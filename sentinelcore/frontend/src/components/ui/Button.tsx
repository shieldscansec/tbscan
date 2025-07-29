import React from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  glow = false,
  className,
  ...props
}) => {
  const baseClasses = [
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-gray-900',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'overflow-hidden',
  ];

  const variantClasses = {
    primary: [
      'bg-gradient-to-r',
      'from-primary-500',
      'to-secondary-500',
      'text-white',
      'border',
      'border-primary-400',
      'hover:from-primary-400',
      'hover:to-secondary-400',
      'focus:ring-primary-500',
      glow && 'shadow-neon',
    ],
    secondary: [
      'bg-gradient-to-r',
      'from-gray-700',
      'to-gray-600',
      'text-white',
      'border',
      'border-gray-600',
      'hover:from-gray-600',
      'hover:to-gray-500',
      'focus:ring-gray-500',
    ],
    danger: [
      'bg-gradient-to-r',
      'from-error-500',
      'to-red-600',
      'text-white',
      'border',
      'border-error-400',
      'hover:from-error-400',
      'hover:to-red-500',
      'focus:ring-error-500',
    ],
    success: [
      'bg-gradient-to-r',
      'from-success-500',
      'to-green-600',
      'text-white',
      'border',
      'border-success-400',
      'hover:from-success-400',
      'hover:to-green-500',
      'focus:ring-success-500',
    ],
    warning: [
      'bg-gradient-to-r',
      'from-warning-500',
      'to-yellow-600',
      'text-white',
      'border',
      'border-warning-400',
      'hover:from-warning-400',
      'hover:to-yellow-500',
      'focus:ring-warning-500',
    ],
    ghost: [
      'bg-transparent',
      'text-gray-300',
      'border',
      'border-gray-600',
      'hover:bg-gray-800',
      'hover:text-white',
      'focus:ring-gray-500',
    ],
  };

  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs'],
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-4', 'py-2', 'text-sm'],
    lg: ['px-6', 'py-3', 'text-base'],
    xl: ['px-8', 'py-4', 'text-lg'],
  };

  const widthClasses = fullWidth ? ['w-full'] : [];

  const buttonClasses = classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  );

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {/* Background glow effect */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-20 blur-lg -z-10" />
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className={classNames('flex items-center gap-2', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {children && <span>{children}</span>}
        
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </motion.button>
  );
};

export default Button;