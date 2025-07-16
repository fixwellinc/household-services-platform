'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

function LoginContent() {
  const { user, isLoading, isHydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to redirect URL or home page if user is already logged in
  useEffect(() => {
    if (user && !isLoading && isHydrated) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        const decodedUrl = decodeURIComponent(redirectUrl);
        router.push(decodedUrl);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, isHydrated, router, searchParams]);

  // Show loading while checking authentication or during hydration
  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null;
  }

  const redirectUrl = searchParams.get('redirect');
  const registerUrl = redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href={registerUrl} className="font-medium text-primary hover:text-primary/80">
              create a new account
            </Link>
          </p>
          {redirectUrl && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 text-center">
                Sign in to continue with your plan subscription
              </p>
            </div>
          )}
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 