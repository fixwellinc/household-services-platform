// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  SALESMAN = 'SALESMAN',
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
  STARTER = 'STARTER',
  HOMECARE = 'HOMECARE',
  PRIORITY = 'PRIORITY'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  PAUSED = 'PAUSED',
  INCOMPLETE = 'INCOMPLETE',
  EXPIRED = 'EXPIRED'
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

// Salesman Employee System Types
export interface SalesmanProfile {
  id: string;
  userId: string;
  referralCode: string;
  displayName: string;
  personalMessage?: string;
  commissionRate: number;
  commissionType: CommissionType;
  commissionTier: CommissionTier;
  territoryPostalCodes: string[];
  territoryRegions: string[];
  monthlyTarget: number;
  quarterlyTarget: number;
  yearlyTarget: number;
  status: SalesmanStatus;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED'
}

export enum CommissionTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export enum SalesmanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface CustomerReferral {
  id: string;
  customerId: string;
  salesmanId: string;
  referralCode: string;
  referralSource: ReferralSource;
  referralDate: Date;
  conversionDate?: Date;
  subscriptionId?: string;
  commissionEarned: number;
  status: ReferralStatus;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReferralSource {
  DIRECT_LINK = 'DIRECT_LINK',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL = 'SOCIAL'
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED'
}

export interface CommissionTransaction {
  id: string;
  salesmanId: string;
  customerId: string;
  referralId: string;
  transactionType: CommissionTransactionType;
  amount: number;
  currency: string;
  periodStart?: Date;
  periodEnd?: Date;
  status: CommissionTransactionStatus;
  paymentDate?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum CommissionTransactionType {
  SIGNUP = 'SIGNUP',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  BONUS = 'BONUS'
}

export enum CommissionTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

// Salesman Dashboard Types
export interface SalesmanDashboard {
  overview: SalesmanOverview;
  customers: CustomerSummary[];
  performance: SalesmanPerformance;
}

export interface SalesmanOverview {
  totalReferrals: number;
  activeCustomers: number;
  monthlyAcquisitions: number;
  totalCommission: number;
  performanceRating: PerformanceRating;
}

export enum PerformanceRating {
  POOR = 'POOR',
  AVERAGE = 'AVERAGE',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: CustomerStatus;
  subscriptionTier?: SubscriptionTier;
  joinDate: Date;
  lastActivity: Date;
  totalValue: number;
  commissionEarned: number;
  nextPaymentDate?: Date;
  riskScore?: number;
}

export enum CustomerStatus {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export interface SalesmanPerformance {
  acquisitionMetrics: AcquisitionMetrics;
  revenueMetrics: RevenueMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface AcquisitionMetrics {
  totalReferrals: number;
  conversionRate: number;
  averageTimeToConversion: number;
  topReferralSources: ReferralSourceStats[];
}

export interface ReferralSourceStats {
  source: string;
  count: number;
  conversionRate: number;
}

export interface RevenueMetrics {
  totalCommissionEarned: number;
  monthlyRecurringRevenue: number;
  averageCustomerValue: number;
  customerLifetimeValue: number;
}

export interface PerformanceMetrics {
  targetProgress: TargetProgress;
  ranking: SalesmanRanking;
}

export interface TargetProgress {
  monthly: TargetMetric;
  quarterly: TargetMetric;
  yearly: TargetMetric;
}

export interface TargetMetric {
  achieved: number;
  target: number;
  percentage: number;
}

export interface SalesmanRanking {
  position: number;
  totalSalesmen: number;
  percentile: number;
}

// API Request Types
export interface CreateSalesmanRequest {
  userId: string;
  displayName: string;
  personalMessage?: string;
  commissionRate: number;
  commissionType: CommissionType;
  commissionTier: CommissionTier;
  territoryPostalCodes?: string[];
  territoryRegions?: string[];
  monthlyTarget?: number;
  quarterlyTarget?: number;
  yearlyTarget?: number;
}

export interface UpdateSalesmanRequest {
  displayName?: string;
  personalMessage?: string;
  commissionRate?: number;
  commissionType?: CommissionType;
  commissionTier?: CommissionTier;
  territoryPostalCodes?: string[];
  territoryRegions?: string[];
  monthlyTarget?: number;
  quarterlyTarget?: number;
  yearlyTarget?: number;
  status?: SalesmanStatus;
}

export interface RegisterWithReferralRequest extends RegisterRequest {
  referralCode?: string;
  referralSource?: ReferralSource;
} 