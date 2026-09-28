import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator';

import {
  DEFAULT_CURRENCIES,
  SUPPORTED_CURRENCIES,
} from '../constants/supported-currencies';

export class GetExchangeRatesQueryDto {
  @ApiPropertyOptional({
    description:
      'Códigos das moedas separados por vírgula. Quando não informado, todas as moedas padrão são retornadas.',
    example: 'USD,EUR,GBP',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .split(',')
      .map((currency) => currency.trim().toUpperCase())
      .filter(Boolean);
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SUPPORTED_CURRENCIES, {
    each: true,
    message: `Each currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
  })
  currencies: string[] = [...DEFAULT_CURRENCIES];
}
