import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import { Readable } from 'stream';

import { ServersService } from '../servers/servers.service';
import { User } from '../users/entities/user.entity';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  extension?: string;
  modified: Date;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

export interface UploadResult {
  filename: string;
  originalName: string;
  size: number;
  path: string;
  type: string;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly serversService: ServersService,
  ) {}

  async listFiles(serverId: string, user: User, directory = ''): Promise<FileInfo[]> {
    // Verify server ownership
    const server = await this.serversService.findOne(serverId, user);
    
    const serverPath = server.serverPath;
    const targetPath = path.join(serverPath, directory);

    // Security check - ensure path is within server directory
    if (!this.isPathSafe(serverPath, targetPath)) {
      throw new ForbiddenException('Acesso negado ao diretório');
    }

    if (!await fs.pathExists(targetPath)) {
      throw new NotFoundException('Diretório não encontrado');
    }

    const files: FileInfo[] = [];
    const items = await fs.readdir(targetPath);

    for (const item of items) {
      const itemPath = path.join(targetPath, item);
      const stats = await fs.stat(itemPath);
      const relativePath = path.relative(serverPath, itemPath);

      files.push({
        name: item,
        path: relativePath,
        size: stats.size,
        type: stats.isDirectory() ? 'directory' : 'file',
        extension: stats.isFile() ? path.extname(item) : undefined,
        modified: stats.mtime,
        permissions: {
          read: true, // Simplified - in production, check actual permissions
          write: true,
          execute: stats.isFile() && path.extname(item) === '.amx',
        },
      });
    }

    // Sort: directories first, then files alphabetically
    return files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async readFile(serverId: string, user: User, filePath: string): Promise<string> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, filePath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao arquivo');
    }

    if (!await fs.pathExists(fullPath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      throw new BadRequestException('Caminho é um diretório');
    }

    // Check file size - don't read files larger than 10MB
    if (stats.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande para edição');
    }

    return await fs.readFile(fullPath, 'utf8');
  }

  async writeFile(serverId: string, user: User, filePath: string, content: string): Promise<void> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, filePath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao arquivo');
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath));

    // Create backup if file exists
    if (await fs.pathExists(fullPath)) {
      const backupPath = `${fullPath}.backup.${Date.now()}`;
      await fs.copy(fullPath, backupPath);
    }

    await fs.writeFile(fullPath, content, 'utf8');
  }

  async deleteFile(serverId: string, user: User, filePath: string): Promise<void> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, filePath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao arquivo');
    }

    if (!await fs.pathExists(fullPath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Don't allow deletion of critical files
    const criticalFiles = ['server.cfg', 'samp03svr', 'omp-server'];
    const fileName = path.basename(fullPath);
    
    if (criticalFiles.includes(fileName)) {
      throw new ForbiddenException('Não é possível excluir arquivos críticos do sistema');
    }

    await fs.remove(fullPath);
  }

  async createDirectory(serverId: string, user: User, dirPath: string): Promise<void> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, dirPath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao diretório');
    }

    await fs.ensureDir(fullPath);
  }

  async uploadFiles(
    serverId: string,
    user: User,
    files: Express.Multer.File[],
    targetDirectory = '',
  ): Promise<UploadResult[]> {
    const server = await this.serversService.findOne(serverId, user);
    const serverPath = server.serverPath;
    const targetPath = path.join(serverPath, targetDirectory);

    if (!this.isPathSafe(serverPath, targetPath)) {
      throw new ForbiddenException('Acesso negado ao diretório');
    }

    await fs.ensureDir(targetPath);

    const results: UploadResult[] = [];

    for (const file of files) {
      const targetFile = path.join(targetPath, file.originalname);
      
      // Check if file already exists
      if (await fs.pathExists(targetFile)) {
        // Create backup
        const backupFile = `${targetFile}.backup.${Date.now()}`;
        await fs.move(targetFile, backupFile);
      }

      // Move uploaded file to target location
      await fs.move(file.path, targetFile);

      results.push({
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        path: path.relative(serverPath, targetFile),
        type: this.getFileType(file.originalname),
      });
    }

    return results;
  }

  async downloadFile(serverId: string, user: User, filePath: string): Promise<{ stream: Readable; filename: string; size: number }> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, filePath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao arquivo');
    }

    if (!await fs.pathExists(fullPath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      throw new BadRequestException('Não é possível baixar diretórios');
    }

    const stream = fs.createReadStream(fullPath);
    const filename = path.basename(fullPath);

    return { stream, filename, size: stats.size };
  }

  async downloadDirectory(serverId: string, user: User, dirPath: string): Promise<{ stream: Readable; filename: string }> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, dirPath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao diretório');
    }

    if (!await fs.pathExists(fullPath)) {
      throw new NotFoundException('Diretório não encontrado');
    }

    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new BadRequestException('Caminho não é um diretório');
    }

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const filename = `${path.basename(fullPath)}.zip`;

    archive.directory(fullPath, false);
    archive.finalize();

    return { stream: archive, filename };
  }

  async moveFile(serverId: string, user: User, sourcePath: string, targetPath: string): Promise<void> {
    const server = await this.serversService.findOne(serverId, user);
    const sourceFullPath = path.join(server.serverPath, sourcePath);
    const targetFullPath = path.join(server.serverPath, targetPath);

    if (!this.isPathSafe(server.serverPath, sourceFullPath) || 
        !this.isPathSafe(server.serverPath, targetFullPath)) {
      throw new ForbiddenException('Acesso negado');
    }

    if (!await fs.pathExists(sourceFullPath)) {
      throw new NotFoundException('Arquivo de origem não encontrado');
    }

    // Ensure target directory exists
    await fs.ensureDir(path.dirname(targetFullPath));

    await fs.move(sourceFullPath, targetFullPath);
  }

  async copyFile(serverId: string, user: User, sourcePath: string, targetPath: string): Promise<void> {
    const server = await this.serversService.findOne(serverId, user);
    const sourceFullPath = path.join(server.serverPath, sourcePath);
    const targetFullPath = path.join(server.serverPath, targetPath);

    if (!this.isPathSafe(server.serverPath, sourceFullPath) || 
        !this.isPathSafe(server.serverPath, targetFullPath)) {
      throw new ForbiddenException('Acesso negado');
    }

    if (!await fs.pathExists(sourceFullPath)) {
      throw new NotFoundException('Arquivo de origem não encontrado');
    }

    // Ensure target directory exists
    await fs.ensureDir(path.dirname(targetFullPath));

    await fs.copy(sourceFullPath, targetFullPath);
  }

  async getFileInfo(serverId: string, user: User, filePath: string): Promise<FileInfo> {
    const server = await this.serversService.findOne(serverId, user);
    const fullPath = path.join(server.serverPath, filePath);

    if (!this.isPathSafe(server.serverPath, fullPath)) {
      throw new ForbiddenException('Acesso negado ao arquivo');
    }

    if (!await fs.pathExists(fullPath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const stats = await fs.stat(fullPath);
    const fileName = path.basename(fullPath);

    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      type: stats.isDirectory() ? 'directory' : 'file',
      extension: stats.isFile() ? path.extname(fileName) : undefined,
      modified: stats.mtime,
      permissions: {
        read: true,
        write: true,
        execute: stats.isFile() && path.extname(fileName) === '.amx',
      },
    };
  }

  private isPathSafe(basePath: string, targetPath: string): boolean {
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(targetPath);
    
    return resolvedTarget.startsWith(resolvedBase);
  }

  private getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    const typeMap: { [key: string]: string } = {
      '.amx': 'gamemode',
      '.pwn': 'source',
      '.inc': 'include',
      '.so': 'plugin',
      '.dll': 'plugin',
      '.cfg': 'config',
      '.txt': 'text',
      '.log': 'log',
      '.db': 'database',
      '.sql': 'database',
      '.lua': 'script',
      '.json': 'data',
      '.xml': 'data',
      '.ini': 'config',
    };

    return typeMap[ext] || 'unknown';
  }
}