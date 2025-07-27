'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  CheckCircle, 
  Star, 
  Crown, 
  Sparkles,
  ArrowRight,
  Home,
  Wrench,
  Shield,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Gift,
  Heart,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import LocationPromptModal from '@/components/location/LocationPromptModal';

const PLAN_INFO = {
  starter: {
    name: 'Starter Plan',
    icon: Star,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    benefits: [
      '1 visit per month (up to 0.5 hour)',
      'Minor repairs and basic maintenance',
      'Lightbulb replacements and safety checks',
      'Faucet tightening & leak checks',
      'Cabinet hinge adjustment',
      'Basic caulking and door alignment',
      'Priority scheduling',
      'Free annual home inspection'
    ]
  },
  homecare: {
    name: 'HomeCare Plan',
    icon: Crown,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    benefits: [
      '1 visit per month (up to 1 hour)',
      'Everything from Starter Plan',
      'Gutter inspection and seasonal maintenance',
      'Small drywall repairs and touch-ups',
      'Hanging shelves, photos, and curtains',
      'Appliance checks and toilet adjustments',
      '10% off hourly add-ons',
      'Emergency visits with priority booking'
    ]
  },
  priority: {
    name: 'Priority Plan',
    icon: Sparkles,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    benefits: [
      '2 visits per month (up to 2 hours total)',
      'All services from previous plans',
      'Same-week emergency callout',
      'Smart home device setup',
      'TV mounting and furniture assembly',
      'Paint touch-ups and light fixture upgrades',
      'Free consumables included',
      '10% off larger renovation projects'
    ]
  }
};

const WELCOME_FEATURES = [
  {
    icon: Home,
    title: 'Comprehensive Home Services',
    description: 'From minor repairs to major maintenance, we handle it all so you can focus on what matters most.'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book services at your convenience with our easy-to-use platform and priority scheduling options.'
  },
  {
    icon: Shield,
    title: 'Guaranteed Quality',
    description: '100% satisfaction guarantee with professional, vetted service providers and comprehensive insurance coverage.'
  },
  {
    icon: Zap,
    title: 'Instant Support',
    description: 'Get help when you need it with our 24/7 support team and emergency response services.'
  }
];

function WelcomeContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { userLocation, isInBC, isLoading: locationLoading } = useLocation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'starter';
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const selectedPlan = PLAN_INFO[planId as keyof typeof PLAN_INFO] || PLAN_INFO.starter;
  const PlanIcon = selectedPlan.icon;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push(`/login?redirect=${encodeURIComponent(`/welcome?plan=${planId}`)}`);
    }
  }, [isAuthenticated, isLoading, router, planId]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  const handleContinueToPlan = () => {
    console.log('=== Welcome handleContinueToPlan called ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('userLocation:', userLocation);
    console.log('isInBC:', isInBC);
    console.log('locationLoading:', locationLoading);
    console.log('showLocationModal:', showLocationModal);
    
    // If location is still loading, wait
    if (locationLoading) {
      console.log('Location still loading, waiting...');
      return;
    }
    
    // If user is not authenticated, check location first
    if (!isAuthenticated) {
      console.log('User not authenticated, checking location...');
      // If no location is set, show location modal
      if (!userLocation || !isInBC) {
        console.log('No valid location, showing location modal');
        setShowLocationModal(true);
        console.log('Modal should now be open');
        return;
      }
      
      console.log('Location is valid, redirecting to sign up');
      // If location is valid, redirect to sign up
      router.push(`/register?redirect=${encodeURIComponent(`/welcome?plan=${planId}`)}`);
      return;
    }
    
    console.log('User is authenticated, proceeding to subscription');
    // If user is authenticated, proceed to subscription
    router.push(`/pricing/subscribe?plan=${planId}`);
  };

  const handleExploreDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <User className="h-8 w-8" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome to Household Services, {user?.name}! 🎉
                </h1>
                <p className="text-blue-100 text-lg mt-2">
                  You're now part of our community of over 10,000 satisfied members
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-8">
              <CheckCircle className="h-6 w-6 text-green-300" />
              <span className="text-lg font-semibold">Account Created Successfully</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Plan Section */}
      {showPlanDetails && (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${selectedPlan.gradient} flex items-center justify-center mr-4`}>
                  <PlanIcon className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-2xl md:text-3xl text-gray-900">
                    You Selected the {selectedPlan.name} Plan
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Perfect choice for your household needs!</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Plan Benefits */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Gift className="h-6 w-6 text-green-600 mr-2" />
                  What's Included in Your Plan
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {selectedPlan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button 
                  onClick={handleContinueToPlan}
                  size="lg"
                  className={`flex-1 bg-gradient-to-r ${selectedPlan.gradient} text-white font-semibold py-4 text-lg hover:shadow-lg transition-all duration-300`}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Continue with {selectedPlan.name} Plan
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
                <Button 
                  onClick={handleExploreDashboard}
                  variant="outline" 
                  size="lg"
                  className="flex-1 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 py-4 text-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Explore Dashboard First
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Overview */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why You'll Love Our Service
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied customers who trust us with their household needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {WELCOME_FEATURES.map((feature, index) => (
            <Card key={index} className="text-center p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Next Steps Section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Ready to Get You Started? 🚀
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Complete your subscription to unlock all the benefits and start booking services today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleContinueToPlan}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Subscribe to {selectedPlan.name} Plan
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
              
              <Link href="/pricing">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 px-8 py-4 text-lg transition-all duration-300"
                >
                  Compare All Plans
                </Button>
              </Link>
            </div>

            {/* Contact Info */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Need help getting started? Our team is here for you!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>1-800-FIXWELL</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  <span>support@household.services</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>24/7 Support Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={() => {
          // After location is set, redirect to sign up
          router.push(`/register?redirect=${encodeURIComponent(`/welcome?plan=${planId}`)}`);
          setShowLocationModal(false);
        }}
        planName={selectedPlan.name.toLowerCase()}
      />
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading welcome page...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
} 