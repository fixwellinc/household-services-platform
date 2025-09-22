#!/usr/bin/env node

/**
 * Comprehensive React Error Fix
 * Addresses React errors #418, #306 and server-side rendering issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React errors and SSR issues...');

// 1. Fix blog page with proper error handling
const blogPageContent = `'use client';

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
`;

// 2. Fix terms page with proper error handling
const termsPageContent = `'use client';

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
`;

// 3. Create a safe layout wrapper
const safeLayoutContent = `'use client';

import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface SafeLayoutProps {
  children: React.ReactNode;
}

export default function SafeLayout({ children }: SafeLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
`;

// Write the fixed files
fs.writeFileSync(path.join(process.cwd(), 'app', 'blog', 'page.tsx'), blogPageContent);
fs.writeFileSync(path.join(process.cwd(), 'app', 'terms', 'page.tsx'), termsPageContent);
fs.writeFileSync(path.join(process.cwd(), 'components', 'common', 'SafeLayout.tsx'), safeLayoutContent);

console.log('✅ Fixed blog and terms pages');

// 4. Update root layout to handle errors better
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Ensure proper error boundary wrapping
  if (!layoutContent.includes('ErrorBoundary')) {
    // Add import
    layoutContent = layoutContent.replace(
      /import.*from.*['"]react['"];?\n/,
      `$&import ErrorBoundary from '@/components/common/ErrorBoundary';\n`
    );
    
    // Wrap body content
    layoutContent = layoutContent.replace(
      /<body[^>]*>\s*{children}\s*<\/body>/,
      `<body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>`
    );
    
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('✅ Updated root layout with error handling');
  }
}

// 5. Create development-friendly Next.js config
const devNextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development mode settings
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false, // Disable strict mode to reduce hydration warnings
    swcMinify: false,
    compiler: {
      removeConsole: false,
    },
  }),
  
  // Production mode settings
  ...(process.env.NODE_ENV === 'production' && {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
      removeConsole: true,
    },
  }),
  
  // Error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Prevent hydration issues
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Custom error pages
  async rewrites() {
    return [
      {
        source: '/500',
        destination: '/error',
      },
    ];
  },
  
  // Headers for better error handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;

// Write development config
fs.writeFileSync(path.join(process.cwd(), 'next.config.dev.js'), devNextConfigContent);

// 6. Create custom error page
const errorPageContent = `'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg className="h-12 w-12 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        
        <div className="space-y-3">
          {reset && (
            <button
              onClick={reset}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && \`\n\n\${error.stack}\`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
`;

// Create error page
const errorDir = path.join(process.cwd(), 'app', 'error');
if (!fs.existsSync(errorDir)) {
  fs.mkdirSync(errorDir, { recursive: true });
}
fs.writeFileSync(path.join(errorDir, 'page.tsx'), errorPageContent);

console.log('✅ Created custom error page');

// 7. Create global error handler
const globalErrorContent = `'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Application Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong with the application. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
`;

fs.writeFileSync(path.join(process.cwd(), 'app', 'global-error.tsx'), globalErrorContent);

console.log('✅ Created global error handler');

console.log('\n🎉 React Error Fix Complete!');
console.log('\n📋 What was fixed:');
console.log('• Blog and Terms pages converted to client components with error boundaries');
console.log('• Added proper loading states and error handling');
console.log('• Created custom error pages for better user experience');
console.log('• Updated Next.js config for development-friendly error messages');
console.log('• Added global error handlers');
console.log('\n🚀 Next steps:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Test the /blog and /terms pages');
console.log('3. Check browser console for any remaining issues');
console.log('4. Switch to production build when ready: npm run build && npm start');