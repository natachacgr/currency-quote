import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RedisService } from '../database/redis/redis.service';
import { ExchangeRatesService } from './exchange-rates.service';
import type {
  ExchangeRate,
  ExchangeRateHistoryPoint,
  ExchangeRateProvider,
} from './providers/exchange-rate.provider';

describe('ExchangeRatesService', () => {
  let exchangeRatesService: ExchangeRatesService;

  let exchangeRateProvider: {
    getRates: jest.Mock<(currencyCodes: string[]) => Promise<ExchangeRate[]>>;
    getHistory: jest.Mock<
      (
        currencyCode: string,
        days: number,
      ) => Promise<ExchangeRateHistoryPoint[]>
    >;
  };

  let redisService: {
    get: jest.Mock<(key: string) => Promise<unknown>>;
    set: jest.Mock<
      (key: string, value: unknown, ttlInSeconds: number) => Promise<void>
    >;
    acquireLock: jest.Mock<
      (key: string, token: string, ttlInSeconds: number) => Promise<boolean>
    >;
    releaseLock: jest.Mock<(key: string, token: string) => Promise<void>>;
  };

  let configService: {
    get: jest.Mock<(key: string) => string | undefined>;
  };

  const rates: ExchangeRate[] = [
    {
      code: 'USD',
      codeIn: 'BRL',
      name: 'Dólar Americano/Real Brasileiro',
      high: 5.4,
      low: 5.3,
      bid: 5.35,
      ask: 5.36,
      variation: 0.5,
      timestamp: new Date('2026-09-28T12:00:00.000Z'),
    },
    {
      code: 'EUR',
      codeIn: 'BRL',
      name: 'Euro/Real Brasileiro',
      high: 6.3,
      low: 6.2,
      bid: 6.25,
      ask: 6.26,
      variation: 0.4,
      timestamp: new Date('2026-09-28T12:00:00.000Z'),
    },
  ];

  const history: ExchangeRateHistoryPoint[] = [
    {
      high: 5.35,
      low: 5.25,
      bid: 5.3,
      ask: 5.31,
      variation: 0.5,
      timestamp: new Date('2026-09-27T12:00:00.000Z'),
    },
    {
      high: 5.4,
      low: 5.3,
      bid: 5.35,
      ask: 5.36,
      variation: 0.8,
      timestamp: new Date('2026-09-28T12:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    exchangeRateProvider = {
      getRates: jest.fn(),
      getHistory: jest.fn(),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    };

    configService = {
      get: jest.fn<(key: string) => string | undefined>().mockReturnValue('30'),
    };

    exchangeRatesService = new ExchangeRatesService(
      exchangeRateProvider as unknown as ExchangeRateProvider,
      redisService as unknown as RedisService,
      configService as unknown as ConfigService,
    );

    jest.clearAllMocks();
  });

  describe('getRates', () => {
    it('should return cached rates without calling the provider', async () => {
      redisService.get.mockResolvedValue(rates);

      const result = await exchangeRatesService.getRates(['usd', 'EUR']);

      expect(redisService.get).toHaveBeenCalledWith('exchange-rates:EUR,USD');

      expect(exchangeRateProvider.getRates).not.toHaveBeenCalled();

      expect(redisService.acquireLock).not.toHaveBeenCalled();

      expect(result).toEqual(rates);
    });

    it('should fetch rates from the provider and cache them when cache is empty', async () => {
      redisService.get.mockResolvedValue(null);

      redisService.acquireLock.mockResolvedValue(true);

      exchangeRateProvider.getRates.mockResolvedValue(rates);

      const result = await exchangeRatesService.getRates(['usd', 'EUR']);

      expect(exchangeRateProvider.getRates).toHaveBeenCalledWith([
        'EUR',
        'USD',
      ]);

      expect(redisService.set).toHaveBeenCalledWith(
        'exchange-rates:EUR,USD',
        rates,
        30,
      );

      expect(redisService.set).toHaveBeenCalledWith(
        'stale:exchange-rates:EUR,USD',
        rates,
        300,
      );

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(rates);
    });

    it('should return stale cached rates when the provider fails', async () => {
      redisService.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(rates);

      redisService.acquireLock.mockResolvedValue(true);

      exchangeRateProvider.getRates.mockRejectedValue(
        new Error('AwesomeAPI unavailable'),
      );

      const result = await exchangeRatesService.getRates(['USD', 'EUR']);

      expect(exchangeRateProvider.getRates).toHaveBeenCalledWith([
        'EUR',
        'USD',
      ]);

      expect(redisService.get).toHaveBeenNthCalledWith(
        3,
        'stale:exchange-rates:EUR,USD',
      );

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(rates);
    });

    it('should fetch rates directly from the provider when Redis is unavailable', async () => {
      redisService.get.mockRejectedValue(new Error('Redis unavailable'));

      redisService.acquireLock.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      exchangeRateProvider.getRates.mockResolvedValue(rates);

      const result = await exchangeRatesService.getRates(['usd', 'EUR']);

      expect(exchangeRateProvider.getRates).toHaveBeenCalledWith([
        'EUR',
        'USD',
      ]);

      expect(exchangeRateProvider.getRates).toHaveBeenCalledTimes(1);

      expect(redisService.set).not.toHaveBeenCalled();

      expect(redisService.releaseLock).not.toHaveBeenCalled();

      expect(result).toEqual(rates);
    });

    it('should wait for cache when another request holds the lock', async () => {
      redisService.get.mockResolvedValueOnce(null).mockResolvedValueOnce(rates);

      redisService.acquireLock.mockResolvedValue(false);

      const result = await exchangeRatesService.getRates(['usd', 'EUR']);

      expect(redisService.acquireLock).toHaveBeenCalledTimes(1);

      expect(redisService.acquireLock).toHaveBeenCalledWith(
        'lock:exchange-rates:EUR,USD',
        expect.any(String),
        5,
      );

      expect(redisService.get).toHaveBeenNthCalledWith(
        2,
        'exchange-rates:EUR,USD',
      );

      expect(exchangeRateProvider.getRates).not.toHaveBeenCalled();

      expect(redisService.releaseLock).not.toHaveBeenCalled();

      expect(result).toEqual(rates);
    });

    it('should use cache populated after acquiring the lock', async () => {
      redisService.get.mockResolvedValueOnce(null).mockResolvedValueOnce(rates);

      redisService.acquireLock.mockResolvedValue(true);

      const result = await exchangeRatesService.getRates(['usd', 'EUR']);

      expect(redisService.acquireLock).toHaveBeenCalledWith(
        'lock:exchange-rates:EUR,USD',
        expect.any(String),
        5,
      );

      expect(redisService.get).toHaveBeenNthCalledWith(
        2,
        'exchange-rates:EUR,USD',
      );

      expect(exchangeRateProvider.getRates).not.toHaveBeenCalled();

      expect(redisService.set).not.toHaveBeenCalled();

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(rates);
    });
  });
  describe('getHistory', () => {
    it('should return cached history without calling the provider', async () => {
      redisService.get.mockResolvedValue(history);

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(redisService.get).toHaveBeenCalledWith(
        'exchange-rate-history:USD:30',
      );

      expect(exchangeRateProvider.getHistory).not.toHaveBeenCalled();

      expect(redisService.acquireLock).not.toHaveBeenCalled();

      expect(result).toEqual(history);
    });

    it('should fetch history from the provider and cache it when cache is empty', async () => {
      redisService.get.mockResolvedValue(null);

      redisService.acquireLock.mockResolvedValue(true);

      exchangeRateProvider.getHistory.mockResolvedValue(history);

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(exchangeRateProvider.getHistory).toHaveBeenCalledWith('USD', 30);

      expect(redisService.set).toHaveBeenCalledWith(
        'exchange-rate-history:USD:30',
        history,
        300,
      );

      expect(redisService.set).toHaveBeenCalledWith(
        'stale:exchange-rate-history:USD:30',
        history,
        1800,
      );

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(history);
    });
    it('should return stale cached history when the provider fails', async () => {
      redisService.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(history);

      redisService.acquireLock.mockResolvedValue(true);

      exchangeRateProvider.getHistory.mockRejectedValue(
        new Error('AwesomeAPI unavailable'),
      );

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(exchangeRateProvider.getHistory).toHaveBeenCalledWith('USD', 30);

      expect(redisService.get).toHaveBeenNthCalledWith(
        3,
        'stale:exchange-rate-history:USD:30',
      );

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(history);
    });

    it('should fetch history directly from the provider when Redis is unavailable', async () => {
      redisService.get.mockRejectedValue(new Error('Redis unavailable'));

      redisService.acquireLock.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      exchangeRateProvider.getHistory.mockResolvedValue(history);

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(exchangeRateProvider.getHistory).toHaveBeenCalledWith('USD', 30);

      expect(exchangeRateProvider.getHistory).toHaveBeenCalledTimes(1);

      expect(redisService.set).not.toHaveBeenCalled();

      expect(redisService.releaseLock).not.toHaveBeenCalled();

      expect(result).toEqual(history);
    });
    it('should wait for history cache when another request holds the lock', async () => {
      redisService.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(history);

      redisService.acquireLock.mockResolvedValue(false);

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(redisService.acquireLock).toHaveBeenCalledTimes(1);

      expect(redisService.acquireLock).toHaveBeenCalledWith(
        'lock:exchange-rate-history:USD:30',
        expect.any(String),
        5,
      );

      expect(redisService.get).toHaveBeenNthCalledWith(
        2,
        'exchange-rate-history:USD:30',
      );

      expect(exchangeRateProvider.getHistory).not.toHaveBeenCalled();

      expect(redisService.releaseLock).not.toHaveBeenCalled();

      expect(result).toEqual(history);
    });

    it('should use history cache populated after acquiring the lock', async () => {
      redisService.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(history);

      redisService.acquireLock.mockResolvedValue(true);

      const result = await exchangeRatesService.getHistory('usd', 30);

      expect(redisService.acquireLock).toHaveBeenCalledWith(
        'lock:exchange-rate-history:USD:30',
        expect.any(String),
        5,
      );

      expect(redisService.get).toHaveBeenNthCalledWith(
        2,
        'exchange-rate-history:USD:30',
      );

      expect(exchangeRateProvider.getHistory).not.toHaveBeenCalled();

      expect(redisService.set).not.toHaveBeenCalled();

      expect(redisService.releaseLock).toHaveBeenCalledTimes(1);

      expect(result).toEqual(history);
    });
  });
});
