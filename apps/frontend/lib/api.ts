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
    const url = `${this.baseURL}${endpoint}`;
    
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
    role?: 'CUSTOMER';
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
    return this.request<{ status: string; timestamp: string }>('/api/health');
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
  updateProfile = async (data: { name?: string; email?: string; phone?: string; avatar?: string }): Promise<{ user: User }> => {
    return this.request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return this.request<{ message: string }>('/users/me/change-password', {
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
    return this.request('/plans');
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
    return this.request(`/plans/${planId}`);
  }

  getUserPlan = async (): Promise<{
    success: boolean;
    hasPlan: boolean;
    subscription?: {
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
    return this.request('/plans/user/current');
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
}

// Create and export API client instance
const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '/api');

export const apiClient = api;
export default api; 