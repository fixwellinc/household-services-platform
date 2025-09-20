'use client';

import React, { Suspense } from 'react';
import { FullPageLoader } from '@/components/customer/loading/LoadingStates';

interface CustomerDashboardWrapperProps {
  children: React.ReactNode;
}

export function CustomerDashboardWrapper({ children }: CustomerDashboardWrapperProps) {
  return (
    <Suspense fallback={
      <FullPageLoader 
        message="Loading customer dashboard..."
        submessage="Preparing your personalized experience..."
      />
    }>
      {children}
    </Suspense>
  );
}