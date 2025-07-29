import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { Server } from './entities/server.entity';
import { ServerLog } from './entities/server-log.entity';
import { ServerBackup } from './entities/server-backup.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Server, ServerLog, ServerBackup]),
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}