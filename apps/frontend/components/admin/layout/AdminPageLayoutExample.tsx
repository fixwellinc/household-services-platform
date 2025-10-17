"use client";

import React from 'react';
import { AdminPageLayout } from './AdminPageLayout';
import { PageActions, createCommonActions } from './PageActions';
import { Users, Mail, FileText, TrendingUp } from 'lucide-react';

/**
 * Example usage of AdminPageLayout components
 * This demonstrates how to use the shared layout components
 */
export function AdminPageLayoutExample() {
  const breadcrumbs = [
    { name: 'Communications', icon: Mail },
    { name: 'Email Campaigns' }
  ];

  const stats = [
    {
      label: 'Total Campaigns',
      value: 24,
      change: { value: 12, type: 'increase' as const },
      icon: Mail
    },
    {
      label: 'Active Recipients',
      value: '1,234',
      change: { value: 5, type: 'increase' as const },
      icon: Users
    },
    {
      label: 'Open Rate',
      value: '68.5%',
      change: { value: 3, type: 'decrease' as const },
      icon: TrendingUp
    },
    {
      label: 'Templates',
      value: 8,
      icon: FileText
    }
  ];

  const actions = (
    <PageActions
      primaryAction={createCommonActions.add(() => console.log('Add campaign'), 'New Campaign')}
      actions={[
        createCommonActions.export(() => console.log('Export campaigns')),
        createCommonActions.settings(() => console.log('Campaign settings'))
      ]}
      showSearch={true}
      showFilter={true}
      showRefresh={true}
      onSearchChange={(value) => console.log('Search:', value)}
      onFilterClick={() => console.log('Filter clicked')}
      onRefreshClick={() => console.log('Refresh clicked')}
    />
  );

  return (
    <AdminPageLayout
      title="Email Campaigns"
      description="Manage and monitor your email marketing campaigns"
      breadcrumbs={breadcrumbs}
      stats={stats}
      actions={actions}
    >
      <div className="p-6">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Page Content Goes Here
          </h3>
          <p className="text-gray-600">
            This is where your main page content would be rendered.
            The AdminPageLayout provides the consistent header, breadcrumbs, 
            stats, and actions structure.
          </p>
        </div>
      </div>
    </AdminPageLayout>
  );
}