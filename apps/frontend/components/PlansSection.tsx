'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { usePlans, useUserPlan, formatPrice, calculateYearlySavings, getDiscountPercentage } from '@/hooks/use-plans';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  Star, 
  Crown, 
  Sparkles,
  ArrowRight,
  X,
  CheckCircle,
  Award,
  Phone,
  MessageSquare,
  Quote,
  Shield,
  Clock,
  Users,
  Zap,
  Home,
  Wrench,
  Heart,
  TrendingUp,
  Clock as ClockIcon,
  MapPin,
  Truck
} from 'lucide-react';
import { useSubscriptionPrerequisites } from '@/hooks/use-subscription-prerequisites';
import { toast } from 'sonner';
import LocationPromptModal from '@/components/location/LocationPromptModal';

// Icon mapping for plans
const getPlanIcon = (iconName: string) => {
  switch (iconName) {
    case 'star': return Star;
    case 'crown': return Crown;
    case 'sparkles': return Sparkles;
    default: return Star;
  }
};

// Color mapping for plans
const getPlanColors = (colorName: string) => {
  switch (colorName) {
    case 'blue':
      return {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700'
      };
    case 'purple':
      return {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700'
      };
    case 'amber':
      return {
        gradient: 'from-amber-500 to-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        button: 'bg-amber-600 hover:bg-amber-700'
      };
    default:
      return {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700'
      };
  }
};

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Home Care Member',
    location: 'Vancouver',
    content: 'The Home Care plan has transformed how I manage my household. The priority booking and faster response times make all the difference for my busy schedule.',
    rating: 5,
    avatar: 'SJ',
    savings: '$1,200 saved this year'
  },
  {
    name: 'Michael Chen',
    role: 'Priority Member',
    location: 'Burnaby',
    content: 'As a Priority member, I get the white-glove treatment I expect. My dedicated account manager knows exactly what I need before I even ask.',
    rating: 5,
    avatar: 'MC',
    savings: '$1,800 saved this year'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Starter Member',
    location: 'Richmond',
    content: 'Perfect for my needs! The Starter plan gives me access to reliable services without breaking the bank. Great value for money.',
    rating: 5,
    avatar: 'ER',
    savings: '$600 saved this year'
  }
];

const stats = [
  { number: '10,000+', label: 'Happy Members', icon: Users },
  { number: '50+', label: 'Service Categories', icon: Wrench },
  { number: '24/7', label: 'Support Available', icon: Clock },
  { number: '100%', label: 'Satisfaction Guarantee', icon: Shield }
];

