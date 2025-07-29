import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ServersService } from '../servers/servers.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WSGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/console',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private serverSubscriptions = new Map<string, Set<string>>(); // serverId -> Set of userIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly serversService: ServersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = payload;

      this.connectedUsers.set(client.userId, client);
      
      this.logger.log(`User ${client.userId} connected via WebSocket`);
      
      // Join user to their personal room
      client.join(`user:${client.userId}`);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Conectado ao console em tempo real',
        userId: client.userId,
      });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('auth_error', { message: 'Token inválido' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      
      // Remove from all server subscriptions
      for (const [serverId, subscribers] of this.serverSubscriptions.entries()) {
        if (subscribers.has(client.userId)) {
          subscribers.delete(client.userId);
          if (subscribers.size === 0) {
            this.serverSubscriptions.delete(serverId);
          }
        }
      }
      
      this.logger.log(`User ${client.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('subscribe_server_logs')
  async handleSubscribeServerLogs(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { serverId: string },
  ) {
    try {
      const { serverId } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      // Verify user has access to this server
      const server = await this.serversService.findOne(serverId, client.user);
      
      if (!server) {
        client.emit('error', { message: 'Servidor não encontrado ou acesso negado' });
        return;
      }

      // Add user to server subscription
      if (!this.serverSubscriptions.has(serverId)) {
        this.serverSubscriptions.set(serverId, new Set());
      }
      this.serverSubscriptions.get(serverId).add(client.userId);
      
      // Join server room
      client.join(`server:${serverId}`);
      
      this.logger.log(`User ${client.userId} subscribed to server ${serverId} logs`);
      
      client.emit('subscribed_server_logs', {
        serverId,
        message: `Inscrito nos logs do servidor ${server.name}`,
      });

      // Send recent logs
      const recentLogs = await this.serversService.getLogs(serverId, client.user, 50, 0);
      client.emit('server_logs_history', {
        serverId,
        logs: recentLogs,
      });

    } catch (error) {
      this.logger.error(`Error subscribing to server logs:`, error);
      client.emit('error', { message: 'Erro ao se inscrever nos logs do servidor' });
    }
  }

  @SubscribeMessage('unsubscribe_server_logs')
  async handleUnsubscribeServerLogs(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { serverId: string },
  ) {
    const { serverId } = data;
    
    if (!client.userId) {
      return;
    }

    // Remove from server subscription
    if (this.serverSubscriptions.has(serverId)) {
      this.serverSubscriptions.get(serverId).delete(client.userId);
      if (this.serverSubscriptions.get(serverId).size === 0) {
        this.serverSubscriptions.delete(serverId);
      }
    }
    
    // Leave server room
    client.leave(`server:${serverId}`);
    
    this.logger.log(`User ${client.userId} unsubscribed from server ${serverId} logs`);
    
    client.emit('unsubscribed_server_logs', {
      serverId,
      message: 'Desinscrito dos logs do servidor',
    });
  }

  @SubscribeMessage('send_rcon_command')
  async handleSendRconCommand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { serverId: string; command: string },
  ) {
    try {
      const { serverId, command } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      // Verify user has access to this server
      const server = await this.serversService.findOne(serverId, client.user);
      
      if (!server) {
        client.emit('error', { message: 'Servidor não encontrado ou acesso negado' });
        return;
      }

      if (!server.isRunning) {
        client.emit('rcon_error', {
          serverId,
          message: 'Servidor não está rodando',
        });
        return;
      }

      // TODO: Implement RCON command execution
      // This would involve connecting to the server via RCON and sending the command
      
      this.logger.log(`User ${client.userId} sent RCON command to server ${serverId}: ${command}`);
      
      // Emit command to server room (for other users watching)
      this.server.to(`server:${serverId}`).emit('rcon_command_sent', {
        serverId,
        command,
        sentBy: client.user.username,
        timestamp: new Date(),
      });

      client.emit('rcon_command_success', {
        serverId,
        command,
        message: 'Comando enviado com sucesso',
      });

    } catch (error) {
      this.logger.error(`Error sending RCON command:`, error);
      client.emit('rcon_error', {
        serverId: data.serverId,
        message: 'Erro ao enviar comando RCON',
      });
    }
  }

  @SubscribeMessage('get_server_status')
  async handleGetServerStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { serverId: string },
  ) {
    try {
      const { serverId } = data;
      
      if (!client.userId) {
        client.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      const status = await this.serversService.getStatus(serverId, client.user);
      
      client.emit('server_status', {
        serverId,
        status,
      });

    } catch (error) {
      this.logger.error(`Error getting server status:`, error);
      client.emit('error', { message: 'Erro ao obter status do servidor' });
    }
  }

  // Methods to be called by other services to broadcast events

  broadcastServerLog(serverId: string, log: any) {
    this.server.to(`server:${serverId}`).emit('server_log', {
      serverId,
      log,
    });
  }

  broadcastServerStatusChange(serverId: string, status: any) {
    this.server.to(`server:${serverId}`).emit('server_status_change', {
      serverId,
      status,
    });
  }

  broadcastServerStarted(serverId: string, serverName: string) {
    this.server.to(`server:${serverId}`).emit('server_started', {
      serverId,
      serverName,
      timestamp: new Date(),
    });
  }

  broadcastServerStopped(serverId: string, serverName: string) {
    this.server.to(`server:${serverId}`).emit('server_stopped', {
      serverId,
      serverName,
      timestamp: new Date(),
    });
  }

  broadcastServerCrashed(serverId: string, serverName: string, exitCode: number) {
    this.server.to(`server:${serverId}`).emit('server_crashed', {
      serverId,
      serverName,
      exitCode,
      timestamp: new Date(),
    });
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit(event, data);
    }
  }

  broadcastToAllUsers(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getServerSubscribersCount(serverId: string): number {
    return this.serverSubscriptions.get(serverId)?.size || 0;
  }
}