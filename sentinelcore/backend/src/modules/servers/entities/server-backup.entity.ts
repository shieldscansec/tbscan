import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Server } from './server.entity';
import { User } from '../../users/entities/user.entity';

export enum BackupType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SCHEDULED = 'scheduled',
  PRE_UPDATE = 'pre_update',
  CRASH_RECOVERY = 'crash_recovery',
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CORRUPTED = 'corrupted',
}

@Entity('server_backups')
@Index(['serverId'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class ServerBackup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ default: true })
  compressed: boolean;

  @Column({ default: false })
  encrypted: boolean;

  @Column({ length: 64, nullable: true })
  checksum?: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    name: 'backup_type',
    default: BackupType.MANUAL,
  })
  backupType: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.PENDING,
  })
  status: BackupStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ name: 'last_downloaded', nullable: true })
  lastDownloaded?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  // Relations
  @ManyToOne(() => Server, (server) => server.backups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @Column({ name: 'created_by', nullable: true })
  createdById?: string;

  // Helper methods
  get isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  get isCompleted(): boolean {
    return this.status === BackupStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return [BackupStatus.FAILED, BackupStatus.CORRUPTED].includes(this.status);
  }

  get fileSizeFormatted(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (this.fileSize === 0) return '0 Bytes';
    const i = Math.floor(Math.log(Number(this.fileSize)) / Math.log(1024));
    return Math.round(Number(this.fileSize) / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get typeLabel(): string {
    const labels = {
      [BackupType.MANUAL]: 'Manual',
      [BackupType.AUTOMATIC]: 'Automático',
      [BackupType.SCHEDULED]: 'Agendado',
      [BackupType.PRE_UPDATE]: 'Pré-Atualização',
      [BackupType.CRASH_RECOVERY]: 'Recuperação de Crash',
    };
    return labels[this.backupType] || 'Desconhecido';
  }

  get statusLabel(): string {
    const labels = {
      [BackupStatus.PENDING]: 'Pendente',
      [BackupStatus.IN_PROGRESS]: 'Em Progresso',
      [BackupStatus.COMPLETED]: 'Concluído',
      [BackupStatus.FAILED]: 'Falhou',
      [BackupStatus.CORRUPTED]: 'Corrompido',
    };
    return labels[this.status] || 'Desconhecido';
  }
}