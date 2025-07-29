import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'SentinelJWT2024SecureKey!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'SentinelRefresh2024SecureKey!',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION, 10) || 15 * 60 * 1000, // 15 minutes
  sessionSecret: process.env.SESSION_SECRET || 'SentinelSession2024SecureKey!',
  twoFactorAppName: process.env.TWO_FACTOR_APP_NAME || 'SentinelCore',
  passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY, 10) || 3600000, // 1 hour
  emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY, 10) || 86400000, // 24 hours
}));