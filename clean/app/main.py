from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import sys
import pandas as pd
import numpy as np

# Add parent directory to path so we can import scoreengine
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

import scoreengine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for the demo session
app_state = {
    "current_weights": None,
    "exporter_id": None,
    "pool": None,    # DataFrame of remaining importers
    "round_num": 0,
    "accepted_ids": [],
    "rejected_ids": set()
}

@app.on_event("startup")
def startup_event():
    scoreengine.load_data()
    # Initialize default weights
    app_state["current_weights"] = scoreengine.DEFAULT_WEIGHTS.copy()

class InitSessionRequest(BaseModel):
    exporter_id: str

class FeedbackRequest(BaseModel):
    accepted_ids: List[str]
    rejected_ids: List[str]

@app.post("/session/init")
def init_session(request: InitSessionRequest):
    # Find exporter
    exp_df = scoreengine.exp_df
    exp_matches = exp_df[exp_df["Exporter_ID"] == request.exporter_id]
    
    if exp_matches.empty:
        raise HTTPException(status_code=404, detail="Exporter not found")
    
    # Reset state
    app_state["exporter_id"] = request.exporter_id
    app_state["current_weights"] = scoreengine.DEFAULT_WEIGHTS.copy()
    app_state["round_num"] = 0
    app_state["accepted_ids"] = []
    app_state["rejected_ids"] = set()
    
    # Initialize pool (all latest importers)
    imp_df = scoreengine.imp_df
    app_state["run_exp_row"] = exp_matches.iloc[0] # Store the full row for scoring
    app_state["pool"] = imp_df[imp_df["Is_Latest_Record"]==1].copy().reset_index(drop=True)
    
    return {
        "message": "Session initialized", 
        "exporter": {
            "id": request.exporter_id,
            "industry": app_state["run_exp_row"]["Industry"],
            "country": app_state["run_exp_row"]["Country"]
        },
        "initial_weights": app_state["current_weights"]
    }

@app.get("/recommendations")
def get_recommendations(limit: int = 10):
    if app_state["pool"] is None or app_state.get("run_exp_row") is None:
        raise HTTPException(status_code=400, detail="Session not initialized. Call /session/init first.")
    
    pool = app_state["pool"]
    if pool.empty:
        return {"buyers": [], "message": "No more buyers available"}

    # Run Scoring
    scored = scoreengine.score_pool(
        app_state["run_exp_row"], 
        pool, 
        scoreengine.mat_lookup, 
        scoreengine.news_cache, 
        scoreengine.cap_norms, 
        scoreengine.ref_date, 
        app_state["current_weights"]
    )
    
    if scored.empty:
        return {"buyers": [], "message": "No matching buyers found"}

    # Get top N
    top_n = scored.head(limit).copy()
    
    # Handle NaN values and Datetimes for JSON compliance
    # Convert datetimes to ISO strings
    for col in top_n.select_dtypes(include=['datetime64', 'datetime64[ns]']).columns:
        top_n[col] = top_n[col].apply(lambda x: x.isoformat() if pd.notnull(x) else None)
        
    # Replace NaN with None (which becomes null in JSON)
    top_n = top_n.replace({np.nan: None})
    
    results = top_n.to_dict(orient="records")
    
    return {
        "round": app_state["round_num"],
        "weights": app_state["current_weights"],
        "buyers": results
    }

@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    if app_state["pool"] is None:
        raise HTTPException(status_code=400, detail="Session not initialized")

    # Update global lists
    app_state["accepted_ids"].extend(request.accepted_ids)
    app_state["rejected_ids"].update(request.rejected_ids)
    
    # Update pool: Remove accepted buyers (rejected ones return to pool!)
    # Wait, original logic: "Rejected: n buyers -> re-enter pool with new weights"
    # Accepted: "Accepted -> added to pipeline" (removed from pool)
    # So we strictly remove ACCEPTED ones from future consideration.
    # Rejected ones stay in the pool but will be re-scored.
    # To prevent immediate re-recommendation of the SAME rejected ones, 
    # the original code simply proceeded to the next batch or re-scored.
    # If the weights don't change much, they might appear again at the top.
    # Usually in a swipe interface, you don't want to see the same card immediately again.
    # We should probably temporarily exclude them or mark them "seen" for this round.
    # For now, let's remove ACCEPTED from pool.
    
    current_pool = app_state["pool"]
    if request.accepted_ids:
        app_state["pool"] = current_pool[~current_pool["Buyer_ID"].isin(request.accepted_ids)].copy()

    # Update Weights
    # We need the full dataframe rows for accepted/rejected to calculate weight updates
    # We can fetch them from the original pool (before removal) or the global imp_df
    imp_df = scoreengine.imp_df
    
    # Find rows for accepted/rejected
    accepted_df = imp_df[imp_df["Buyer_ID"].isin(request.accepted_ids)]
    rejected_df = imp_df[imp_df["Buyer_ID"].isin(request.rejected_ids)]
    
    app_state["round_num"] += 1
    
    weight_log = []
    if not accepted_df.empty and not rejected_df.empty:
        new_weights, weight_log_entries = scoreengine.adjust_weights(
            accepted_df, 
            rejected_df, 
            app_state["current_weights"], 
            app_state["round_num"]
        )
        app_state["current_weights"] = new_weights
        
    return {
        "message": "Weights updated",
        "new_weights": app_state["current_weights"],
        "round": app_state["round_num"]
    }

