'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { usePlans, useUserPlan, formatPrice, calculateYearlySavings, getDiscountPercentage } from '@/hooks/use-plans';
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
    role: 'Plus Member',
    location: 'Vancouver',
    content: 'The Plus plan has transformed how I manage my household. The priority booking and faster response times make all the difference for my busy schedule.',
    rating: 5,
    avatar: 'SJ',
    savings: '$1,200 saved this year'
  },
  {
    name: 'Michael Chen',
    role: 'Premier Member',
    location: 'Burnaby',
    content: 'As a Premier member, I get the white-glove treatment I expect. My dedicated account manager knows exactly what I need before I even ask.',
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
  { number: '100%', label: 'Satisfaction Guarantee', icon: Shield }
];

export default function PlansSection() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: userPlanData } = useUserPlan();

  const plans = (plansData as any)?.plans || [];
  const userPlan = (userPlanData as any)?.subscription;

  // Debug logging
  if (plans.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Plans data:', plans);
    console.log('User plan:', userPlan);
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
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4 md:mb-6">
            <Award className="h-4 w-4" />
            Choose Your Plan
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Simple, Transparent Plans
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
            Choose the perfect plan for your household needs. All plans include our core services with different levels of convenience and support.
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

          {/* Savings Highlight */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4 md:p-6 lg:p-8 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Save $1,000+ Per Year</h3>
            </div>
            <p className="text-gray-600 text-center mb-4 text-sm md:text-base">
              Our members save an average of $1,000+ annually compared to hiring individual contractors for each service.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span>Lower Mainland service area</span>
              </div>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'year' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingPeriod === 'year' && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plansLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse bg-gray-50">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            plans.map((plan: any) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${
                plan.popular 
                  ? 'ring-2 ring-purple-500 shadow-xl scale-105' 
                  : 'shadow-lg'
              } ${plan.bgColor} ${plan.borderColor}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    <Crown className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${plan.color} mb-3 md:mb-4`}>
                  <plan.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                
                <CardDescription className="text-gray-600 text-sm md:text-base">
                  {plan.description}
                </CardDescription>

                {/* Price */}
                <div className="mt-4 md:mt-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl md:text-4xl font-bold text-gray-900">
                      ${getDiscountedPrice(plan)}
                    </span>
                    <span className="text-gray-500 text-sm md:text-base">/{billingPeriod}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 line-through">
                        ${getOriginalPrice(plan)}/{billingPeriod}
                      </span>
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        Save ${calculateSavings(plan).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                  {billingPeriod === 'year' && (
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      Billed annually (${plan.monthlyPrice}/month)
                    </p>
                  )}
                  {/* Savings */}
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      {plan.savings}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features */}
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {plan.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start gap-2 md:gap-3">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  className={`w-full ${plan.ctaColor} text-white font-semibold py-2 md:py-3 text-base md:text-lg transition-all duration-300 transform hover:scale-105`}
                >
                  <span className="flex items-center gap-2">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>

                {/* Additional Info */}
                <p className="text-xs text-gray-500 text-center mt-3 md:mt-4">
                  {plan.name === 'Premier' ? 'Contact us for custom enterprise solutions' : 'No setup fees • Cancel anytime'}
                </p>
              </CardContent>
            </Card>
          ))
        )}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
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
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Basic</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Plus</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Premier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Response Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">24 hours</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">12 hours</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Same day</td>
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
                    <td className="px-6 py-4 text-center text-sm text-gray-600">10% off</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">20% off</td>
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
              { name: 'Basic', color: 'blue', icon: Star },
              { name: 'Plus', color: 'purple', icon: Crown },
              { name: 'Premier', color: 'amber', icon: Sparkles }
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
                      <p className="text-gray-600">{index === 0 ? '24 hours' : index === 1 ? '12 hours' : 'Same day'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Support</p>
                      <p className="text-gray-600">{index === 0 ? 'Email only' : index === 1 ? 'Phone & Email' : '24/7 Priority'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Service Discount</p>
                      <p className="text-gray-600">{index === 0 ? 'None' : index === 1 ? '10% off' : '20% off'}</p>
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
        <div className="mb-16">
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
    </section>
  );
} 