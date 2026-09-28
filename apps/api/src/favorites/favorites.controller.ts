import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SUPPORTED_CURRENCIES } from '../exchange-rates/constants/supported-currencies';
import { FavoritesService } from './favorites.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiTags('Favorites')
@ApiBearerAuth()
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar moedas favoritas',
    description:
      'Retorna todas as moedas favoritas do usuário autenticado.',
  })
  @ApiOkResponse({
    description:
      'Lista de moedas favoritas retornada com sucesso.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Token ausente, inválido ou expirado.',
  })
  findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.findAllByUser(
      request.user.id,
    );
  }

  @Post(':currencyCode')
  @ApiOperation({
    summary: 'Adicionar moeda aos favoritos',
    description:
      'Adiciona uma moeda à lista de favoritos do usuário autenticado.',
  })
  @ApiParam({
    name: 'currencyCode',
    description: 'Código da moeda que será adicionada aos favoritos.',
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
  })
  @ApiCreatedResponse({
    description:
      'Moeda adicionada aos favoritos com sucesso.',
  })
  @ApiConflictResponse({
    description:
      'A moeda já está na lista de favoritos do usuário.',
  })
  @ApiNotFoundResponse({
    description:
      'A moeda informada não foi encontrada.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Token ausente, inválido ou expirado.',
  })
  add(
    @Req() request: AuthenticatedRequest,
    @Param('currencyCode') currencyCode: string,
  ) {
    return this.favoritesService.add(
      request.user.id,
      currencyCode,
    );
  }

  @Delete(':currencyCode')
  @ApiOperation({
    summary: 'Remover moeda dos favoritos',
    description:
      'Remove uma moeda da lista de favoritos do usuário autenticado.',
  })
  @ApiParam({
    name: 'currencyCode',
    description: 'Código da moeda que será removida dos favoritos.',
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
  })
  @ApiOkResponse({
    description:
      'Moeda removida dos favoritos com sucesso.',
  })
  @ApiNotFoundResponse({
    description:
      'A moeda não está na lista de favoritos do usuário.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Token ausente, inválido ou expirado.',
  })
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('currencyCode') currencyCode: string,
  ) {
    return this.favoritesService.remove(
      request.user.id,
      currencyCode,
    );
  }
}