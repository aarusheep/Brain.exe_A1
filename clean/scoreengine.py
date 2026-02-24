# scoreengine.py  –  Brain.exe_A1/clean/scoreengine.py
# Pure scoring engine – imported by api.py.
# Drop this file next to api.py in the clean/ folder.
import os
import pandas as pd
import numpy as np

# ── Data file path ────────────────────────────────────────────────────────────
CLEAN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "EXIM_Cleaned_GlobexMatch.xlsx")

# ── Hyperparameters ───────────────────────────────────────────────────────────
DEFAULT_WEIGHTS = {
    "D1_Product_Compat":  0.30,
    "D2_Geography_Fit":   0.20,
    "D3_Trade_Capacity":  0.20,
    "D4_Intent_Activity": 0.20,
    "D5_Reliability":     0.10,
}
LEARNING_RATE   = 0.05
WEIGHT_MIN      = 0.05
WEIGHT_MAX      = 0.50
DELTA_THRESHOLD = 0.10
TOP_N           = 7

# ── Domain lookup tables ──────────────────────────────────────────────────────
INDUSTRY_AFFINITY = {
    ("Chemicals",   "Pharmaceuticals"): 0.7,
    ("Electronics", "Solar"):           0.6,
    ("Machinery",   "Auto Parts"):      0.65,
    ("Machinery",   "Engineering"):     0.70,
    ("IT Software", "Electronics"):     0.5,
}
MATURITY_W = {"Growing": 1.0, "Stable": 0.7, "New": 0.5, "Declining": 0.2}
HIGH_EXPORT_STATES = {
    "Gujarat": 1.0, "Maharashtra": 0.9, "Tamil Nadu": 0.85,
    "Karnataka": 0.80, "Telangana": 0.75, "Delhi": 0.70,
    "Haryana": 0.65, "Punjab": 0.60, "Rajasthan": 0.55,
}
COUNTRY_OPENNESS = {
    "Germany": 1.0, "USA": 1.0, "Japan": 0.95, "UK": 0.90,
    "France": 0.90, "Netherlands": 0.90, "Canada": 0.85,
    "Australia": 0.85, "Singapore": 0.95, "Italy": 0.80, "UAE": 0.85,
}
BILATERAL = {
    "UAE": 0.05, "Australia": 0.08, "Japan": 0.10, "Singapore": 0.08,
    "Germany": 0.12, "France": 0.12, "Netherlands": 0.12, "UK": 0.15,
    "Italy": 0.13, "Canada": 0.15, "USA": 0.20,
}
TRADE_LAW = {
    "USA": 0.25, "UK": 0.18, "Germany": 0.12, "France": 0.12,
    "Netherlands": 0.10, "Italy": 0.13, "Canada": 0.15, "Australia": 0.08,
    "Japan": 0.10, "Singapore": 0.07, "UAE": 0.06,
}
IND_COUNTRY = {
    "Pharmaceuticals": {"USA": 0.35, "Germany": 0.25, "France": 0.25, "UK": 0.28, "Japan": 0.40, "Australia": 0.22, "Canada": 0.28, "Netherlands": 0.25, "Italy": 0.25, "Singapore": 0.15, "UAE": 0.12},
    "Medical Devices":  {"USA": 0.35, "Germany": 0.28, "France": 0.28, "UK": 0.30, "Japan": 0.38, "Australia": 0.22, "Canada": 0.25, "Netherlands": 0.28, "Italy": 0.28, "Singapore": 0.15, "UAE": 0.12},
    "Chemicals":        {"Germany": 0.30, "France": 0.30, "Netherlands": 0.28, "Italy": 0.30, "UK": 0.28, "USA": 0.22, "Japan": 0.25, "Australia": 0.18, "Canada": 0.20, "Singapore": 0.12, "UAE": 0.10},
    "Electronics":      {"Germany": 0.20, "France": 0.20, "Netherlands": 0.20, "Italy": 0.20, "UK": 0.22, "USA": 0.18, "Japan": 0.25, "Australia": 0.15, "Canada": 0.18, "Singapore": 0.10, "UAE": 0.10},
    "Solar":            {"USA": 0.40, "Germany": 0.18, "France": 0.18, "Netherlands": 0.18, "UK": 0.20, "Japan": 0.15, "Australia": 0.12, "Canada": 0.20, "Singapore": 0.10, "UAE": 0.08, "Italy": 0.18},
    "Textiles":         {"USA": 0.20, "Germany": 0.12, "France": 0.15, "Netherlands": 0.12, "Italy": 0.18, "UK": 0.15, "Japan": 0.12, "Australia": 0.10, "Canada": 0.15, "Singapore": 0.08, "UAE": 0.08},
    "IT Software":      {"USA": 0.18, "Germany": 0.12, "France": 0.12, "Netherlands": 0.10, "Italy": 0.10, "UK": 0.12, "Japan": 0.15, "Australia": 0.10, "Canada": 0.12, "Singapore": 0.08, "UAE": 0.10},
    "Machinery":        {"USA": 0.15, "Germany": 0.18, "France": 0.18, "Netherlands": 0.15, "Italy": 0.18, "UK": 0.18, "Japan": 0.20, "Australia": 0.12, "Canada": 0.15, "Singapore": 0.10, "UAE": 0.10},
    "Auto Parts":       {"USA": 0.20, "Germany": 0.18, "France": 0.18, "Netherlands": 0.15, "Italy": 0.18, "UK": 0.20, "Japan": 0.25, "Australia": 0.12, "Canada": 0.18, "Singapore": 0.10, "UAE": 0.10},
    "Engineering":      {"USA": 0.15, "Germany": 0.15, "France": 0.15, "Netherlands": 0.12, "Italy": 0.15, "UK": 0.15, "Japan": 0.18, "Australia": 0.10, "Canada": 0.12, "Singapore": 0.08, "UAE": 0.08},
}
CERT_MAP = {
    "ISO9001":  ["Machinery", "Auto Parts", "Engineering", "Electronics"],
    "ISO14001": ["Chemicals", "Pharmaceuticals", "Solar"],
    "FDA":      ["Pharmaceuticals", "Medical Devices"],
    "CE":       ["Electronics", "Medical Devices", "Machinery"],
    "WHO-GMP":  ["Pharmaceuticals"],
    "EU-GMP":   ["Pharmaceuticals", "Chemicals"],
    "IEC":      ["Solar", "Electronics"],
    "SOC2":     ["IT Software"],
    "GDPR":     ["IT Software"],
    "RoHS":     ["Electronics", "Solar"],
    "REACH":    ["Chemicals"],
    "TUV":      ["Machinery", "Electronics"],
    "UL":       ["Electronics", "Machinery"],
}
COUNTRY_REGION = {
    "Netherlands": "Europe", "Italy": "Europe", "France": "Europe",
    "Germany": "Europe", "UK": "Europe", "Canada": "North America",
    "USA": "North America", "Australia": "Asia", "Singapore": "Asia",
    "Japan": "Asia", "UAE": "Middle East",
}
NEWS_IMPACT = {"Low": 0.05, "Medium": 0.12, "High": 0.22}

