import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServersModule } from './modules/servers/servers.module';
import { FilesModule } from './modules/files/files.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

// Configuration
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import securityConfig from './config/security.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, securityConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl'),
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('security.rateLimitTtl'),
        limit: configService.get('security.rateLimitMax'),
      }),
      inject: [ConfigService],
    }),

    // Static files serving
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        redirect: false,
      },
    }),

    // Core modules
    AuthModule,
    UsersModule,
    ServersModule,
    FilesModule,
    WebSocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}