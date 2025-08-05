'use client';

import { useState } from 'react';
import { useUserPlan } from '@/hooks/use-plans';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Loader2, 
  Shield, 
  Calendar, 
  DollarSign, 
  Gift, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Star,
  Zap,
  Users,
  MessageCircle,
  BookOpen,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomerSubscriptionPage() {
  const { data: userPlanData, isLoading, refetch } = useUserPlan();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  // Check if user is subscribed
  const isSubscribed = userPlanData?.success && userPlanData?.hasPlan && userPlanData?.subscription?.status === 'ACTIVE';
  const subscription = userPlanData?.subscription;
  const plan = userPlanData?.plan;

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium benefits.')) {
      return;
    }

    setIsLoadingAction(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Subscription cancelled successfully');
        refetch();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription, view usage, and access premium benefits.
          </p>
        </div>

        {!isSubscribed ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Subscribe to our premium plans to unlock exclusive services, priority booking, and member-only perks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Star className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Current Plan */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{plan?.name || 'Premium'} Plan</h2>
                      <p className="text-blue-100">
                        {subscription?.status === 'ACTIVE' ? 'Active' : 'Inactive'} • 
                        Next billing: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">${plan?.monthlyPrice || 0}/month</div>
                      <p className="text-blue-100 text-sm">Billed monthly</p>
                    </div>
                  </div>
                                     <div className="flex items-center gap-4">
                     <Badge className="bg-white/20 text-white border-0">
                       <Shield className="h-3 w-3 mr-1" />
                       Active
                     </Badge>
                   </div>
                </CardContent>
              </Card>

              {/* Plan Benefits */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    Plan Benefits
                  </CardTitle>
                  <CardDescription>
                    Exclusive features and perks included with your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan?.features?.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Monthly Savings</span>
                    </div>
                    <p className="text-blue-800">
                      You're saving <strong>${plan?.savings || 0}</strong> per month with your subscription compared to individual service bookings!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Tracking */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Usage This Month
                  </CardTitle>
                  <CardDescription>
                    Track your service usage and remaining benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Deep House Cleaning', used: 2, limit: 4, icon: '🏠' },
                      { name: 'Plumbing Services', used: 1, limit: 3, icon: '🔧' },
                      { name: 'Electrical Services', used: 0, limit: 2, icon: '⚡' },
                      { name: 'Home Organization', used: 1, limit: 2, icon: '📦' }
                    ].map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600">
                              {service.used} of {service.limit} used
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${(service.used / service.limit) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.limit - service.used} remaining
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Billing History
                  </CardTitle>
                  <CardDescription>
                    Your recent payments and invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: '2024-01-15', amount: '$89.99', status: 'paid', description: 'Monthly subscription' },
                      { date: '2024-01-15', amount: '$120.00', status: 'paid', description: 'Deep house cleaning service' },
                      { date: '2024-01-10', amount: '$85.00', status: 'paid', description: 'Plumbing repair service' }
                    ].map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <h3 className="font-medium text-gray-900">{invoice.description}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{invoice.amount}</p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      View All Invoices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Book a Service
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Manage Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{plan?.name || 'Premium'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Billing:</span>
                      <span className="font-medium">
                        {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Cost:</span>
                      <span className="font-medium">${plan?.monthlyPrice || 0}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                      disabled={isLoadingAction}
                    >
                      {isLoadingAction ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">1-800-FIXWELL</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">support@fixwell.ca</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">24/7 Support</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 