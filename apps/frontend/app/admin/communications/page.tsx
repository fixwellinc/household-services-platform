"use client";

import React from 'react';
import { CommunicationsOverview } from '@/components/admin/communications/CommunicationsOverview';
import { AdminPageErrorBoundary } from '@/components/admin/error-boundaries/AdminPageErrorBoundary';
import { createErrorBoundaryProps } from '@/lib/admin-error-reporting';

export const dynamic = 'force-dynamic';

export default function CommunicationsPage() {
  return (
    <AdminPageErrorBoundary 
      {...createErrorBoundaryProps('AdminCommunicationsPage')}
      pageTitle="Communications"
    >
      <CommunicationsOverview />
    </AdminPageErrorBoundary>
  );
}