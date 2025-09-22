'use client';

import { ReactNode, useMemo } from 'react';

interface SafeTextProps {
  children: unknown;
  fallback?: string;
  className?: string;
}

export function SafeText({ children, fallback = '', className }: SafeTextProps) {
  const safeContent = useMemo(() => {
    if (children === null || children === undefined) {
      return fallback;
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    if (typeof children === 'number') {
      return children.toString();
    }
    
    if (typeof children === 'boolean') {
      return children.toString();
    }
    
    if (Array.isArray(children)) {
      return children.join(' ');
    }
    
    try {
      return String(children);
    } catch (error) {
      console.warn('SafeText: Failed to convert to string:', error);
      return fallback;
    }
  }, [children, fallback]);

  return <span className={className}>{safeContent}</span>;
}

export function SafeDiv({ children, fallback = '', className, ...props }: SafeTextProps & React.HTMLAttributes<HTMLDivElement>) {
  const safeContent = useMemo(() => {
    if (children === null || children === undefined) {
      return fallback;
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    try {
      return String(children);
    } catch (error) {
      console.warn('SafeDiv: Failed to convert to string:', error);
      return fallback;
    }
  }, [children, fallback]);

  return <div className={className} {...props}>{safeContent}</div>;
}

// Utility function for safe text conversion
export function toSafeText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  try {
    return String(value);
  } catch (error) {
    console.warn('toSafeText: Failed to convert to string:', error);
    return fallback;
  }
}
