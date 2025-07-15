// Shared types for Fixwell Services Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'BASIC' | 'PLUS' | 'PREMIER';
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  serviceId: string;
  scheduledDate: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
  };
  createdAt: string;
}

export interface Quote {
  id: string;
  email: string;
  message: string;
  userId?: string;
  serviceId?: string;
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  reply?: string;
  price?: number;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  SERVICES: {
    LIST: '/services',
    DETAIL: (id: string) => `/services/${id}`,
    CREATE: '/services',
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
  },
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id: string) => `/bookings/${id}`,
    CREATE: '/bookings',
    UPDATE: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
  },
  QUOTES: {
    LIST: '/quotes',
    SUBMIT: '/quotes/submit',
    REPLY: (id: string) => `/quotes/${id}/reply`,
  },
  HEALTH: '/health',
} as const;

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
}

// Service categories
export const SERVICE_CATEGORIES = [
  'CLEANING',
  'MAINTENANCE', 
  'REPAIR',
  'ORGANIZATION',
  'SHOPPING',
  'OTHER'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

// Service complexity levels
export const SERVICE_COMPLEXITY = [
  'SIMPLE',
  'MODERATE',
  'COMPLEX'
] as const;

export type ServiceComplexity = typeof SERVICE_COMPLEXITY[number];

// Booking statuses
export const BOOKING_STATUS = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
] as const;

export type BookingStatus = typeof BOOKING_STATUS[number]; 