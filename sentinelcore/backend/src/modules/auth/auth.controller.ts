import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto, ForgotPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Autenticação')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email ou username já existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Ip() ip: string,
  ) {
    return this.authService.refreshToken(refreshToken, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout de todas as sessões' })
  @ApiResponse({ status: 200, description: 'Logout de todas as sessões realizado' })
  async logoutAll(@Request() req) {
    await this.authService.logoutAll(req.user.sub);
    return { message: 'Logout de todas as sessões realizado com sucesso' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiResponse({ status: 200, description: 'Email de recuperação enviado' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email' })
  @ApiResponse({ status: 200, description: 'Email verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Token de verificação inválido' })
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
            twoFactorEnabled: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getProfile(@Request() req) {
    return { user: req.user };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Habilitar autenticação de dois fatores' })
  @ApiResponse({
    status: 200,
    description: '2FA iniciado - QR Code gerado',
    schema: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCode: { type: 'string' },
        backupCodes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async enable2FA(@Request() req) {
    return this.authService.enable2FA(req.user.sub);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar habilitação do 2FA' })
  @ApiResponse({ status: 200, description: '2FA habilitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código 2FA inválido' })
  async confirm2FA(
    @Request() req,
    @Body('token') token: string,
    @Body('backupCodes') backupCodes: string[],
  ) {
    return this.authService.confirm2FA(req.user.sub, token, backupCodes);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desabilitar autenticação de dois fatores' })
  @ApiResponse({ status: 200, description: '2FA desabilitado com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  async disable2FA(@Request() req, @Body('password') password: string) {
    return this.authService.disable2FA(req.user.sub, password);
  }
}