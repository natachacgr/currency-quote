import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './database/redis/redis.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    ExchangeRatesModule,
    AuthModule,
    FavoritesModule,
  ],
})
export class AppModule {}
