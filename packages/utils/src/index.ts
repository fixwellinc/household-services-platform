// Shared utilities for Fixwell Services Platform

import { ServiceCategory, ServiceComplexity, BookingStatus } from '@fixwell/types';

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isFutureDate = (date: Date | string): boolean => {
  return new Date(date) > new Date();
};

// Price utilities
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export const calculateDiscount = (originalPrice: number, discountPercentage: number): number => {
  return (originalPrice * discountPercentage) / 100;
};

export const calculateFinalPrice = (originalPrice: number, discountAmount: number): number => {
  return Math.max(0, originalPrice - discountAmount);
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Array utilities
export const groupBy = <T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Service utilities
export const getServiceCategoryLabel = (category: ServiceCategory): string => {
  const labels: Record<ServiceCategory, string> = {
    CLEANING: 'Cleaning',
    MAINTENANCE: 'Maintenance',
    REPAIR: 'Repair',
    ORGANIZATION: 'Organization',
    OTHER: 'Other'
  };
  return labels[category] || category;
};

export const getServiceComplexityLabel = (complexity: ServiceComplexity): string => {
  const labels: Record<ServiceComplexity, string> = {
    SIMPLE: 'Simple',
    MODERATE: 'Moderate',
    COMPLEX: 'Complex'
  };
  return labels[complexity] || complexity;
};

export const getBookingStatusLabel = (status: BookingStatus): string => {
  const labels: Record<BookingStatus, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  };
  return labels[status] || status;
};

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

// Error utilities
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

export const isApiError = (error: any): boolean => {
  return error && typeof error.message === 'string' && error.statusCode;
};

// API utilities
export const createApiResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    message
  };
};

export const createApiError = (message: string, code?: string) => {
  return {
    success: false,
    error: message,
    code
  };
}; 