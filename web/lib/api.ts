const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FundingRate {
  coin: string;
  exchange: string;
  rate: number;
  raw_rate: number;
  interval_hours: number;
  mark_price: number;
  open_interest: number;
}

export interface FundingSpread {
  coin: string;
  long_exchange: string;
  short_exchange: string;
  spread: number;
  long_rate: number;
  short_rate: number;
  annualized_pct: number;
  spread_bps: number;
}

export interface PredictedVenue {
  venue: string;
  rate: number;
  interval_hours: number;
  hourly_rate: number;
  annualized_pct: number;
}

export interface PredictedCoin {
  coin: string;
  venues: PredictedVenue[];
}

export interface CostPosition {
  coin: string;
  size: number;
  side: string;
  mark_price: number;
  funding_rate: number;
  hourly_cost: number;
}

export interface CostData {
  positions: CostPosition[];
  total_hourly: number;
  total_daily: number;
  total_monthly: number;
  account_value: number;
}

export interface HealthData {
  ok: boolean;
  exchanges: Record<string, string>;
  failed: string[];
}

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function getSpreads(limit = 20) {
  return fetchAPI<FundingSpread[]>(`/api/spreads?limit=${limit}`);
}

export function getRates() {
  return fetchAPI<FundingRate[]>("/api/rates");
}

export function getCoinRates(coin: string) {
  return fetchAPI<FundingRate[]>(`/api/rates/${coin}`);
}

export function getPredicted() {
  return fetchAPI<PredictedCoin[]>("/api/predicted");
}

export function getCost(address: string) {
  return fetchAPI<CostData>(`/api/cost/${address}`);
}

export function getHealth() {
  return fetchAPI<HealthData>("/api/health");
}
