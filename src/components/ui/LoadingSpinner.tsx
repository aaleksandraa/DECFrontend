import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

/**
 * Reusable Loading Spinner Component
 * 
 * Features:
 * - Multiple sizes
 * - Optional text
 * - Full screen mode
 * - Overlay mode
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-amber-600 animate-spin`} 
        aria-hidden="true"
      />
      {text && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-white z-50"
        role="status"
        aria-label={text || 'Učitavanje'}
      >
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div 
        className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"
        role="status"
        aria-label={text || 'Učitavanje'}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div role="status" aria-label={text || 'Učitavanje'}>
      {spinner}
    </div>
  );
};

// Skeleton Loading Components
export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({
  className = '',
  animate = true,
  lines = 3,
}) => {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          animate={animate}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({
  className = '',
  animate = true,
}) => {
  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}
      aria-hidden="true"
    >
      <Skeleton animate={animate} className="w-full h-40 rounded-lg mb-4" />
      <Skeleton animate={animate} className="h-6 w-3/4 mb-2" />
      <Skeleton animate={animate} className="h-4 w-1/2 mb-4" />
      <SkeletonText animate={animate} lines={2} />
    </div>
  );
};

export const SkeletonTable: React.FC<SkeletonProps & { rows?: number; cols?: number }> = ({
  className = '',
  animate = true,
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="bg-gray-50 flex gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} animate={animate} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`flex gap-4 p-4 ${rowIndex !== rows - 1 ? 'border-b border-gray-100' : ''}`}
        >
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              animate={animate} 
              className={`h-4 flex-1 ${colIndex === 0 ? 'w-1/4' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
