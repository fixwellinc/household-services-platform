'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import DynamicLocationPromptModal from '@/components/location/DynamicLocationPromptModal';
import { useSearchParams } from 'next/navigation';

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
    role: 'Premium Member',
    location: 'Vancouver',
    content: 'The Premium plan has transformed how I manage my household. The priority booking and faster response times make all the difference for my busy schedule.',
    rating: 5,
    avatar: 'SJ',
    savings: '$1,200 saved this year'
  },
  {
    name: 'Michael Chen',
    role: 'Premium Member',
    location: 'Burnaby',
    content: 'As a Premium member, I get the white-glove treatment I expect. My dedicated account manager knows exactly what I need before I even ask.',
    rating: 5,
    avatar: 'MC',
    savings: '$1,800 saved this year'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Basic Member',
    location: 'Richmond',
    content: 'Perfect for my needs! The Basic plan gives me access to reliable services without breaking the bank. Great value for money.',
    rating: 5,
    avatar: 'ER',
    savings: '$600 saved this year'
  }
];

const stats = [
  { number: '10,000+', label: 'Happy Members', icon: Users },
  { number: '50+', label: 'Service Categories', icon: Wrench },
  { number: '24/7', label: 'Support Available', icon: Clock },
  { number: '100%', label: 'Professional Quality', icon: Shield }
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
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new_user') === 'true';

  // Handle Get in Touch button click
  const handleGetInTouch = () => {
    // If no location is set or not in BC, show location modal
    if (!userLocation || !isInBC) {
      setShowLocationModal(true);
      return;
    }
    
    // If location is valid, redirect to contact page
    router.push('/contact');
  };

  // Helper function to get button text based on authentication status
  const getButtonText = (plan: any) => {
    if (isNewUser) {
      return `Start ${plan.name} Plan - Get Started Today!`;
    }
    
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
    id: 'basic',
    name: 'Basic Plan',
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
    cta: 'CHOOSE BASIC',
    icon: Star
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Monthly help for ongoing maintenance and upkeep. Enhanced services for comprehensive home care.',
    monthlyPrice: 54.99,
    yearlyPrice: 593.89,
    originalPrice: 79.00,
    features: [
      '1 visit per month (up to 1 hour)',
      'Everything from Basic Plan',
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
    <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container-mobile mx-auto">
        {/* Special Message for New Users */}
        {isNewUser && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ready to Choose Your Plan?</h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              You're just one step away from unlocking all the benefits of Fixwell Services. 
              Choose the plan that best fits your needs and start saving on household services today!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg px-4 py-2">
                <span className="text-blue-800 dark:text-blue-200 font-medium">✓ Account Created</span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg px-4 py-2">
                <span className="text-blue-800 dark:text-blue-200 font-medium">✓ Location Verified</span>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-2">
                <span className="text-green-800 dark:text-green-200 font-medium">→ Select Your Plan</span>
              </div>
            </div>
          </div>
        )}

        {/* Header - BCAA Style */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            MEMBERSHIP PLANS
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Choose Your Plan
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 px-4 leading-relaxed">
            Select the perfect plan for your household needs. All plans include our core services with different levels of convenience and support.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.number}</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Savings Highlight - BCAA Style */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8 max-w-2xl mx-auto mb-12 shadow-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Save Up to $1,000+ Per Year</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">
                Our members save up to $1,000+ annually compared to hiring individual contractors for each service. With our subscription model, you get predictable pricing, priority scheduling, and comprehensive coverage across all household needs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">Professional quality assurance</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Lower Mainland service area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Toggle - Enhanced with Always-Visible Savings */}
          <div className="flex flex-col items-center justify-center gap-4 mb-12">
            {/* Savings Badge - Always Visible */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg border-2 border-white/20 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">💰 Save 10% with Annual Billing!</span>
              </div>
            </div>

            {/* Toggle Section */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  billingPeriod === 'year' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Yearly
                </span>
                {billingPeriod === 'year' && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1 font-bold animate-bounce">
                    ✓ ACTIVE
                  </Badge>
                )}
              </div>
            </div>
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
                          <div className="flex flex-col items-center gap-2 mb-3">
                            <span className="text-lg text-white/60 line-through font-medium">
                              Was ${getOriginalPrice(plan)}/{billingPeriod}
                            </span>
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-6 py-3 font-black shadow-2xl rounded-full animate-pulse border-2 border-white/30">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎉</span>
                                <span className="text-lg">Save ${calculateSavings(plan).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {billingPeriod === 'year' && (
                          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg p-3 mt-2 border border-yellow-300/30">
                            <p className="text-lg text-white font-bold">
                              Billed annually (${(plan.monthlyPrice * 0.9).toFixed(2)}/month)
                            </p>
                            <p className="text-sm text-yellow-100 font-medium">
                              💰 Save ${((plan.monthlyPrice * 12) - (plan.monthlyPrice * 0.9 * 12)).toFixed(2)} per year!
                            </p>
                          </div>
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
                          
                          // All prerequisites met, proceed to Stripe payment
                          router.push(`/pricing/stripe-payment?plan=${plan.id}`);
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
                          <div className="flex flex-col items-center gap-2 mb-3">
                            <span className="text-lg text-white/60 line-through font-medium">
                              Was ${getOriginalPrice(plan)}/{billingPeriod}
                            </span>
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-6 py-3 font-black shadow-2xl rounded-full animate-pulse border-2 border-white/30">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎉</span>
                                <span className="text-lg">Save ${calculateSavings(plan).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {billingPeriod === 'year' && (
                          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg p-3 mt-2 border border-yellow-300/30">
                            <p className="text-lg text-white font-bold">
                              Billed annually (${(plan.monthlyPrice * 0.9).toFixed(2)}/month)
                            </p>
                            <p className="text-sm text-yellow-100 font-medium">
                              💰 Save ${((plan.monthlyPrice * 12) - (plan.monthlyPrice * 0.9 * 12)).toFixed(2)} per year!
                            </p>
                          </div>
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
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Starter</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Home Care</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Response Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Up to 48 hrs</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Up to 24 hrs</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Up to 12 hrs</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Customer Support</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Email only</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Phone & Email</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">24/7 Priority</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Service Categories</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Basic</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Extended</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">All + Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Service Discount</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">None</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Up to 10%</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Up to 20%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Account Manager</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Concierge Service</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Emergency Call-out</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Standard rate</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Standard rate</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">Free</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">Quality Assurance</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
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
              <Card key={index} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 flex items-center justify-center`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name} Plan</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Key features and benefits</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Response Time</p>
                      <p className="text-gray-600 dark:text-gray-400">{index === 0 ? 'Up to 48 hrs' : index === 1 ? 'Up to 24 hrs' : 'Up to 12 hrs'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Support</p>
                      <p className="text-gray-600 dark:text-gray-400">{index === 0 ? 'Email only' : index === 1 ? 'Phone & Email' : '24/7 Priority'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Service Discount</p>
                      <p className="text-gray-600 dark:text-gray-400">{index === 0 ? 'None' : index === 1 ? 'Up to 10%' : 'Up to 20%'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Account Manager</p>
                      <p className="text-gray-600 dark:text-gray-400">{index === 2 ? '✓ Included' : '✗ Not included'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Our Members Say
            </h3>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Join thousands of satisfied households
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 md:mb-4 text-sm md:text-base leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{testimonial.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{testimonial.role} • {testimonial.location}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                    <p className="text-green-700 dark:text-green-300 text-xs font-medium">{testimonial.savings}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Members Discount Preview */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 md:p-8 border border-green-200 dark:border-green-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                🎁 Exclusive Member Discounts
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Subscribe to any plan and unlock exclusive savings from our partner businesses
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-green-200 dark:border-green-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">10%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Infinite Optical</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Eye care & eyewear</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-green-200 dark:border-green-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">10%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Nutrition Well</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Body scan services</div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/members-discount">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3">
                  View All Member Discounts
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 lg:p-8 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 md:mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base">
              Join thousands of satisfied households who trust us with their home services. Start saving today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button 
                onClick={handleGetInTouch}
                variant="outline" 
                size="lg" 
                className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-sm md:text-base py-3 md:py-4"
              >
                <Phone className="h-4 w-4 mr-2" />
                Get in Touch
              </Button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-6 text-xs text-gray-500 dark:text-gray-400">
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
      <DynamicLocationPromptModal
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