# ── Global data holders (populated by load_data) ──────────────────────────────
clean     = None
exp_df    = None
imp_df    = None
news_df   = None
mat_df    = None
mat_lookup = None
ref_date  = None
cap_norms = None
news_cache = None


# ── Helpers ───────────────────────────────────────────────────────────────────
def normalize(val, mn, mx):
    if mx == mn:
        return 0.5
    return float(np.clip((val - mn) / (mx - mn), 0, 1))


def recency_score(date_val, ref_date_):
    if pd.isna(date_val):
        return 0.0
    days = (ref_date_ - pd.Timestamp(date_val)).days
    if days <= 90:    return 1.0
    elif days <= 180: return 0.7
    elif days <= 365: return 0.4
    return 0.1


def normalize_weights(weights):
    w = {k: np.clip(v, WEIGHT_MIN, WEIGHT_MAX) for k, v in weights.items()}
    total = sum(w.values())
    return {k: round(v / total, 4) for k, v in w.items()}


def get_adjacent_industries(industry):
    adj = {}
    for (a, b), sc in INDUSTRY_AFFINITY.items():
        if a == industry:
            adj[b] = sc
        elif b == industry:
            adj[a] = sc
    return adj


def build_news_cache(news_df_, lookback_days=90):
    cutoff = news_df_["Date"].max() - pd.Timedelta(days=lookback_days)
    recent = news_df_[news_df_["Date"] >= cutoff]
    cache = {}
    for country in COUNTRY_REGION:
        for industry in IND_COUNTRY:
            region = COUNTRY_REGION.get(country, "Global")
            rel = recent[
                (recent["Region"].isin([region, "Global"])) &
                (recent["Affected_Industry"] == industry)
            ]
            penalty = 0.0
            for _, r in rel.iterrows():
                base = NEWS_IMPACT.get(r["Impact_Level"], 0.05)
                et   = r["Event_Type"]
                if r["War_Flag"] == 1:                    penalty += base * 1.5
                elif et == "Supply Chain Shock":          penalty += base
                elif et == "Tariff Update":               penalty += base
                elif et == "Stock Crash":                 penalty += base * 0.5
                elif et == "Natural Calamity":            penalty += base
                elif et == "Trade Agreement":             penalty -= base * 0.5
            cache[(country, industry)] = round(min(max(penalty, 0.0), 0.35), 4)
    return cache


