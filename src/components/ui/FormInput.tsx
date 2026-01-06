import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
}

/**
 * Reusable Form Input Component
 * 
 * Features:
 * - Error and success states
 * - Password visibility toggle
 * - Left/right icons
 * - Helper text
 * - Multiple sizes
 * - Full accessibility support
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      success,
      size = 'md',
      leftIcon,
      rightIcon,
      showPasswordToggle,
      containerClassName = '',
      labelClassName = '',
      required,
      type = 'text',
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const getInputClasses = () => {
      const baseClasses = `
        w-full rounded-lg border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
        ${sizeClasses[size]}
        ${leftIcon ? 'pl-10' : ''}
        ${rightIcon || showPasswordToggle ? 'pr-10' : ''}
      `;

      if (error) {
        return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50`;
      }

      if (success) {
        return `${baseClasses} border-green-500 focus:border-green-500 focus:ring-green-200 bg-green-50`;
      }

      return `${baseClasses} border-gray-300 focus:border-amber-500 focus:ring-amber-200 bg-white`;
    };

    const actualType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1.5 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`${getInputClasses()} ${className}`}
            {...props}
          />

          {/* Right Icon / Password Toggle */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {error && !showPasswordToggle && (
              <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
            )}
            {success && !error && !showPasswordToggle && (
              <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
            )}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            )}
            {rightIcon && !showPasswordToggle && !error && !success && rightIcon}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
