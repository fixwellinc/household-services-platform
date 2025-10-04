"use client";

import React from 'react';
import { AdminAPIDocumentation } from '@/components/admin/API/AdminAPIDocumentation';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function APIDocumentationPage() {
  return (
    <AdminErrorBoundary context="AdminAPIDocumentationPage">
      <AdminAPIDocumentation />
    </AdminErrorBoundary>
  );
}
