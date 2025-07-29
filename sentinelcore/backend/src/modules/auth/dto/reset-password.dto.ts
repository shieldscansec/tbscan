import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação de senha',
    example: 'abc123def456...',
  })
  @IsString({ message: 'Token deve ser uma string' })
  token: string;

  @ApiProperty({
    description: 'Nova senha segura',
    example: 'MyNewSecurePass123!',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email para recuperação',
    example: 'user@example.com',
  })
  @IsString({ message: 'Email deve ser uma string' })
  email: string;
}