"""
GlobexMatch — Data Cleaning Pipeline
Tailored to: EXIM_DatasetAlgo_Hackathon.xlsx
Sheets: Exporter_LiveSignals | Importer_LiveSignals | Global_News_LiveSignals

Run:  python cleaner_globexmatch.py
Output: EXIM_Cleaned_GlobexMatch.xlsx + prints summary

This will give you the cleaned dataset for EXP_1715 ( electronics , telangana )
"""

import pandas as pd
from datetime import datetime

# ── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_FILE  = "EXIM_DatasetAlgo_Hackathon.xlsx"
OUTPUT_FILE = "EXIM_Cleaned_GlobexMatch.xlsx"

IMPACT_MAP     = {'Low': 1, 'Medium': 2, 'High': 3}
SCORE_COLS_EXP = ['Intent_Score', 'Prompt_Response_Score']
RISK_COLS_EXP  = ['Tariff_Impact', 'StockMarket_Impact', 'Currency_Shift']
SCORE_COLS_IMP = ['Intent_Score', 'Response_Probability', 'Prompt_Response']
RISK_COLS_IMP  = ['Tariff_News', 'StockMarket_Shock', 'Currency_Fluctuation']


# ── LOAD ─────────────────────────────────────────────────────────────────────
def load_data(filepath: str) -> dict:
    sheets = pd.read_excel(filepath, sheet_name=None)
    return {
        'exp':  sheets['Exporter_LiveSignals_v5_Updated'].copy(),
        'imp':  sheets['Importer_LiveSignals_v5_Updated'].copy(),
        'news': sheets['Global_News_LiveSignals_Updated'].copy(),
    }


# ── EXPORTER CLEANING ─────────────────────────────────────────────────────────
def clean_exporters(df: pd.DataFrame) -> pd.DataFrame:
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')

    # MSME_Udyam: NaN = not registered → 0
    df['MSME_Udyam'] = df['MSME_Udyam'].fillna(0).astype(int)

    # Manufacturing_Capacity: fill with industry median (50% missing)
    medians = df.groupby('Industry')['Manufacturing_Capacity_Tons'].median()
    df['Manufacturing_Capacity_Tons'] = df.apply(
        lambda r: medians[r['Industry']] if pd.isna(r['Manufacturing_Capacity_Tons'])
                  else r['Manufacturing_Capacity_Tons'], axis=1
    )

    # Certification: NaN → 'None'
    df['Certification'] = df['Certification'].fillna('None')

    # Shipment_Value_USD: 67% missing — flag before filling
    # NOTE: Missing = no recent shipment recorded, not zero trade
    df['Has_Shipment_Value'] = df['Shipment_Value_USD'].notna().astype(int)
    df['Shipment_Value_USD']  = df['Shipment_Value_USD'].fillna(0)

    # Clip all score columns to valid ranges
    for col in SCORE_COLS_EXP:
        df[col] = df[col].clip(0, 1)
    for col in RISK_COLS_EXP:
        df[col] = df[col].clip(-1, 1)

    # Sort by date desc, flag most recent record per exporter
    df = df.sort_values('Date', ascending=False)
    df['Is_Latest_Record'] = (~df.duplicated(subset=['Exporter_ID'], keep='first')).astype(int)

    return df.reset_index(drop=True)


# ── IMPORTER CLEANING ─────────────────────────────────────────────────────────
def clean_importers(df: pd.DataFrame) -> pd.DataFrame:
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')

    # Buyer_ID: 598 nulls → generate synthetic IDs
    null_mask = df['Buyer_ID'].isnull()
    df.loc[null_mask, 'Buyer_ID'] = [
        f'BUY_SYNTH_{i:05d}' for i in range(null_mask.sum())
    ]

    # Avg_Order_Tons: 49% missing → fill with country+industry median
    order_medians = df.groupby(['Country', 'Industry'])['Avg_Order_Tons'].median()
    global_median  = df['Avg_Order_Tons'].median()
    def fill_order(r):
        if pd.isna(r['Avg_Order_Tons']):
            try:    return order_medians.loc[(r['Country'], r['Industry'])]
            except: return global_median
        return r['Avg_Order_Tons']
    df['Avg_Order_Tons'] = df.apply(fill_order, axis=1)

    # Certification: NaN → 'None'
    df['Certification'] = df['Certification'].fillna('None')

    # Preferred_Channel: NaN → 'Unknown'
    df['Preferred_Channel'] = df['Preferred_Channel'].fillna('Unknown')

    # Response_Probability: 67% missing → impute from Intent_Score
    # Logic: buyers with high intent are likely to respond
    df['Response_Probability'] = df.apply(
        lambda r: round(r['Intent_Score'] * 0.85, 2)
                  if pd.isna(r['Response_Probability']) else r['Response_Probability'],
        axis=1
    )

    # Clip score and risk columns
    for col in SCORE_COLS_IMP:
        df[col] = df[col].clip(0, 1)
    for col in RISK_COLS_IMP:
        df[col] = df[col].clip(-1, 1)

    # Sort by date desc, flag most recent record per buyer
    df = df.sort_values('Date', ascending=False)
    df['Is_Latest_Record'] = (~df.duplicated(subset=['Buyer_ID'], keep='first')).astype(int)

    return df.reset_index(drop=True)