# ── Data loader ───────────────────────────────────────────────────────────────
def load_data():
    global clean, exp_df, imp_df, news_df, mat_df
    global mat_lookup, ref_date, cap_norms, news_cache

    print("Loading dataset …")
    clean   = pd.read_excel(CLEAN_FILE, sheet_name=None)
    exp_df  = clean["Exporters_Clean"]
    imp_df  = clean["Importers_Clean"]
    news_df = clean["News_Clean"]
    mat_df  = clean["Buyer_Maturity"]

    for df in [exp_df, imp_df, news_df]:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    imp_df["Funding_Event"] = pd.to_numeric(imp_df["Funding_Event"], errors="coerce").fillna(0)

    mat_lookup = dict(zip(mat_df["Buyer_ID"], mat_df["Maturity"]))
    ref_date   = exp_df["Date"].max()
    cap_norms  = {c: (exp_df[c].min(), exp_df[c].max())
                  for c in ["Shipment_Value_USD", "Quantity_Tons",
                             "Revenue_Size_USD", "Team_Size"]}

    print("Building news risk cache …")
    news_cache = build_news_cache(news_df)

    print(f"Data ready  |  exporters={exp_df[exp_df['Is_Latest_Record']==1].shape[0]:,}"
          f"  importers={imp_df[imp_df['Is_Latest_Record']==1].shape[0]:,}")


