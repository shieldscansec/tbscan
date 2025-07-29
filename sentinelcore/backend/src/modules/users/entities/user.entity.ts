import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Server } from '../../servers/entities/server.entity';
import { UserSession } from './user-session.entity';
import { UserLog } from './user-log.entity';

export enum UserRole {
  VISITOR = 0,
  CLIENT = 1,
  SUBADMIN = 2,
  ADMIN = 3,
  ROOT = 4,
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'company_name', nullable: true })
  companyName?: string;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true })
  @Exclude({ toPlainOnly: true })
  twoFactorSecret?: string;

  @Column({ name: 'two_factor_backup_codes', type: 'text', array: true, nullable: true })
  @Exclude({ toPlainOnly: true })
  twoFactorBackupCodes?: string[];

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  @Exclude({ toPlainOnly: true })
  emailVerificationToken?: string;

  @Column({ name: 'password_reset_token', nullable: true })
  @Exclude({ toPlainOnly: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', nullable: true })
  passwordResetExpires?: Date;

  @Column({ name: 'last_login', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'login_attempts', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', nullable: true })
  lockedUntil?: Date;

  @Column({ name: 'preferences', type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ name: 'permissions', type: 'text', array: true, default: [] })
  permissions: string[];

  @Column({ name: 'max_servers', default: 1 })
  maxServers: number;

  @Column({ name: 'disk_quota_mb', default: 1024 })
  diskQuotaMb: number;

  @Column({ name: 'bandwidth_quota_gb', default: 10 })
  bandwidthQuotaGb: number;

  @Column({ name: 'api_key', nullable: true })
  @Exclude({ toPlainOnly: true })
  apiKey?: string;

  @Column({ name: 'api_key_expires', nullable: true })
  apiKeyExpires?: Date;

  @Column({ name: 'subscription_plan', nullable: true })
  subscriptionPlan?: string;

  @Column({ name: 'subscription_expires', nullable: true })
  subscriptionExpires?: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relations
  @OneToMany(() => Server, (server) => server.owner)
  servers: Server[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => UserLog, (log) => log.user)
  logs: UserLog[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get canLogin(): boolean {
    return (
      this.status === UserStatus.ACTIVE &&
      this.emailVerified &&
      !this.isLocked
    );
  }

  get roleLabel(): string {
    const labels = {
      [UserRole.VISITOR]: 'Visitante',
      [UserRole.CLIENT]: 'Cliente',
      [UserRole.SUBADMIN]: 'SubAdmin',
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.ROOT]: 'Root/Sentinel',
    };
    return labels[this.role] || 'Desconhecido';
  }

  get statusLabel(): string {
    const labels = {
      [UserStatus.ACTIVE]: 'Ativo',
      [UserStatus.INACTIVE]: 'Inativo',
      [UserStatus.SUSPENDED]: 'Suspenso',
      [UserStatus.BANNED]: 'Banido',
      [UserStatus.PENDING_VERIFICATION]: 'Aguardando Verificação',
    };
    return labels[this.status] || 'Desconhecido';
  }

  // Helper methods
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission) || this.role >= UserRole.ADMIN;
  }

  hasRole(role: UserRole): boolean {
    return this.role >= role;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
  }

  lockAccount(duration: number): void {
    this.lockedUntil = new Date(Date.now() + duration);
  }
}