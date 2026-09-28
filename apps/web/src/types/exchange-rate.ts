export interface ExchangeRate {
  code: string;
  codeIn: string;
  name: string;
  high: number;
  low: number;
  bid: number;
  ask: number;
  variation: number;
  timestamp: string;
}

export interface ExchangeRateHistoryPoint {
  high: number;
  low: number;
  bid: number;
  ask: number;
  variation: number;
  timestamp: string;
}
