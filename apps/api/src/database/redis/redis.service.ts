import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined');
    }

    this.client = new Redis(redisUrl, {
      lazyConnect: true,

      /*
       * Redis é uma otimização da aplicação.
       * As operações devem falhar rapidamente quando
       * o serviço estiver indisponível.
       */
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      connectTimeout: 1000,

      /*
       * Permite que o cliente tente restabelecer
       * a conexão em segundo plano.
       */
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    });

    /*
     * O ioredis emite eventos de erro durante problemas
     * de conexão. Tratamos o evento para evitar erros
     * não tratados no processo.
     */
    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis connection established');
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        `Redis unavailable during startup: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready') {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }

      return;
    }

    this.client.disconnect();
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlInSeconds: number,
  ): Promise<void> {
    await this.client.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlInSeconds,
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async acquireLock(
    key: string,
    token: string,
    ttlInSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.set(
      key,
      token,
      'EX',
      ttlInSeconds,
      'NX',
    );

    return result === 'OK';
  }

  async releaseLock(
    key: string,
    token: string,
  ): Promise<boolean> {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end

      return 0
    `;

    const result = await this.client.eval(
      script,
      1,
      key,
      token,
    );

    return result === 1;
  }

  getClient(): Redis {
    return this.client;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Unknown Redis error';
  }
}