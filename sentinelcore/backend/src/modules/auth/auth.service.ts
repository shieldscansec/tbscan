import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { User, UserStatus } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { TwoFactorService } from './two-factor.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if user is locked
    if (user.isLocked) {
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    // Check if user can login
    if (!user.canLogin) {
      throw new UnauthorizedException('Conta não autorizada para login');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Reset login attempts on successful password verification
    await this.resetLoginAttempts(user);

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const { email, password, twoFactorCode, rememberMe } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return { requiresTwoFactor: true };
      }

      const isValidCode = await this.twoFactorService.verifyToken(
        user.twoFactorSecret,
        twoFactorCode,
      );

      if (!isValidCode) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user, tokens.accessToken, tokens.refreshToken, ipAddress, userAgent, rememberMe);

    // Update last login
    await this.updateLastLogin(user, ipAddress);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const { username, email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email já está em uso');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Nome de usuário já está em uso');
      }
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerificationToken,
      status: UserStatus.PENDING_VERIFICATION,
    });

    await this.userRepository.save(user);

    // TODO: Send email verification
    // await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);

    return {
      message: 'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
      userId: user.id,
    };
  }

  async refreshToken(refreshToken: string, ipAddress: string): Promise<any> {
    // Find session with refresh token
    const session = await this.sessionRepository.findOne({
      where: { refreshToken, isActive: true },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresh inválido ou expirado');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.user);

    // Update session
    session.sessionToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken;
    session.lastActivity = new Date();
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessionRepository.save(session);

    return tokens;
  }

  async logout(sessionToken: string): Promise<void> {
    await this.sessionRepository.update(
      { sessionToken },
      { isActive: false },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { user: { id: userId } },
      { isActive: false },
    );
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'Se o email existir, um link de recuperação será enviado.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;

    await this.userRepository.save(user);

    // TODO: Send password reset email
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Se o email existir, um link de recuperação será enviado.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { token, password } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token de recuperação inválido ou expirado');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockedUntil = null;

    await this.userRepository.save(user);

    // Invalidate all sessions
    await this.logoutAll(user.id);

    return { message: 'Senha alterada com sucesso' };
  }

  async verifyEmail(token: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificação inválido');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.status = UserStatus.ACTIVE;

    await this.userRepository.save(user);

    return { message: 'Email verificado com sucesso' };
  }

  async enable2FA(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA já está habilitado');
    }

    const secret = this.twoFactorService.generateSecret();
    const qrCode = await this.twoFactorService.generateQRCode(user.email, secret);

    // Save secret temporarily (will be confirmed later)
    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    return {
      secret,
      qrCode,
      backupCodes: this.generateBackupCodes(),
    };
  }

  async confirm2FA(userId: string, token: string, backupCodes: string[]): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA não foi iniciado');
    }

    const isValid = await this.twoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;

    await this.userRepository.save(user);

    return { message: '2FA habilitado com sucesso' };
  }

  async disable2FA(userId: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = null;

    await this.userRepository.save(user);

    return { message: '2FA desabilitado com sucesso' };
  }

  private async generateTokens(user: any): Promise<any> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('auth.jwtExpiresIn'),
    };
  }

  private async createSession(
    user: any,
    accessToken: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean,
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );

    const session = this.sessionRepository.create({
      user: { id: user.id },
      sessionToken: accessToken,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.sessionRepository.save(session);
  }

  private async updateLastLogin(user: any, ipAddress: string): Promise<void> {
    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
      lastLoginIp: ipAddress,
    });
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.incrementLoginAttempts();

    const maxAttempts = this.configService.get('auth.maxLoginAttempts');
    const lockoutDuration = this.configService.get('auth.lockoutDuration');

    if (user.loginAttempts >= maxAttempts) {
      user.lockAccount(lockoutDuration);
    }

    await this.userRepository.save(user);
  }

  private async resetLoginAttempts(user: User): Promise<void> {
    if (user.loginAttempts > 0 || user.lockedUntil) {
      user.resetLoginAttempts();
      await this.userRepository.save(user);
    }
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}