import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Settings,
  Notifications,
  Timeline,
  Devices,
  Speed,
  Memory,
  NetworkCheck,
  Storage,
  BugReport,
  Analytics,
  Download,
  Visibility,
  Block,
  PlayArrow,
  Stop,
  Pause
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { io, Socket } from 'socket.io-client';

// Tipos
interface Detection {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
  riskLevel: string;
  recommendation: string;
  status: 'active' | 'resolved';
}

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  lastDetection?: string;
  detectionCount: number;
  lastSeverity?: string;
}

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalDetections: number;
  criticalDetections: number;
  highDetections: number;
  mediumDetections: number;
  lowDetections: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const Dashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    totalDetections: 0,
    criticalDetections: 0,
    highDetections: 0,
    mediumDetections: 0,
    lowDetections: 0,
    systemHealth: 'excellent'
  });
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [detectionDialogOpen, setDetectionDialogOpen] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Cores para diferentes severidades
  const severityColors = {
    critical: '#f44336',
    high: '#ff9800',
    medium: '#ffc107',
    low: '#4caf50'
  };

  // Cores para status de dispositivos
  const deviceStatusColors = {
    online: '#4caf50',
    offline: '#f44336',
    warning: '#ff9800'
  };

  useEffect(() => {
    // Conectar ao WebSocket
    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Conectado ao servidor WebSocket');
    });

    newSocket.on('new_detection', (detection: Detection) => {
      setRecentDetections(prev => [detection, ...prev.slice(0, 9)]);
      updateStats(detection);
    });

    newSocket.on('detection_alert', (detection: Detection) => {
      // Mostrar notificação para administradores
      showNotification(detection);
    });

    setSocket(newSocket);

    // Carregar dados iniciais
    loadInitialData();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Simular carregamento de dados
      const mockStats: DashboardStats = {
        totalDevices: 156,
        onlineDevices: 142,
        totalDetections: 89,
        criticalDetections: 12,
        highDetections: 23,
        mediumDetections: 34,
        lowDetections: 20,
        systemHealth: 'good'
      };

      const mockDetections: Detection[] = [
        {
          id: '1',
          type: 'suspicious_process',
          severity: 'critical',
          details: { processName: 'GameGuardian', pid: 1234 },
          timestamp: new Date().toISOString(),
          riskLevel: 'critical',
          recommendation: 'Encerrar processo imediatamente',
          status: 'active'
        },
        {
          id: '2',
          type: 'memory_anomaly',
          severity: 'high',
          details: { anomalyType: 'memory_injection', address: '0x7f8b4c2a1000' },
          timestamp: new Date(Date.now() - 300000).toISOString(),
          riskLevel: 'high',
          recommendation: 'Investigar modificações na memória',
          status: 'active'
        }
      ];

      const mockDevices: Device[] = [
        { id: '1', name: 'Samsung Galaxy S23', status: 'online', detectionCount: 5, lastSeverity: 'high' },
        { id: '2', name: 'iPhone 15 Pro', status: 'online', detectionCount: 2, lastSeverity: 'medium' },
        { id: '3', name: 'Google Pixel 8', status: 'warning', detectionCount: 8, lastSeverity: 'critical' }
      ];

      setStats(mockStats);
      setRecentDetections(mockDetections);
      setDevices(mockDevices);

      // Gerar dados em tempo real para gráficos
      generateRealTimeData();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const generateRealTimeData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        detections: Math.floor(Math.random() * 10),
        threats: Math.floor(Math.random() * 5),
        performance: 85 + Math.random() * 15
      });
    }
    
    setRealTimeData(data);
  };

  const updateStats = (detection: Detection) => {
    setStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      [`${detection.severity}Detections`]: prev[`${detection.severity}Detections` as keyof DashboardStats] as number + 1
    }));
  };

  const showNotification = (detection: Detection) => {
    // Implementar notificação push ou toast
    console.log('Nova detecção:', detection);
  };

  const handleScanStart = () => {
    setIsScanning(true);
    // Implementar início do scan
    setTimeout(() => setIsScanning(false), 5000);
  };

  const handleDetectionClick = (detection: Detection) => {
    setSelectedDetection(detection);
    setDetectionDialogOpen(true);
  };

  const handleDetectionResolve = async (detectionId: string) => {
    try {
      // Implementar resolução da detecção
      setRecentDetections(prev => 
        prev.map(d => d.id === detectionId ? { ...d, status: 'resolved' as const } : d)
      );
      setDetectionDialogOpen(false);
    } catch (error) {
      console.error('Erro ao resolver detecção:', error);
    }
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    // Implementar exportação de relatório
    console.log(`Exportando relatório em ${format.toUpperCase()}`);
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle />;
      case 'good': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <Info />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🛡️ PowerClash Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadInitialData}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            color={isScanning ? 'secondary' : 'primary'}
            startIcon={isScanning ? <CircularProgress size={20} /> : <PlayArrow />}
            onClick={handleScanStart}
            disabled={isScanning}
          >
            {isScanning ? 'Escaneando...' : 'Iniciar Scan'}
          </Button>
        </Box>
      </Box>

      {/* Alertas Críticos */}
      {stats.criticalDetections > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              Ver Detalhes
            </Button>
          }
        >
          <strong>Alerta Crítico:</strong> {stats.criticalDetections} detecções críticas ativas requerem atenção imediata!
        </Alert>
      )}

      {/* Estatísticas Principais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Dispositivos Ativos
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.onlineDevices}/{stats.totalDevices}
                    </Typography>
                  </Box>
                  <Devices sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Detecções
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.totalDetections}
                    </Typography>
                  </Box>
                  <Security sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Saúde do Sistema
                    </Typography>
                    <Typography variant="h6" component="div" sx={{ color: getSystemHealthColor(stats.systemHealth) }}>
                      {stats.systemHealth.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ color: getSystemHealthColor(stats.systemHealth) }}>
                    {getSystemHealthIcon(stats.systemHealth)}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Performance
                    </Typography>
                    <Typography variant="h4" component="div">
                      98%
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Gráficos e Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detecções em Tempo Real (Últimas 24h)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="detections" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="threats" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição por Severidade
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Crítico', value: stats.criticalDetections, color: severityColors.critical },
                    { name: 'Alto', value: stats.highDetections, color: severityColors.high },
                    { name: 'Médio', value: stats.mediumDetections, color: severityColors.medium },
                    { name: 'Baixo', value: stats.lowDetections, color: severityColors.low }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {[
                    { name: 'Crítico', value: stats.criticalDetections, color: severityColors.critical },
                    { name: 'Alto', value: stats.highDetections, color: severityColors.high },
                    { name: 'Médio', value: stats.mediumDetections, color: severityColors.medium },
                    { name: 'Baixo', value: stats.lowDetections, color: severityColors.low }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detecções Recentes e Dispositivos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Detecções Recentes
              </Typography>
              <Button size="small" onClick={() => exportReport('pdf')}>
                Exportar PDF
              </Button>
            </Box>
            <List>
              {recentDetections.map((detection, index) => (
                <React.Fragment key={detection.id}>
                  <ListItem 
                    button 
                    onClick={() => handleDetectionClick(detection)}
                    sx={{ 
                      borderLeft: `4px solid ${severityColors[detection.severity]}`,
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      <Badge badgeContent={detection.severity === 'critical' ? '!' : ''} color="error">
                        <Security sx={{ color: severityColors[detection.severity] }} />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={detection.type.replace('_', ' ').toUpperCase()}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(detection.timestamp).toLocaleString('pt-BR')}
                          </Typography>
                          <Chip 
                            label={detection.severity.toUpperCase()} 
                            size="small" 
                            sx={{ 
                              backgroundColor: severityColors[detection.severity],
                              color: 'white',
                              mt: 0.5
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentDetections.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status dos Dispositivos
            </Typography>
            <List>
              {devices.map((device, index) => (
                <React.Fragment key={device.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: deviceStatusColors[device.status]
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={device.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Status: {device.status}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Detecções: {device.detectionCount}
                          </Typography>
                          {device.lastSeverity && (
                            <Chip 
                              label={device.lastSeverity.toUpperCase()} 
                              size="small" 
                              sx={{ 
                                backgroundColor: severityColors[device.lastSeverity as keyof typeof severityColors],
                                color: 'white',
                                mt: 0.5
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < devices.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Detalhes da Detecção */}
      <Dialog 
        open={detectionDialogOpen} 
        onClose={() => setDetectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1, color: selectedDetection ? severityColors[selectedDetection.severity] : 'inherit' }} />
            Detalhes da Detecção
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDetection && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tipo: {selectedDetection.type.replace('_', ' ').toUpperCase()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Severidade: 
                <Chip 
                  label={selectedDetection.severity.toUpperCase()} 
                  sx={{ 
                    backgroundColor: severityColors[selectedDetection.severity],
                    color: 'white',
                    ml: 1
                  }}
                />
              </Typography>
              <Typography variant="body1" gutterBottom>
                Nível de Risco: {selectedDetection.riskLevel}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Recomendação: {selectedDetection.recommendation}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Timestamp: {new Date(selectedDetection.timestamp).toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Status: {selectedDetection.status}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Detalhes Técnicos:
                </Typography>
                <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(selectedDetection.details, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetectionDialogOpen(false)}>
            Fechar
          </Button>
          {selectedDetection?.status === 'active' && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => handleDetectionResolve(selectedDetection.id)}
            >
              Marcar como Resolvida
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;