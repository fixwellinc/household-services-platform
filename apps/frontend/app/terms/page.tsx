'use client';

import { Suspense } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function TermsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<TermsPageSkeleton />}>
        <TermsContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function TermsContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-6">Last updated: December 15, 2024</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Household Services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Area</h2>
              <p className="mb-3">
                Our services are currently available only to residents of the Lower Mainland within 50km of Surrey, British Columbia, Canada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Contact Information</h2>
              <p>
                If you have any questions about these terms of service, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <p className="font-semibold">Household Services Inc.</p>
                <p>Email: legal@householdservices.com</p>
                <p>Phone: (555) 123-4567</p>
                <p>Address: 123 Service Street, Vancouver, BC V6B 2Z9</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-6 w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