# ── Core scorer ───────────────────────────────────────────────────────────────
def score_pool(exp_row, buyer_pool, mat_lookup_, news_cache_,
               cap_norms_, ref_date_, weights):
    pool = buyer_pool.copy()
    ei   = exp_row["Industry"]
    adj  = get_adjacent_industries(ei)
    target = {ei: 1.0}
    target.update(adj)

    pool = pool[pool["Industry"].isin(target.keys())].copy()
    if pool.empty:
        return pd.DataFrame()

    # D1 – Product Compatibility
    pool["sem_score"]  = pool["Industry"].map(target).fillna(0.0)
    exp_cert           = str(exp_row.get("Certification", "None"))
    rel_inds           = CERT_MAP.get(exp_cert, [])
    pool["cert_boost"] = pool["Industry"].apply(
        lambda ii: 1.0 if ii in rel_inds else (0.4 if target.get(ii, 0) > 0 else 0.0))
    exp_msme           = int(exp_row.get("MSME_Udyam", 0))
    pool["size_compat"]= ((pool["Team_Size"] < 500).astype(int) == exp_msme).astype(float) * 0.3
    pool["D1"]         = (pool["sem_score"] * 0.60 +
                          pool["cert_boost"] * 0.25 +
                          pool["size_compat"] * 0.15).clip(0, 1)

    # D2 – Geography Fit
    state_score = HIGH_EXPORT_STATES.get(str(exp_row.get("State", "")), 0.4)
    pool["D2"]  = (
        state_score * 0.50 +
        pool["Country"].map(COUNTRY_OPENNESS).fillna(0.5) * 0.30 +
        float(exp_row.get("Has_Shipment_Value", 0)) * 0.20
    ).clip(0, 1)

    # D3 – Trade Capacity (exporter-level scalar)
    d3_val = (
        normalize(float(exp_row.get("Shipment_Value_USD", 0)), *cap_norms_["Shipment_Value_USD"]) * 0.40 +
        normalize(float(exp_row.get("Quantity_Tons",      0)), *cap_norms_["Quantity_Tons"])      * 0.30 +
        normalize(float(exp_row.get("Revenue_Size_USD",   0)), *cap_norms_["Revenue_Size_USD"])   * 0.20 +
        normalize(float(exp_row.get("Team_Size",          0)), *cap_norms_["Team_Size"])          * 0.10
    )
    pool["D3"] = round(float(d3_val), 4)

    # D4 – Intent & Activity
    pool["recency"]    = pool["Date"].apply(lambda d: recency_score(d, ref_date_))
    pool["maturity_w"] = pool["Buyer_ID"].map(mat_lookup_).map(MATURITY_W).fillna(0.7)
    pool["Funding_Event"] = pd.to_numeric(pool["Funding_Event"], errors="coerce").fillna(0)
    pool["D4"] = (
        (pool["Intent_Score"]        * 0.30 +
         pool["Prompt_Response"]      * 0.15 +
         pool["Hiring_Growth"]        * 0.15 +
         pool["Engagement_Spike"]     * 0.10 +
         pool["DecisionMaker_Change"] * 0.10 +
         pool["Funding_Event"]        * 0.10 +
         pool["recency"]              * 0.10) * pool["maturity_w"]
    ).clip(0, 1)

    # D5 – Reliability
    exp_has_cert = 1.0 if exp_cert and exp_cert != "None" else 0.0
    exp_payment  = float(exp_row.get("Good_Payment_Terms", 0))
    pool["D5"]   = (
        exp_has_cert                 * 0.25 +
        exp_payment                  * 0.25 +
        pool["Good_Payment_History"] * 0.30 +
        pool["Response_Probability"] * 0.20
    ).clip(0, 1)

    # Weighted raw score
    pool["Raw_Score"] = (
        pool["D1"] * weights["D1_Product_Compat"]  +
        pool["D2"] * weights["D2_Geography_Fit"]   +
        pool["D3"] * weights["D3_Trade_Capacity"]  +
        pool["D4"] * weights["D4_Intent_Activity"] +
        pool["D5"] * weights["D5_Reliability"]
    )

    # Risk dimensions
    pool["S1"] = pool.apply(
        lambda r: BILATERAL.get(r["Country"], 0.35) * 0.40 +
                  TRADE_LAW.get(r["Country"], 0.30) * 0.35 +
                  IND_COUNTRY.get(r["Industry"], {}).get(r["Country"], 0.15) * 0.25,
        axis=1)
    pool["S2"] = (
        pool["War_Event"]                             * 0.30 +
        pool["Tariff_News"].clip(0, 1)                * 0.20 +
        pool["StockMarket_Shock"].clip(0, 1)          * 0.15 +
        pool["Natural_Calamity"]                       * 0.10 +
        pool["Currency_Fluctuation"].clip(0, 1)       * 0.10 +
        float(exp_row.get("War_Risk", 0))              * 0.07 +
        max(float(exp_row.get("Tariff_Impact", 0)), 0) * 0.05 +
        float(exp_row.get("Natural_Calamity_Risk", 0)) * 0.03
    ).clip(0, 1)
    pool["S3"] = pool.apply(
        lambda r: news_cache_.get((r["Country"], r["Industry"]), 0.0), axis=1)

    pool["Risk_Friction"] = (pool["S1"] * 0.40 +
                              pool["S2"] * 0.35 +
                              pool["S3"] * 0.25).clip(0, 0.60)
    pool["Final_Score"]   = (pool["Raw_Score"] - pool["Risk_Friction"]).clip(0, 1).round(4)
    pool["Risk_Label"]    = pool["Risk_Friction"].apply(
        lambda r: "Low" if r < 0.10 else
                  ("Medium" if r < 0.20 else
                   ("High" if r < 0.35 else "Very High")))
    pool["Match_Type"]    = pool["Industry"].apply(
        lambda ii: "Primary" if ii == ei else "Adjacent")

    return pool.sort_values("Final_Score", ascending=False).reset_index(drop=True)


# ── Weight adjuster ───────────────────────────────────────────────────────────
def adjust_weights(accepted_df, rejected_df, current_weights, round_num):
    new_weights = current_weights.copy()
    log = []
    dim_cols = {
        "D1_Product_Compat":  "D1",
        "D2_Geography_Fit":   "D2",
        "D3_Trade_Capacity":  "D3",
        "D4_Intent_Activity": "D4",
        "D5_Reliability":     "D5",
    }
    for dim_key, col in dim_cols.items():
        avg_acc = accepted_df[col].mean() if len(accepted_df) > 0 else 0.5
        avg_rej = rejected_df[col].mean() if len(rejected_df) > 0 else 0.5
        delta   = avg_acc - avg_rej
        old_w   = current_weights[dim_key]

        if delta > DELTA_THRESHOLD:
            change, direction = LEARNING_RATE, "INCREASE"
        elif delta < -DELTA_THRESHOLD:
            change, direction = -LEARNING_RATE, "DECREASE"
        else:
            change, direction = 0.0, "UNCHANGED"

        new_weights[dim_key] = old_w + change
        log.append({
            "Dimension": dim_key,
            "Old":       round(old_w, 4),
            "Delta":     round(delta, 4),
            "Direction": direction,
        })

    new_weights = normalize_weights(new_weights)
    return new_weights, log