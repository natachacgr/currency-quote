import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { RedisService } from '../database/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.ping();

    return {
      status: 'ok',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
