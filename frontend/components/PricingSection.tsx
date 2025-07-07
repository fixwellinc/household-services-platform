'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Check, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Sparkles,
  ArrowRight,
  X,
  CheckCircle,
  Award,
  Heart,
  Globe,
  Phone,
  MessageSquare,
  Quote
} from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 9.99,
    period: 'month',
    description: 'Perfect for individual households',
    icon: Star,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      'Access to basic household services',
      'Standard booking system',
      'Email support',
      'Basic service categories',
      'Standard response time (24h)',
      'No booking fees',
      'Service history tracking',
      'Professional service team'
    ],
    popular: false,
    cta: 'Get Started',
    ctaColor: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    name: 'Premium',
    price: 19.99,
    period: 'month',
    description: 'Enhanced features for busy families',
    icon: Crown,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Everything in Basic',
      'Priority booking system',
      'Premium service categories',
      'Faster response time (12h)',
      'Phone & email support',
      'Advanced scheduling options',
      'Service ratings & reviews',
      'Service customization',
      'Recurring service setup',
      'Priority customer support',
      'Service guarantees',
      'Advanced filtering options'
    ],
    popular: true,
    cta: 'Get Started',
    ctaColor: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    name: 'VIP',
    price: 39.99,
    period: 'month',
    description: 'Ultimate convenience for luxury households',
    icon: Sparkles,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    features: [
      'Everything in Premium',
      'Concierge service',
      'Instant booking (2h response)',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom service packages',
      'Premium service team',
      'White-glove service',
      'Service quality guarantees',
      'Flexible scheduling',
      'Premium service categories',
      'Advanced analytics dashboard',
      'Family member management',
      'Integration with smart home',
      'Exclusive events & offers'
    ],
    popular: false,
    cta: 'Get Started',
    ctaColor: 'bg-amber-600 hover:bg-amber-700'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Premium Member',
    content: 'The Premium plan has transformed how I manage my household. The priority booking and faster response times make all the difference for my busy schedule.',
    rating: 5,
    avatar: 'SJ'
  },
  {
    name: 'Michael Chen',
    role: 'VIP Member',
    content: 'As a VIP member, I get the white-glove treatment I expect. My dedicated account manager knows exactly what I need before I even ask.',
    rating: 5,
    avatar: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Basic Member',
    content: 'Perfect for my needs! The Basic plan gives me access to reliable services without breaking the bank. Great value for money.',
    rating: 5,
    avatar: 'ER'
  }
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  const getDiscountedPrice = (price: number) => {
    return billingPeriod === 'year' ? price * 10 : price; // Yearly discount
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Choose Your Plan
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your household needs. All plans include our core services with different levels of convenience and support.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
          {plans.map((plan) => (
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

              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} mb-4`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                
                <CardDescription className="text-gray-600 text-base">
                  {plan.description}
                </CardDescription>

                {/* Price */}
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getDiscountedPrice(plan.price)}
                    </span>
                    <span className="text-gray-500">/{billingPeriod}</span>
                  </div>
                  {billingPeriod === 'year' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Billed annually (${plan.price}/month)
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  className={`w-full ${plan.ctaColor} text-white font-semibold py-3 text-lg transition-all duration-300 transform hover:scale-105`}
                >
                  <span className="flex items-center gap-2">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>

                {/* Additional Info */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  {plan.name === 'VIP' ? 'Contact us for custom enterprise solutions' : 'No setup fees • Cancel anytime'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h3>
            <p className="text-lg text-gray-600">
              See exactly what&apos;s included in each plan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Basic</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Premium</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Response Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">24 hours</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">12 hours</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">2 hours</td>
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
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Premium</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">All + Custom</td>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Members Say
            </h3>
            <p className="text-lg text-gray-600">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <Quote className="h-8 w-8 text-blue-600 mb-4" />
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need a Custom Solution?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We offer enterprise solutions for property management companies, hotels, and large households with custom requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-blue-500">
                <Phone className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 