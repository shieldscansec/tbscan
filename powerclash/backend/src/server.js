const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar serviços e middlewares
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { rateLimitMiddleware } = require('./middleware/rateLimit');

// Importar rotas
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const detectionRoutes = require('./routes/detections');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

// Importar serviços de detecção
const CheatDetectionService = require('./services/CheatDetectionService');
const MemoryAnalysisService = require('./services/MemoryAnalysisService');
const ProcessMonitorService = require('./services/ProcessMonitorService');
const NetworkMonitorService = require('./services/NetworkMonitorService');
const AIService = require('./services/AIService');

// Importar modelos
const Device = require('./models/Device');
const Detection = require('./models/Detection');
const Report = require('./models/Report');
const User = require('./models/User');

class PowerClashServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.port = process.env.PORT || 3001;
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Inicializar serviços
    this.cheatDetectionService = new CheatDetectionService();
    this.memoryAnalysisService = new MemoryAnalysisService();
    this.processMonitorService = new ProcessMonitorService();
    this.networkMonitorService = new NetworkMonitorService();
    this.aiService = new AIService();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    this.initializeServices();
    this.initializeErrorHandling();
  }

  async initializeMiddleware() {
    // Segurança
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true
    }));

    // Compressão
    this.app.use(compression());

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Logging
    this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));
    this.app.use('/logs', express.static('logs'));

    logger.info('Middleware inicializado com sucesso');
  }

  initializeRoutes() {
    // Rotas públicas
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/webhooks', webhookRoutes);

    // Rotas protegidas
    this.app.use('/api/devices', authMiddleware, deviceRoutes);
    this.app.use('/api/detections', authMiddleware, detectionRoutes);
    this.app.use('/api/reports', authMiddleware, reportRoutes);
    this.app.use('/api/admin', authMiddleware, adminRoutes);

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
      });
    });

    logger.info('Rotas inicializadas com sucesso');
  }

  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Cliente conectado: ${socket.id}`);

      // Autenticação do socket
      socket.on('authenticate', async (data) => {
        try {
          const { token, deviceId } = data;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          
          if (!user) {
            socket.emit('auth_error', { message: 'Usuário não encontrado' });
            return;
          }

          socket.userId = decoded.userId;
          socket.deviceId = deviceId;
          socket.join(`user_${decoded.userId}`);
          socket.join(`device_${deviceId}`);

          socket.emit('authenticated', { 
            message: 'Autenticado com sucesso',
            userId: decoded.userId,
            deviceId: deviceId
          });

          logger.info(`Socket autenticado: ${socket.id} para usuário ${decoded.userId}`);
        } catch (error) {
          socket.emit('auth_error', { message: 'Token inválido' });
          logger.error(`Erro na autenticação do socket: ${error.message}`);
        }
      });

      // Receber dados de detecção do dispositivo
      socket.on('detection_data', async (data) => {
        try {
          if (!socket.userId || !socket.deviceId) {
            socket.emit('error', { message: 'Socket não autenticado' });
            return;
          }

          const detection = await this.processDetectionData(data, socket.deviceId, socket.userId);
          
          // Emitir para todos os clientes do usuário
          this.io.to(`user_${socket.userId}`).emit('new_detection', detection);
          
          // Emitir para painel administrativo
          this.io.to('admin').emit('detection_alert', detection);

          logger.info(`Detecção processada: ${detection.id}`);
        } catch (error) {
          logger.error(`Erro ao processar detecção: ${error.message}`);
          socket.emit('error', { message: 'Erro ao processar detecção' });
        }
      });

      // Receber logs do sistema
      socket.on('system_logs', async (data) => {
        try {
          if (!socket.userId || !socket.deviceId) {
            return;
          }

          await this.processSystemLogs(data, socket.deviceId, socket.userId);
          logger.info(`Logs do sistema processados para dispositivo ${socket.deviceId}`);
        } catch (error) {
          logger.error(`Erro ao processar logs: ${error.message}`);
        }
      });

      // Receber métricas de performance
      socket.on('performance_metrics', async (data) => {
        try {
          if (!socket.userId || !socket.deviceId) {
            return;
          }

          await this.processPerformanceMetrics(data, socket.deviceId, socket.userId);
        } catch (error) {
          logger.error(`Erro ao processar métricas: ${error.message}`);
        }
      });

      // Desconexão
      socket.on('disconnect', () => {
        logger.info(`Cliente desconectado: ${socket.id}`);
      });
    });

    logger.info('Handlers de Socket.io inicializados com sucesso');
  }

  async initializeServices() {
    try {
      // Conectar ao banco de dados
      await connectDB();
      logger.info('Conectado ao MongoDB');

      // Conectar ao Redis
      await connectRedis();
      logger.info('Conectado ao Redis');

      // Inicializar serviços de detecção
      await this.cheatDetectionService.initialize();
      await this.memoryAnalysisService.initialize();
      await this.processMonitorService.initialize();
      await this.networkMonitorService.initialize();
      await this.aiService.initialize();

      logger.info('Todos os serviços inicializados com sucesso');

      // Iniciar tarefas agendadas
      this.startScheduledTasks();

    } catch (error) {
      logger.error(`Erro ao inicializar serviços: ${error.message}`);
      process.exit(1);
    }
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
    logger.info('Tratamento de erros inicializado');
  }

  startScheduledTasks() {
    // Atualizar assinaturas de cheats a cada 6 horas
    setInterval(async () => {
      try {
        await this.cheatDetectionService.updateSignatures();
        logger.info('Assinaturas de cheats atualizadas');
      } catch (error) {
        logger.error(`Erro ao atualizar assinaturas: ${error.message}`);
      }
    }, 6 * 60 * 60 * 1000);

    // Limpar logs antigos diariamente
    setInterval(async () => {
      try {
        await this.cleanupOldLogs();
        logger.info('Logs antigos limpos');
      } catch (error) {
        logger.error(`Erro ao limpar logs: ${error.message}`);
      }
    }, 24 * 60 * 60 * 1000);

    // Análise de IA para novos padrões
    setInterval(async () => {
      try {
        await this.aiService.analyzeNewPatterns();
        logger.info('Análise de IA para novos padrões concluída');
      } catch (error) {
        logger.error(`Erro na análise de IA: ${error.message}`);
      }
    }, 12 * 60 * 60 * 1000);

    logger.info('Tarefas agendadas iniciadas');
  }

  async processDetectionData(data, deviceId, userId) {
    try {
      const {
        type,
        severity,
        details,
        timestamp,
        processInfo,
        memoryInfo,
        networkInfo
      } = data;

      // Criar detecção no banco
      const detection = new Detection({
        deviceId,
        userId,
        type,
        severity,
        details,
        timestamp: timestamp || new Date(),
        processInfo,
        memoryInfo,
        networkInfo,
        status: 'active'
      });

      await detection.save();

      // Processar com IA para classificação
      const aiAnalysis = await this.aiService.analyzeDetection(detection);
      detection.aiAnalysis = aiAnalysis;
      detection.riskLevel = aiAnalysis.riskLevel;
      detection.recommendation = aiAnalysis.recommendation;

      await detection.save();

      // Notificar usuário se for crítico
      if (detection.severity === 'critical') {
        await this.sendCriticalAlert(userId, detection);
      }

      // Atualizar estatísticas do dispositivo
      await this.updateDeviceStats(deviceId, detection);

      return detection;
    } catch (error) {
      logger.error(`Erro ao processar dados de detecção: ${error.message}`);
      throw error;
    }
  }

  async processSystemLogs(logs, deviceId, userId) {
    try {
      // Processar logs com IA para identificar padrões suspeitos
      const suspiciousPatterns = await this.aiService.analyzeSystemLogs(logs);
      
      if (suspiciousPatterns.length > 0) {
        // Criar detecções baseadas nos padrões encontrados
        for (const pattern of suspiciousPatterns) {
          await this.processDetectionData({
            type: 'system_log_analysis',
            severity: pattern.severity,
            details: pattern.details,
            timestamp: new Date(),
            processInfo: pattern.processInfo
          }, deviceId, userId);
        }
      }

      // Armazenar logs no banco
      await this.storeSystemLogs(logs, deviceId, userId);
    } catch (error) {
      logger.error(`Erro ao processar logs do sistema: ${error.message}`);
    }
  }

  async processPerformanceMetrics(metrics, deviceId, userId) {
    try {
      // Analisar métricas para detectar anomalias
      const anomalies = await this.aiService.analyzePerformanceMetrics(metrics);
      
      if (anomalies.length > 0) {
        for (const anomaly of anomalies) {
          await this.processDetectionData({
            type: 'performance_anomaly',
            severity: anomaly.severity,
            details: anomaly.details,
            timestamp: new Date()
          }, deviceId, userId);
        }
      }

      // Armazenar métricas
      await this.storePerformanceMetrics(metrics, deviceId, userId);
    } catch (error) {
      logger.error(`Erro ao processar métricas de performance: ${error.message}`);
    }
  }

  async sendCriticalAlert(userId, detection) {
    try {
      // Enviar notificação push
      // Enviar email
      // Enviar SMS se configurado
      
      logger.info(`Alerta crítico enviado para usuário ${userId}`);
    } catch (error) {
      logger.error(`Erro ao enviar alerta crítico: ${error.message}`);
    }
  }

  async updateDeviceStats(deviceId, detection) {
    try {
      const device = await Device.findById(deviceId);
      if (device) {
        device.lastDetection = new Date();
        device.detectionCount = (device.detectionCount || 0) + 1;
        device.lastSeverity = detection.severity;
        await device.save();
      }
    } catch (error) {
      logger.error(`Erro ao atualizar estatísticas do dispositivo: ${error.message}`);
    }
  }

  async storeSystemLogs(logs, deviceId, userId) {
    // Implementar armazenamento de logs
  }

  async storePerformanceMetrics(metrics, deviceId, userId) {
    // Implementar armazenamento de métricas
  }

  async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Limpar detecções antigas
      await Detection.deleteMany({
        timestamp: { $lt: thirtyDaysAgo },
        severity: { $ne: 'critical' }
      });

      // Limpar logs antigos
      // Implementar limpeza de logs

      logger.info('Limpeza de dados antigos concluída');
    } catch (error) {
      logger.error(`Erro na limpeza de dados: ${error.message}`);
    }
  }

  async start() {
    try {
      this.server.listen(this.port, () => {
        logger.info(`🚀 PowerClash Server rodando na porta ${this.port}`);
        logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📱 API: http://localhost:${this.port}`);
        logger.info(`🔌 WebSocket: ws://localhost:${this.port}`);
        logger.info(`📊 Health Check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error(`Erro ao iniciar servidor: ${error.message}`);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    logger.info('🛑 Iniciando shutdown gracioso...');
    
    try {
      // Fechar servidor HTTP
      this.server.close(() => {
        logger.info('Servidor HTTP fechado');
      });

      // Fechar conexões Socket.io
      this.io.close(() => {
        logger.info('Socket.io fechado');
      });

      // Fechar conexões de banco
      await mongoose.connection.close();
      logger.info('Conexão MongoDB fechada');

      // Fechar conexão Redis
      const redisClient = redis.createClient();
      await redisClient.quit();
      logger.info('Conexão Redis fechada');

      logger.info('✅ Shutdown gracioso concluído');
      process.exit(0);
    } catch (error) {
      logger.error(`Erro durante shutdown: ${error.message}`);
      process.exit(1);
    }
  }
}

// Criar e iniciar servidor
const server = new PowerClashServer();

// Tratamento de sinais para shutdown gracioso
process.on('SIGTERM', () => {
  server.gracefulShutdown();
});

process.on('SIGINT', () => {
  server.gracefulShutdown();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error(`Erro não capturado: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Promise rejeitada não tratada: ${reason}`);
  process.exit(1);
});

// Iniciar servidor
server.start();

module.exports = server;