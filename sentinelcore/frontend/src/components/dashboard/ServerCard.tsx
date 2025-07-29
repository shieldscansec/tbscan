import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Users, 
  Cpu, 
  MemoryStick,
  Settings,
  MoreVertical,
  Activity
} from 'lucide-react';
import classNames from 'classnames';

import Button from '../ui/Button';

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    description?: string;
    status: 'running' | 'stopped' | 'starting' | 'stopping' | 'crashed';
    type: string;
    ip: string;
    port: number;
    currentPlayers: number;
    maxPlayers: number;
    uptime?: string;
    resourceUsage?: {
      cpu: number;
      memory: number;
      disk: number;
    };
  };
  onAction: (serverId: string, action: 'start' | 'stop' | 'restart') => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onAction }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-success-400 bg-success-500/20';
      case 'stopped':
        return 'text-gray-400 bg-gray-500/20';
      case 'starting':
      case 'stopping':
        return 'text-warning-400 bg-warning-500/20';
      case 'crashed':
        return 'text-error-400 bg-error-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'Online';
      case 'stopped':
        return 'Parado';
      case 'starting':
        return 'Iniciando...';
      case 'stopping':
        return 'Parando...';
      case 'crashed':
        return 'Crashou';
      default:
        return 'Desconhecido';
    }
  };

  const canStart = ['stopped', 'crashed'].includes(server.status);
  const canStop = ['running'].includes(server.status);
  const canRestart = ['running'].includes(server.status);
  const isTransitioning = ['starting', 'stopping'].includes(server.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass rounded-lg p-4 border border-gray-700 hover:border-primary-500/50 transition-all"
    >
      <div className="flex items-center justify-between">
        {/* Server Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{server.name}</h3>
            <span className={classNames(
              'px-2 py-1 rounded-full text-xs font-medium',
              getStatusColor(server.status)
            )}>
              {getStatusLabel(server.status)}
            </span>
          </div>
          
          {server.description && (
            <p className="text-gray-400 text-sm mb-2">{server.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>{server.ip}:{server.port}</span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {server.currentPlayers}/{server.maxPlayers}
            </span>
            {server.uptime && (
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {server.uptime}
              </span>
            )}
          </div>
        </div>

        {/* Resource Usage */}
        {server.resourceUsage && (
          <div className="flex items-center gap-4 mx-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Cpu className="w-3 h-3" />
                CPU
              </div>
              <div className="text-sm font-medium text-white">
                {server.resourceUsage.cpu}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <MemoryStick className="w-3 h-3" />
                RAM
              </div>
              <div className="text-sm font-medium text-white">
                {server.resourceUsage.memory}%
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              variant="success"
              size="sm"
              icon={<Play className="w-4 h-4" />}
              onClick={() => onAction(server.id, 'start')}
              disabled={isTransitioning}
            >
              Iniciar
            </Button>
          )}
          
          {canStop && (
            <Button
              variant="danger"
              size="sm"
              icon={<Square className="w-4 h-4" />}
              onClick={() => onAction(server.id, 'stop')}
              disabled={isTransitioning}
            >
              Parar
            </Button>
          )}
          
          {canRestart && (
            <Button
              variant="warning"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => onAction(server.id, 'restart')}
              disabled={isTransitioning}
            >
              Reiniciar
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => window.location.href = `/servers/${server.id}`}
          >
            Gerenciar
          </Button>
        </div>
      </div>

      {/* Progress bar for resource usage */}
      {server.resourceUsage && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Uso de Recursos</span>
            <span className="text-gray-400">
              CPU: {server.resourceUsage.cpu}% | 
              RAM: {server.resourceUsage.memory}% | 
              Disk: {server.resourceUsage.disk}%
            </span>
          </div>
          
          <div className="flex gap-2">
            {/* CPU Bar */}
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={classNames(
                    'h-2 rounded-full transition-all',
                    server.resourceUsage.cpu > 80 ? 'bg-error-500' :
                    server.resourceUsage.cpu > 60 ? 'bg-warning-500' :
                    'bg-success-500'
                  )}
                  style={{ width: `${server.resourceUsage.cpu}%` }}
                />
              </div>
            </div>
            
            {/* Memory Bar */}
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={classNames(
                    'h-2 rounded-full transition-all',
                    server.resourceUsage.memory > 80 ? 'bg-error-500' :
                    server.resourceUsage.memory > 60 ? 'bg-warning-500' :
                    'bg-primary-500'
                  )}
                  style={{ width: `${server.resourceUsage.memory}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ServerCard;