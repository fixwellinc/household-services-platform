"use client";

import React from 'react';
import { AdminErrorBoundary } from '../AdminErrorBoundary';
import { PageHeader } from './PageHeader';

export interface BreadcrumbItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AdminPageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: StatItem[];
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  className?: string;
}

export function AdminPageLayout({
  title,
  description,
  actions,
  breadcrumbs,
  stats,
  children,
  loading = false,
  error = null,
  className = ''
}: AdminPageLayoutProps) {
  if (loading) {
    return (
      <div className={`p-4 sm:p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Mobile loading */}
          <div className="sm:hidden space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          
          {/* Desktop loading */}
          <div className="hidden sm:block">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 sm:p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading page
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <div className={`p-4 sm:p-6 ${className}`}>
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          stats={stats}
          actions={actions}
        />
        
        <div className="mt-4 sm:mt-6">
          {children}
        </div>
      </div>
    </AdminErrorBoundary>
  );
}