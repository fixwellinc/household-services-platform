'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import Link from 'next/link';
import { 
  Calendar,
  Settings,
  CreditCard,
  Bell,
  Shield
} from 'lucide-react';

/**
 * Simple Customer Dashboard - Railway deployment safe version
 * This component avoids useSearchParams and other hooks that cause build issues
 */
export function SimpleCustomerDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customer Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your subscription, view services, and track your account activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Customer Account
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Book Service</h3>
                <p className="text-sm text-gray-600">Schedule a new service</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <Button className="w-full mt-4" asChild>
              <Link href="/book-appointment">Book Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Manage Plan</h3>
                <p className="text-sm text-gray-600">Upgrade or modify</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <Button className="w-full mt-4" asChild>
              <Link href="/pricing">Manage Plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Billing</h3>
                <p className="text-sm text-gray-600">Payment & invoices</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <Button className="w-full mt-4" asChild>
              <Link href="/profile">View Billing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">View updates</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
            <Button className="w-full mt-4" asChild>
              <Link href="/profile">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Your customer dashboard is being prepared with all the latest features. 
            In the meantime, you can use the quick actions above to access key services.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Available features:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Book and manage service appointments</li>
              <li>• View and modify your subscription plan</li>
              <li>• Access billing and payment information</li>
              <li>• Receive important notifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}