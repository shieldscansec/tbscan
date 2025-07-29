import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
  twoFactorCode?: string;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Handle lockout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  const onSubmit = async (data: LoginFormData) => {
    if (isLocked) {
      toast.error(`Conta bloqueada. Tente novamente em ${Math.ceil(lockoutTime / 60)} minutos.`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email: data.email,
        password: data.password,
        twoFactorCode: data.twoFactorCode,
        rememberMe: data.rememberMe,
      });

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.success('Código 2FA enviado para seu dispositivo');
      } else {
        toast.success('Login realizado com sucesso!');
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(15 * 60); // 15 minutes
        toast.error('Muitas tentativas de login. Conta bloqueada por 15 minutos.');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
        if (newAttempts >= 3) {
          toast.warning(`Atenção: ${5 - newAttempts} tentativas restantes`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Helmet>
        <title>Login - SentinelCore</title>
        <meta name="description" content="Faça login no SentinelCore - Painel de Gerenciamento SA-MP da Shield Scan Security" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary-500 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-secondary-500 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-accent-500 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

        <motion.div
          className="max-w-md w-full space-y-8 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div className="text-center" variants={itemVariants}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-neon">
                  <ShieldCheckIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 text-shadow-lg">
              Sentinel<span className="text-primary-500">Core</span>
            </h1>
            <p className="text-gray-300 text-lg">Shield Scan Security</p>
            <p className="text-gray-400 mt-2">Painel de Gerenciamento SA-MP</p>
          </motion.div>

          {/* Login Form */}
          <motion.div
            className="glass rounded-2xl p-8 shadow-glass"
            variants={itemVariants}
          >
            {isLocked && (
              <motion.div
                className="mb-6 p-4 bg-error-500/10 border border-error-500/20 rounded-lg flex items-center space-x-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-error-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-error-400 text-sm font-medium">Conta Temporariamente Bloqueada</p>
                  <p className="text-error-300 text-xs mt-1">
                    Tempo restante: {formatTime(lockoutTime)}
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  icon={<UserIcon className="w-5 h-5" />}
                  error={errors.email?.message}
                  disabled={isLoading || isLocked}
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                />
              </div>

              <div>
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<LockClosedIcon className="w-5 h-5" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  }
                  error={errors.password?.message}
                  disabled={isLoading || isLocked}
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres',
                    },
                  })}
                />
              </div>

              {requiresTwoFactor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Código 2FA"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    error={errors.twoFactorCode?.message}
                    disabled={isLoading}
                    {...register('twoFactorCode', {
                      required: requiresTwoFactor ? 'Código 2FA é obrigatório' : false,
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Código deve ter 6 dígitos',
                      },
                    })}
                  />
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-800"
                    disabled={isLoading || isLocked}
                    {...register('rememberMe')}
                  />
                  <span className="ml-2 text-sm text-gray-300">Lembrar-me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || isLocked}
                className="relative overflow-hidden group"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
              <motion.div
                className="mt-4 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-warning-400 text-sm text-center">
                  {loginAttempts === 1 && 'Primeira tentativa de login incorreta'}
                  {loginAttempts === 2 && 'Segunda tentativa incorreta'}
                  {loginAttempts === 3 && 'Atenção: 2 tentativas restantes'}
                  {loginAttempts === 4 && 'ÚLTIMA TENTATIVA - Conta será bloqueada'}
                </p>
              </motion.div>
            )}

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  Cadastre-se aqui
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div className="text-center text-gray-500 text-sm" variants={itemVariants}>
            <p>© 2024 Shield Scan Security</p>
            <p className="mt-1">Máxima Segurança • Zero Vulnerabilidades</p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;