import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { RedisService } from '../src/database/redis/redis.service';
import { ExchangeRatesService } from '../src/exchange-rates/exchange-rates.service';
import { FavoritesService } from '../src/favorites/favorites.service';
import { UsersService } from '../src/users/users.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const prismaServiceMock = {
    $queryRaw: jest.fn<() => Promise<unknown>>(),
  };

  const redisServiceMock = {
    ping: jest.fn<() => Promise<string>>(),
  };

  const exchangeRatesServiceMock = {
    getRates: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    getHistory: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const authServiceMock = {
    register: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    login: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const usersServiceMock = {
    findById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const favoritesServiceMock = {
    findAllByUser: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    add: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    remove: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  async function createAccessToken(): Promise<string> {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwtService.signAsync(
      {
        sub: 'user-1',
        email: 'maria@email.com',
      },
      {
        secret: jwtSecret,
        expiresIn: '1h',
      },
    );
  }

  beforeEach(async () => {
    prismaServiceMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    redisServiceMock.ping.mockResolvedValue('PONG');

    exchangeRatesServiceMock.getRates.mockResolvedValue([
      {
        code: 'USD',
        codeIn: 'BRL',
        name: 'Dólar Americano/Real Brasileiro',
        high: 5.35,
        low: 5.25,
        bid: 5.3,
        ask: 5.31,
        variation: 0.5,
        timestamp: new Date('2026-09-28T12:00:00.000Z'),
      },
    ]);

    exchangeRatesServiceMock.getHistory.mockResolvedValue([
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
    ]);

    authServiceMock.register.mockResolvedValue({
      accessToken: 'register-token',
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@email.com',
      },
    });

    authServiceMock.login.mockResolvedValue({
      accessToken: 'login-token',
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@email.com',
      },
    });

    usersServiceMock.findById.mockResolvedValue({
      id: 'user-1',
      name: 'Maria Silva',
      email: 'maria@email.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-09-28T12:00:00.000Z'),
      updatedAt: new Date('2026-09-28T12:00:00.000Z'),
    });

    favoritesServiceMock.findAllByUser.mockResolvedValue([
      {
        id: 'favorite-1',
        userId: 'user-1',
        currencyId: 'currency-usd',
        createdAt: new Date('2026-09-28T12:00:00.000Z'),
        currency: {
          id: 'currency-usd',
          code: 'USD',
          name: 'Dólar Americano',
          createdAt: new Date('2026-09-28T12:00:00.000Z'),
          updatedAt: new Date('2026-09-28T12:00:00.000Z'),
        },
      },
    ]);

    favoritesServiceMock.add.mockResolvedValue({
      id: 'favorite-1',
      userId: 'user-1',
      currencyId: 'currency-usd',
      createdAt: new Date('2026-09-28T12:00:00.000Z'),
      currency: {
        id: 'currency-usd',
        code: 'USD',
        name: 'Dólar Americano',
        createdAt: new Date('2026-09-28T12:00:00.000Z'),
        updatedAt: new Date('2026-09-28T12:00:00.000Z'),
      },
    });

    favoritesServiceMock.remove.mockResolvedValue({
      message: 'Currency "USD" removed from favorites',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .overrideProvider(RedisService)
      .useValue(redisServiceMock)
      .overrideProvider(ExchangeRatesService)
      .useValue(exchangeRatesServiceMock)
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(FavoritesService)
      .useValue(favoritesServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();

    jest.clearAllMocks();
  });

  describe('/health', () => {
    it('GET should return the application health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        database: 'connected',
        redis: 'connected',
        timestamp: expect.any(String),
      });

      expect(prismaServiceMock.$queryRaw).toHaveBeenCalledTimes(1);

      expect(redisServiceMock.ping).toHaveBeenCalledTimes(1);

      expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    });
  });

  describe('/exchange-rates', () => {
    it('GET should return the current exchange rates', async () => {
      const response = await request(app.getHttpServer())
        .get('/exchange-rates')
        .expect(200);

      expect(response.body).toEqual([
        {
          code: 'USD',
          codeIn: 'BRL',
          name: 'Dólar Americano/Real Brasileiro',
          high: 5.35,
          low: 5.25,
          bid: 5.3,
          ask: 5.31,
          variation: 0.5,
          timestamp: '2026-09-28T12:00:00.000Z',
        },
      ]);

      expect(exchangeRatesServiceMock.getRates).toHaveBeenCalledTimes(1);

      expect(exchangeRatesServiceMock.getRates).toHaveBeenCalledWith([
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
        'ARS',
        'MXN',
      ]);
    });

    it('GET should normalize the currencies query', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates')
        .query({
          currencies: ' usd, eur ',
        })
        .expect(200);

      expect(exchangeRatesServiceMock.getRates).toHaveBeenCalledWith([
        'USD',
        'EUR',
      ]);
    });

    it('GET should return 400 when a currency is not supported', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates')
        .query({
          currencies: 'USD,XYZ',
        })
        .expect(400);

      expect(exchangeRatesServiceMock.getRates).not.toHaveBeenCalled();
    });
  });

  describe('/exchange-rates/history', () => {
    it('GET should return the exchange rate history', async () => {
      const response = await request(app.getHttpServer())
        .get('/exchange-rates/history')
        .query({
          currency: 'USD',
          days: 30,
        })
        .expect(200);

      expect(response.body).toEqual([
        {
          high: 5.35,
          low: 5.25,
          bid: 5.3,
          ask: 5.31,
          variation: 0.5,
          timestamp: '2026-09-27T12:00:00.000Z',
        },
        {
          high: 5.4,
          low: 5.3,
          bid: 5.35,
          ask: 5.36,
          variation: 0.8,
          timestamp: '2026-09-28T12:00:00.000Z',
        },
      ]);

      expect(exchangeRatesServiceMock.getHistory).toHaveBeenCalledWith(
        'USD',
        30,
      );
    });

    it('GET should use 30 days by default', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates/history')
        .query({
          currency: 'EUR',
        })
        .expect(200);

      expect(exchangeRatesServiceMock.getHistory).toHaveBeenCalledWith(
        'EUR',
        30,
      );
    });

    it('GET should return 400 when currency is not supported', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates/history')
        .query({
          currency: 'XYZ',
          days: 30,
        })
        .expect(400);

      expect(exchangeRatesServiceMock.getHistory).not.toHaveBeenCalled();
    });

    it('GET should return 400 when days is less than 1', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates/history')
        .query({
          currency: 'USD',
          days: 0,
        })
        .expect(400);

      expect(exchangeRatesServiceMock.getHistory).not.toHaveBeenCalled();
    });

    it('GET should return 400 when days is greater than 360', async () => {
      await request(app.getHttpServer())
        .get('/exchange-rates/history')
        .query({
          currency: 'USD',
          days: 361,
        })
        .expect(400);

      expect(exchangeRatesServiceMock.getHistory).not.toHaveBeenCalled();
    });
  });

  describe('/auth/register', () => {
    it('POST should register a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Maria Silva',
          email: 'maria@email.com',
          password: 'Senha123',
        })
        .expect(201);

      expect(response.body).toEqual({
        accessToken: 'register-token',
        user: {
          id: 'user-1',
          name: 'Maria Silva',
          email: 'maria@email.com',
        },
      });

      expect(authServiceMock.register).toHaveBeenCalledWith({
        name: 'Maria Silva',
        email: 'maria@email.com',
        password: 'Senha123',
      });
    });

    it('POST should return 400 when registration data is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'M',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });
  });

  describe('/auth/login', () => {
    it('POST should authenticate a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria@email.com',
          password: 'Senha123',
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: 'login-token',
        user: {
          id: 'user-1',
          name: 'Maria Silva',
          email: 'maria@email.com',
        },
      });

      expect(authServiceMock.login).toHaveBeenCalledWith({
        email: 'maria@email.com',
        password: 'Senha123',
      });
    });

    it('POST should return 400 when login data is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(authServiceMock.login).not.toHaveBeenCalled();
    });
  });

  describe('/auth/me', () => {
    it('GET should return 401 without an access token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);

      expect(usersServiceMock.findById).not.toHaveBeenCalled();
    });

    it('GET should return the authenticated user with a valid token', async () => {
      const accessToken = await createAccessToken();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@email.com',
      });

      expect(usersServiceMock.findById).toHaveBeenCalledWith('user-1');

      expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
    });

    it('GET should return 401 with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(usersServiceMock.findById).not.toHaveBeenCalled();
    });
  });

  describe('/favorites', () => {
    it('GET should return 401 without an access token', async () => {
      await request(app.getHttpServer()).get('/favorites').expect(401);

      expect(favoritesServiceMock.findAllByUser).not.toHaveBeenCalled();
    });

    it('GET should return the authenticated user favorites', async () => {
      const accessToken = await createAccessToken();

      const response = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 'favorite-1',
          userId: 'user-1',
          currencyId: 'currency-usd',
          createdAt: '2026-09-28T12:00:00.000Z',
          currency: {
            id: 'currency-usd',
            code: 'USD',
            name: 'Dólar Americano',
            createdAt: '2026-09-28T12:00:00.000Z',
            updatedAt: '2026-09-28T12:00:00.000Z',
          },
        },
      ]);

      expect(favoritesServiceMock.findAllByUser).toHaveBeenCalledWith('user-1');

      expect(usersServiceMock.findById).toHaveBeenCalledWith('user-1');
    });

    it('POST should add a favorite for the authenticated user', async () => {
      const accessToken = await createAccessToken();

      const response = await request(app.getHttpServer())
        .post('/favorites/USD')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toEqual({
        id: 'favorite-1',
        userId: 'user-1',
        currencyId: 'currency-usd',
        createdAt: '2026-09-28T12:00:00.000Z',
        currency: {
          id: 'currency-usd',
          code: 'USD',
          name: 'Dólar Americano',
          createdAt: '2026-09-28T12:00:00.000Z',
          updatedAt: '2026-09-28T12:00:00.000Z',
        },
      });

      expect(favoritesServiceMock.add).toHaveBeenCalledWith('user-1', 'USD');
    });

    it('DELETE should remove a favorite for the authenticated user', async () => {
      const accessToken = await createAccessToken();

      const response = await request(app.getHttpServer())
        .delete('/favorites/USD')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Currency "USD" removed from favorites',
      });

      expect(favoritesServiceMock.remove).toHaveBeenCalledWith('user-1', 'USD');
    });
  });
});
