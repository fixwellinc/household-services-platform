"use client";

import React from 'react';
import { Loader2, RefreshCw, Database, Wifi, FileText, Settings } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  className?: string;
  variant?: 'default' | 'data' | 'network' | 'processing' | 'settings';
}

export function AdminLoadingSpinner({
  size = 'md',
  text,
  overlay = false,
  className = '',
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const getIcon = () => {
    switch (variant) {
      case 'data':
        return <Database className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
      case 'network':
        return <Wifi className={`${sizeClasses[size]} animate-pulse text-green-600`} />;
      case 'processing':
        return <FileText className={`${sizeClasses[size]} animate-bounce text-purple-600`} />;
      case 'settings':
        return <Settings className={`${sizeClasses[size]} animate-spin text-gray-600`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
    }
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        {text && (
          <span className="text-sm text-gray-600">{text}</span>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

// Action Loading Spinner (for buttons)
export function AdminActionSpinner({
  size = 'sm',
  text,
  className = ''
}: Omit<LoadingSpinnerProps, 'overlay' | 'variant'>) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

// Navigation Loading Spinner
export function AdminNavigationSpinner() {
  return (
    <div className="flex items-center justify-center p-2">
      <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
    </div>
  );
}

// Inline Loading Spinner (for small components)
export function AdminInlineSpinner({ 
  text, 
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}

// Page Loading Overlay
export function AdminPageLoadingOverlay({ 
  message = "Loading page..." 
}: { 
  message?: string; 
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}