# ── NEWS CLEANING ─────────────────────────────────────────────────────────────
def clean_news(df: pd.DataFrame) -> pd.DataFrame:
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['Impact_Score']  = df['Impact_Level'].map(IMPACT_MAP)    # Low=1, Med=2, High=3
    df['Tariff_Change'] = df['Tariff_Change'].clip(-1, 1)
    df['Currency_Shift']= df['Currency_Shift'].clip(-1, 1)
    return df


# ── BUYER MATURITY ANALYSIS ───────────────────────────────────────────────────
def compute_buyer_maturity(imp_clean: pd.DataFrame) -> pd.DataFrame:
    """
    Compares buyer's recent 90-day intent vs. overall intent.
    Assigns maturity: New | Growing | Stable | Declining
    This table feeds directly into the Scoring Engine.
    """
    latest_date = imp_clean['Date'].max()
    cutoff_90   = latest_date - pd.Timedelta(days=90)

    recent  = (imp_clean[imp_clean['Date'] >= cutoff_90]
               .groupby('Buyer_ID')['Intent_Score'].mean()
               .rename('Recent_Intent_90d'))
    overall = (imp_clean.groupby('Buyer_ID')['Intent_Score'].mean()
               .rename('Overall_Intent'))

    maturity_df = pd.concat([recent, overall], axis=1).fillna(0)
    maturity_df['Intent_Trend'] = (
        maturity_df['Recent_Intent_90d'] - maturity_df['Overall_Intent']
    ).round(3)

    def assign_maturity(row):
        if   row['Overall_Intent'] < 0.2:    return 'New'
        elif row['Intent_Trend']   > 0.10:   return 'Growing'
        elif row['Intent_Trend']   < -0.10:  return 'Declining'
        else:                                return 'Stable'

    maturity_df['Maturity'] = maturity_df.apply(assign_maturity, axis=1)
    return maturity_df.reset_index()


# ── SAVE OUTPUT ───────────────────────────────────────────────────────────────
def save_output(exp, imp, news, maturity, filepath: str):
    with pd.ExcelWriter(filepath, engine='openpyxl', datetime_format='YYYY-MM-DD') as writer:
        exp.to_excel(writer,      sheet_name='Exporters_Clean',  index=False)
        imp.to_excel(writer,      sheet_name='Importers_Clean',  index=False)
        news.to_excel(writer,     sheet_name='News_Clean',       index=False)
        maturity.to_excel(writer, sheet_name='Buyer_Maturity',   index=False)


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Loading data...")
    data = load_data(INPUT_FILE)

    print("Cleaning exporters...")
    exp_clean  = clean_exporters(data['exp'])

    print("Cleaning importers...")
    imp_clean  = clean_importers(data['imp'])

    print("Cleaning news signals...")
    news_clean = clean_news(data['news'])

    print("Computing buyer maturity...")
    maturity   = compute_buyer_maturity(imp_clean)

    print("Saving output...")
    save_output(exp_clean, imp_clean, news_clean, maturity, OUTPUT_FILE)

    # ── SUMMARY ──────────────────────────────────────────────────────
    print("\n" + "="*50)
    print("CLEANING COMPLETE")
    print("="*50)
    print(f"Exporters : {exp_clean.shape[0]:,} rows | {exp_clean.isnull().sum().sum()} nulls remaining")
    print(f"Importers : {imp_clean.shape[0]:,} rows | {imp_clean.isnull().sum().sum()} nulls remaining")
    print(f"News      : {news_clean.shape[0]:,} rows | {news_clean.isnull().sum().sum()} nulls remaining")
    print(f"\nBuyer Maturity Distribution:")
    print(maturity['Maturity'].value_counts().to_string())
    print(f"\nOutput saved to: {OUTPUT_FILE}")
