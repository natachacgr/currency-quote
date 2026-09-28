import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthResponse, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastrar usuário',
    description:
      'Cria uma nova conta de usuário e retorna um token JWT para autenticação.',
  })
  @ApiBody({
    type: RegisterDto,
  })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso.',
  })
  @ApiConflictResponse({
    description: 'Já existe um usuário cadastrado com este e-mail.',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Autentica o usuário através de e-mail e senha e retorna um token JWT.',
  })
  @ApiBody({
    type: LoginDto,
  })
  @ApiOkResponse({
    description: 'Usuário autenticado com sucesso.',
  })
  @ApiUnauthorizedResponse({
    description: 'E-mail ou senha inválidos.',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter usuário autenticado',
    description:
      'Retorna os dados do usuário associado ao token JWT informado.',
  })
  @ApiOkResponse({
    description: 'Dados do usuário autenticado retornados com sucesso.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado.',
  })
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user;
  }
}
