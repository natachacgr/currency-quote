import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../database/redis/redis.service';
import {
  ExchangeRate,
  ExchangeRateHistoryPoint,
  ExchangeRateProvider,
} from './providers/exchange-rate.provider';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  private readonly cacheTtl: number;
  private readonly historyCacheTtl = 300;
  private readonly staleCacheTtl = 300;
  private readonly staleHistoryCacheTtl = 1800;
  private readonly lockTtl = 5;
  private readonly lockRetryDelay = 100;
  private readonly lockRetryAttempts = 20;

  constructor(
    private readonly exchangeRateProvider: ExchangeRateProvider,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.cacheTtl = Number(
      configService.get<string>('EXCHANGE_RATES_CACHE_TTL') ?? 30,
    );
  }

  async getRates(currencyCodes: string[]): Promise<ExchangeRate[]> {
    const normalizedCodes = [
      ...new Set(currencyCodes.map((code) => code.trim().toUpperCase())),
    ].sort();

    const cacheKey = `exchange-rates:${normalizedCodes.join(',')}`;
    const staleCacheKey = `stale:${cacheKey}`;
    const lockKey = `lock:${cacheKey}`;

    const cachedRates = await this.getCachedRates(cacheKey);

    if (cachedRates) {
      return cachedRates;
    }

    const lockToken = randomUUID();

    const lockAcquired = await this.tryAcquireLock(
      lockKey,
      lockToken,
    );

    if (lockAcquired === null) {
      return this.exchangeRateProvider.getRates(normalizedCodes);
    }

    if (lockAcquired) {
      try {
        const ratesAfterLock = await this.getCachedRates(cacheKey);

        if (ratesAfterLock) {
          return ratesAfterLock;
        }

        return await this.fetchAndCacheRates(
          normalizedCodes,
          cacheKey,
          staleCacheKey,
        );
      } finally {
        await this.tryReleaseLock(
          lockKey,
          lockToken,
        );
      }
    }

    for (
      let attempt = 0;
      attempt < this.lockRetryAttempts;
      attempt += 1
    ) {
      await this.sleep(this.lockRetryDelay);

      const rates = await this.getCachedRates(cacheKey);

      if (rates) {
        return rates;
      }
    }

    return this.fetchAndCacheRates(
      normalizedCodes,
      cacheKey,
      staleCacheKey,
    );
  }

  async getHistory(
    currencyCode: string,
    days: number,
  ): Promise<ExchangeRateHistoryPoint[]> {
    const normalizedCode = currencyCode.trim().toUpperCase();

    const cacheKey =
      `exchange-rate-history:${normalizedCode}:${days}`;

    const staleCacheKey = `stale:${cacheKey}`;
    const lockKey = `lock:${cacheKey}`;

    const cachedHistory =
      await this.getCachedHistory(cacheKey);

    if (cachedHistory) {
      return cachedHistory;
    }

    const lockToken = randomUUID();

    const lockAcquired = await this.tryAcquireLock(
      lockKey,
      lockToken,
    );

    if (lockAcquired === null) {
      return this.exchangeRateProvider.getHistory(
        normalizedCode,
        days,
      );
    }

    if (lockAcquired) {
      try {
        const historyAfterLock =
          await this.getCachedHistory(cacheKey);

        if (historyAfterLock) {
          return historyAfterLock;
        }

        return await this.fetchAndCacheHistory(
          normalizedCode,
          days,
          cacheKey,
          staleCacheKey,
        );
      } finally {
        await this.tryReleaseLock(
          lockKey,
          lockToken,
        );
      }
    }

    for (
      let attempt = 0;
      attempt < this.lockRetryAttempts;
      attempt += 1
    ) {
      await this.sleep(this.lockRetryDelay);

      const history =
        await this.getCachedHistory(cacheKey);

      if (history) {
        return history;
      }
    }

    return this.fetchAndCacheHistory(
      normalizedCode,
      days,
      cacheKey,
      staleCacheKey,
    );
  }

  private async fetchAndCacheRates(
    currencyCodes: string[],
    cacheKey: string,
    staleCacheKey: string,
  ): Promise<ExchangeRate[]> {
    try {
      const rates =
        await this.exchangeRateProvider.getRates(currencyCodes);

      await Promise.all([
        this.trySetCache(
          cacheKey,
          rates,
          this.cacheTtl,
        ),
        this.trySetCache(
          staleCacheKey,
          rates,
          this.staleCacheTtl,
        ),
      ]);

      return rates;
    } catch (error) {
      const staleRates =
        await this.getCachedRates(staleCacheKey);

      if (staleRates) {
        this.logger.warn(
          `AwesomeAPI unavailable. Serving stale cache for key "${cacheKey}".`,
        );

        return staleRates;
      }

      throw error;
    }
  }

  private async fetchAndCacheHistory(
    currencyCode: string,
    days: number,
    cacheKey: string,
    staleCacheKey: string,
  ): Promise<ExchangeRateHistoryPoint[]> {
    try {
      const history =
        await this.exchangeRateProvider.getHistory(
          currencyCode,
          days,
        );

      await Promise.all([
        this.trySetCache(
          cacheKey,
          history,
          this.historyCacheTtl,
        ),
        this.trySetCache(
          staleCacheKey,
          history,
          this.staleHistoryCacheTtl,
        ),
      ]);

      return history;
    } catch (error) {
      const staleHistory =
        await this.getCachedHistory(staleCacheKey);

      if (staleHistory) {
        this.logger.warn(
          `AwesomeAPI unavailable. Serving stale history for key "${cacheKey}".`,
        );

        return staleHistory;
      }

      throw error;
    }
  }

  private async getCachedRates(
    cacheKey: string,
  ): Promise<ExchangeRate[] | null> {
    try {
      const cachedRates =
        await this.redisService.get<ExchangeRate[]>(cacheKey);

      if (!cachedRates) {
        return null;
      }

      return cachedRates.map((rate) => ({
        ...rate,
        timestamp: new Date(rate.timestamp),
      }));
    } catch (error) {
      this.logger.warn(
        `Redis cache read failed for key "${cacheKey}": ${this.getErrorMessage(error)}`,
      );

      return null;
    }
  }

  private async getCachedHistory(
    cacheKey: string,
  ): Promise<ExchangeRateHistoryPoint[] | null> {
    try {
      const cachedHistory =
        await this.redisService.get<ExchangeRateHistoryPoint[]>(
          cacheKey,
        );

      if (!cachedHistory) {
        return null;
      }

      return cachedHistory.map((point) => ({
        ...point,
        timestamp: new Date(point.timestamp),
      }));
    } catch (error) {
      this.logger.warn(
        `Redis history cache read failed for key "${cacheKey}": ${this.getErrorMessage(error)}`,
      );

      return null;
    }
  }

  private async trySetCache<T>(
    cacheKey: string,
    value: T,
    ttlInSeconds: number,
  ): Promise<void> {
    try {
      await this.redisService.set(
        cacheKey,
        value,
        ttlInSeconds,
      );
    } catch (error) {
      this.logger.warn(
        `Redis cache write failed for key "${cacheKey}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async tryAcquireLock(
    lockKey: string,
    lockToken: string,
  ): Promise<boolean | null> {
    try {
      return await this.redisService.acquireLock(
        lockKey,
        lockToken,
        this.lockTtl,
      );
    } catch (error) {
      this.logger.warn(
        `Redis lock acquisition failed for key "${lockKey}": ${this.getErrorMessage(error)}`,
      );

      return null;
    }
  }

  private async tryReleaseLock(
    lockKey: string,
    lockToken: string,
  ): Promise<void> {
    try {
      await this.redisService.releaseLock(
        lockKey,
        lockToken,
      );
    } catch (error) {
      this.logger.warn(
        `Redis lock release failed for key "${lockKey}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Unknown error';
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}