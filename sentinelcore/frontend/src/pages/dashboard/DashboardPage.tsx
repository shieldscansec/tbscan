import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Activity, 
  Users, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Play,
  Square,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ServerCard from '../../components/dashboard/ServerCard';
import StatsCard from '../../components/dashboard/StatsCard';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentActivity from '../../components/dashboard/RecentActivity';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Fetch servers
  const { data: servers, isLoading: serversLoading, refetch: refetchServers } = useQuery(
    'servers',
    async () => {
      const response = await axios.get('/api/v1/servers');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['dashboard-stats', selectedTimeRange],
    async () => {
      const response = await axios.get(`/api/v1/dashboard/stats?timeRange=${selectedTimeRange}`);
      return response.data;
    },
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useQuery(
    'recent-activity',
    async () => {
      const response = await axios.get('/api/v1/dashboard/activity?limit=10');
      return response.data;
    },
    {
      refetchInterval: 30000,
    }
  );

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      await axios.post(`/api/v1/servers/${serverId}/${action}`);
      toast.success(`Servidor ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso`);
      refetchServers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Erro ao ${action} servidor`);
    }
  };

  const runningServers = servers?.filter((s: any) => s.status === 'running') || [];
  const totalServers = servers?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo, {user?.firstName}!
            </h1>
            <p className="text-gray-300">
              Gerencie seus servidores SA-MP com facilidade e segurança
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {['1h', '24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    selectedTimeRange === range
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => window.location.href = '/servers/new'}
              glow
            >
              Novo Servidor
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatsCard
          title="Servidores Ativos"
          value={runningServers.length}
          total={totalServers}
          icon={<Server className="w-6 h-6" />}
          color="primary"
          trend={stats?.serversTrend}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Jogadores Online"
          value={stats?.totalPlayers || 0}
          icon={<Users className="w-6 h-6" />}
          color="secondary"
          trend={stats?.playersTrend}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Uso de CPU"
          value={`${stats?.avgCpuUsage || 0}%`}
          icon={<Cpu className="w-6 h-6" />}
          color="warning"
          trend={stats?.cpuTrend}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Uso de Memória"
          value={`${stats?.avgMemoryUsage || 0}%`}
          icon={<MemoryStick className="w-6 h-6" />}
          color="error"
          trend={stats?.memoryTrend}
          loading={statsLoading}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Servers List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Server className="w-5 h-5" />
                Meus Servidores
              </h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchServers()}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Atualizar
              </Button>
            </div>

            {serversLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : servers?.length === 0 ? (
              <div className="text-center py-12">
                <Server className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Nenhum servidor encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Crie seu primeiro servidor SA-MP para começar
                </p>
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => window.location.href = '/servers/new'}
                >
                  Criar Servidor
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {servers?.map((server: any) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onAction={handleServerAction}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <RecentActivity 
            activities={activity || []}
            loading={activityLoading}
          />

          {/* System Status */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Status do Sistema
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-success-400 text-sm">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-success-400 text-sm">Conectado</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">WebSocket</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-success-400 text-sm">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;