/**
 * Lazy-loaded admin components for code splitting
 * This file centralizes all lazy imports for better performance
 */

import { lazy } from 'react';

// Dashboard Components
export const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
export const DashboardGrid = lazy(() => import('@/components/admin/dashboard/DashboardGrid'));
export const DashboardWidget = lazy(() => import('@/components/admin/dashboard/DashboardWidget'));

// User Management Components
export const UserManagement = lazy(() => import('@/components/admin/users/UserManagement'));
export const UserDetails = lazy(() => import('@/components/admin/users/UserDetails'));
export const UserForm = lazy(() => import('@/components/admin/users/UserForm'));

// Subscription Management Components
export const SubscriptionManagement = lazy(() => import('@/components/admin/subscriptions/SubscriptionManagement'));
export const SubscriptionDetails = lazy(() => import('@/components/admin/subscriptions/SubscriptionDetails'));
export const SubscriptionAnalytics = lazy(() => import('@/components/admin/subscriptions/SubscriptionAnalytics'));

// Communication Components
export const CommunicationCenter = lazy(() => import('@/components/admin/communications/CommunicationCenter'));
export const MessageComposer = lazy(() => import('@/components/admin/communications/MessageComposer'));
export const CampaignBuilder = lazy(() => import('@/components/admin/communications/CampaignBuilder'));

// Monitoring Components
export const SystemMonitoring = lazy(() => import('@/components/admin/monitoring/SystemMonitoring'));
export const PerformanceMetrics = lazy(() => import('@/components/admin/monitoring/PerformanceMetrics'));
export const AlertManagement = lazy(() => import('@/components/admin/monitoring/AlertManagement'));

// Audit and Security Components
export const AuditLogs = lazy(() => import('@/components/admin/AuditLogs'));
export const SecuritySettings = lazy(() => import('@/components/admin/settings/SecuritySettings'));

// Data Management Components
export const EnhancedDataTable = lazy(() => import('@/components/admin/EnhancedDataTable'));
export const BulkOperationsToolbar = lazy(() => import('@/components/admin/BulkOperationsToolbar'));
export const ExportManager = lazy(() => import('@/components/admin/reports/ExportManager'));

// Analytics Components
export const EnhancedAnalytics = lazy(() => import('@/components/admin/EnhancedAnalytics'));
export const ReportBuilder = lazy(() => import('@/components/admin/reports/ReportBuilder'));