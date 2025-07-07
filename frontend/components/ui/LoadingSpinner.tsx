import React from 'react';
import { Loader2, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'bounce' | 'heartbeat';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const getSpinnerIcon = () => {
    switch (variant) {
      case 'heartbeat':
        return <Heart className={`${sizeClasses[size]} animate-pulse text-red-500`} />;
      case 'bounce':
        return <Sparkles className={`${sizeClasses[size]} animate-bounce text-blue-500`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {getSpinnerIcon()}
      {text && (
        <p className="mt-3 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <LoadingSpinner size="xl" variant="default" />
      </div>
    </div>
  );
} 