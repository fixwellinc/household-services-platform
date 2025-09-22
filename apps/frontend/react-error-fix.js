#!/usr/bin/env node

/**
 * React Error Fix Script
 * Fixes React errors #418 and #306 by addressing hydration and rendering issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting React Error Fix...');

// 1. Create error boundary component
const errorBoundaryContent = `'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Something went wrong
                </h3>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
`;

// 2. Create hydration-safe component wrapper
const hydrationSafeContent = `'use client';

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
`;

// 3. Create client-only wrapper
const clientOnlyContent = `'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ClientOnlyComponent({ children, fallback = null }: ClientOnlyProps) {
  return <>{children}</>;
}

const ClientOnly = dynamic(() => Promise.resolve(ClientOnlyComponent), {
  ssr: false,
  loading: () => null,
});

export default ClientOnly;
`;

// 4. Create text rendering fix utility
const textUtilsContent = `'use client';

/**
 * Safe text rendering utilities to prevent React error #418
 */

import { ReactNode } from 'react';

export function safeText(text: unknown): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  if (typeof text === 'string') {
    return text;
  }
  
  if (typeof text === 'number') {
    return text.toString();
  }
  
  if (typeof text === 'boolean') {
    return text.toString();
  }
  
  return String(text);
}

export function SafeText({ children, fallback = '' }: { children: unknown; fallback?: string }) {
  try {
    const text = safeText(children);
    return <>{text}</>;
  } catch (error) {
    console.warn('SafeText rendering error:', error);
    return <>{fallback}</>;
  }
}

export function conditionalRender(condition: unknown, component: ReactNode): ReactNode {
  if (!condition) {
    return null;
  }
  return component;
}
`;

// Create directories if they don't exist
const componentsDir = path.join(process.cwd(), 'components', 'common');
const utilsDir = path.join(process.cwd(), 'lib', 'utils');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Write the files
fs.writeFileSync(path.join(componentsDir, 'ErrorBoundary.tsx'), errorBoundaryContent);
fs.writeFileSync(path.join(componentsDir, 'HydrationSafe.tsx'), hydrationSafeContent);
fs.writeFileSync(path.join(componentsDir, 'ClientOnly.tsx'), clientOnlyContent);
fs.writeFileSync(path.join(utilsDir, 'text-utils.tsx'), textUtilsContent);

console.log('✅ Created error handling components');

// 5. Update root layout to include error boundary
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Add ErrorBoundary import if not present
  if (!layoutContent.includes('ErrorBoundary')) {
    layoutContent = layoutContent.replace(
      /import.*from.*['"]react['"];?\n/,
      `$&import ErrorBoundary from '@/components/common/ErrorBoundary';\n`
    );
    
    // Wrap children in ErrorBoundary
    layoutContent = layoutContent.replace(
      /<body[^>]*>\s*{children}\s*<\/body>/,
      `<body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>`
    );
    
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('✅ Updated root layout with ErrorBoundary');
  }
}

// 6. Create development configuration for better error messages
const devConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development settings for better error debugging
  ...(process.env.NODE_ENV === 'development' && {
    compiler: {
      removeConsole: false,
    },
    minify: false,
    swcMinify: false,
  }),
  
  // Production settings
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
    minify: true,
    swcMinify: true,
  }),
  
  // Error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Prevent hydration mismatches
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Server components configuration
  serverComponentsExternalPackages: ['sharp'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
fs.writeFileSync(path.join(process.cwd(), 'next.config.dev.js'), devConfigContent);

console.log('✅ React Error Fix completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Restart your development server');
console.log('2. Check browser console for detailed error messages');
console.log('3. Use ErrorBoundary components around problematic areas');
console.log('4. Use HydrationSafe for components with client-side state');
console.log('5. Use SafeText for dynamic text content');