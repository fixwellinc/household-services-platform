'use client';

import { Suspense } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function BlogPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<BlogPageSkeleton />}>
        <BlogContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function BlogContent() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Blog & Resources</h1>
      <p className="text-lg text-gray-600 mb-8">
        Tips, guides, and resources for household management, cleaning, repairs, and more. 
        Stay tuned for our latest articles!
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-3">Coming Soon</h2>
          <p className="text-gray-600">
            We're working on bringing you valuable content about household services, 
            maintenance tips, and more. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}

function BlogPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-8 w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded mb-8 w-3/4"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
