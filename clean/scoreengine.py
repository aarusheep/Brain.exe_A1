"""
GlobexMatch — Adaptive Scoring Engine with Feedback Loop
=========================================================

FLOW:
  Round 1: Generate top 15 buyers for exporter
         ↓
  Exporter swipes: 5 accepted (right), 10 rejected (left)
         ↓
  Weight Adjustment:
    - Features HIGH in accepted & LOW in rejected → weight INCREASES
    - Features HIGH in rejected & LOW in accepted → weight DECREASES
         ↓
  Rejected buyers re-enter the pool
  Accepted buyers permanently removed
         ↓
  Round 2: Re-score remaining pool with updated weights → new top 15
         ↓
  Repeat until pool exhausted or exporter stops

WEIGHT ADJUSTMENT LOGIC:
  For each feature signal:
    avg_accepted = mean signal value across accepted buyers
    avg_rejected = mean signal value across rejected buyers
    delta = avg_accepted - avg_rejected

    if delta > threshold:  feature drove acceptance → increase weight
    if delta < -threshold: feature drove rejection  → decrease weight

  new_weight = old_weight + (LEARNING_RATE * sign(delta))
  Weights are re-normalized to sum to 1.0 after each round.
"""

import pandas as pd
import numpy as np
import json
import os

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_WEIGHTS = {
    'D1_Product_Compat':  0.30,
    'D2_Geography_Fit':   0.20,
    'D3_Trade_Capacity':  0.20,
    'D4_Intent_Activity': 0.20,
    'D5_Reliability':     0.10,
}

LEARNING_RATE  = 0.05   # weight shifts by 5% per feedback signal
WEIGHT_MIN     = 0.05   # floor — no dimension can vanish completely
WEIGHT_MAX     = 0.50   # ceiling — no dimension dominates entirely
DELTA_THRESHOLD = 0.10  # minimum signal difference to trigger weight change
TOP_N          = 15     # buyers shown per round

# Lookup tables
INDUSTRY_AFFINITY = {
    ('Chemicals','Pharmaceuticals'):0.7, ('Electronics','Solar'):0.6,
    ('Machinery','Auto Parts'):0.65,     ('Machinery','Engineering'):0.70,
    ('IT Software','Electronics'):0.5,
}
MATURITY_W = {'Growing':1.0,'Stable':0.7,'New':0.5,'Declining':0.2}
HIGH_EXPORT_STATES = {
    'Gujarat':1.0,'Maharashtra':0.9,'Tamil Nadu':0.85,'Karnataka':0.80,
    'Telangana':0.75,'Delhi':0.70,'Haryana':0.65,'Punjab':0.60,'Rajasthan':0.55,
}
COUNTRY_OPENNESS = {
    'Germany':1.0,'USA':1.0,'Japan':0.95,'UK':0.90,'France':0.90,
    'Netherlands':0.90,'Canada':0.85,'Australia':0.85,'Singapore':0.95,
    'Italy':0.80,'UAE':0.85,
}
BILATERAL   = {'UAE':0.05,'Australia':0.08,'Japan':0.10,'Singapore':0.08,
               'Germany':0.12,'France':0.12,'Netherlands':0.12,'UK':0.15,
               'Italy':0.13,'Canada':0.15,'USA':0.20}
TRADE_LAW   = {'USA':0.25,'UK':0.18,'Germany':0.12,'France':0.12,
               'Netherlands':0.10,'Italy':0.13,'Canada':0.15,'Australia':0.08,
               'Japan':0.10,'Singapore':0.07,'UAE':0.06}
