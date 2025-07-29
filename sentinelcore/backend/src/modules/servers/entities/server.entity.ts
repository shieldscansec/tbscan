import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ServerLog } from './server-log.entity';
import { ServerBackup } from './server-backup.entity';

export enum ServerStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  CRASHED = 'crashed',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended',
}

export enum ServerType {
  SAMP_037 = 'samp_037',
  SAMP_03DL = 'samp_03dl',
  SAMP_03DL_R1 = 'samp_03dl_r1',
  OPENMP = 'openmp',
}

@Entity('servers')
@Index(['name'])
@Index(['ip', 'port'], { unique: true })
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ServerType,
    default: ServerType.SAMP_037,
  })
  type: ServerType;

  @Column({
    type: 'enum',
    enum: ServerStatus,
    default: ServerStatus.STOPPED,
  })
  status: ServerStatus;

  @Column({ length: 45 })
  ip: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ name: 'rcon_password' })
  rconPassword: string;

  @Column({ name: 'max_players', default: 50 })
  maxPlayers: number;

  @Column({ name: 'gamemode_name', length: 100, nullable: true })
  gamemodeName?: string;

  @Column({ name: 'gamemode_file', length: 255, nullable: true })
  gamemodeFile?: string;

  @Column({ name: 'filterscripts', type: 'text', array: true, default: [] })
  filterscripts: string[];

  @Column({ name: 'plugins', type: 'text', array: true, default: [] })
  plugins: string[];

  @Column({ name: 'server_cfg', type: 'text', nullable: true })
  serverCfg?: string;

  @Column({ name: 'auto_restart', default: true })
  autoRestart: boolean;

  @Column({ name: 'restart_interval_hours', default: 24 })
  restartIntervalHours: number;

  @Column({ name: 'cpu_limit_percent', default: 80 })
  cpuLimitPercent: number;

  @Column({ name: 'memory_limit_mb', default: 512 })
  memoryLimitMb: number;

  @Column({ name: 'disk_quota_mb', default: 1024 })
  diskQuotaMb: number;

  @Column({ name: 'bandwidth_limit_mbps', nullable: true })
  bandwidthLimitMbps?: number;

  @Column({ name: 'backup_enabled', default: true })
  backupEnabled: boolean;

  @Column({ name: 'backup_interval_hours', default: 6 })
  backupIntervalHours: number;

  @Column({ name: 'backup_retention_days', default: 7 })
  backupRetentionDays: number;

  @Column({ name: 'monitoring_enabled', default: true })
  monitoringEnabled: boolean;

  @Column({ name: 'crash_detection', default: true })
  crashDetection: boolean;

  @Column({ name: 'log_retention_days', default: 30 })
  logRetentionDays: number;

  @Column({ name: 'server_path', length: 500 })
  serverPath: string;

  @Column({ name: 'process_id', nullable: true })
  processId?: number;

  @Column({ name: 'last_started', nullable: true })
  lastStarted?: Date;

  @Column({ name: 'last_stopped', nullable: true })
  lastStopped?: Date;

  @Column({ name: 'uptime_seconds', default: 0 })
  uptimeSeconds: number;

  @Column({ name: 'crash_count', default: 0 })
  crashCount: number;

  @Column({ name: 'total_restarts', default: 0 })
  totalRestarts: number;

  @Column({ name: 'current_players', default: 0 })
  currentPlayers: number;

  @Column({ name: 'peak_players', default: 0 })
  peakPlayers: number;

  @Column({ name: 'total_connections', default: 0 })
  totalConnections: number;

  @Column({ name: 'cpu_usage_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cpuUsagePercent: number;

  @Column({ name: 'memory_usage_mb', type: 'decimal', precision: 10, scale: 2, default: 0 })
  memoryUsageMb: number;

  @Column({ name: 'disk_usage_mb', type: 'decimal', precision: 10, scale: 2, default: 0 })
  diskUsageMb: number;

  @Column({ name: 'network_in_mb', type: 'decimal', precision: 15, scale: 2, default: 0 })
  networkInMb: number;

  @Column({ name: 'network_out_mb', type: 'decimal', precision: 15, scale: 2, default: 0 })
  networkOutMb: number;

  @Column({ name: 'server_version', length: 50, nullable: true })
  serverVersion?: string;

  @Column({ name: 'custom_params', type: 'text', nullable: true })
  customParams?: string;

  @Column({ name: 'environment_vars', type: 'jsonb', default: {} })
  environmentVars: Record<string, string>;

  @Column({ name: 'security_settings', type: 'jsonb', default: {} })
  securitySettings: Record<string, any>;

  @Column({ name: 'performance_settings', type: 'jsonb', default: {} })
  performanceSettings: Record<string, any>;

  @Column({ name: 'notification_settings', type: 'jsonb', default: {} })
  notificationSettings: Record<string, any>;

  @Column({ name: 'is_template', default: false })
  isTemplate: boolean;

  @Column({ name: 'template_name', length: 100, nullable: true })
  templateName?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.servers, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToMany(() => ServerLog, (log) => log.server)
  logs: ServerLog[];

  @OneToMany(() => ServerBackup, (backup) => backup.server)
  backups: ServerBackup[];

  // Virtual properties
  get statusLabel(): string {
    const labels = {
      [ServerStatus.STOPPED]: 'Parado',
      [ServerStatus.STARTING]: 'Iniciando',
      [ServerStatus.RUNNING]: 'Executando',
      [ServerStatus.STOPPING]: 'Parando',
      [ServerStatus.CRASHED]: 'Crashado',
      [ServerStatus.MAINTENANCE]: 'Manutenção',
      [ServerStatus.SUSPENDED]: 'Suspenso',
    };
    return labels[this.status] || 'Desconhecido';
  }

  get typeLabel(): string {
    const labels = {
      [ServerType.SAMP_037]: 'SA-MP 0.3.7',
      [ServerType.SAMP_03DL]: 'SA-MP 0.3.DL',
      [ServerType.SAMP_03DL_R1]: 'SA-MP 0.3.DL-R1',
      [ServerType.OPENMP]: 'OpenMP',
    };
    return labels[this.type] || 'Desconhecido';
  }

  get fullAddress(): string {
    return `${this.ip}:${this.port}`;
  }

  get isRunning(): boolean {
    return this.status === ServerStatus.RUNNING;
  }

  get isStopped(): boolean {
    return this.status === ServerStatus.STOPPED;
  }

  get canStart(): boolean {
    return [ServerStatus.STOPPED, ServerStatus.CRASHED].includes(this.status);
  }

  get canStop(): boolean {
    return [ServerStatus.RUNNING, ServerStatus.STARTING].includes(this.status);
  }

  get canRestart(): boolean {
    return this.status === ServerStatus.RUNNING;
  }

  get uptimeFormatted(): string {
    const hours = Math.floor(this.uptimeSeconds / 3600);
    const minutes = Math.floor((this.uptimeSeconds % 3600) / 60);
    const seconds = this.uptimeSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  get resourceUsage(): { cpu: number; memory: number; disk: number } {
    return {
      cpu: this.cpuUsagePercent,
      memory: (this.memoryUsageMb / this.memoryLimitMb) * 100,
      disk: (this.diskUsageMb / this.diskQuotaMb) * 100,
    };
  }

  // Helper methods
  updateStatus(status: ServerStatus): void {
    this.status = status;
    
    if (status === ServerStatus.RUNNING && this.lastStarted) {
      this.uptimeSeconds = Math.floor((Date.now() - this.lastStarted.getTime()) / 1000);
    }
    
    if (status === ServerStatus.CRASHED) {
      this.crashCount += 1;
      this.lastStopped = new Date();
    }
  }

  updateResourceUsage(cpu: number, memory: number, disk: number): void {
    this.cpuUsagePercent = cpu;
    this.memoryUsageMb = memory;
    this.diskUsageMb = disk;
  }

  updatePlayerCount(current: number): void {
    this.currentPlayers = current;
    if (current > this.peakPlayers) {
      this.peakPlayers = current;
    }
  }

  incrementConnections(): void {
    this.totalConnections += 1;
  }

  incrementRestarts(): void {
    this.totalRestarts += 1;
  }

  isResourceLimitExceeded(): boolean {
    const usage = this.resourceUsage;
    return usage.cpu > this.cpuLimitPercent || usage.memory > 90 || usage.disk > 90;
  }
}