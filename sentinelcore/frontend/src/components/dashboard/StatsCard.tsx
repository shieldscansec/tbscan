import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import classNames from 'classnames';

import LoadingSpinner from '../ui/LoadingSpinner';

interface StatsCardProps {
  title: string;
  value: string | number;
  total?: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  total,
  icon,
  color,
  trend,
  loading = false,
}) => {
  const colorClasses = {
    primary: {
      bg: 'from-primary-500/20 to-primary-600/20',
      border: 'border-primary-500/30',
      icon: 'text-primary-400',
      glow: 'shadow-primary-500/20',
    },
    secondary: {
      bg: 'from-secondary-500/20 to-secondary-600/20',
      border: 'border-secondary-500/30',
      icon: 'text-secondary-400',
      glow: 'shadow-secondary-500/20',
    },
    success: {
      bg: 'from-success-500/20 to-success-600/20',
      border: 'border-success-500/30',
      icon: 'text-success-400',
      glow: 'shadow-success-500/20',
    },
    warning: {
      bg: 'from-warning-500/20 to-warning-600/20',
      border: 'border-warning-500/30',
      icon: 'text-warning-400',
      glow: 'shadow-warning-500/20',
    },
    error: {
      bg: 'from-error-500/20 to-error-600/20',
      border: 'border-error-500/30',
      icon: 'text-error-400',
      glow: 'shadow-error-500/20',
    },
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-error-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-400';
    
    switch (trend.direction) {
      case 'up':
        return 'text-success-400';
      case 'down':
        return 'text-error-400';
      case 'stable':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={classNames(
        'relative overflow-hidden rounded-xl p-6 border backdrop-blur-sm',
        `bg-gradient-to-br ${colorClasses[color].bg}`,
        colorClasses[color].border,
        `shadow-lg ${colorClasses[color].glow}`,
        'hover:shadow-xl transition-all duration-300'
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={classNames('p-2 rounded-lg bg-white/10', colorClasses[color].icon)}>
            {icon}
          </div>
          
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={classNames('text-sm font-medium', getTrendColor())}>
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
            {title}
          </h3>
          
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" color="white" />
              <span className="text-gray-400">Carregando...</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {total !== undefined && (
                <span className="text-lg text-gray-400">
                  / {total.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar (if total is provided) */}
        {total !== undefined && !loading && typeof value === 'number' && (
          <div className="mt-4">
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((value / total) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={classNames(
                  'h-2 rounded-full',
                  color === 'primary' ? 'bg-primary-500' :
                  color === 'secondary' ? 'bg-secondary-500' :
                  color === 'success' ? 'bg-success-500' :
                  color === 'warning' ? 'bg-warning-500' :
                  'bg-error-500'
                )}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Trend Description */}
        {trend && !loading && (
          <div className="mt-3 text-xs text-gray-400">
            <span>
              {trend.direction === 'up' ? 'Aumento' : 
               trend.direction === 'down' ? 'Diminuição' : 
               'Estável'} de {Math.abs(trend.value)}% nas últimas 24h
            </span>
          </div>
        )}
      </div>

      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className={classNames(
          'absolute inset-0 rounded-xl border-2',
          color === 'primary' ? 'border-primary-500/50' :
          color === 'secondary' ? 'border-secondary-500/50' :
          color === 'success' ? 'border-success-500/50' :
          color === 'warning' ? 'border-warning-500/50' :
          'border-error-500/50'
        )} />
      </div>
    </motion.div>
  );
};

export default StatsCard;