IND_COUNTRY = {
    'Pharmaceuticals':{'USA':0.35,'Germany':0.25,'France':0.25,'UK':0.28,'Japan':0.40,'Australia':0.22,'Canada':0.28,'Netherlands':0.25,'Italy':0.25,'Singapore':0.15,'UAE':0.12},
    'Medical Devices':{'USA':0.35,'Germany':0.28,'France':0.28,'UK':0.30,'Japan':0.38,'Australia':0.22,'Canada':0.25,'Netherlands':0.28,'Italy':0.28,'Singapore':0.15,'UAE':0.12},
    'Chemicals':{'Germany':0.30,'France':0.30,'Netherlands':0.28,'Italy':0.30,'UK':0.28,'USA':0.22,'Japan':0.25,'Australia':0.18,'Canada':0.20,'Singapore':0.12,'UAE':0.10},
    'Electronics':{'Germany':0.20,'France':0.20,'Netherlands':0.20,'Italy':0.20,'UK':0.22,'USA':0.18,'Japan':0.25,'Australia':0.15,'Canada':0.18,'Singapore':0.10,'UAE':0.10},
    'Solar':{'USA':0.40,'Germany':0.18,'France':0.18,'Netherlands':0.18,'UK':0.20,'Japan':0.15,'Australia':0.12,'Canada':0.20,'Singapore':0.10,'UAE':0.08,'Italy':0.18},
    'Textiles':{'USA':0.20,'Germany':0.12,'France':0.15,'Netherlands':0.12,'Italy':0.18,'UK':0.15,'Japan':0.12,'Australia':0.10,'Canada':0.15,'Singapore':0.08,'UAE':0.08},
    'IT Software':{'USA':0.18,'Germany':0.12,'France':0.12,'Netherlands':0.10,'Italy':0.10,'UK':0.12,'Japan':0.15,'Australia':0.10,'Canada':0.12,'Singapore':0.08,'UAE':0.10},
    'Machinery':{'USA':0.15,'Germany':0.18,'France':0.18,'Netherlands':0.15,'Italy':0.18,'UK':0.18,'Japan':0.20,'Australia':0.12,'Canada':0.15,'Singapore':0.10,'UAE':0.10},
    'Auto Parts':{'USA':0.20,'Germany':0.18,'France':0.18,'Netherlands':0.15,'Italy':0.18,'UK':0.20,'Japan':0.25,'Australia':0.12,'Canada':0.18,'Singapore':0.10,'UAE':0.10},
    'Engineering':{'USA':0.15,'Germany':0.15,'France':0.15,'Netherlands':0.12,'Italy':0.15,'UK':0.15,'Japan':0.18,'Australia':0.10,'Canada':0.12,'Singapore':0.08,'UAE':0.08},
}
CERT_MAP = {
    'ISO9001':['Machinery','Auto Parts','Engineering','Electronics'],
    'ISO14001':['Chemicals','Pharmaceuticals','Solar'],
    'FDA':['Pharmaceuticals','Medical Devices'],
    'CE':['Electronics','Medical Devices','Machinery'],
    'WHO-GMP':['Pharmaceuticals'],'EU-GMP':['Pharmaceuticals','Chemicals'],
    'IEC':['Solar','Electronics'],'SOC2':['IT Software'],'GDPR':['IT Software'],
    'RoHS':['Electronics','Solar'],'REACH':['Chemicals'],
    'TUV':['Machinery','Electronics'],'UL':['Electronics','Machinery'],
}
COUNTRY_REGION = {
    'Netherlands':'Europe','Italy':'Europe','France':'Europe','Germany':'Europe',
    'UK':'Europe','Canada':'North America','USA':'North America',
    'Australia':'Asia','Singapore':'Asia','Japan':'Asia','UAE':'Middle East',
}
NEWS_IMPACT = {'Low':0.05,'Medium':0.12,'High':0.22}


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE SIGNALS — what gets compared during feedback
# These are the granular sub-signals within each dimension
# ─────────────────────────────────────────────────────────────────────────────

