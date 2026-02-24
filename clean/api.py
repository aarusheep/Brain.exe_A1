"""
api.py  –  Brain.exe_A1/clean/api.py

Key fixes:
  1. Rejected buyers re-scored with updated weights (not prepended raw).
  2. Session persists to disk across Flask restarts.
  3. On resume, the CURRENT batch is restored from disk — /api/buyers is
     NOT called again, so round does not increment and no buyers repeat.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os, json, traceback, sys

app = Flask(__name__)
CORS(app)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scoreengine as SE

SE.load_data()

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "session_state.json")


# ── Persistence ───────────────────────────────────────────────────────────────
def _save_state(session: dict):
    payload = {
        "ready":            session["ready"],
        "exp_id":           session["exp_id"],
        "weights":          session["weights"],
        "round":            session["round"],
        "approved_ids":     list(session["approved_ids"]),
        "rejected_ids":     list(session["rejected_ids"]),
        "seen_ids":         list(session["seen_ids"]),
        "total_approved":   session["total_approved"],
        # Save the IDs of the current active batch so we can restore it
        "current_batch_ids": list(session["current_batch_ids"]),
    }
    with open(STATE_FILE, "w") as f:
        json.dump(payload, f)


def _load_state():
    if not os.path.exists(STATE_FILE):
        return None
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return None


def _build_session_from_disk(payload: dict):
    exp_id = payload.get("exp_id")
    if not exp_id:
        return None

    exp_matches = SE.exp_df[SE.exp_df["Exporter_ID"] == exp_id]
    if exp_matches.empty:
        return None

    exp_row      = exp_matches.iloc[0]
    approved_ids = set(payload.get("approved_ids", []))
    pool = (SE.imp_df[SE.imp_df["Is_Latest_Record"] == 1]
              .copy().reset_index(drop=True))
    pool = pool[~pool["Buyer_ID"].isin(approved_ids)].copy()

    # Reconstruct the batch DataFrame from saved IDs
    batch_ids = payload.get("current_batch_ids", [])
    if batch_ids:
        batch_df = SE.imp_df[SE.imp_df["Buyer_ID"].isin(batch_ids)].copy()
    else:
        batch_df = None

    return {
        "ready":            True,
        "exp_id":           exp_id,
        "exp_row":          exp_row,
        "pool":             pool,
        "rejected_ids":     list(payload.get("rejected_ids", [])),
        "approved_ids":     list(payload.get("approved_ids", [])),
        "weights":          payload.get("weights", SE.DEFAULT_WEIGHTS.copy()),
        "round":            payload.get("round", 0),
        "batch":            batch_df,        # restored DataFrame (unscored, for feedback)
        "current_batch_ids": list(batch_ids),
        "seen_ids":         set(payload.get("seen_ids", [])),
        "total_approved":   payload.get("total_approved", 0),
    }


def _empty_session() -> dict:
    return {
        "ready":            False,
        "exp_id":           None,
        "exp_row":          None,
        "pool":             None,
        "rejected_ids":     [],
        "approved_ids":     [],
        "weights":          SE.DEFAULT_WEIGHTS.copy(),
        "round":            0,
        "batch":            None,
        "current_batch_ids": [],
        "seen_ids":         set(),
        "total_approved":   0,
    }


SESSION = _empty_session()

_persisted = _load_state()
if _persisted:
    _restored = _build_session_from_disk(_persisted)
    if _restored:
        SESSION = _restored
        print(f"  Restored session: exp={SESSION['exp_id']} "
              f"round={SESSION['round']} "
              f"approved={SESSION['total_approved']} "
              f"batch_ids={len(SESSION['current_batch_ids'])}")


# ── Helpers ───────────────────────────────────────────────────────────────────
COUNTRY_COORDS = {
    "USA":         {"lat": 37.09,  "lng": -95.71},
    "Germany":     {"lat": 51.16,  "lng":  10.45},
    "UK":          {"lat": 55.37,  "lng":  -3.43},
    "France":      {"lat": 46.22,  "lng":   2.21},
    "Japan":       {"lat": 36.20,  "lng": 138.25},
    "Australia":   {"lat": -25.27, "lng": 133.77},
    "Canada":      {"lat": 56.13,  "lng": -106.34},
    "Singapore":   {"lat":  1.35,  "lng": 103.82},
    "Netherlands": {"lat": 52.13,  "lng":   5.29},
    "Italy":       {"lat": 41.87,  "lng":  12.56},
    "UAE":         {"lat": 23.42,  "lng":  53.84},
    "India":       {"lat": 20.59,  "lng":  78.96},
}


def safe(v):
    if isinstance(v, np.integer):  return int(v)
    if isinstance(v, np.floating): return float(v)
    if isinstance(v, np.bool_):    return bool(v)
    try:
        if pd.isna(v): return None
    except Exception:
        pass
    return v


def row_to_dict(row):
    d = {k: safe(v) for k, v in row.items()}
    coords = COUNTRY_COORDS.get(str(d.get("Country", "")), {"lat": 0, "lng": 0})
    d["lat"]       = coords["lat"]
    d["lng"]       = coords["lng"]
    d["Score_100"] = round(float(d.get("Final_Score", 0)) * 100, 1)
    return d


def _score_and_serve_batch():
    """Score the pool, pick top N, save to session, return list of dicts."""
    approved_set = set(SESSION["approved_ids"])

    pool = (SE.imp_df[SE.imp_df["Is_Latest_Record"] == 1]
              .copy().reset_index(drop=True))
    pool = pool[~pool["Buyer_ID"].isin(approved_set)].copy()

    unseen = pool[~pool["Buyer_ID"].isin(SESSION["seen_ids"])]
    pool   = unseen.copy() if len(unseen) >= SE.TOP_N else pool

    SESSION["pool"] = pool

    scored = SE.score_pool(
        SESSION["exp_row"], SESSION["pool"],
        SE.mat_lookup, SE.news_cache, SE.cap_norms, SE.ref_date,
        SESSION["weights"],
    )

    if scored.empty:
        return []

    top = scored.head(SE.TOP_N).copy()
    SESSION["batch"]            = top
    SESSION["current_batch_ids"] = top["Buyer_ID"].tolist()
    SESSION["seen_ids"].update(SESSION["current_batch_ids"])
    _save_state(SESSION)

    return [row_to_dict(r) for _, r in top.iterrows()]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/init", methods=["POST"])
def init():
    try:
        eid = (request.json or {}).get("exporter_id", "EXP_1715").strip()
        m   = SE.exp_df[SE.exp_df["Exporter_ID"] == eid]
        if m.empty:
            return jsonify({"error": f"{eid} not found"}), 404

        er   = m.iloc[0]
        pool = (SE.imp_df[SE.imp_df["Is_Latest_Record"] == 1]
                  .copy().reset_index(drop=True))

        SESSION.update({
            "ready":            True,
            "exp_id":           eid,
            "exp_row":          er,
            "pool":             pool,
            "rejected_ids":     [],
            "approved_ids":     [],
            "weights":          SE.DEFAULT_WEIGHTS.copy(),
            "round":            0,
            "batch":            None,
            "current_batch_ids": [],
            "seen_ids":         set(),
            "total_approved":   0,
        })
        _save_state(SESSION)

        return jsonify({
            "ok": True,
            "exporter": {
                "id":       eid,
                "industry": str(er.get("Industry", "")),
                "state":    str(er.get("State", "")),
                "cert":     str(er.get("Certification", "")),
            },
            "pool_size": len(SESSION["pool"]),
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500


@app.route("/api/status", methods=["GET"])
def status():
    """
    Called by the frontend on every page mount.
    If a batch is already in progress (current_batch_ids exists),
    returns those buyers directly so the frontend resumes mid-batch
    without calling /api/buyers and incrementing round.
    """
    if not SESSION["ready"]:
        return jsonify({"ready": False})

    # Rebuild the scored batch from saved IDs so the frontend
    # gets the full scored card data (D1-D5, Final_Score, etc.)
    current_buyers = []
    if SESSION["current_batch_ids"]:
        try:
            # Re-score just the saved batch IDs with current weights
            batch_pool = SE.imp_df[
                SE.imp_df["Buyer_ID"].isin(SESSION["current_batch_ids"])
            ].copy()

            if not batch_pool.empty:
                scored = SE.score_pool(
                    SESSION["exp_row"], batch_pool,
                    SE.mat_lookup, SE.news_cache, SE.cap_norms, SE.ref_date,
                    SESSION["weights"],
                )
                # Preserve the original order
                order = {bid: i for i, bid in enumerate(SESSION["current_batch_ids"])}
                scored["_order"] = scored["Buyer_ID"].map(order)
                scored = scored.sort_values("_order").drop(columns="_order")
                SESSION["batch"] = scored
                current_buyers = [row_to_dict(r) for _, r in scored.iterrows()]
        except Exception:
            current_buyers = []

    return jsonify({
        "ready":            True,
        "exp_id":           SESSION["exp_id"],
        "round":            SESSION["round"],
        "total_approved":   SESSION["total_approved"],
        "pool_remaining":   len(SESSION["pool"]) if SESSION["pool"] is not None else 0,
        "weights":          SESSION["weights"],
        "has_active_batch": len(current_buyers) > 0,
        "current_buyers":   current_buyers,   # ← frontend uses these on resume
        "exporter": {
            "id":       SESSION["exp_id"],
            "industry": str(SESSION["exp_row"].get("Industry", "")),
            "state":    str(SESSION["exp_row"].get("State", "")),
            "cert":     str(SESSION["exp_row"].get("Certification", "")),
        },
    })


@app.route("/api/buyers", methods=["GET"])
def get_buyers():
    """Fetch the NEXT batch. Only call this after feedback is submitted."""
    if not SESSION["ready"]:
        return jsonify({"error": "Not initialised – call /api/init"}), 400
    try:
        SESSION["round"] += 1
        buyers = _score_and_serve_batch()

        if not buyers:
            return jsonify({"buyers": [], "pool_remaining": 0,
                            "round": SESSION["round"]})

        return jsonify({
            "buyers":         buyers,
            "pool_remaining": len(SESSION["pool"]),
            "round":          SESSION["round"],
            "weights":        SESSION["weights"],
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500


@app.route("/api/feedback", methods=["POST"])
def feedback():
    if not SESSION["ready"]:
        return jsonify({"error": "Not initialised"}), 400
    try:
        body    = request.json or {}
        acc_ids = set(body.get("accepted", []))
        rej_ids = set(body.get("rejected", []))
        batch   = SESSION["batch"]

        if batch is None:
            return jsonify({"error": "No active batch"}), 400

        acc_df = batch[batch["Buyer_ID"].isin(acc_ids)]
        rej_df = batch[batch["Buyer_ID"].isin(rej_ids)]

        weight_log = []
        if len(acc_df) > 0 and len(rej_df) > 0:
            SESSION["weights"], weight_log = SE.adjust_weights(
                acc_df, rej_df, SESSION["weights"], SESSION["round"]
            )

        SESSION["approved_ids"].extend(list(acc_ids))
        SESSION["total_approved"] += len(acc_ids)
        SESSION["rejected_ids"]    = list(rej_ids)

        # Clear the active batch — next /api/buyers will score fresh
        SESSION["batch"]             = None
        SESSION["current_batch_ids"] = []
        _save_state(SESSION)

        return jsonify({
            "ok":             True,
            "weights":        SESSION["weights"],
            "weight_log":     weight_log,
            "pool_remaining": len(SESSION["pool"]),
            "total_approved": SESSION["total_approved"],
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500


@app.route("/api/leads", methods=["GET"])
def leads():
    approved_ids  = set(SESSION["approved_ids"])
    approved_rows = SE.imp_df[SE.imp_df["Buyer_ID"].isin(approved_ids)].copy()
    return jsonify({
        "leads":   [row_to_dict(r) for _, r in approved_rows.iterrows()],
        "total":   SESSION["total_approved"],
        "round":   SESSION["round"],
        "weights": SESSION["weights"],
    })


@app.route("/api/reset", methods=["POST"])
def reset():
    SESSION.update(_empty_session())
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("\n  GlobexMatch API → http://localhost:5050\n")
    app.run(port=5050, debug=False)














