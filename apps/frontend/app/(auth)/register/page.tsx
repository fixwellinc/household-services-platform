'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

function RegisterContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const loginUrl = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Let's Get You Started
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href={loginUrl} className="font-medium text-primary hover:text-primary/80">
              sign in to your existing account
            </Link>
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 text-center">
              {redirectUrl 
                ? 'Create an account to continue with your plan subscription'
                : 'We\'ll verify your location to ensure we can serve your area'
              }
            </p>
          </div>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
} 