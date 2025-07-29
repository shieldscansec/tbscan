import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'sentinel_admin',
  password: process.env.DB_PASSWORD || 'SentinelSecure2024!',
  name: process.env.DB_NAME || 'sentinelcore',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
  migrationsRun: true,
  migrations: ['dist/migrations/*.js'],
  entities: ['dist/**/*.entity.js'],
}));