'use client';

import { useCurrentUser } from '@/hooks/use-api';
import { useUserPlan } from '@/hooks/use-plans';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Loader2, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings, 
  Shield, 
  Clock, 
  Star,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Zap,
  Home,
  Wrench,
  Sparkle,
  Award,
  Gift,
  ArrowRight,
  Eye,
  Plus,
  History,
  MessageCircle,
  User,
  Bell,
  Star as StarIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomerDashboardPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const { data: userPlanData, isLoading: planLoading } = useUserPlan();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const user = userData?.user;

  if (isLoading || planLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Fixwell</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access your customer dashboard.
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

  // Check if user is subscribed
  const isSubscribed = userPlanData?.success && userPlanData?.hasPlan && userPlanData?.subscription?.status === 'ACTIVE';
  const subscription = userPlanData?.subscription;
  const plan = userPlanData?.plan;
  
  // Use real dashboard data
  const stats = dashboardData?.statistics || { totalBookings: 0, upcomingBookings: 0, completedBookings: 0, totalSpent: 0 };
  const usageStats = dashboardData?.usageStats;
  const recentActivity = dashboardData?.recentActivity || [];
  const availableServices = dashboardData?.availableServices || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here's your personalized customer dashboard with all your subscription details and services.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSubscribed && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Active Subscription
                </Badge>
              )}
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {isSubscribed && (
          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{plan?.name || 'Premium'} Plan</h2>
                      <p className="text-blue-100">
                        {subscription?.status === 'ACTIVE' ? 'Active' : 'Inactive'} • 
                        Next billing: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${plan?.monthlyPrice || 0}/month</div>
                    <p className="text-blue-100 text-sm">Billed monthly</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {usageStats ? 'Perks Used' : 'Completed Bookings'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats ? `${usageStats.perksUsed}/${usageStats.totalPerks}` : stats.completedBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {usageStats ? 'Total Savings' : 'Total Spent'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${usageStats ? usageStats.savings.toFixed(2) : stats.totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Services & Booking */}
          <div className="lg:col-span-2 space-y-8">
            {/* Available Services */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Available Services
                </CardTitle>
                <CardDescription>
                  Book your next service with our professional team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.length > 0 ? (
                    availableServices.map((service, index) => (
                      <div key={service.id} className="flex items-center gap-3 p-4 rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600">${service.basePrice}</p>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/dashboard/customer/book-service?service=${service.id}`)}>
                          Book Now
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-gray-500">No services available at the moment.</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/services">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Services
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest bookings and service history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.status === 'COMPLETED' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {activity.status === 'COMPLETED' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{activity.service}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.date).toLocaleDateString()} • {activity.provider}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${activity.amount}</p>
                          <Badge variant={activity.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {activity.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No recent activity to show.</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/dashboard/customer/bookings">
                    <Button variant="outline" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      View All Activity
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Subscription & Support */}
          <div className="space-y-8">
            {/* Subscription Details */}
            {isSubscribed && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Subscription Details
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
                  <div className="pt-4 border-t">
                    <Link href="/dashboard/customer/subscription">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Benefits */}
            {isSubscribed && plan && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    Plan Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plan.features?.slice(0, 5).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Savings:</strong> You've saved ${plan.savings || 0} this month with your subscription!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/customer/book-service">
                  <Button className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Book a Service
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Services
                  </Button>
                </Link>
                <Link href="/dashboard/customer/bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
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

        {/* Bottom CTA */}
        {!isSubscribed && (
          <div className="mt-12">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Unlock Premium Benefits</h2>
                <p className="text-blue-100 mb-6">
                  Subscribe to our premium plan and enjoy exclusive services, priority booking, and member-only perks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button className="bg-white text-blue-600 hover:bg-gray-100">
                      <StarIcon className="h-4 w-4 mr-2" />
                      View Plans
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Browse Services
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 