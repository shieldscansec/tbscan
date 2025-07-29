import React from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const baseClasses = classNames(
    'inline-block',
    sizeClasses[size],
    colorClasses[color],
    className
  );

  if (variant === 'spinner') {
    return (
      <motion.div
        className={classNames(baseClasses, 'border-2 border-current border-t-transparent rounded-full')}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={classNames('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={classNames(
              'rounded-full bg-current',
              size === 'xs' ? 'w-1 h-1' : 
              size === 'sm' ? 'w-1.5 h-1.5' :
              size === 'md' ? 'w-2 h-2' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
              colorClasses[color]
            )}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={classNames(baseClasses, 'rounded-full bg-current')}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    );
  }

  if (variant === 'bars') {
    return (
      <div className={classNames('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={classNames(
              'bg-current',
              size === 'xs' ? 'w-0.5 h-3' :
              size === 'sm' ? 'w-0.5 h-4' :
              size === 'md' ? 'w-1 h-6' :
              size === 'lg' ? 'w-1 h-8' : 'w-1.5 h-12',
              colorClasses[color]
            )}
            animate={{ scaleY: [1, 2, 1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;