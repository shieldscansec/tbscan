import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';

import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Gerenciamento de Arquivos')
@Controller('servers/:serverId/files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar arquivos e diretórios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos e diretórios',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          size: { type: 'number' },
          type: { type: 'string', enum: ['file', 'directory'] },
          extension: { type: 'string' },
          modified: { type: 'string' },
          permissions: {
            type: 'object',
            properties: {
              read: { type: 'boolean' },
              write: { type: 'boolean' },
              execute: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async listFiles(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('directory') directory?: string,
  ) {
    return this.filesService.listFiles(serverId, req.user, directory);
  }

  @Get('read')
  @ApiOperation({ summary: 'Ler conteúdo de um arquivo' })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo do arquivo',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        path: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  @ApiResponse({ status: 400, description: 'Arquivo muito grande ou é um diretório' })
  async readFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('path') filePath: string,
  ) {
    const content = await this.filesService.readFile(serverId, req.user, filePath);
    const fileInfo = await this.filesService.getFileInfo(serverId, req.user, filePath);
    
    return {
      content,
      path: filePath,
      size: fileInfo.size,
    };
  }

  @Put('write')
  @ApiOperation({ summary: 'Escrever conteúdo em um arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo salvo com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado ao arquivo' })
  async writeFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Body('path') filePath: string,
    @Body('content') content: string,
  ) {
    await this.filesService.writeFile(serverId, req.user, filePath, content);
    return { message: 'Arquivo salvo com sucesso' };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir arquivo ou diretório' })
  @ApiResponse({ status: 204, description: 'Arquivo excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  @ApiResponse({ status: 403, description: 'Não é possível excluir arquivos críticos' })
  async deleteFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('path') filePath: string,
  ) {
    await this.filesService.deleteFile(serverId, req.user, filePath);
  }

  @Post('directory')
  @ApiOperation({ summary: 'Criar novo diretório' })
  @ApiResponse({ status: 201, description: 'Diretório criado com sucesso' })
  async createDirectory(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Body('path') dirPath: string,
  ) {
    await this.filesService.createDirectory(serverId, req.user, dirPath);
    return { message: 'Diretório criado com sucesso' };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de arquivos' })
  @ApiResponse({
    status: 201,
    description: 'Arquivos enviados com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              originalName: { type: 'string' },
              size: { type: 'number' },
              path: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Tipo de arquivo não permitido' })
  async uploadFiles(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('directory') directory?: string,
  ) {
    const results = await this.filesService.uploadFiles(serverId, req.user, files, directory);
    
    return {
      message: `${results.length} arquivo(s) enviado(s) com sucesso`,
      files: results,
    };
  }

  @Get('download')
  @ApiOperation({ summary: 'Download de arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo baixado com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('path') filePath: string,
    @Res() res: Response,
  ) {
    const { stream, filename, size } = await this.filesService.downloadFile(serverId, req.user, filePath);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': size.toString(),
    });

    stream.pipe(res);
  }

  @Get('download-directory')
  @ApiOperation({ summary: 'Download de diretório (ZIP)' })
  @ApiResponse({ status: 200, description: 'Diretório baixado como ZIP' })
  @ApiResponse({ status: 404, description: 'Diretório não encontrado' })
  async downloadDirectory(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('path') dirPath: string,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.filesService.downloadDirectory(serverId, req.user, dirPath);
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    stream.pipe(res);
  }

  @Post('move')
  @ApiOperation({ summary: 'Mover arquivo ou diretório' })
  @ApiResponse({ status: 200, description: 'Arquivo movido com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo de origem não encontrado' })
  async moveFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Body('sourcePath') sourcePath: string,
    @Body('targetPath') targetPath: string,
  ) {
    await this.filesService.moveFile(serverId, req.user, sourcePath, targetPath);
    return { message: 'Arquivo movido com sucesso' };
  }

  @Post('copy')
  @ApiOperation({ summary: 'Copiar arquivo ou diretório' })
  @ApiResponse({ status: 200, description: 'Arquivo copiado com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo de origem não encontrado' })
  async copyFile(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Body('sourcePath') sourcePath: string,
    @Body('targetPath') targetPath: string,
  ) {
    await this.filesService.copyFile(serverId, req.user, sourcePath, targetPath);
    return { message: 'Arquivo copiado com sucesso' };
  }

  @Get('info')
  @ApiOperation({ summary: 'Obter informações de um arquivo' })
  @ApiResponse({
    status: 200,
    description: 'Informações do arquivo',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        path: { type: 'string' },
        size: { type: 'number' },
        type: { type: 'string' },
        extension: { type: 'string' },
        modified: { type: 'string' },
        permissions: {
          type: 'object',
          properties: {
            read: { type: 'boolean' },
            write: { type: 'boolean' },
            execute: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getFileInfo(
    @Param('serverId', ParseUUIDPipe) serverId: string,
    @Request() req,
    @Query('path') filePath: string,
  ) {
    return this.filesService.getFileInfo(serverId, req.user, filePath);
  }
}