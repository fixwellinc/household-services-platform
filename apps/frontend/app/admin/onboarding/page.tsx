"use client";

import React from 'react';
import { AdminOnboardingFlow } from '@/components/admin/onboarding/AdminOnboardingFlow';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function AdminOnboardingPage() {
  return (
    <AdminErrorBoundary context="AdminOnboardingPage">
      <AdminOnboardingFlow />
    </AdminErrorBoundary>
  );
}
