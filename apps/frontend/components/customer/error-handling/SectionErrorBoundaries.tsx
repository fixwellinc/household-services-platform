'use client';

import React from 'react';
import CustomerErrorBoundary from './CustomerErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  AlertTriangle, 
  RefreshCw, 
  CreditCard, 
  Gift, 
  Zap, 
  BarChart3, 
  Bell,
  Settings
} from 'lucide-react';

// Subscription Overview Error Boundary
export function SubscriptionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomerErrorBoundary
      section="Subscription Overview"
      fallback={({ error, resetError, retryCount }) => (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-orange-900">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Overview Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              We're having trouble loading your subscription details. Your account is still active.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/billing'}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Settings className="h-4 w-4 mr-1" />
                Billing Settings
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}

// Perks and Benefits Error Boundary
export function PerksErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomerErrorBoundary
      section="Perks & Benefits"
      fallback={({ error, resetError, retryCount }) => (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-purple-900">
              <Gift className="h-5 w-5 mr-2" />
              Perks & Benefits Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              We can't load your perks right now, but they're still active on your account.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-purple-600 mt-2">
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}

// Services Error Boundary
export function ServicesErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomerErrorBoundary
      section="Available Services"
      fallback={({ error, resetError, retryCount }) => (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-blue-900">
              <Zap className="h-5 w-5 mr-2" />
              Services Temporarily Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              We're having trouble loading available services. You can still request services by contacting us directly.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/services'}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Zap className="h-4 w-4 mr-1" />
                Browse Services
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}

// Usage Analytics Error Boundary
export function UsageAnalyticsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomerErrorBoundary
      section="Usage Analytics"
      fallback={({ error, resetError, retryCount }) => (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-green-900">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Usage analytics are temporarily unavailable. Your usage is still being tracked.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-green-600 mt-2">
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}

// Notifications Error Boundary
export function NotificationsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomerErrorBoundary
      section="Notifications"
      fallback={({ error, resetError, retryCount }) => (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-900">
              <Bell className="h-5 w-5 mr-2" />
              Notifications Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              We can't load your notifications right now. Important updates will still be sent via email.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-yellow-600 mt-2">
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}

// Generic Section Error Boundary for other components
export function SectionErrorBoundary({ 
  children, 
  sectionName,
  icon: Icon = AlertTriangle,
  color = 'gray'
}: { 
  children: React.ReactNode;
  sectionName: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'gray' | 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
}) {
  const colorClasses = {
    gray: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textTertiary: 'text-gray-600',
      button: 'border-gray-300 text-gray-700 hover:bg-gray-100'
    },
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      text: 'text-red-900',
      textSecondary: 'text-red-700',
      textTertiary: 'text-red-600',
      button: 'border-red-300 text-red-700 hover:bg-red-100'
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      textSecondary: 'text-blue-700',
      textTertiary: 'text-blue-600',
      button: 'border-blue-300 text-blue-700 hover:bg-blue-100'
    },
    green: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      text: 'text-green-900',
      textSecondary: 'text-green-700',
      textTertiary: 'text-green-600',
      button: 'border-green-300 text-green-700 hover:bg-green-100'
    },
    yellow: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      textSecondary: 'text-yellow-700',
      textTertiary: 'text-yellow-600',
      button: 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      textSecondary: 'text-purple-700',
      textTertiary: 'text-purple-600',
      button: 'border-purple-300 text-purple-700 hover:bg-purple-100'
    },
    orange: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      textSecondary: 'text-orange-700',
      textTertiary: 'text-orange-600',
      button: 'border-orange-300 text-orange-700 hover:bg-orange-100'
    }
  };

  const classes = colorClasses[color];

  return (
    <CustomerErrorBoundary
      section={sectionName}
      fallback={({ error, resetError, retryCount }) => (
        <Card className={`${classes.border} ${classes.bg}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center ${classes.text}`}>
              <Icon className="h-5 w-5 mr-2" />
              {sectionName} Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${classes.textSecondary} mb-4`}>
              This section is temporarily unavailable. Please try again.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={resetError}
                size="sm"
                variant="outline"
                className={classes.button}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
            {retryCount > 0 && (
              <p className={`text-xs ${classes.textTertiary} mt-2`}>
                Retry {retryCount}/3
              </p>
            )}
          </CardContent>
        </Card>
      )}
    >
      {children}
    </CustomerErrorBoundary>
  );
}