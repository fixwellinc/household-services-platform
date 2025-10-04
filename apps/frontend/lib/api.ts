// API client for connecting to the backend
// Updated for production deployment with Railway backend
// const API_BASE_URL = '/api';

// Types for API responses
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatar?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  createdAt: string;
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

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// API client class
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Remove duplicate /api if the baseURL already ends with /api and endpoint starts with /api
    const cleanEndpoint = this.baseURL.endsWith('/api') && endpoint.startsWith('/api')
      ? endpoint.slice(4)
      : endpoint;
    const url = `${this.baseURL}${cleanEndpoint}`;

    // API request logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('API request to:', url);
      console.log('Request method:', options.method || 'GET');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Always get the latest token from localStorage
    let token = this.token;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Request headers:', headers);
    }

    try {
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
        credentials: 'include',
        ...options,
      };

      // Ensure method is not overridden by spread
      if (options.method) {
        fetchOptions.method = options.method;
      }

      const response = await fetch(url, fetchOptions);

      if (process.env.NODE_ENV === 'development') {
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Only log errors in development or if they're not authentication-related
        if (process.env.NODE_ENV === 'development' || response.status !== 401) {
          console.error('API error response:', errorData);
        }

        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to continue.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('Resource not found.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('API response data:', data);
      }
      return data;
    } catch (error) {
      // Only log API request failures in development or if they're not authentication-related
      if (process.env.NODE_ENV === 'development' || !(error instanceof Error && error.message?.includes('Authentication required'))) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Set auth token
  setToken = (token: string) => {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Clear auth token
  clearToken = () => {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  register = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    role?: 'CUSTOMER';
    referralCode?: string;
    referralSource?: string;
  }): Promise<AuthResponse> => {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API client login called with data:', data);
    }
    const body = JSON.stringify(data);
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body,
    });
    this.setToken(response.token);
    return response;
  }

  getCurrentUser = async (): Promise<{ user: User }> => {
    return this.request<{ user: User }>('/auth/me');
  }

  logout = async (): Promise<{ message: string }> => {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  // Services endpoints
  getServices = async (params?: {
    category?: string;
    complexity?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
  }): Promise<{ services: Service[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/services?${queryString}` : '/services';
    return this.request<{ services: Service[] }>(endpoint);
  }

  getService = async (id: string): Promise<{ service: Service }> => {
    return this.request<{ service: Service }>(`/services/${id}`);
  }

  createService = async (data: {
    name: string;
    description: string;
    category: string;
    complexity: string;
    basePrice: number;
  }): Promise<{ service: Service }> => {
    return this.request<{ service: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateService = async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      complexity: string;
      basePrice: number;
      isActive: boolean;
    }>
  ): Promise<{ service: Service }> => {
    return this.request<{ service: Service }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteService = async (id: string): Promise<void> => {
    await this.request<void>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings endpoints
  getBookings = async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ bookings: Booking[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
    return this.request<{ bookings: Booking[] }>(endpoint);
  }

  getBooking = async (id: string): Promise<{ booking: Booking }> => {
    return this.request<{ booking: Booking }>(`/bookings/${id}`);
  }

  createBooking = async (data: {
    serviceId: string;
    scheduledDate: string;
    notes?: string;
  }): Promise<{ booking: Booking }> => {
    return this.request<{ booking: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBooking = async (
    id: string,
    data: Partial<{
      status: string;
      scheduledDate: string;
      notes: string;
    }>
  ): Promise<{ booking: Booking }> => {
    return this.request<{ booking: Booking }>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  cancelBooking = async (id: string): Promise<void> => {
    await this.request<void>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  // Health check
  healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Quotes endpoints
  getQuotes = async (): Promise<{ quotes: unknown[] }> => {
    return this.request<{ quotes: unknown[] }>('/quotes');
  }

  replyToQuote = async (id: string, data: { reply: string; price?: number }): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`/quotes/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  submitQuote = async (data: { email: string; message: string; userId?: string; serviceId?: string }): Promise<{ success: boolean; quote: unknown }> => {
    return this.request<{ success: boolean; quote: unknown }>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User self-service endpoints
  updateProfile = async (data: { name?: string; email?: string; phone?: string; avatar?: string; address?: string; postalCode?: string }): Promise<{ user: User }> => {
    return this.request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateNotifications = async (data: { notifications: Record<string, boolean> }): Promise<{ user: User }> => {
    return this.request<{ user: User }>('/users/me/notifications', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteAccount = async (): Promise<{ message: string }> => {
    return this.request<{ message: string }>('/users/me', {
      method: 'DELETE',
    });
  }

  // Plans endpoints
  getPlans = async (): Promise<{
    success: boolean;
    plans: Array<{
      id: string;
      name: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      originalPrice: number;
      stripePriceIds: {
        monthly: string;
        yearly: string;
      };
      features: string[];
      savings: string;
      color: string;
      icon: string;
      popular?: boolean;
    }>;
    userPlan?: {
      tier: string;
      status: string;
      currentPeriodEnd: string;
    };
    message: string;
  }> => {
    return this.request('/subscriptions/plans');
  }

  getPlan = async (planId: string): Promise<{
    success: boolean;
    plan: {
      id: string;
      name: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      originalPrice: number;
      stripePriceIds: {
        monthly: string;
        yearly: string;
      };
      features: string[];
      savings: string;
      color: string;
      icon: string;
      popular?: boolean;
    };
    message: string;
  }> => {
    return this.request(`/subscriptions/plans/${planId}`);
  }

  getUserPlan = async (): Promise<{
    success: boolean;
    hasPlan: boolean;
    subscription?: {
      id: string;
      tier: string;
      status: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      createdAt: string;
    };
    plan?: {
      id: string;
      name: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      originalPrice: number;
      stripePriceIds: {
        monthly: string;
        yearly: string;
      };
      features: string[];
      savings: string;
      color: string;
      icon: string;
      popular?: boolean;
    };
    message: string;
  }> => {
    return this.request('/subscriptions/current');
  }

  selectPlan = async (tier: string, billingCycle: 'monthly' | 'yearly'): Promise<{
    success: boolean;
    message: string;
    tier: string;
    billingCycle: string;
  }> => {
    return this.request('/plans/user/select-plan', {
      method: 'POST',
      body: JSON.stringify({ tier, billingCycle }),
    });
  }

  // Enhanced plan change with prorated billing and visit carryover
  changePlan = async (newTier: string, billingCycle: 'monthly' | 'yearly'): Promise<{
    success: boolean;
    message: string;
    subscription: {
      tier: string;
      status: string;
      paymentFrequency: string;
      nextPaymentAmount: number;
    };
    billingPreview: {
      currentPrice: number;
      newPrice: number;
      proratedDifference: number;
      immediateCharge: number;
      creditAmount: number;
      nextAmount: number;
      remainingDays: number;
      totalDays: number;
      billingCycle: string;
    };
    visitCarryover: {
      currentVisitsPerMonth: number;
      newVisitsPerMonth: number;
      unusedVisits: number;
      carryoverVisits: number;
      totalVisitsNextPeriod: number;
    };
    effectiveDate: string;
    isUpgrade: boolean;
  }> => {
    return this.request('/subscriptions/change-plan', {
      method: 'POST',
      body: JSON.stringify({ newTier, billingCycle }),
    });
  }

  // Get plan change preview without making changes
  getPlanChangePreview = async (newTier: string, billingCycle: 'monthly' | 'yearly'): Promise<{
    success: boolean;
    preview: {
      currentPlan: {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice?: number;
      };
      newPlan: {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice?: number;
      };
      isUpgrade: boolean;
      canChange: boolean;
      restrictions: string[];
      billingPreview: {
        currentPrice: number;
        newPrice: number;
        proratedDifference: number;
        immediateCharge: number;
        creditAmount: number;
        nextAmount: number;
        remainingDays: number;
        totalDays: number;
        billingCycle: string;
      };
      visitCarryover: {
        currentVisitsPerMonth: number;
        newVisitsPerMonth: number;
        unusedVisits: number;
        carryoverVisits: number;
        totalVisitsNextPeriod: number;
      };
      effectiveDate: string;
    };
    message: string;
  }> => {
    return this.request('/subscriptions/change-plan/preview', {
      method: 'POST',
      body: JSON.stringify({ newTier, billingCycle }),
    });
  }

  calculateDiscount = async (servicePrice: number): Promise<{
    success: boolean;
    discount: number;
    finalPrice: number;
    planTier?: string;
    message: string;
  }> => {
    return this.request('/plans/calculate-discount', {
      method: 'POST',
      body: JSON.stringify({ servicePrice }),
    });
  }

  getPlanComparison = async (): Promise<{
    success: boolean;
    comparison: {
      features: Array<{
        name: string;
        basic: string | boolean;
        plus: string | boolean;
        premier: string | boolean;
      }>;
    };
    message: string;
  }> => {
    return this.request('/plans/comparison/table');
  }

  getPlanStats = async (): Promise<{
    success: boolean;
    stats: Array<{
      tier: string;
      status: string;
      _count: { id: number };
    }>;
    totalRevenue: {
      monthly: number;
      yearly: number;
    };
    message: string;
  }> => {
    return this.request('/plans/admin/stats');
  }

  // Subscription endpoints
  getCurrentSubscription = async (): Promise<{
    subscription: {
      id: string;
      userId: string;
      tier: string;
      status: string;
      paymentFrequency: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      nextPaymentAmount: number;
      plan: {
        id: string;
        name: string;
        description: string;
        monthlyPrice: number;
        yearlyPrice: number;
        features: string[];
      };
      usage?: any;
      stripeSubscription?: any;
    } | null;
  }> => {
    return this.request('/subscriptions/current');
  }

  updateSubscription = async (data: {
    tier: string;
    billingPeriod?: 'monthly' | 'yearly';
  }): Promise<{
    message: string;
  }> => {
    return this.request('/subscriptions/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  cancelSubscription = async (): Promise<{
    message: string;
  }> => {
    return this.request('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  // Check if user can cancel subscription
  canCancelSubscription = async (): Promise<{
    canCancel: boolean;
    reason?: string;
    blockedAt?: string;
  }> => {
    return this.request('/subscriptions/can-cancel');
  }

  // Get retention offers for cancellation
  getRetentionOffers = async (): Promise<{
    success: boolean;
    offers: Array<{
      id: string;
      type: 'DISCOUNT' | 'PAUSE' | 'DOWNGRADE';
      title: string;
      description: string;
      value: string;
      duration?: string;
      originalPrice: number;
      discountedPrice?: number;
      validUntil: string;
    }>;
    message: string;
  }> => {
    return this.request('/subscriptions/retention-offers');
  }

  // Apply a retention offer
  applyRetentionOffer = async (offerId: string): Promise<{
    success: boolean;
    message: string;
    offerId: string;
  }> => {
    return this.request('/subscriptions/apply-retention-offer', {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    });
  }

  getSubscriptionPlans = async (): Promise<{
    success: boolean;
    plans: Array<{
      id: string;
      name: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      originalPrice: number;
      stripePriceIds: {
        monthly: string;
        yearly: string;
      };
      features: string[];
      savings: string;
      color: string;
      icon: string;
      popular?: boolean;
      visitFrequency: string;
      timePerVisit: string;
      visitsPerMonth: number;
    }>;
    message: string;
  }> => {
    return this.request('/subscriptions/plans');
  }

  // Dashboard endpoints
  getDashboardData = async (): Promise<{
    subscription: {
      id: string;
      status: string;
      tier: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      plan: {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice: number;
        features: string[];
        maxServicesPerMonth: number;
      };
    } | null;
    statistics: {
      totalBookings: number;
      upcomingBookings: number;
      completedBookings: number;
    };
    usageStats: {
      perksUsed: number;
      totalPerks: number;
      remainingPerks: number;
      savings: number;
    } | null;
    recentActivity: Array<{
      id: string;
      service: string;
      date: string;
      status: string;
      amount: number;
      provider: string;
    }>;
    availableServices: Array<{
      id: string;
      name: string;
      description: string;
      basePrice: number;
      category: string;
    }>;
  }> => {
    return this.request('/dashboard/customer');
  }
}

// Create and export API client instance
const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '/api');

export const apiClient = api;
export default api; 
