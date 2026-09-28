import { Module } from '@nestjs/common';

import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';
import { AwesomeApiExchangeRateProvider } from './providers/awesome-api-exchange-rate.provider';
import { ExchangeRateProvider } from './providers/exchange-rate.provider';

@Module({
  controllers: [ExchangeRatesController],
  providers: [
    ExchangeRatesService,
    {
      provide: ExchangeRateProvider,
      useClass: AwesomeApiExchangeRateProvider,
    },
  ],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
