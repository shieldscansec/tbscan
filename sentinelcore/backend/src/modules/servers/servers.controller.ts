import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Servidores')
@Controller('servers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo servidor' })
  @ApiResponse({
    status: 201,
    description: 'Servidor criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        ip: { type: 'string' },
        port: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status:409, description: 'IP:Porta já em uso' })
  async create(@Body() createServerDto: CreateServerDto, @Request() req) {
    return this.serversService.create(createServerDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar servidores do usuário' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome/descrição' })
  @ApiResponse({
    status: 200,
    description: 'Lista de servidores',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          currentPlayers: { type: 'number' },
          maxPlayers: { type: 'number' },
          uptime: { type: 'string' },
        },
      },
    },
  })
  async findAll(@Request() req, @Query() filters: any) {
    return this.serversService.findAll(req.user, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes do servidor' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do servidor',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        type: { type: 'string' },
        ip: { type: 'string' },
        port: { type: 'number' },
        maxPlayers: { type: 'number' },
        currentPlayers: { type: 'number' },
        gamemodeName: { type: 'string' },
        filterscripts: { type: 'array', items: { type: 'string' } },
        plugins: { type: 'array', items: { type: 'string' } },
        resourceUsage: { type: 'object' },
        uptime: { type: 'string' },
        crashCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.serversService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configurações do servidor' })
  @ApiResponse({ status: 200, description: 'Servidor atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou servidor rodando' })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServerDto: UpdateServerDto,
    @Request() req,
  ) {
    return this.serversService.update(id, updateServerDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir servidor' })
  @ApiResponse({ status: 204, description: 'Servidor excluído com sucesso' })
  @ApiResponse({ status: 400, description: 'Servidor ainda está rodando' })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.serversService.remove(id, req.user);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar servidor' })
  @ApiResponse({ status: 200, description: 'Servidor iniciado com sucesso' })
  @ApiResponse({ status: 400, description: 'Servidor não pode ser iniciado' })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async start(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.serversService.start(id, req.user);
    return { message: 'Servidor iniciado com sucesso' };
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parar servidor' })
  @ApiResponse({ status: 200, description: 'Servidor parado com sucesso' })
  @ApiResponse({ status: 400, description: 'Servidor não pode ser parado' })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async stop(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.serversService.stop(id, req.user);
    return { message: 'Servidor parado com sucesso' };
  }

  @Post(':id/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reiniciar servidor' })
  @ApiResponse({ status: 200, description: 'Servidor reiniciado com sucesso' })
  @ApiResponse({ status: 400, description: 'Servidor não pode ser reiniciado' })
  @ApiResponse({ status: 404, description: 'Servidor não encontrado' })
  async restart(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.serversService.restart(id, req.user);
    return { message: 'Servidor reiniciado com sucesso' };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obter status do servidor em tempo real' })
  @ApiResponse({
    status: 200,
    description: 'Status do servidor',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        statusLabel: { type: 'string' },
        currentPlayers: { type: 'number' },
        maxPlayers: { type: 'number' },
        uptime: { type: 'number' },
        uptimeFormatted: { type: 'string' },
        resourceUsage: {
          type: 'object',
          properties: {
            cpu: { type: 'number' },
            memory: { type: 'number' },
            disk: { type: 'number' },
          },
        },
        lastStarted: { type: 'string' },
        lastStopped: { type: 'string' },
        crashCount: { type: 'number' },
        totalRestarts: { type: 'number' },
      },
    },
  })
  async getStatus(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.serversService.getStatus(id, req.user);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Obter logs do servidor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de logs (padrão: 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  @ApiResponse({
    status: 200,
    description: 'Logs do servidor',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          logType: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  async getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.serversService.getLogs(id, req.user, limit, offset);
  }

  @Post(':id/backup')
  @ApiOperation({ summary: 'Criar backup do servidor' })
  @ApiResponse({
    status: 201,
    description: 'Backup criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  })
  async createBackup(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body('name') name?: string,
    @Body('description') description?: string,
  ) {
    return this.serversService.createBackup(id, req.user, name, description);
  }

  @Get(':id/backups')
  @ApiOperation({ summary: 'Listar backups do servidor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de backups',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          fileSize: { type: 'number' },
          fileSizeFormatted: { type: 'string' },
          backupType: { type: 'string' },
          status: { type: 'string' },
          createdAt: { type: 'string' },
          createdBy: {
            type: 'object',
            properties: {
              username: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getBackups(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.serversService.getBackups(id, req.user);
  }
}