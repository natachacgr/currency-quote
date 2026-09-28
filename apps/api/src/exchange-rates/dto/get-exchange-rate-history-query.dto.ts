import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';

import { SUPPORTED_CURRENCIES } from '../constants/supported-currencies';

export class GetExchangeRateHistoryQueryDto {
  @ApiProperty({
    description: 'Código da moeda para consulta do histórico',
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
  })
  @IsIn(SUPPORTED_CURRENCIES, {
    message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
  })
  currency!: string;

  @ApiProperty({
    description: 'Quantidade de dias do histórico',
    example: 30,
    default: 30,
    minimum: 1,
    maximum: 360,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(360)
  days = 30;
}
