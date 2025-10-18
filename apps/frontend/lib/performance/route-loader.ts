/**
 * Route-based dynamic loading system
 * Implements intelligent code splitting based on route patterns
 */

import { lazy, ComponentType } from 'react';

// Route patterns for dynamic loading
export const ROUTE_PATTERNS = {
  ADMIN: /^\/admin/,
  CUSTOMER_DASHBOARD: /^\/(dashboard|customer-dashboard)/,
  BOOKING: /^\/book-appointment/,
  SERVICES: /^\/services/,
  ANALYTICS: /^\/(admin\/analytics|dashboard.*analytics)/,
  REPORTS: /^\/admin\/reports/,
  MONITORING: /^\/admin\/monitoring/,
  COMMUNICATIONS: /^\/admin\/communications/,
} as const;

// Dynamic route component loader
export class RouteLoader {
  private static componentCache = new Map<string, ComponentType<any>>();
  
  /**
   * Load component based on route pattern
   */
  static loadByRoute(pathname: string): ComponentType<any> | null {
    // Check cache first
    if (this.componentCache.has(pathname)) {
      return this.componentCache.get(pathname)!;
    }

    let component: ComponentType<any> | null = null;

    // Admin routes
    if (ROUTE_PATTERNS.ADMIN.test(pathname)) {
      component = this.loadAdminComponent(pathname);
    }
    // Customer dashboard routes
    else if (ROUTE_PATTERNS.CUSTOMER_DASHBOARD.test(pathname)) {
      component = this.loadCustomerComponent(pathname);
    }
    // Booking routes
    else if (ROUTE_PATTERNS.BOOKING.test(pathname)) {
      component = lazy(() => import('@/components/customer/booking/EnhancedBookingForm').then(module => ({ default: (module as any).EnhancedBookingForm || (module as any).default })));
    }
    // Services routes
    else if (ROUTE_PATTERNS.SERVICES.test(pathname)) {
      component = lazy(() => import('@/components/customer/services/AvailableServices'));
    }

    // Cache the component if found
    if (component) {
      this.componentCache.set(pathname, component);
    }

    return component;
  }

  /**
   * Load admin-specific components based on sub-route
   */
  private static loadAdminComponent(pathname: string): ComponentType<any> {
    // Analytics routes
    if (ROUTE_PATTERNS.ANALYTICS.test(pathname)) {
      return lazy(() => import('@/components/admin/EnhancedAnalytics'));
    }
    
    // Reports routes
    if (ROUTE_PATTERNS.REPORTS.test(pathname)) {
      return lazy(() => import('@/components/admin/reports/ReportsOverview'));
    }
    
    // Monitoring routes
    if (ROUTE_PATTERNS.MONITORING.test(pathname)) {
      return lazy(() => import('@/components/admin/monitoring/SystemMonitoringDashboard').then(module => ({ default: (module as any).SystemMonitoringDashboard || (module as any).default })));
    }
    
    // Communications routes
    if (ROUTE_PATTERNS.COMMUNICATIONS.test(pathname)) {
      return lazy(() => import('@/components/admin/communications/CommunicationsOverview').then(module => ({ default: (module as any).CommunicationsOverview || (module as any).default })));
    }

    // User management routes
    if (pathname.includes('/admin/users')) {
      return lazy(() => import('@/components/admin/users/UserManagement').then(module => ({ default: (module as any).UserManagement || (module as any).default })));
    }

    // Subscription management routes
    if (pathname.includes('/admin/subscriptions')) {
      return lazy(() => import('@/components/admin/subscriptions/SubscriptionManagement').then(module => ({ default: (module as any).SubscriptionManagement || (module as any).default })));
    }

    // Settings routes
    if (pathname.includes('/admin/settings')) {
      return lazy(() => import('@/components/admin/settings/AdminSettings').then(module => ({ default: (module as any).AdminSettings || (module as any).default })));
    }

    // Appointments routes
    if (pathname.includes('/admin/appointments')) {
      return lazy(() => import('@/components/admin/appointments/AppointmentsList'));
    }

    // Salesmen routes
    if (pathname.includes('/admin/salesmen')) {
      return lazy(() => import('@/components/admin/salesmen/SalesmenManagement').then(module => ({ default: (module as any).SalesmenManagement || (module as any).default })));
    }

    // Default admin dashboard
    return lazy(() => import('@/components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
  }

  /**
   * Load customer-specific components based on sub-route
   */
  private static loadCustomerComponent(pathname: string): ComponentType<any> {
    // Usage analytics
    if (pathname.includes('analytics')) {
      return lazy(() => import('@/components/customer/usage-analytics/UsageAnalytics'));
    }

    // Subscription management
    if (pathname.includes('subscription')) {
      return lazy(() => import('@/components/customer/SubscriptionManagement'));
    }

    // Service requests
    if (pathname.includes('service')) {
      return lazy(() => import('@/components/customer/ServiceRequestList'));
    }

    // Notifications
    if (pathname.includes('notifications')) {
      return lazy(() => import('@/components/customer/notifications/NotificationCenter'));
    }

    // Default customer dashboard
    return lazy(() => import('@/components/dashboard/CustomerDashboardContent').then(module => ({ default: (module as any).CustomerDashboardContent || (module as any).default })));
  }

  /**
   * Preload components for likely next routes
   */
  static preloadRoute(pathname: string): void {
    // Preload related components based on current route
    if (ROUTE_PATTERNS.ADMIN.test(pathname)) {
      // Preload common admin components
      import('@/components/admin/EnhancedDataTable');
      import('@/components/admin/BulkOperationsToolbar');
    } else if (ROUTE_PATTERNS.CUSTOMER_DASHBOARD.test(pathname)) {
      // Preload common customer components
      import('@/components/customer/booking/BookingForm');
      import('@/components/customer/services/ServiceRequestForm');
    }
  }

  /**
   * Clear component cache (useful for development)
   */
  static clearCache(): void {
    this.componentCache.clear();
  }
}

// Hook for using route-based loading
export function useRouteLoader(pathname: string) {
  return {
    loadComponent: () => RouteLoader.loadByRoute(pathname),
    preloadNext: () => RouteLoader.preloadRoute(pathname),
  };
}