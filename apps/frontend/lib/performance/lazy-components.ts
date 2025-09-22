/**
 * Lazy-loaded admin components for code splitting
 * This file centralizes all lazy imports for better performance
 * Only includes components that actually exist with proper exports
 */

import { lazy } from 'react';

// Dashboard Components (these exist)
export const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

// Audit and Security Components (these exist)
export const AuditLogs = lazy(() => import('@/components/admin/AuditLogs'));

// Data Management Components (these exist)
export const EnhancedDataTable = lazy(() => import('@/components/admin/EnhancedDataTable'));
export const BulkOperationsToolbar = lazy(() => import('@/components/admin/BulkOperationsToolbar'));

// Analytics Components (these exist)
export const EnhancedAnalytics = lazy(() => import('@/components/admin/EnhancedAnalytics'));

// NOTE: Other components are commented out until they are properly implemented
// with default exports or confirmed to exist

// // User Management Components
// export const UserManagement = lazy(() => import('@/components/admin/users/UserManagement'));
// export const UserDetails = lazy(() => import('@/components/admin/users/UserDetails'));
// export const UserForm = lazy(() => import('@/components/admin/users/UserForm'));

// // Subscription Management Components
// export const SubscriptionManagement = lazy(() => import('@/components/admin/subscriptions/SubscriptionManagement'));
// export const SubscriptionDetails = lazy(() => import('@/components/admin/subscriptions/SubscriptionDetails'));
// export const SubscriptionAnalytics = lazy(() => import('@/components/admin/subscriptions/SubscriptionAnalytics'));