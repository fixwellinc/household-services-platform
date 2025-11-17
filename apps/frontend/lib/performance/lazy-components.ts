/**
 * Lazy-loaded components for code splitting
 * This file centralizes all lazy imports for better performance
 * Organized by feature area for optimal bundle splitting
 */

import { lazy } from 'react';

// =============================================================================
// ADMIN DASHBOARD COMPONENTS
// =============================================================================

// Core Admin Dashboard
export const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

// User Management Components - Using fallback implementations
export const UserManagement = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const UserDetails = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const UserForm = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Subscription Management Components - Using fallback implementations
export const SubscriptionManagement = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const SubscriptionDetails = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const SubscriptionAnalytics = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Analytics and Reporting Components
export const EnhancedAnalytics = lazy(() => import('@/components/admin/EnhancedAnalytics'));

export const AdvancedAnalyticsML = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const ReportsOverview = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const ReportBuilder = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Data Management Components
export const EnhancedDataTable = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const BulkOperationsToolbar = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const BulkOperationsManagement = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Audit and Security Components
export const AuditLogs = lazy(() => import('@/components/admin/AuditLogs'));

// Communications Components
export const CommunicationsOverview = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const EmailCampaignManager = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const CommunicationCenter = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Monitoring Components
export const SystemMonitoringDashboard = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const PerformanceDashboard = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Settings Components
export const AdminSettings = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const SystemSettings = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Appointments Management
export const AppointmentsList = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const AvailabilityManager = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Salesmen Management
export const SalesmenManagement = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// =============================================================================
// CUSTOMER DASHBOARD COMPONENTS
// =============================================================================

// Core Customer Dashboard - Railway deployment safe version
export const CustomerDashboard = lazy(() => 
  import('@/components/dashboard/SimpleCustomerDashboard').then(module => ({ 
    default: module.SimpleCustomerDashboard 
  }))
);

// Booking Components
export const BookingForm = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const EnhancedBookingForm = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const BookingCalendar = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Service Management Components
export const ServiceRequestForm = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const AvailableServices = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const ServiceRequestList = lazy(() => import('@/components/customer/ServiceRequestList'));

// Subscription Management Components
export const CustomerSubscriptionManagement = lazy(() => import('@/components/customer/SubscriptionManagement'));

export const SubscriptionOverview = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const PlanComparison = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Usage Analytics Components
export const UsageAnalytics = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

export const UsageMetrics = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// New Customer Dashboard Components
export const DashboardOverview = lazy(() => 
  import('@/components/customer/dashboard-overview').then(m => ({ default: m.DashboardOverview }))
);

export const AppointmentsListComponent = lazy(() => 
  import('@/components/customer/services/AppointmentsList').then(m => ({ default: m.AppointmentsList }))
);

export const QuickBookService = lazy(() => 
  import('@/components/customer/services/QuickBookService').then(m => ({ default: m.QuickBookService }))
);

export const ServiceHistory = lazy(() => 
  import('@/components/customer/services/ServiceHistory').then(m => ({ default: m.ServiceHistory }))
);

export const BillingOverview = lazy(() => 
  import('@/components/customer/billing/BillingOverview').then(m => ({ default: m.BillingOverview }))
);

export const UsageTrendsChart = lazy(() => 
  import('@/components/customer/usage-analytics/UsageTrendsChart').then(m => ({ default: m.UsageTrendsChart }))
);

export const ServiceCategoryChart = lazy(() => 
  import('@/components/customer/usage-analytics/ServiceCategoryChart').then(m => ({ default: m.ServiceCategoryChart }))
);

export const SavingsChart = lazy(() => 
  import('@/components/customer/usage-analytics/SavingsChart').then(m => ({ default: m.SavingsChart }))
);

export const UsageLimitsCard = lazy(() => 
  import('@/components/customer/usage-tracking/UsageLimitsCard').then(m => ({ default: m.UsageLimitsCard }))
);

export const PaymentMethodsList = lazy(() => 
  import('@/components/customer/billing/PaymentMethodsList').then(m => ({ default: m.PaymentMethodsList }))
);

export const InvoicesList = lazy(() => 
  import('@/components/customer/billing/InvoicesList').then(m => ({ default: m.InvoicesList }))
);

export const ProfileSettings = lazy(() => 
  import('@/components/customer/settings/ProfileSettings').then(m => ({ default: m.ProfileSettings }))
);

export const NotificationPreferences = lazy(() => 
  import('@/components/customer/settings/NotificationPreferences').then(m => ({ default: m.NotificationPreferences }))
);

// Notification Components
export const NotificationCenter = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// =============================================================================
// SHARED HEAVY COMPONENTS
// =============================================================================

// Charts and Visualization Components
export const RechartsComponents = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// Form Components
export const ReactQuillEditor = lazy(() => 
  Promise.resolve({
    default: () => null // Fallback component
  })
);

// =============================================================================
// ROUTE-BASED LAZY LOADING HELPERS
// =============================================================================

// Admin Route Components
export const AdminRouteComponents = {
  dashboard: AdminDashboard,
  users: UserManagement,
  subscriptions: SubscriptionManagement,
  analytics: EnhancedAnalytics,
  reports: ReportsOverview,
  communications: CommunicationsOverview,
  monitoring: SystemMonitoringDashboard,
  settings: AdminSettings,
  appointments: AppointmentsList,
  salesmen: SalesmenManagement,
};

// Customer Route Components
export const CustomerRouteComponents = {
  dashboard: CustomerDashboard,
  booking: EnhancedBookingForm,
  services: AvailableServices,
  subscription: CustomerSubscriptionManagement,
  analytics: UsageAnalytics,
  notifications: NotificationCenter,
};