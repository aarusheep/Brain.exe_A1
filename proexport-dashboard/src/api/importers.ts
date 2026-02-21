// src/api/importers.ts
const API_URL = 'http://localhost:5000/api/importers';

export interface Importer {
  _id: string;
  name: string;
  country: string;
  industry: string;
  intent_score: number;
  response_probability: number;
  trade_volume: string;
  revenue: number;
  team_size: number;
  certification: string;
  good_payment_history: boolean;
  hiring_growth: boolean;
  funding_event: string;
  engagement_spike: boolean;
  sales_nav_visits: number;
  decision_maker_change: boolean;
  preferred_channel: string;

  tariff_news: boolean;
  stock_market_shock: boolean;
  war_event: boolean;
  natural_calamity: boolean;
  currency_fluctuation: number;

  summary?: string;
  pros: string[];
  cons: string[];
}

export const fetchImporters = async (): Promise<Importer[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch importers');
  return response.json();
};

export const fetchSummary = async (id: string): Promise<{ summary: string, pros: string[], cons: string[] }> => {
  const response = await fetch(`${API_URL}/${id}/summary`);
  if (!response.ok) throw new Error('Failed to fetch summary');
  return response.json();
};

export const reviewImporter = async (id: string, status: 'accepted' | 'rejected') => {
  const response = await fetch(`${API_URL}/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to review importer');
  return response.json();
};
