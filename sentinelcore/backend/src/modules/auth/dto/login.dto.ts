import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@sentinelcore.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SentinelSecure123!',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Código 2FA (se habilitado)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Código 2FA deve ser uma string' })
  twoFactorCode?: string;

  @ApiProperty({
    description: 'Manter login ativo por mais tempo',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'RememberMe deve ser um boolean' })
  rememberMe?: boolean;
}