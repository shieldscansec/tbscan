import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'filled' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      rightElement,
      variant = 'default',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'w-full',
      'rounded-lg',
      'border',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-offset-gray-900',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      default: [
        'bg-gray-800',
        'border-gray-600',
        'text-white',
        'placeholder-gray-400',
        'focus:border-primary-500',
        'focus:ring-primary-500',
        error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '',
      ],
      filled: [
        'bg-gray-700',
        'border-transparent',
        'text-white',
        'placeholder-gray-400',
        'focus:bg-gray-800',
        'focus:border-primary-500',
        'focus:ring-primary-500',
        error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '',
      ],
      glass: [
        'glass',
        'text-white',
        'placeholder-gray-300',
        'focus:border-primary-500',
        'focus:ring-primary-500',
        error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '',
      ],
    };

    const sizeClasses = {
      sm: ['px-3', 'py-2', 'text-sm'],
      md: ['px-4', 'py-2.5', 'text-sm'],
      lg: ['px-4', 'py-3', 'text-base'],
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const inputClasses = classNames(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'pl-10': icon && size === 'sm',
        'pl-11': icon && size === 'md',
        'pl-12': icon && size === 'lg',
        'pr-10': rightElement && size === 'sm',
        'pr-11': rightElement && size === 'md',
        'pr-12': rightElement && size === 'lg',
      },
      className
    );

    const labelClasses = classNames(
      'block',
      'text-sm',
      'font-medium',
      'mb-2',
      error ? 'text-error-400' : 'text-gray-300'
    );

    return (
      <div className="w-full">
        {label && (
          <label className={labelClasses}>
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className={classNames(iconSizeClasses[size], 'text-gray-400')}>
                {icon}
              </div>
            </div>
          )}

          {/* Input field */}
          <motion.input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />

          {/* Right element */}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}

          {/* Focus ring effect */}
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-secondary-500/20 opacity-0 transition-opacity duration-200 focus-within:opacity-100" />
          </div>
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            {error ? (
              <p className="text-sm text-error-400 flex items-center gap-1">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            ) : (
              <p className="text-sm text-gray-400">{helperText}</p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;