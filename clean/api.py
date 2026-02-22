"""
api.py  –  Brain.exe_A1/clean/api.py
Run:  pip install flask flask-cors pandas numpy openpyxl
      python api.py
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd, numpy as np, os, traceback, sys

app = Flask(__name__)
CORS(app)

# ── Import your scoreengine module directly ───────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scoreengine as SE

# Pre-boot: load data once
SE.load_data()

# ── Session state ─────────────────────────────────────────────────────────────
SESSION = {
    "ready":    False,
    "exp_row":  None,
    "exp_id":   None,
    "pool":     None,        # DataFrame – remaining buyers
    "rejected": [],          # list of buyer dicts (re-enter next round)
    "weights":  SE.DEFAULT_WEIGHTS.copy(),
    "approved": [],          # list of accepted buyer dicts (all rounds)
    "round":    0,
    "batch":    None,        # current top-7 DataFrame
}

COUNTRY_COORDS = {
    "USA":{"lat":37.09,"lng":-95.71},"Germany":{"lat":51.16,"lng":10.45},
    "UK":{"lat":55.37,"lng":-3.43},"France":{"lat":46.22,"lng":2.21},
    "Japan":{"lat":36.20,"lng":138.25},"Australia":{"lat":-25.27,"lng":133.77},
    "Canada":{"lat":56.13,"lng":-106.34},"Singapore":{"lat":1.35,"lng":103.82},
    "Netherlands":{"lat":52.13,"lng":5.29},"Italy":{"lat":41.87,"lng":12.56},
    "UAE":{"lat":23.42,"lng":53.84},"India":{"lat":20.59,"lng":78.96},
}

def safe(v):
    if isinstance(v, np.integer):  return int(v)
    if isinstance(v, np.floating): return float(v)
    if isinstance(v, np.bool_):    return bool(v)
    try:
        if pd.isna(v): return None
    except: pass
    return v

def row_to_dict(row):
    d = {k: safe(v) for k, v in row.items()}
    coords = COUNTRY_COORDS.get(str(d.get("Country", "")), {"lat": 0, "lng": 0})
    d["lat"] = coords["lat"]
    d["lng"] = coords["lng"]
    d["Score_100"] = round(float(d.get("Final_Score", 0)) * 100, 1)
    return d

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/init", methods=["POST"])
def init():
    try:
        eid = (request.json or {}).get("exporter_id", "EXP_1715").strip()
        m   = SE.exp_df[SE.exp_df["Exporter_ID"] == eid]
        if m.empty:
            return jsonify({"error": f"{eid} not found"}), 404
        er = m.iloc[0]
        SESSION.update({
            "ready": True, "exp_id": eid, "exp_row": er,
            "pool": SE.imp_df[SE.imp_df["Is_Latest_Record"] == 1].copy().reset_index(drop=True),
            "rejected": [], "weights": SE.DEFAULT_WEIGHTS.copy(),
            "approved": [], "round": 0, "batch": None,
        })
        return jsonify({
            "ok": True,
            "exporter": {"id": eid, "industry": str(er.get("Industry","")),
                         "state": str(er.get("State","")), "cert": str(er.get("Certification",""))},
            "pool_size": len(SESSION["pool"]),
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/buyers", methods=["GET"])
def get_buyers():
    if not SESSION["ready"]:
        return jsonify({"error": "Not initialised – call /api/init"}), 400
    try:
        SESSION["round"] += 1

        # Merge rejected back into pool for re-scoring
        if SESSION["rejected"]:
            rej_ids = [b["Buyer_ID"] for b in SESSION["rejected"]]
            rej_back = SE.imp_df[SE.imp_df["Buyer_ID"].isin(rej_ids)].copy()
            SESSION["pool"] = pd.concat([SESSION["pool"], rej_back]).drop_duplicates("Buyer_ID").reset_index(drop=True)
            SESSION["rejected"] = []

        scored = SE.score_pool(
            SESSION["exp_row"], SESSION["pool"],
            SE.mat_lookup, SE.news_cache, SE.cap_norms, SE.ref_date,
            SESSION["weights"]
        )
        if scored.empty:
            return jsonify({"buyers": [], "pool_remaining": 0, "round": SESSION["round"]})

        top = scored.head(SE.TOP_N).copy()
        SESSION["batch"] = top

        return jsonify({
            "buyers": [row_to_dict(r) for _, r in top.iterrows()],
            "pool_remaining": len(SESSION["pool"]),
            "round": SESSION["round"],
            "weights": SESSION["weights"],
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/feedback", methods=["POST"])
def feedback():
    if not SESSION["ready"]:
        return jsonify({"error": "Not initialised"}), 400
    try:
        body     = request.json or {}
        acc_ids  = set(body.get("accepted", []))
        rej_ids  = set(body.get("rejected", []))
        batch    = SESSION["batch"]
        if batch is None:
            return jsonify({"error": "No active batch – call /api/buyers first"}), 400

        acc_df = batch[batch["Buyer_ID"].isin(acc_ids)]
        rej_df = batch[batch["Buyer_ID"].isin(rej_ids)]

        # Adjust weights
        weight_log = []
        if len(acc_df) > 0 and len(rej_df) > 0:
            SESSION["weights"], weight_log = SE.adjust_weights(
                acc_df, rej_df, SESSION["weights"], SESSION["round"]
            )

        # Accepted → approved pipeline, remove from pool
        for _, row in acc_df.iterrows():
            d = row_to_dict(row)
            d["accepted_round"] = SESSION["round"]
            SESSION["approved"].append(d)
        SESSION["pool"] = SESSION["pool"][~SESSION["pool"]["Buyer_ID"].isin(acc_ids)].copy()

        # Rejected → re-enter next round
        for _, row in rej_df.iterrows():
            SESSION["rejected"].append(row_to_dict(row))

        SESSION["batch"] = None

        return jsonify({
            "ok": True,
            "weights": SESSION["weights"],
            "weight_log": weight_log,
            "pool_remaining": len(SESSION["pool"]),
            "total_approved": len(SESSION["approved"]),
        })
    except Exception:
        return jsonify({"error": traceback.format_exc()}), 500

@app.route("/api/leads", methods=["GET"])
def leads():
    return jsonify({
        "leads": SESSION["approved"],
        "total": len(SESSION["approved"]),
        "round": SESSION["round"],
        "weights": SESSION["weights"],
    })

@app.route("/api/reset", methods=["POST"])
def reset():
    SESSION.update({"ready": False, "exp_row": None, "pool": None,
                    "rejected": [], "weights": SE.DEFAULT_WEIGHTS.copy(),
                    "approved": [], "round": 0, "batch": None})
    return jsonify({"ok": True})

if __name__ == "__main__":
    print("\n  GlobexMatch API → http://localhost:5050\n")
    app.run(port=5050, debug=False)