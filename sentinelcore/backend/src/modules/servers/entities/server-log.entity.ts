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

export enum ServerLogType {
  SYSTEM = 'system',
  GAMEMODE = 'gamemode',
  PLUGIN = 'plugin',
  CHAT = 'chat',
  ADMIN = 'admin',
  ERROR = 'error',
  WARNING = 'warning',
  DEBUG = 'debug',
  CRASH = 'crash',
  STARTUP = 'startup',
  SHUTDOWN = 'shutdown',
}

@Entity('server_logs')
@Index(['serverId'])
@Index(['logType'])
@Index(['createdAt'])
export class ServerLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ServerLogType,
    name: 'log_type',
  })
  logType: ServerLogType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'file_path', nullable: true })
  filePath?: string;

  @Column({ name: 'line_number', nullable: true })
  lineNumber?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Server, (server) => server.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'server_id' })
  serverId: string;

  // Helper methods
  get isError(): boolean {
    return [ServerLogType.ERROR, ServerLogType.CRASH].includes(this.logType);
  }

  get isWarning(): boolean {
    return this.logType === ServerLogType.WARNING;
  }

  get isSystem(): boolean {
    return [
      ServerLogType.SYSTEM,
      ServerLogType.STARTUP,
      ServerLogType.SHUTDOWN,
    ].includes(this.logType);
  }
}