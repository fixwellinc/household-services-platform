'use client';

import { useEffect, Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import { FullPageLoader } from '@/components/customer/loading/LoadingStates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { SubscriptionStatusTransition, DashboardHistoryManager } from '@/components/dashboard/DashboardTransitions';
import { Badge, Button } from '@/components/ui/shared';
import { 
  Shield, 
  Settings, 
  Star,
  CheckCircle,
  Gift,
  Zap,
  Home,
  Wrench,
  ArrowRight,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <FullPageLoader 
        message="Loading dashboard..."
        submessage="Determining the best dashboard for your account..."
      />
    }>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const dashboardRouting = useDashboardRouting();
  const router = useRouter();

  // Initialize history manager
  useEffect(() => {
    const historyManager = DashboardHistoryManager.getInstance();
    historyManager.pushRoute('/dashboard');
  }, []);

  // Handle automatic redirection to appropriate dashboard
  useEffect(() => {
    if (!authLoading && user && !dashboardRouting.isLoading) {
      const historyManager = DashboardHistoryManager.getInstance();
      
      // Admin users should be redirected to admin dashboard
      if (dashboardRouting.shouldRedirectToAdmin) {
        historyManager.pushRoute('/admin');
        dashboardRouting.navigateToRoute('/admin', true);
        return;
      }

      // Customer users with subscription history should be redirected to customer dashboard
      if (dashboardRouting.shouldRedirectToCustomerDashboard) {
        historyManager.pushRoute('/customer-dashboard');
        dashboardRouting.navigateToRoute('/customer-dashboard', true);
        return;
      }

      // If we reach here, user should see the general dashboard (customers without subscription history)
      // No redirect needed, continue rendering the general dashboard
    }
  }, [authLoading, user, dashboardRouting]);

  // Show loading while determining route
  if (authLoading || dashboardRouting.isLoading) {
    return (
      <FullPageLoader 
        message="Loading dashboard..."
        submessage="Determining the best dashboard for your account..."
      />
    );
  }

  // If there's an error with routing, show error state
  if (dashboardRouting.error) {
    return (
      <DashboardRouteGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
            <p className="text-gray-600 mb-8">
              We encountered an issue loading your dashboard. Please try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardRouteGuard>
    );
  }

  // If user should be redirected but we're still here, show loading
  if (dashboardRouting.shouldRedirectToAdmin || dashboardRouting.shouldRedirectToCustomerDashboard) {
    return (
      <FullPageLoader 
        message="Redirecting..."
        submessage="Taking you to your personalized dashboard..."
      />
    );
  }

  // Render general dashboard for customers without subscription history
  return (
    <DashboardRouteGuard>
      <SubscriptionStatusTransition subscriptionStatus={dashboardRouting}>
        <GeneralDashboard />
      </SubscriptionStatusTransition>
    </DashboardRouteGuard>
  );
}

// General Dashboard Component for users without subscription history
function GeneralDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Discover our services and find the perfect subscription plan for your needs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="h-3 w-3 mr-1" />
                Free Account
              </Badge>
              <Link href="/profile">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 h-9 rounded-md px-3">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Promotion */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock Premium Benefits</h2>
                <p className="text-blue-100 mb-6">
                  Subscribe to our premium plans and enjoy exclusive services, priority booking, and member-only perks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button className="bg-white text-blue-600 hover:bg-gray-100">
                      <Star className="h-4 w-4 mr-2" />
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What You'll Get with Subscription */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">What You'll Get with a Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Priority Services</h3>
                <p className="text-sm text-gray-600">Get priority booking and faster response times</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Exclusive Perks</h3>
                <p className="text-sm text-gray-600">Access member-only benefits and discounts</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Premium Support</h3>
                <p className="text-sm text-gray-600">24/7 customer support and dedicated assistance</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-sm text-gray-600">Track your service usage and savings</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Services & Booking */}
          <div className="lg:col-span-2 space-y-8">
            {/* Book a Service */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Book a Service
                </CardTitle>
                <CardDescription>
                  Submit a service request and get a quote from our qualified technicians
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Need a Service?</h3>
                  <p className="text-gray-600 mb-6">
                    Describe what you need, upload photos if helpful, and we'll assign a qualified technician to provide you with a detailed quote.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/services">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Request Service
                      </Button>
                    </Link>
                    <Link href="/services">
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Browse Services
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Services */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Available Services
                </CardTitle>
                <CardDescription>
                  Explore our professional services and get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Deep House Cleaning', icon: Home, color: 'bg-green-100', textColor: 'text-green-600' },
                    { name: 'Plumbing Repair', icon: Wrench, color: 'bg-blue-100', textColor: 'text-blue-600' },
                    { name: 'Electrical Repair', icon: Zap, color: 'bg-orange-100', textColor: 'text-orange-600' },
                    { name: 'Home Organization', icon: Settings, color: 'bg-purple-100', textColor: 'text-purple-600' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg border hover:shadow-md transition-all duration-200">
                      <div className={`w-10 h-10 ${service.color} rounded-full flex items-center justify-center`}>
                        <service.icon className={`h-5 w-5 ${service.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">Professional service</p>
                      </div>
                      <Link href="/services">
                        <Button size="sm">
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  ))}
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

            {/* Get Started */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Get Started
                </CardTitle>
                <CardDescription>
                  Choose a subscription plan to unlock all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Subscribe?</h3>
                  <p className="text-gray-600 mb-6">
                    Choose from our flexible subscription plans and start enjoying premium services, priority booking, and exclusive member benefits.
                  </p>
                  <div className="space-y-3">
                    <Link href="/pricing">
                      <Button className="w-full">
                        <Star className="h-4 w-4 mr-2" />
                        View Subscription Plans
                      </Button>
                    </Link>
                    <Link href="/services">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Browse Services First
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Subscription Plans & Support */}
          <div className="space-y-8">
            {/* Subscription Plans */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Choose Your Plan
                </CardTitle>
                <CardDescription>
                  Select the perfect subscription for your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Starter Plan</h4>
                      <span className="text-lg font-bold text-gray-900">$29/mo</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Perfect for occasional services</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">2 services per month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">Basic support</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Priority Plan</h4>
                      <span className="text-lg font-bold text-gray-900">$79/mo</span>
                    </div>
                    <Badge className="mb-2 bg-blue-600">Most Popular</Badge>
                    <p className="text-sm text-gray-600 mb-3">Best value for regular users</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">Unlimited services</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">Priority booking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">24/7 support</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link href="/pricing">
                  <Button className="w-full">
                    <Star className="h-4 w-4 mr-2" />
                    Compare All Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/services">
                  <Button className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Services
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">📞 1-800-FIXWELL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">✉️ support@fixwell.ca</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">🕒 24/7 Support</span>
                  </div>
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}