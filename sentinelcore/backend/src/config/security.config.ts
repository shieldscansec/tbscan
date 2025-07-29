import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  encryptionKey: process.env.ENCRYPTION_KEY || 'SentinelEncryption2024Key!',
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 100 * 1024 * 1024, // 100MB
  uploadAllowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/*,text/*,.amx,.pwn,.inc,.cfg,.txt,.log').split(','),
  ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
  ipBlacklist: process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : [],
  maxFileUploads: parseInt(process.env.MAX_FILE_UPLOADS, 10) || 10,
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 30 * 60 * 1000, // 30 minutes
  bruteForceProtection: {
    freeRetries: parseInt(process.env.BRUTE_FORCE_FREE_RETRIES, 10) || 3,
    minWait: parseInt(process.env.BRUTE_FORCE_MIN_WAIT, 10) || 5 * 60 * 1000, // 5 minutes
    maxWait: parseInt(process.env.BRUTE_FORCE_MAX_WAIT, 10) || 60 * 60 * 1000, // 1 hour
    lifetime: parseInt(process.env.BRUTE_FORCE_LIFETIME, 10) || 24 * 60 * 60 * 1000, // 24 hours
  },
  shieldScanLicense: process.env.SHIELD_SCAN_LICENSE,
  offlineMode: process.env.OFFLINE_MODE === 'true',
}));