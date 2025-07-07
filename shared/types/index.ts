// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID'
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  complexity: ServiceComplexity;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceCategory {
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  ORGANIZATION = 'ORGANIZATION',
  SHOPPING = 'SHOPPING',
  OTHER = 'OTHER'
}

export enum ServiceComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX'
}

// Booking types
export interface Booking {
  id: string;
  customerId: string;
  customer: User;
  serviceId: string;
  service: Service;
  scheduledDate: Date;
  status: BookingStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Message types
export interface Message {
  id: string;
  bookingId: string;
  booking: Booking;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Service request types
export interface CreateServiceRequest {
  name: string;
  description: string;
  category: ServiceCategory;
  complexity: ServiceComplexity;
  basePrice: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  complexity?: ServiceComplexity;
  basePrice?: number;
  isActive?: boolean;
}

// Booking request types
export interface CreateBookingRequest {
  serviceId: string;
  scheduledDate: string;
  notes?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}

// Message request types
export interface SendMessageRequest {
  bookingId: string;
  receiverId: string;
  content: string;
}

// Quote types
export interface Quote {
  id: string;
  userId?: string;
  email: string;
  serviceId?: string;
  message: string;
  status: QuoteStatus;
  adminReply?: string;
  adminReplyPrice?: number;
  adminReplySentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  REPLIED = 'REPLIED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
}

export interface CreateQuoteRequest {
  email: string;
  serviceId?: string;
  message: string;
}

export interface QuoteReplyRequest {
  adminReply: string;
  adminReplyPrice?: number;
} 