export default function PlansSection() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: userPlanData, error: userPlanError } = useUserPlan();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPlanForLocation, setSelectedPlanForLocation] = useState<any>(null);
  const router = useRouter();
  const prerequisites = useSubscriptionPrerequisites();
  const { isAuthenticated } = useAuth();
  const { userLocation, isInBC } = useLocation();

  // Helper function to get button text based on authentication status
  const getButtonText = (plan: any) => {
    if (!prerequisites.isAuthenticated) {
      return 'Let\'s Get You Started';
    }
    
    // For authenticated users, show the plan-specific text
    return plan.cta || (
      plan.name === 'Basic' ? 'Choose Basic' : 
      plan.name === 'Plus' ? 'Choose Plus' : 
      plan.name === 'Premier' ? 'Choose Premier' : 
      'Choose Plan'
    );
  };

  // Fallback plans in case API fails
  const fallbackPlans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      description: 'Perfect for light upkeep & peace of mind. Monthly maintenance visits to keep your home in top condition.',
      monthlyPrice: 21.99,
      yearlyPrice: 237.49,
      originalPrice: 49.00,
      features: [
        '1 visit per month (up to 0.5 hour)',
        'Minor repairs (squeaky doors, loose handles)',
        'Lightbulb replacements',
        'Smoke detector battery checks',
        'Faucet tightening & leak checks',
        'Cabinet hinge adjustment',
        'Basic caulking (kitchen/bathroom)',
        'Door alignment & lubrication',
        'Home safety check (visual)',
        'Priority scheduling',
        'Free annual home inspection',
        'Access to discounted upgrade services'
      ],
      savings: 'Peace of mind maintenance',
      popular: false,
      cta: 'CHOOSE STARTER',
      icon: Star
    },
    {
      id: 'homecare',
      name: 'HomeCare Plan',
      description: 'Monthly help for ongoing maintenance and upkeep. Enhanced services for comprehensive home care.',
      monthlyPrice: 54.99,
      yearlyPrice: 593.89,
      originalPrice: 79.00,
      features: [
        '1 visit per month (up to 1 hour)',
        'Everything from Starter Plan',
        'Gutter inspection/clearing (ground floor)',
        'Seasonal maintenance (weatherstripping, window sealing)',
        'Small drywall repairs or touch-ups',
        'Power outlet/switch inspection',
        'Hanging shelves, photos, curtains',
        'Appliance checks (wobbling, leaks, noise)',
        'Toilet tank/flush adjustments',
        'Exterior door & lock tune-ups',
        '10% off hourly add-ons or larger projects',
        'Seasonal home maintenance reminders',
        'Emergency visits at standard rate (priority booking)'
      ],
      savings: 'Professional monthly maintenance',
      popular: true,
      cta: 'CHOOSE HOMECARE',
      icon: Crown
    },
    {
      id: 'priority',
      name: 'Priority Plan',
      description: 'For homeowners who want their home proactively managed. Complete home management with premium benefits.',
      monthlyPrice: 120.99,
      yearlyPrice: 1306.69,
      originalPrice: 199.00,
      features: [
        '2 visits per month (up to 2 hours total)',
        'All services from Starter + HomeCare Plans',
        'Same-week emergency callout (1 per quarter)',
        'Full-home "fix-it list" checkup every visit',
        'Smart home device setup (doorbells, cameras, thermostats)',
        'TV mounting, shelf and curtain installations',
        'Basic furniture assembly',
        'Window screen replacement/repair',
        'Interior door planing or sticking fixes',
        'Paint touch-ups (up to 1 wall/surface per visit)',
        'Light fixture replacement/upgrade',
        'Tile regrouting (small areas)',
        '10% off larger renovations or handyman jobs',
        'Free consumables: caulk, screws, anchors, silicone',
        'Early access to Fixwell promos and partner perks'
      ],
      savings: 'Complete home management',
      popular: false,
      cta: 'CHOOSE PRIORITY',
      icon: Sparkles
    }
  ];

  const plans = (plansData as any)?.plans || fallbackPlans;
  const userPlan = (userPlanData as any)?.subscription;

  // Debug logging - only log if there's an error or if user plan data exists
  if (process.env.NODE_ENV === 'development') {
    console.log('Plans data:', plans);
    console.log('Plans loading:', plansLoading);
    console.log('User plan:', userPlan);
    if (userPlanError) {
      console.log('User plan error:', userPlanError);
    }
  }

  const getDiscountedPrice = (plan: any) => {
    if (billingPeriod === 'year') {
      return plan.yearlyPrice;
    }
    return plan.monthlyPrice;
  };

  const getOriginalPrice = (plan: any) => {
    if (billingPeriod === 'year') {
      return plan.originalPrice * 12; // Yearly original price
    }
    return plan.originalPrice;
  };

  const calculateSavings = (plan: any) => {
    const original = getOriginalPrice(plan);
    const discounted = getDiscountedPrice(plan);
    return original - discounted;
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container-mobile mx-auto">
        {/* Header - BCAA Style */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            MEMBERSHIP PLANS
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 px-4 leading-relaxed">
            Select the perfect plan for your household needs. All plans include our core services with different levels of convenience and support.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{stat.number}</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Savings Highlight - BCAA Style */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 max-w-2xl mx-auto mb-12 shadow-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Save $1,000+ Per Year</h3>
              </div>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                Our members save an average of $1,000+ annually compared to hiring individual contractors for each service.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>Lower Mainland service area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Toggle - BCAA Style */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                billingPeriod === 'year' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                  billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingPeriod === 'year' && (
              <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                Save 10%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Cards - BCAA Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plansLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse bg-blue-600 h-96">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-full mb-4"></div>
                  <div className="h-12 bg-white/20 rounded w-1/2 mx-auto"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-4 bg-white/20 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : plans && plans.length > 0 ? (
            plans.map((plan: any) => {
              // Define background colors for each plan with gradients
              const getPlanBackground = (planName: string) => {
                switch (planName.toLowerCase()) {
                  case 'basic':
                    return 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800';
                  case 'plus':
                    return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800';
                  case 'premier':
                    return 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900';
                  default:
                    return 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900';
                }
              };

              return (
                <Card 
                  key={plan.name}
                  className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${getPlanBackground(plan.name)} h-full flex flex-col text-white border-0 shadow-xl`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 left-4 transform -rotate-12 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-xs font-bold rounded-full shadow-lg border-2 border-white/20">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                  </div>

                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    {/* Plan Name */}
                    <div className="mb-8">
                      <CardTitle className="text-4xl font-bold text-white mb-4 tracking-tight">
                        {plan.name}
                      </CardTitle>
                      
                      <CardDescription className="text-white/90 text-base leading-relaxed mb-6 max-w-xs mx-auto">
                        {plan.description}
                      </CardDescription>
                    </div>

                    {/* Price Section - Enhanced BCAA Style */}
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-inner">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-3">
                          <span className="text-5xl font-black text-white">
                            ${getDiscountedPrice(plan)}
                          </span>
                          <span className="text-white/80 text-lg font-medium">/{billingPeriod}</span>
                        </div>
                        {plan.originalPrice && (
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <span className="text-lg text-white/60 line-through font-medium">
                              ${getOriginalPrice(plan)}/{billingPeriod}
                            </span>
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-sm px-4 py-2 font-bold shadow-lg">
                              Save ${calculateSavings(plan).toFixed(2)}
                            </Badge>
                          </div>
                        )}
                        {billingPeriod === 'year' && (
                          <p className="text-sm text-white/70 font-medium">
                            Billed annually (${plan.monthlyPrice}/month)
                          </p>
                        )}
                        {/* Savings Badge */}
                        <div className="mt-4">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-sm px-4 py-2 font-bold shadow-lg">
                            {plan.savings}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex-1 flex flex-col relative z-10">
                    {/* Features List */}
                    <div className="flex-1">
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature: string, featureIndex: number) => (
                          <li key={featureIndex} className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                            <span className="text-white/95 text-sm leading-relaxed font-medium group-hover:text-white transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-auto">
                      {/* CTA Button */}
                      <Button
                        variant="outline"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 text-lg border-none transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 rounded-xl shadow-lg"
                        aria-label={`Select the ${plan.name} plan`}
                        disabled={loadingPlan === plan.id}
                        onClick={async () => {
                          setLoadingPlan(plan.id);
                          
                          // If user is not authenticated, check location first
                          if (!isAuthenticated) {
                            // If no location is set, show location modal
                            if (!userLocation || !isInBC) {
                              setSelectedPlanForLocation(plan);
                              setShowLocationModal(true);
                              setLoadingPlan(null);
                              return;
                            }
                            
                            // If location is valid, redirect to sign up
                            router.push(`/register?redirect=${encodeURIComponent('/pricing')}`);
                            setLoadingPlan(null);
                            return;
                          }
                          
                          // Check prerequisites before proceeding for authenticated users
                          const canProceed = await prerequisites.checkAndRedirect(plan.id);
                          
                          if (!canProceed) {
                            setLoadingPlan(null);
                            // Show appropriate message based on what's missing
                            if (!prerequisites.hasValidLocation) {
                              // Show location modal instead of just a toast
                              setSelectedPlanForLocation(plan);
                              setShowLocationModal(true);
                            }
                            return;
                          }
                          
                          // All prerequisites met, proceed to subscription
                          router.push(`/pricing/subscribe?plan=${plan.id}`);
                        }}
                      >
                        {loadingPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            Loading...
                          </span>
                        ) : (
                          getButtonText(plan)
                        )}
                      </Button>

                      {/* Additional Info */}
                      <p className="text-xs text-white/70 text-center mt-4 font-medium">
                        {plan.name === 'Premier' ? 'Contact us for custom enterprise solutions' : 'No setup fees • Cancel anytime'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Error state - show fallback plans
            fallbackPlans.map((plan: any) => {
              const getPlanBackground = (planName: string) => {
                switch (planName.toLowerCase()) {
                  case 'basic':
                    return 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800';
                  case 'plus':
                    return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800';
                  case 'premier':
                    return 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900';
                  default:
                    return 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900';
                }
              };

              return (
                <Card 
                  key={plan.name}
                  className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${getPlanBackground(plan.name)} h-full flex flex-col text-white border-0 shadow-xl`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 left-4 transform -rotate-12 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-xs font-bold rounded-full shadow-lg border-2 border-white/20">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                  </div>

                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    {/* Plan Name */}
                    <div className="mb-8">
                      <CardTitle className="text-4xl font-bold text-white mb-4 tracking-tight">
                        {plan.name}
                      </CardTitle>
                      
                      <CardDescription className="text-white/90 text-base leading-relaxed mb-6 max-w-xs mx-auto">
                        {plan.description}
                      </CardDescription>
                    </div>

                    {/* Price Section - Enhanced BCAA Style */}
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-inner">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-3">
                          <span className="text-5xl font-black text-white">
                            ${getDiscountedPrice(plan)}
                          </span>
                          <span className="text-white/80 text-lg font-medium">/{billingPeriod}</span>
                        </div>
                        {plan.originalPrice && (
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <span className="text-lg text-white/60 line-through font-medium">
                              ${getOriginalPrice(plan)}/{billingPeriod}
                            </span>
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-sm px-4 py-2 font-bold shadow-lg">
                              Save ${calculateSavings(plan).toFixed(2)}
                            </Badge>
                          </div>
                        )}
                        {billingPeriod === 'year' && (
                          <p className="text-sm text-white/70 font-medium">
                            Billed annually (${plan.monthlyPrice}/month)
                          </p>
                        )}
                        {/* Savings Badge */}
                        <div className="mt-4">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-sm px-4 py-2 font-bold shadow-lg">
                            {plan.savings}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex-1 flex flex-col relative z-10">
                    {/* Features List */}
                    <div className="flex-1">
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature: string, featureIndex: number) => (
                          <li key={featureIndex} className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                            <span className="text-white/95 text-sm leading-relaxed font-medium group-hover:text-white transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-auto">
                      {/* CTA Button */}
                      <Button 
                        variant="outline"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 text-lg border-none transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 rounded-xl shadow-lg"
                        aria-label={`Select the ${plan.name} plan`}
                        disabled={loadingPlan === plan.id}
                        onClick={async () => {
                          setLoadingPlan(plan.id);
                          
                          // If user is not authenticated, check location first
                          if (!isAuthenticated) {
                            // If no location is set, show location modal
                            if (!userLocation || !isInBC) {
                              setSelectedPlanForLocation(plan);
                              setShowLocationModal(true);
                              setLoadingPlan(null);
                              return;
                            }
                            
                            // If location is valid, redirect to sign up
                            router.push(`/register?redirect=${encodeURIComponent('/pricing')}`);
                            setLoadingPlan(null);
                            return;
                          }
                          
                          // Check prerequisites before proceeding for authenticated users
                          const canProceed = await prerequisites.checkAndRedirect(plan.id);
                          
                          if (!canProceed) {
                            setLoadingPlan(null);
                            // Show appropriate message based on what's missing
                            if (!prerequisites.hasValidLocation) {
                              // Show location modal instead of just a toast
                              setSelectedPlanForLocation(plan);
                              setShowLocationModal(true);
                            }
                            return;
                          }
                          
                          // All prerequisites met, proceed to subscription
                          router.push(`/pricing/subscribe?plan=${plan.id}`);
                        }}
                      >
                        {loadingPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            Loading...
                          </span>
                        ) : (
                          getButtonText(plan)
                        )}
                      </Button>

                      {/* Additional Info */}
                      <p className="text-xs text-white/70 text-center mt-4 font-medium">
                        {plan.name === 'Premier' ? 'Contact us for custom enterprise solutions' : 'No setup fees • Cancel anytime'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16 md:mt-20">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h3>
            <p className="text-base md:text-lg text-gray-600">
              See exactly what&apos;s included in each plan
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Home Care</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Response Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Up to 48 hrs</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Up to 24 hrs</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Up to 12 hrs</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Customer Support</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Email only</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Phone & Email</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">24/7 Priority</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Service Categories</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Basic</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Extended</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">All + Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Service Discount</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">None</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Up to 10%</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Up to 20%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Account Manager</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Concierge Service</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Emergency Call-out</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Standard rate</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Standard rate</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Free</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Money-back Guarantee</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden space-y-6">
            {[
              { name: 'Starter', color: 'blue', icon: Star },
              { name: 'Home Care', color: 'purple', icon: Crown },
              { name: 'Priority', color: 'amber', icon: Sparkles }
            ].map((plan, index) => (
              <Card key={index} className="bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 flex items-center justify-center`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{plan.name} Plan</h4>
                      <p className="text-sm text-gray-600">Key features and benefits</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-gray-600">{index === 0 ? 'Up to 48 hrs' : index === 1 ? 'Up to 24 hrs' : 'Up to 12 hrs'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Support</p>
                      <p className="text-gray-600">{index === 0 ? 'Email only' : index === 1 ? 'Phone & Email' : '24/7 Priority'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Service Discount</p>
                      <p className="text-gray-600">{index === 0 ? 'None' : index === 1 ? 'Up to 10%' : 'Up to 20%'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Account Manager</p>
                      <p className="text-gray-600">{index === 2 ? '✓ Included' : '✗ Not included'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {index === 0 ? 'Essential services for everyday needs' : 
                       index === 1 ? 'Enhanced features for busy families' : 
                       'Ultimate convenience for luxury households'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16 mt-16">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              What Our Members Say
            </h3>
            <p className="text-base md:text-lg text-gray-600">
              Join thousands of satisfied households
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{testimonial.name}</p>
                      <p className="text-gray-500 text-xs truncate">{testimonial.role} • {testimonial.location}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-green-700 text-xs font-medium">{testimonial.savings}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base">
              Join thousands of satisfied households who trust us with their home services. Start saving today with our 30-day money-back guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-blue-500 text-sm md:text-base py-3 md:py-4">
                <Phone className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base py-3 md:py-4">
                <MessageSquare className="h-4 w-4 mr-2" />
                Schedule Demo
              </Button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>30-day guarantee</span>
              </div>
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Lower Mainland service</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedPlanForLocation(null);
        }}
        onLocationSet={() => {
          // After location is set, redirect to sign up
          router.push(`/register?redirect=${encodeURIComponent('/pricing')}`);
          setShowLocationModal(false);
          setSelectedPlanForLocation(null);
        }}
        planName={selectedPlanForLocation?.name?.toLowerCase() || "plan"}
      />
    </section>
  );
} 