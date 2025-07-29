import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WebSocketGateway } from './websocket.gateway';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [ConfigModule, ServersModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}