import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ServersPage from './pages/servers/ServersPage';
import ServerDetailPage from './pages/servers/ServerDetailPage';
import FilesPage from './pages/files/FilesPage';
import LogsPage from './pages/logs/LogsPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './styles/globals.css';
import './styles/animations.css';
import './styles/glassmorphism.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  useEffect(() => {
    // Set app theme
    document.documentElement.classList.add('dark');
    
    // Prevent right-click context menu in production
    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Add custom CSS variables for theme
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#00d4ff');
    root.style.setProperty('--secondary-color', '#0099cc');
    root.style.setProperty('--accent-color', '#ff6b6b');
    root.style.setProperty('--success-color', '#00ff88');
    root.style.setProperty('--warning-color', '#ffaa00');
    root.style.setProperty('--error-color', '#ff4757');
    root.style.setProperty('--background-dark', '#0a0a0a');
    root.style.setProperty('--background-darker', '#050505');
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <Router>
                  <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                    {/* Background Effects */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                      <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                    </div>

                    {/* Routes */}
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

                      {/* Protected Routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/servers"
                        element={
                          <ProtectedRoute>
                            <ServersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/servers/:id"
                        element={
                          <ProtectedRoute>
                            <ServerDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/files/:serverId?"
                        element={
                          <ProtectedRoute>
                            <FilesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/logs/:serverId?"
                        element={
                          <ProtectedRoute>
                            <LogsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Default Redirects */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>

                    {/* Global Components */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(10px)',
                        },
                        success: {
                          iconTheme: {
                            primary: '#00ff88',
                            secondary: '#000',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: '#ff4757',
                            secondary: '#000',
                          },
                        },
                      }}
                    />
                  </div>
                </Router>
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;