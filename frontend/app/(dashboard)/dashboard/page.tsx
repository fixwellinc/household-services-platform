'use client';

import { useCurrentUser } from '@/hooks/use-api';
import { Button } from '@/components/ui/shared';
import { Loader2, Calendar, DollarSign, Users, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const user = userData?.user;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Household Services</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access your dashboard.
          </p>
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s what&apos;s happening with your {user.role.toLowerCase()} account.
        </p>
      </div>

      {user.role === 'CUSTOMER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
            <p className="text-gray-600 text-sm">You have 3 scheduled services</p>
            <Link href="/customer/bookings" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              View all bookings →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">$150</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Spent</h3>
            <p className="text-gray-600 text-sm">This month&apos;s service costs</p>
            <Link href="/customer/payments" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              View payment history →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Services Used</h3>
            <p className="text-gray-600 text-sm">Different services you&apos;ve booked</p>
            <Link href="/services" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              Browse services →
            </Link>
          </div>
        </div>
      )}



      {user.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">1,247</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
            <p className="text-gray-600 text-sm">Platform customers</p>
            <Link href="/admin/users" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              Manage users →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">156</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Active Bookings</h3>
            <p className="text-gray-600 text-sm">Scheduled this week</p>
            <Link href="/admin/bookings" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              View all bookings →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">$45,230</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Platform Revenue</h3>
            <p className="text-gray-600 text-sm">This month&apos;s total</p>
            <Link href="/admin/analytics" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm font-medium">
              View analytics →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user.role === 'CUSTOMER' && (
            <>
              <Link href="/customer/book-service">
                <Button className="w-full h-20 flex flex-col items-center justify-center">
                  <Calendar className="h-6 w-6 mb-2" />
                  Book a Service
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Browse Services
                </Button>
              </Link>
              <Link href="/customer/profile">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 mb-2" />
                  Update Profile
                </Button>
              </Link>
              <Link href="/customer/support">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Get Support
                </Button>
              </Link>
            </>
          )}



          {user.role === 'ADMIN' && (
            <>
              <Link href="/admin/users">
                <Button className="w-full h-20 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/services">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Manage Services
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <DollarSign className="h-6 w-6 mb-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  System Settings
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 