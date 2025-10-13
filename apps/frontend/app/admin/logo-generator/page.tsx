import React from 'react';
import LogoGenerator from '@/components/admin/LogoGenerator';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function LogoGeneratorPage() {
  return (
    <AdminErrorBoundary context="LogoGeneratorPage">
      <div className="container mx-auto px-4 py-8">
        <LogoGenerator />
      </div>
    </AdminErrorBoundary>
  );
}
