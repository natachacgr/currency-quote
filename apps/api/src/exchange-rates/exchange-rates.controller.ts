import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { GetExchangeRateHistoryQueryDto } from './dto/get-exchange-rate-history-query.dto';
import { GetExchangeRatesQueryDto } from './dto/get-exchange-rates-query.dto';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
@ApiTags('Exchange Rates')
export class ExchangeRatesController {
  constructor(
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar cotações atuais',
    description:
      'Retorna as cotações atuais das moedas selecionadas em relação ao Real Brasileiro (BRL). Quando nenhuma moeda é informada, retorna as moedas padrão da aplicação.',
  })
  @ApiOkResponse({
    description: 'Cotações retornadas com sucesso.',
  })
  @ApiBadRequestResponse({
    description:
      'Uma ou mais moedas informadas são inválidas.',
  })
  @ApiBadGatewayResponse({
    description:
      'Não foi possível obter as cotações do provedor externo.',
  })
  getRates(
    @Query() query: GetExchangeRatesQueryDto,
  ) {
    return this.exchangeRatesService.getRates(
      query.currencies,
    );
  }

  @Get('history')
  @ApiOperation({
    summary: 'Consultar histórico de uma moeda',
    description:
      'Retorna o histórico de cotação de uma moeda em relação ao Real Brasileiro (BRL) para o período solicitado.',
  })
  @ApiOkResponse({
    description:
      'Histórico da moeda retornado com sucesso.',
  })
  @ApiBadRequestResponse({
    description:
      'Moeda ou quantidade de dias inválida. O período deve estar entre 1 e 360 dias.',
  })
  @ApiBadGatewayResponse({
    description:
      'Não foi possível obter o histórico do provedor externo.',
  })
  getHistory(
    @Query() query: GetExchangeRateHistoryQueryDto,
  ) {
    return this.exchangeRatesService.getHistory(
      query.currency,
      query.days,
    );
  }
}