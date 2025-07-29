import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsIP,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServerType } from '../entities/server.entity';

export class CreateServerDto {
  @ApiProperty({
    description: 'Nome do servidor',
    example: 'Meu Servidor SA-MP',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Descrição do servidor',
    example: 'Servidor de roleplay brasileiro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Tipo do servidor SA-MP',
    enum: ServerType,
    example: ServerType.SAMP_037,
  })
  @IsEnum(ServerType, { message: 'Tipo de servidor inválido' })
  type: ServerType;

  @ApiProperty({
    description: 'Endereço IP do servidor',
    example: '127.0.0.1',
  })
  @IsIP(4, { message: 'IP deve ser um endereço IPv4 válido' })
  ip: string;

  @ApiProperty({
    description: 'Porta do servidor',
    example: 7777,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber({}, { message: 'Porta deve ser um número' })
  @Min(1024, { message: 'Porta deve ser maior que 1024' })
  @Max(65535, { message: 'Porta deve ser menor que 65535' })
  port: number;

  @ApiProperty({
    description: 'Número máximo de jogadores',
    example: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({}, { message: 'Máximo de jogadores deve ser um número' })
  @Min(1, { message: 'Deve permitir pelo menos 1 jogador' })
  @Max(1000, { message: 'Máximo de 1000 jogadores permitido' })
  maxPlayers: number;

  @ApiProperty({
    description: 'Nome do gamemode',
    example: 'grandlarc',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome do gamemode deve ser uma string' })
  @MaxLength(50, { message: 'Nome do gamemode deve ter no máximo 50 caracteres' })
  gamemodeName?: string;

  @ApiProperty({
    description: 'Lista de filterscripts',
    example: ['admin', 'nametags', 'vactions'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Filterscripts deve ser um array' })
  @IsString({ each: true, message: 'Cada filterscript deve ser uma string' })
  filterscripts?: string[];

  @ApiProperty({
    description: 'Lista de plugins',
    example: ['mysql', 'streamer', 'sscanf'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Plugins deve ser um array' })
  @IsString({ each: true, message: 'Cada plugin deve ser uma string' })
  plugins?: string[];

  @ApiProperty({
    description: 'Senha RCON (será gerada automaticamente se não fornecida)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha RCON deve ser uma string' })
  @MinLength(6, { message: 'Senha RCON deve ter pelo menos 6 caracteres' })
  rconPassword?: string;

  @ApiProperty({
    description: 'Configuração personalizada do server.cfg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Configuração do servidor deve ser uma string' })
  serverCfg?: string;

  @ApiProperty({
    description: 'Habilitar reinicialização automática',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'AutoRestart deve ser um boolean' })
  autoRestart?: boolean;

  @ApiProperty({
    description: 'Habilitar backup automático',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'AutoBackup deve ser um boolean' })
  autoBackup?: boolean;

  @ApiProperty({
    description: 'Limite de CPU (%)',
    example: 80,
    minimum: 10,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite de CPU deve ser um número' })
  @Min(10, { message: 'Limite de CPU deve ser pelo menos 10%' })
  @Max(100, { message: 'Limite de CPU deve ser no máximo 100%' })
  cpuLimit?: number;

  @ApiProperty({
    description: 'Limite de memória (MB)',
    example: 512,
    minimum: 64,
    maximum: 4096,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite de memória deve ser um número' })
  @Min(64, { message: 'Limite de memória deve ser pelo menos 64MB' })
  @Max(4096, { message: 'Limite de memória deve ser no máximo 4096MB' })
  memoryLimit?: number;

  @ApiProperty({
    description: 'Limite de disco (MB)',
    example: 1024,
    minimum: 100,
    maximum: 10240,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite de disco deve ser um número' })
  @Min(100, { message: 'Limite de disco deve ser pelo menos 100MB' })
  @Max(10240, { message: 'Limite de disco deve ser no máximo 10GB' })
  diskLimit?: number;
}