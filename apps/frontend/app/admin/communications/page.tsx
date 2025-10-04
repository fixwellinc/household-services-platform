"use client";

import React from 'react';
import { EmailTemplateManagement } from '@/components/admin/communications/EmailTemplateManagement';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function CommunicationsPage() {
  return (
    <AdminErrorBoundary context="AdminCommunicationsPage">
      <EmailTemplateManagement />
    </AdminErrorBoundary>
  );
}