# Maps each dimension to the buyer columns that drive it
DIMENSION_SIGNALS = {
    'D1_Product_Compat':  ['sem_score', 'cert_boost', 'size_compat'],
    'D2_Geography_Fit':   ['country_openness', 'trade_route_exists'],
    'D3_Trade_Capacity':  ['avg_order_tons_norm', 'revenue_norm', 'team_size_norm'],
    'D4_Intent_Activity': ['Intent_Score', 'Prompt_Response', 'Hiring_Growth',
                           'Engagement_Spike', 'DecisionMaker_Change',
                           'Funding_Event', 'recency_score'],
    'D5_Reliability':     ['Good_Payment_History', 'Response_Probability'],
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def normalize(val, mn, mx):
    if mx == mn: return 0.5
    return float(np.clip((val - mn) / (mx - mn), 0, 1))

def recency_score(date_val, ref_date):
    if pd.isna(date_val): return 0.0
    days = (ref_date - pd.Timestamp(date_val)).days
    if days <= 90:  return 1.0
    elif days <= 180: return 0.7
    elif days <= 365: return 0.4
    return 0.1

def normalize_weights(weights: dict) -> dict:
    """Re-normalize weights to sum to 1.0, respecting min/max bounds."""
    w = {k: np.clip(v, WEIGHT_MIN, WEIGHT_MAX) for k, v in weights.items()}
    total = sum(w.values())
    return {k: round(v / total, 4) for k, v in w.items()}

def get_adjacent_industries(industry: str) -> dict:
    adj = {}
    for (a, b), sc in INDUSTRY_AFFINITY.items():
        if a == industry: adj[b] = sc
        elif b == industry: adj[a] = sc
    return adj


# ─────────────────────────────────────────────────────────────────────────────
# NEWS RISK CACHE — pre-computed once
# ─────────────────────────────────────────────────────────────────────────────

def build_news_cache(news_df: pd.DataFrame, lookback_days=90) -> dict:
    cutoff = news_df['Date'].max() - pd.Timedelta(days=lookback_days)
    recent = news_df[news_df['Date'] >= cutoff]
    cache  = {}
    for country in ['Netherlands','Canada','Australia','Italy','Singapore',
                    'USA','Japan','UK','France','Germany','UAE']:
        for industry in ['Solar','Medical Devices','Engineering','Machinery',
                         'IT Software','Textiles','Electronics','Pharmaceuticals',
                         'Chemicals','Auto Parts']:
            region = COUNTRY_REGION.get(country, 'Global')
            rel    = recent[
                (recent['Region'].isin([region, 'Global'])) &
                (recent['Affected_Industry'] == industry)
            ]
            penalty = 0.0
            for _, r in rel.iterrows():
                base = NEWS_IMPACT.get(r['Impact_Level'], 0.05)
                if   r['War_Flag'] == 1:                      penalty += base * 1.5
                elif r['Event_Type'] == 'Supply Chain Shock': penalty += base
                elif r['Event_Type'] == 'Tariff Update':      penalty += base
                elif r['Event_Type'] == 'Stock Crash':        penalty += base * 0.5
                elif r['Event_Type'] == 'Natural Calamity':   penalty += base
                elif r['Event_Type'] == 'Trade Agreement':    penalty -= base * 0.5
            cache[(country, industry)] = round(min(max(penalty, 0.0), 0.35), 4)
    return cache


# ─────────────────────────────────────────────────────────────────────────────
# SCORE BUYER POOL — vectorized, uses current weights
# ─────────────────────────────────────────────────────────────────────────────

def score_pool(
    exp_row:      pd.Series,
    buyer_pool:   pd.DataFrame,
    mat_lookup:   dict,
    news_cache:   dict,
    cap_norms:    dict,
    ref_date:     pd.Timestamp,
    weights:      dict,
) -> pd.DataFrame:
    """
    Scores all buyers in pool against one exporter.
    Returns DataFrame with all dimension scores + Final_Match_Score.
    """
    pool = buyer_pool.copy()
    ei   = exp_row['Industry']

    # Adjacent industry affinity scores
    adj  = get_adjacent_industries(ei)
    target = {ei: 1.0}
    target.update(adj)

    # Filter to relevant industries only
    pool = pool[pool['Industry'].isin(target.keys())].copy()
    if pool.empty:
        return pd.DataFrame()

    # ── D1 Product Compatibility ──────────────────────────────────
    pool['sem_score']   = pool['Industry'].map(target).fillna(0.0)
    exp_cert            = str(exp_row.get('Certification', 'None'))
    rel_inds            = CERT_MAP.get(exp_cert, [])
    pool['cert_boost']  = pool['Industry'].apply(
        lambda ii: 1.0 if ii in rel_inds else (0.4 if target.get(ii, 0) > 0 else 0.0))
    exp_msme            = int(exp_row.get('MSME_Udyam', 0))
    pool['size_compat'] = ((pool['Team_Size'] < 500).astype(int) == exp_msme).astype(float) * 0.3
    pool['D1']          = (
        pool['sem_score']   * 0.60 +
        pool['cert_boost']  * 0.25 +
        pool['size_compat'] * 0.15
    ).clip(0, 1)

    # ── D2 Geography Fit ──────────────────────────────────────────
    state_score              = HIGH_EXPORT_STATES.get(str(exp_row.get('State', '')), 0.4)
    pool['country_openness'] = pool['Country'].map(COUNTRY_OPENNESS).fillna(0.5)
    pool['trade_route_exists'] = float(exp_row.get('Has_Shipment_Value', 0))
    pool['D2']               = (
        state_score                    * 0.50 +
        pool['country_openness']       * 0.30 +
        pool['trade_route_exists']     * 0.20
    ).clip(0, 1)

    # ── D3 Trade Capacity ─────────────────────────────────────────
    pool['avg_order_tons_norm'] = normalize(
        float(exp_row.get('Quantity_Tons', 0)), *cap_norms['Quantity_Tons'])
    pool['revenue_norm']        = normalize(
        float(exp_row.get('Revenue_Size_USD', 0)), *cap_norms['Revenue_Size_USD'])
    pool['team_size_norm']      = normalize(
        float(exp_row.get('Team_Size', 0)), *cap_norms['Team_Size'])
    d3_val = (
        normalize(float(exp_row.get('Shipment_Value_USD', 0)), *cap_norms['Shipment_Value_USD']) * 0.40 +
        pool['avg_order_tons_norm'].iloc[0] * 0.30 +
        pool['revenue_norm'].iloc[0]        * 0.20 +
        pool['team_size_norm'].iloc[0]      * 0.10
    )
    pool['D3'] = round(float(d3_val), 4)

    # ── D4 Intent & Activity ──────────────────────────────────────
    pool['recency_score']  = pool['Date'].apply(lambda d: recency_score(d, ref_date))
    pool['maturity_w']     = pool['Buyer_ID'].map(mat_lookup).map(MATURITY_W).fillna(0.7)
    pool['Funding_Event']  = pd.to_numeric(pool['Funding_Event'], errors='coerce').fillna(0)
    pool['D4_raw']         = (
        pool['Intent_Score']          * 0.30 +
        pool['Prompt_Response']       * 0.15 +
        pool['Hiring_Growth']         * 0.15 +
        pool['Engagement_Spike']      * 0.10 +
        pool['DecisionMaker_Change']  * 0.10 +
        pool['Funding_Event']         * 0.10 +
        pool['recency_score']         * 0.10
    )
    pool['D4'] = (pool['D4_raw'] * pool['maturity_w']).clip(0, 1)

    # ── D5 Reliability ────────────────────────────────────────────
    exp_has_cert   = 1.0 if exp_cert and exp_cert != 'None' else 0.0
    exp_payment    = float(exp_row.get('Good_Payment_Terms', 0))
    pool['D5']     = (
        exp_has_cert                      * 0.25 +
        exp_payment                       * 0.25 +
        pool['Good_Payment_History']      * 0.30 +
        pool['Response_Probability']      * 0.20
    ).clip(0, 1)

    # ── Raw Score using current weights ───────────────────────────
    pool['Raw_Score'] = (
        pool['D1'] * weights['D1_Product_Compat']  +
        pool['D2'] * weights['D2_Geography_Fit']   +
        pool['D3'] * weights['D3_Trade_Capacity']  +
        pool['D4'] * weights['D4_Intent_Activity'] +
        pool['D5'] * weights['D5_Reliability']
    )

    # ── Risk Friction ─────────────────────────────────────────────
    pool['S1'] = pool.apply(
        lambda r: (BILATERAL.get(r['Country'], 0.35) * 0.40 +
                   TRADE_LAW.get(r['Country'], 0.30) * 0.35 +
                   IND_COUNTRY.get(r['Industry'], {}).get(r['Country'], 0.15) * 0.25), axis=1)
    pool['S2'] = (
        pool['War_Event']                         * 0.30 +
        pool['Tariff_News'].clip(0, 1)            * 0.20 +
        pool['StockMarket_Shock'].clip(0, 1)      * 0.15 +
        pool['Natural_Calamity']                   * 0.10 +
        pool['Currency_Fluctuation'].clip(0, 1)   * 0.10 +
        float(exp_row.get('War_Risk', 0))          * 0.07 +
        max(float(exp_row.get('Tariff_Impact', 0)), 0) * 0.05 +
        float(exp_row.get('Natural_Calamity_Risk', 0)) * 0.03
    ).clip(0, 1)
    pool['S3']             = pool.apply(
        lambda r: news_cache.get((r['Country'], r['Industry']), 0.0), axis=1)
    pool['Risk_Friction']  = (
        pool['S1'] * 0.40 + pool['S2'] * 0.35 + pool['S3'] * 0.25
    ).clip(0, 0.60)

    # ── Final Score ───────────────────────────────────────────────
    pool['Final_Match_Score'] = (pool['Raw_Score'] - pool['Risk_Friction']).clip(0, 1).round(4)

    # ── Risk label ────────────────────────────────────────────────
    pool['Risk_Label'] = pool['Risk_Friction'].apply(
        lambda r: 'Low' if r < 0.10 else ('Medium' if r < 0.20 else ('High' if r < 0.35 else 'Very High')))

    pool['Match_Type']    = pool['Industry'].apply(lambda ii: 'Primary' if ii == ei else 'Adjacent')

    return pool.sort_values('Final_Match_Score', ascending=False)


# ─────────────────────────────────────────────────────────────────────────────
# WEIGHT ADJUSTMENT — core feedback logic
# ─────────────────────────────────────────────────────────────────────────────

def adjust_weights(
    accepted_buyers: pd.DataFrame,
    rejected_buyers: pd.DataFrame,
    current_weights: dict,
    round_num: int,
) -> tuple[dict, list]:
    """
    Compares feature signals between accepted and rejected buyers.

    For each DIMENSION:
      - Compute avg signal in accepted vs rejected
      - If accepted >> rejected: this dimension predicted acceptance → INCREASE weight
      - If rejected >> accepted: this dimension predicted rejection  → DECREASE weight

    Returns:
      - new_weights (dict)
      - adjustment_log (list of dicts explaining each change)
    """
    new_weights    = current_weights.copy()
    adjustment_log = []

    dim_cols = {
        'D1_Product_Compat':  'D1',
        'D2_Geography_Fit':   'D2',
        'D3_Trade_Capacity':  'D3',
        'D4_Intent_Activity': 'D4',
        'D5_Reliability':     'D5',
    }

    for dim_key, col in dim_cols.items():
        if col not in accepted_buyers.columns or col not in rejected_buyers.columns:
            continue

        avg_acc = accepted_buyers[col].mean() if len(accepted_buyers) > 0 else 0.5
        avg_rej = rejected_buyers[col].mean()  if len(rejected_buyers) > 0 else 0.5
        delta   = avg_acc - avg_rej

        old_w   = current_weights[dim_key]

        if delta > DELTA_THRESHOLD:
            # Accepted buyers scored HIGH on this → it's a good signal → increase weight
            change    = LEARNING_RATE
            direction = 'INCREASE ↑'
            reason    = f"Avg in accepted ({avg_acc:.3f}) > rejected ({avg_rej:.3f})"
        elif delta < -DELTA_THRESHOLD:
            # Rejected buyers scored HIGH on this → misleading signal → decrease weight
            change    = -LEARNING_RATE
            direction = 'DECREASE ↓'
            reason    = f"Avg in rejected ({avg_rej:.3f}) > accepted ({avg_acc:.3f})"
        else:
            # No significant difference → weight unchanged
            change    = 0.0
            direction = 'UNCHANGED →'
            reason    = f"No significant difference (delta={delta:.3f})"

        new_weights[dim_key] = old_w + change

        adjustment_log.append({
            'Round':      round_num,
            'Dimension':  dim_key,
            'Old_Weight': round(old_w, 4),
            'Delta':      round(delta, 4),
            'Change':     change,
            'New_Weight': round(new_weights[dim_key], 4),
            'Direction':  direction,
            'Reason':     reason,
        })

    # Re-normalize so weights still sum to 1.0
    new_weights = normalize_weights(new_weights)

    # Update log with normalized weights
    for entry in adjustment_log:
        entry['Normalized_Weight'] = new_weights[entry['Dimension']]

    return new_weights, adjustment_log


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ADAPTIVE ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class AdaptiveScoringEngine:
    """
    Stateful engine per exporter.
    Maintains buyer pool, weights, and full history across rounds.
    """

    def __init__(
        self,
        exp_row:    pd.Series,
        buyer_pool: pd.DataFrame,
        mat_lookup: dict,
        news_cache: dict,
        cap_norms:  dict,
        ref_date:   pd.Timestamp,
    ):
        self.exp_row     = exp_row
        self.pool        = buyer_pool.copy()     # shrinks as buyers are accepted
        self.rejected    = pd.DataFrame()        # rejected buyers stay in pool
        self.accepted    = pd.DataFrame()        # accepted buyers removed permanently
        self.mat_lookup  = mat_lookup
        self.news_cache  = news_cache
        self.cap_norms   = cap_norms
        self.ref_date    = ref_date
        self.weights     = DEFAULT_WEIGHTS.copy()
        self.round_num   = 0
        self.weight_history  = [{'Round': 0, **DEFAULT_WEIGHTS}]
        self.adjustment_log  = []
        self.all_rounds_top15= []

    def get_next_15(self) -> pd.DataFrame:
        """Score current pool and return top 15."""
        self.round_num += 1

        scored = score_pool(
            self.exp_row, self.pool,
            self.mat_lookup, self.news_cache,
            self.cap_norms, self.ref_date,
            self.weights,
        )

        if scored.empty:
            return pd.DataFrame()

        top15  = scored.head(TOP_N).copy()
        top15['Round'] = self.round_num

        self.all_rounds_top15.append(top15)
        return top15

    def submit_feedback(self, accepted_ids: list, rejected_ids: list):
        """
        Process swipe decisions.
        accepted_ids → remove from pool permanently
        rejected_ids → stay in pool, trigger weight adjustment
        """
        if not accepted_ids and not rejected_ids:
            return

        # Split last round's top15 into accepted/rejected dataframes
        last_top15    = self.all_rounds_top15[-1]
        accepted_rows = last_top15[last_top15['Buyer_ID'].isin(accepted_ids)]
        rejected_rows = last_top15[last_top15['Buyer_ID'].isin(rejected_ids)]

        # Adjust weights based on comparison
        if len(accepted_rows) > 0 and len(rejected_rows) > 0:
            new_weights, log = adjust_weights(
                accepted_rows, rejected_rows,
                self.weights, self.round_num
            )
            self.weights         = new_weights
            self.adjustment_log += log
            self.weight_history.append({
                'Round': self.round_num,
                **new_weights
            })

        # Remove accepted buyers from pool permanently
        self.pool     = self.pool[~self.pool['Buyer_ID'].isin(accepted_ids)]
        self.accepted = pd.concat([self.accepted, accepted_rows], ignore_index=True)

        # Rejected buyers stay in pool (already there, no action needed)
        # But update their position — they'll be re-ranked with new weights
        print(f"\n  Round {self.round_num} feedback processed:")
        print(f"  Accepted: {len(accepted_ids)} buyers removed from pool")
        print(f"  Rejected: {len(rejected_ids)} buyers re-enter with adjusted weights")
        print(f"  Pool remaining: {len(self.pool)} buyers")
        print(f"  Updated weights: { {k: round(v,3) for k,v in self.weights.items()} }")

    def get_summary(self) -> dict:
        return {
            'Exporter_ID':       self.exp_row['Exporter_ID'],
            'Industry':          self.exp_row['Industry'],
            'Total_Rounds':      self.round_num,
            'Total_Accepted':    len(self.accepted),
            'Pool_Remaining':    len(self.pool),
            'Final_Weights':     self.weights,
            'Weight_History':    self.weight_history,
            'Adjustment_Log':    self.adjustment_log,
        }


# ─────────────────────────────────────────────────────────────────────────────
# SIMULATION — run 3 rounds for EXP_1715 with fake feedback
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import time

    print("Loading data...")
    clean   = pd.read_excel('EXIM_Cleaned_GlobexMatch.xlsx', sheet_name=None)
    exp_df  = clean['Exporters_Clean']
    imp_df  = clean['Importers_Clean']
    news_df = clean['News_Clean']
    mat_df  = clean['Buyer_Maturity']

    for df in [exp_df, imp_df, news_df]:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    imp_df['Funding_Event'] = pd.to_numeric(imp_df['Funding_Event'], errors='coerce').fillna(0)

    latest_imp = imp_df[imp_df['Is_Latest_Record']==1].copy().reset_index(drop=True)
    mat_lookup  = dict(zip(mat_df['Buyer_ID'], mat_df['Maturity']))
    ref_date    = exp_df['Date'].max()

    cap_norms  = {c: (exp_df[c].min(), exp_df[c].max())
                  for c in ['Shipment_Value_USD','Quantity_Tons','Revenue_Size_USD','Team_Size']}

    print("Building news cache...")
    news_cache = build_news_cache(news_df)

    # Get EXP_1715
    exp_row = exp_df[exp_df['Exporter_ID']=='EXP_1715'].iloc[0]
    print(f"\nExporter: {exp_row['Exporter_ID']} | {exp_row['Industry']} | {exp_row['State']}")

    engine = AdaptiveScoringEngine(
        exp_row, latest_imp, mat_lookup, news_cache, cap_norms, ref_date
    )

    # ── ROUND 1 ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"ROUND 1 — Initial weights: {DEFAULT_WEIGHTS}")
    print(f"{'='*60}")
    top15_r1 = engine.get_next_15()
    print(top15_r1[['Buyer_ID','Buyer_Country' if 'Buyer_Country' in top15_r1.columns else 'Country',
                     'Industry','Match_Type','D1','D2','D3','D4','D5',
                     'Risk_Friction','Final_Match_Score']].to_string() 
          if 'Buyer_Country' not in top15_r1.columns 
          else top15_r1[['Buyer_ID','Country','Industry','Match_Type','D1','D2','D3','D4','D5',
                          'Risk_Friction','Final_Match_Score']].to_string())

    # Simulate: accept top 5 (high D4 intent), reject bottom 10
    top15_ids    = top15_r1['Buyer_ID'].tolist()
    accepted_r1  = top15_ids[:5]
    rejected_r1  = top15_ids[5:]
    print(f"\nSimulated swipes: ✅ {len(accepted_r1)} accepted | ❌ {len(rejected_r1)} rejected")
    engine.submit_feedback(accepted_r1, rejected_r1)

    # ── ROUND 2 ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"ROUND 2 — Adjusted weights: { {k:round(v,3) for k,v in engine.weights.items()} }")
    print(f"{'='*60}")
    top15_r2 = engine.get_next_15()
    if not top15_r2.empty:
        print(top15_r2[['Buyer_ID','Country','Industry','Match_Type','D1','D2','D3','D4','D5',
                         'Risk_Friction','Final_Match_Score']].to_string())

        # Simulate round 2 feedback
        top15_ids_r2 = top15_r2['Buyer_ID'].tolist()
        accepted_r2  = top15_ids_r2[:5]
        rejected_r2  = top15_ids_r2[5:]
        print(f"\nSimulated swipes: ✅ {len(accepted_r2)} accepted | ❌ {len(rejected_r2)} rejected")
        engine.submit_feedback(accepted_r2, rejected_r2)

    # ── ROUND 3 ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"ROUND 3 — Further adjusted weights: { {k:round(v,3) for k,v in engine.weights.items()} }")
    print(f"{'='*60}")
    top15_r3 = engine.get_next_15()
    if not top15_r3.empty:
        print(top15_r3[['Buyer_ID','Country','Industry','Match_Type','D4','D5',
                         'Risk_Friction','Final_Match_Score']].to_string())

    # ── WEIGHT EVOLUTION ─────────────────────────────────────────
    summary = engine.get_summary()
    print(f"\n{'='*60}")
    print(f"WEIGHT EVOLUTION ACROSS ROUNDS")
    print(f"{'='*60}")
    wh = pd.DataFrame(summary['Weight_History'])
    print(wh.to_string(index=False))

    print(f"\n{'='*60}")
    print(f"ADJUSTMENT LOG")
    print(f"{'='*60}")
    log_df = pd.DataFrame(summary['Adjustment_Log'])
    if not log_df.empty:
        print(log_df[['Round','Dimension','Old_Weight','Delta','Direction','Normalized_Weight']].to_string(index=False))

    print(f"\nTotal accepted across all rounds: {summary['Total_Accepted']}")
    print(f"Pool remaining: {summary['Pool_Remaining']}")