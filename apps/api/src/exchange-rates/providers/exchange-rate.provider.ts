export interface ExchangeRate {
  code: string;
  codeIn: string;
  name: string;
  high: number;
  low: number;
  bid: number;
  ask: number;
  variation: number;
  timestamp: Date;
}

export interface ExchangeRateHistoryPoint {
  high: number;
  low: number;
  bid: number;
  ask: number;
  variation: number;
  timestamp: Date;
}

export abstract class ExchangeRateProvider {
  abstract getRates(currencyCodes: string[]): Promise<ExchangeRate[]>;

  abstract getHistory(
    currencyCode: string,
    days: number,
  ): Promise<ExchangeRateHistoryPoint[]>;
}
