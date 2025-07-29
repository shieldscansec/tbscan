import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

import { Server, ServerStatus, ServerType } from './entities/server.entity';
import { ServerLog, ServerLogType } from './entities/server-log.entity';
import { ServerBackup, BackupType, BackupStatus } from './entities/server-backup.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  private runningServers = new Map<string, ChildProcess>();

  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerLog)
    private readonly serverLogRepository: Repository<ServerLog>,
    @InjectRepository(ServerBackup)
    private readonly serverBackupRepository: Repository<ServerBackup>,
    private readonly configService: ConfigService,
  ) {
    // Initialize monitoring on startup
    this.initializeMonitoring();
  }

  async create(createServerDto: CreateServerDto, user: User): Promise<Server> {
    // Check user limits
    const userServers = await this.serverRepository.count({
      where: { ownerId: user.id, deletedAt: null },
    });

    if (userServers >= user.maxServers) {
      throw new BadRequestException('Limite de servidores atingido');
    }

    // Check if IP:Port is already in use
    const existingServer = await this.serverRepository.findOne({
      where: {
        ip: createServerDto.ip,
        port: createServerDto.port,
        deletedAt: null,
      },
    });

    if (existingServer) {
      throw new BadRequestException('IP e porta já estão em uso');
    }

    // Generate server path
    const serverPath = path.join(
      this.configService.get('app.serverDataPath'),
      user.id,
      `server_${Date.now()}`
    );

    // Create server directory
    await fs.ensureDir(serverPath);

    // Generate RCON password if not provided
    const rconPassword = createServerDto.rconPassword || 
      crypto.randomBytes(16).toString('hex');

    // Create server entity
    const server = this.serverRepository.create({
      ...createServerDto,
      rconPassword,
      serverPath,
      ownerId: user.id,
      status: ServerStatus.STOPPED,
    });

    const savedServer = await this.serverRepository.save(server);

    // Initialize server files
    await this.initializeServerFiles(savedServer);

    // Log server creation
    await this.createLog(savedServer.id, ServerLogType.SYSTEM, 'Servidor criado com sucesso');

    return savedServer;
  }

  async findAll(user: User, filters?: any): Promise<Server[]> {
    const query = this.serverRepository.createQueryBuilder('server')
      .leftJoinAndSelect('server.owner', 'owner')
      .where('server.deletedAt IS NULL');

    // Apply user-based filtering
    if (user.role < UserRole.ADMIN) {
      query.andWhere('server.ownerId = :userId', { userId: user.id });
    }

    // Apply filters
    if (filters?.status) {
      query.andWhere('server.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('server.type = :type', { type: filters.type });
    }

    if (filters?.search) {
      query.andWhere('(server.name ILIKE :search OR server.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    return query.orderBy('server.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, user: User): Promise<Server> {
    const server = await this.serverRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['owner'],
    });

    if (!server) {
      throw new NotFoundException('Servidor não encontrado');
    }

    // Check permissions
    if (user.role < UserRole.ADMIN && server.ownerId !== user.id) {
      throw new ForbiddenException('Acesso negado');
    }

    return server;
  }

  async update(id: string, updateServerDto: UpdateServerDto, user: User): Promise<Server> {
    const server = await this.findOne(id, user);

    // Check if server is running for certain updates
    if (server.isRunning && (updateServerDto.ip || updateServerDto.port)) {
      throw new BadRequestException('Pare o servidor antes de alterar IP ou porta');
    }

    // Update server
    Object.assign(server, updateServerDto);
    const updatedServer = await this.serverRepository.save(server);

    // Update server.cfg if needed
    if (updateServerDto.serverCfg || updateServerDto.maxPlayers || updateServerDto.gamemodeName) {
      await this.updateServerConfig(updatedServer);
    }

    await this.createLog(server.id, ServerLogType.SYSTEM, 'Configurações do servidor atualizadas');

    return updatedServer;
  }

  async remove(id: string, user: User): Promise<void> {
    const server = await this.findOne(id, user);

    if (server.isRunning) {
      throw new BadRequestException('Pare o servidor antes de excluí-lo');
    }

    // Soft delete
    server.deletedAt = new Date();
    await this.serverRepository.save(server);

    // Clean up server files (optional)
    // await fs.remove(server.serverPath);

    await this.createLog(server.id, ServerLogType.SYSTEM, 'Servidor excluído');
  }

  async start(id: string, user: User): Promise<void> {
    const server = await this.findOne(id, user);

    if (!server.canStart) {
      throw new BadRequestException(`Servidor não pode ser iniciado. Status atual: ${server.statusLabel}`);
    }

    // Update status
    server.status = ServerStatus.STARTING;
    server.lastStarted = new Date();
    await this.serverRepository.save(server);

    try {
      // Start server process
      const process = await this.startServerProcess(server);
      this.runningServers.set(server.id, process);

      // Update status to running
      server.status = ServerStatus.RUNNING;
      server.processId = process.pid;
      await this.serverRepository.save(server);

      await this.createLog(server.id, ServerLogType.STARTUP, 'Servidor iniciado com sucesso');

    } catch (error) {
      server.status = ServerStatus.CRASHED;
      server.crashCount += 1;
      await this.serverRepository.save(server);

      await this.createLog(server.id, ServerLogType.ERROR, `Falha ao iniciar servidor: ${error.message}`);
      throw new BadRequestException('Falha ao iniciar servidor');
    }
  }

  async stop(id: string, user: User): Promise<void> {
    const server = await this.findOne(id, user);

    if (!server.canStop) {
      throw new BadRequestException(`Servidor não pode ser parado. Status atual: ${server.statusLabel}`);
    }

    // Update status
    server.status = ServerStatus.STOPPING;
    await this.serverRepository.save(server);

    try {
      // Stop server process
      const process = this.runningServers.get(server.id);
      if (process) {
        process.kill('SIGTERM');
        this.runningServers.delete(server.id);
      }

      // Update status
      server.status = ServerStatus.STOPPED;
      server.lastStopped = new Date();
      server.processId = null;
      await this.serverRepository.save(server);

      await this.createLog(server.id, ServerLogType.SHUTDOWN, 'Servidor parado com sucesso');

    } catch (error) {
      server.status = ServerStatus.CRASHED;
      await this.serverRepository.save(server);

      await this.createLog(server.id, ServerLogType.ERROR, `Falha ao parar servidor: ${error.message}`);
      throw new BadRequestException('Falha ao parar servidor');
    }
  }

  async restart(id: string, user: User): Promise<void> {
    const server = await this.findOne(id, user);

    if (!server.canRestart) {
      throw new BadRequestException(`Servidor não pode ser reiniciado. Status atual: ${server.statusLabel}`);
    }

    await this.stop(id, user);
    
    // Wait a moment before starting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.start(id, user);

    server.totalRestarts += 1;
    await this.serverRepository.save(server);

    await this.createLog(server.id, ServerLogType.SYSTEM, 'Servidor reiniciado');
  }

  async getStatus(id: string, user: User): Promise<any> {
    const server = await this.findOne(id, user);

    return {
      id: server.id,
      name: server.name,
      status: server.status,
      statusLabel: server.statusLabel,
      currentPlayers: server.currentPlayers,
      maxPlayers: server.maxPlayers,
      uptime: server.uptimeSeconds,
      uptimeFormatted: server.uptimeFormatted,
      resourceUsage: server.resourceUsage,
      lastStarted: server.lastStarted,
      lastStopped: server.lastStopped,
      crashCount: server.crashCount,
      totalRestarts: server.totalRestarts,
    };
  }

  async getLogs(id: string, user: User, limit = 100, offset = 0): Promise<ServerLog[]> {
    await this.findOne(id, user); // Check permissions

    return this.serverLogRepository.find({
      where: { serverId: id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async createBackup(id: string, user: User, name?: string, description?: string): Promise<ServerBackup> {
    const server = await this.findOne(id, user);

    const backupName = name || `backup_${Date.now()}`;
    const backupPath = path.join(
      this.configService.get('app.backupPath'),
      server.ownerId,
      server.id,
      `${backupName}.tar.gz`
    );

    await fs.ensureDir(path.dirname(backupPath));

    // Create backup entity
    const backup = this.serverBackupRepository.create({
      serverId: server.id,
      name: backupName,
      description: description || 'Backup manual',
      filePath: backupPath,
      fileSize: 0,
      backupType: BackupType.MANUAL,
      status: BackupStatus.IN_PROGRESS,
      createdById: user.id,
    });

    const savedBackup = await this.serverBackupRepository.save(backup);

    // Create backup asynchronously
    this.createBackupFile(server, savedBackup);

    return savedBackup;
  }

  async getBackups(id: string, user: User): Promise<ServerBackup[]> {
    await this.findOne(id, user); // Check permissions

    return this.serverBackupRepository.find({
      where: { serverId: id },
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  private async initializeServerFiles(server: Server): Promise<void> {
    const serverPath = server.serverPath;

    // Create necessary directories
    await fs.ensureDir(path.join(serverPath, 'gamemodes'));
    await fs.ensureDir(path.join(serverPath, 'filterscripts'));
    await fs.ensureDir(path.join(serverPath, 'plugins'));
    await fs.ensureDir(path.join(serverPath, 'scriptfiles'));
    await fs.ensureDir(path.join(serverPath, 'logs'));

    // Create default server.cfg
    await this.updateServerConfig(server);

    // Copy SA-MP server files based on type
    await this.copySampFiles(server);
  }

  private async updateServerConfig(server: Server): Promise<void> {
    const configPath = path.join(server.serverPath, 'server.cfg');
    
    const config = server.serverCfg || this.generateDefaultConfig(server);
    
    await fs.writeFile(configPath, config);
  }

  private generateDefaultConfig(server: Server): string {
    return `
# SentinelCore - SA-MP Server Configuration
# Generated for: ${server.name}

echo Executing Server Config...
lanmode 1
rcon_password ${server.rconPassword}
maxplayers ${server.maxPlayers}
port ${server.port}
hostname ${server.name}
gamemode0 ${server.gamemodeName || 'grandlarc'} 1
${server.filterscripts.length > 0 ? `filterscripts ${server.filterscripts.join(' ')}` : ''}
announce 1
chatlogging 1
weburl www.sa-mp.com
onfoot_rate 40
incar_rate 40
weapon_rate 40
stream_distance 300.0
stream_rate 1000
maxnpc 0
logtimeformat [%H:%M:%S]
language English
`.trim();
  }

  private async copySampFiles(server: Server): Promise<void> {
    const sampPath = this.getSampPath(server.type);
    const serverPath = server.serverPath;

    if (await fs.pathExists(sampPath)) {
      await fs.copy(sampPath, serverPath, {
        filter: (src) => !src.includes('server.cfg'), // Don't overwrite our config
      });
    }
  }

  private getSampPath(type: ServerType): string {
    const basePath = path.join(__dirname, '../../../samp-files');
    
    switch (type) {
      case ServerType.SAMP_037:
        return path.join(basePath, 'samp037');
      case ServerType.SAMP_03DL:
        return path.join(basePath, 'samp03dl');
      case ServerType.SAMP_03DL_R1:
        return path.join(basePath, 'samp03dl-r1');
      case ServerType.OPENMP:
        return path.join(basePath, 'openmp');
      default:
        return path.join(basePath, 'samp037');
    }
  }

  private async startServerProcess(server: Server): Promise<ChildProcess> {
    const serverPath = server.serverPath;
    const executable = this.getServerExecutable(server.type);
    
    const process = spawn(executable, [], {
      cwd: serverPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...server.environmentVars,
      },
    });

    // Handle process output
    process.stdout?.on('data', (data) => {
      const content = data.toString();
      this.createLog(server.id, ServerLogType.SYSTEM, content);
    });

    process.stderr?.on('data', (data) => {
      const content = data.toString();
      this.createLog(server.id, ServerLogType.ERROR, content);
    });

    // Handle process exit
    process.on('exit', (code) => {
      this.handleServerExit(server.id, code);
    });

    return process;
  }

  private getServerExecutable(type: ServerType): string {
    switch (type) {
      case ServerType.SAMP_037:
      case ServerType.SAMP_03DL:
      case ServerType.SAMP_03DL_R1:
        return './samp03svr';
      case ServerType.OPENMP:
        return './omp-server';
      default:
        return './samp03svr';
    }
  }

  private async handleServerExit(serverId: string, exitCode: number): Promise<void> {
    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) return;

    this.runningServers.delete(serverId);

    if (exitCode === 0) {
      server.status = ServerStatus.STOPPED;
      await this.createLog(serverId, ServerLogType.SHUTDOWN, 'Servidor parado normalmente');
    } else {
      server.status = ServerStatus.CRASHED;
      server.crashCount += 1;
      await this.createLog(serverId, ServerLogType.CRASH, `Servidor crashou com código: ${exitCode}`);

      // Auto-restart if enabled
      if (server.autoRestart && server.crashCount < 5) {
        setTimeout(() => {
          this.autoRestartServer(serverId);
        }, 10000); // Wait 10 seconds before restart
      }
    }

    server.lastStopped = new Date();
    server.processId = null;
    await this.serverRepository.save(server);
  }

  private async autoRestartServer(serverId: string): Promise<void> {
    try {
      const server = await this.serverRepository.findOne({ where: { id: serverId } });
      if (!server) return;

      await this.createLog(serverId, ServerLogType.SYSTEM, 'Tentando reinicialização automática...');
      
      const process = await this.startServerProcess(server);
      this.runningServers.set(serverId, process);

      server.status = ServerStatus.RUNNING;
      server.processId = process.pid;
      server.totalRestarts += 1;
      await this.serverRepository.save(server);

      await this.createLog(serverId, ServerLogType.STARTUP, 'Servidor reiniciado automaticamente');

    } catch (error) {
      await this.createLog(serverId, ServerLogType.ERROR, `Falha na reinicialização automática: ${error.message}`);
    }
  }

  private async createLog(serverId: string, type: ServerLogType, content: string): Promise<void> {
    const log = this.serverLogRepository.create({
      serverId,
      logType: type,
      content: content.trim(),
    });

    await this.serverLogRepository.save(log);
  }

  private async createBackupFile(server: Server, backup: ServerBackup): Promise<void> {
    try {
      // Implementation for creating backup file (tar.gz)
      // This is a simplified version - in production, you'd use proper archiving
      
      const stats = await fs.stat(server.serverPath);
      backup.fileSize = stats.size;
      backup.status = BackupStatus.COMPLETED;
      backup.checksum = crypto.createHash('md5').update(server.serverPath).digest('hex');

      await this.serverBackupRepository.save(backup);

      await this.createLog(server.id, ServerLogType.SYSTEM, `Backup criado: ${backup.name}`);

    } catch (error) {
      backup.status = BackupStatus.FAILED;
      await this.serverBackupRepository.save(backup);

      await this.createLog(server.id, ServerLogType.ERROR, `Falha ao criar backup: ${error.message}`);
    }
  }

  private async initializeMonitoring(): Promise<void> {
    // Initialize monitoring for running servers
    setInterval(async () => {
      await this.updateServerMetrics();
    }, 30000); // Update every 30 seconds
  }

  private async updateServerMetrics(): Promise<void> {
    const runningServers = await this.serverRepository.find({
      where: { status: ServerStatus.RUNNING },
    });

    for (const server of runningServers) {
      try {
        // Update server metrics (CPU, memory, etc.)
        // This would integrate with system monitoring tools
        
        if (server.lastStarted) {
          server.uptimeSeconds = Math.floor((Date.now() - server.lastStarted.getTime()) / 1000);
        }

        await this.serverRepository.save(server);
      } catch (error) {
        console.error(`Error updating metrics for server ${server.id}:`, error);
      }
    }
  }
}