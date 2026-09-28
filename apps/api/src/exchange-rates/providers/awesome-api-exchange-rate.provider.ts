import { Injectable, Logger } from '@nestjs/common';

import {
  ExchangeRate,
  ExchangeRateHistoryPoint,
  ExchangeRateProvider,
} from './exchange-rate.provider';

interface AwesomeApiRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

interface AwesomeApiHistoryRate {
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
}

type AwesomeApiResponse = Record<string, AwesomeApiRate>;

@Injectable()
export class AwesomeApiExchangeRateProvider extends ExchangeRateProvider {
  private readonly logger = new Logger(
    AwesomeApiExchangeRateProvider.name,
  );

  private readonly baseUrl = 'https://economia.awesomeapi.com.br';
  private readonly requestTimeout = 5000;
  private readonly maxAttempts = 2;
  private readonly retryDelay = 300;

  async getRates(
    currencyCodes: string[],
  ): Promise<ExchangeRate[]> {
    if (currencyCodes.length === 0) {
      return [];
    }

    const pairs = currencyCodes
      .map((code) => `${code.toUpperCase()}-BRL`)
      .join(',');

    const data = await this.request<AwesomeApiResponse>(
      `/last/${encodeURIComponent(pairs)}`,
    );

    return Object.values(data).map((rate) => ({
      code: rate.code,
      codeIn: rate.codein,
      name: rate.name,
      high: Number(rate.high),
      low: Number(rate.low),
      bid: Number(rate.bid),
      ask: Number(rate.ask),
      variation: Number(rate.pctChange),
      timestamp: new Date(Number(rate.timestamp) * 1000),
    }));
  }

  async getHistory(
    currencyCode: string,
    days: number,
  ): Promise<ExchangeRateHistoryPoint[]> {
    const pair = `${currencyCode.toUpperCase()}-BRL`;

    const data = await this.request<AwesomeApiHistoryRate[]>(
      `/json/daily/${encodeURIComponent(pair)}/${days}`,
    );

    return data
      .map((rate) => ({
        high: Number(rate.high),
        low: Number(rate.low),
        bid: Number(rate.bid),
        ask: Number(rate.ask),
        variation: Number(rate.pctChange),
        timestamp: new Date(Number(rate.timestamp) * 1000),
      }))
      .sort(
        (first, second) =>
          first.timestamp.getTime() -
          second.timestamp.getTime(),
      );
  }

  private async request<T>(
    path: string,
  ): Promise<T> {
    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.maxAttempts;
      attempt += 1
    ) {
      try {
        const response = await fetch(
          `${this.baseUrl}${path}`,
          {
            signal: AbortSignal.timeout(
              this.requestTimeout,
            ),
          },
        );

        if (!response.ok) {
          const error = new AwesomeApiHttpError(
            response.status,
          );

          if (!this.shouldRetryStatus(response.status)) {
            throw error;
          }

          lastError = error;
        } else {
          return (await response.json()) as T;
        }
      } catch (error) {
        if (
          error instanceof AwesomeApiHttpError &&
          !this.shouldRetryStatus(error.status)
        ) {
          throw error;
        }

        lastError = error;
      }

      if (attempt < this.maxAttempts) {
        this.logger.warn(
          `AwesomeAPI request failed. Retrying (${attempt + 1}/${this.maxAttempts})...`,
        );

        await this.sleep(this.retryDelay);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('AwesomeAPI request failed');
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}

class AwesomeApiHttpError extends Error {
  constructor(readonly status: number) {
    super(
      `AwesomeAPI request failed with status ${status}`,
    );

    this.name = 'AwesomeApiHttpError';
  }
}