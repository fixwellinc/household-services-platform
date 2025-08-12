'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/use-plans';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Gift, 
  Star, 
  ExternalLink, 
  Users, 
  Crown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Percent,
  MapPin,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Business {
  id: string;
  name: string;
  website: string;
  discount: string;
  description: string;
  category: string;
  location?: string;
  phone?: string;
  email?: string;
  image?: string;
}

const BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'Infinite Optical',
    website: 'https://infiniteoptical.ca/',
    discount: 'Up to 20% discount',
    description: 'Professional eye care and eyewear services',
    category: 'Healthcare',
    location: 'Vancouver, BC',
    phone: '+1 (604) 555-0123',
    email: 'info@infiniteoptical.ca',
    image: '/api/placeholder/300/200'
  },
  {
    id: '2',
    name: 'Nutrition Well',
    website: 'https://nutritionwell.ca/',
    discount: 'Up to 10% discount on body scan',
    description: 'Comprehensive nutrition and wellness services',
    category: 'Health & Wellness',
    location: 'Vancouver, BC',
    phone: '+1 (604) 555-0456',
    email: 'hello@nutritionwell.ca',
    image: '/api/placeholder/300/200'
  },
  {
    id: '3',
    name: 'Green Thumb Landscaping',
    website: 'https://greenthumblandscaping.ca/',
    discount: '15% discount on all services',
    description: 'Professional landscaping and garden maintenance',
    category: 'Home & Garden',
    location: 'Burnaby, BC',
    phone: '+1 (604) 555-0789',
    email: 'contact@greenthumblandscaping.ca',
    image: '/api/placeholder/300/200'
  },
  {
    id: '4',
    name: 'TechFix Pro',
    website: 'https://techfixpro.ca/',
    discount: '20% discount on device repair',
    description: 'Computer and mobile device repair services',
    category: 'Technology',
    location: 'Richmond, BC',
    phone: '+1 (604) 555-0321',
    email: 'support@techfixpro.ca',
    image: '/api/placeholder/300/200'
  },
  {
    id: '5',
    name: 'Fresh Start Cleaning',
    website: 'https://freshstartcleaning.ca/',
    discount: '25% discount on first booking',
    description: 'Professional residential and commercial cleaning',
    category: 'Home Services',
    location: 'Surrey, BC',
    phone: '+1 (604) 555-0654',
    email: 'info@freshstartcleaning.ca',
    image: '/api/placeholder/300/200'
  },
  {
    id: '6',
    name: 'FitLife Gym',
    website: 'https://fitlifegym.ca/',
    discount: '30% discount on annual membership',
    description: 'Modern fitness facility with personal training',
    category: 'Fitness',
    location: 'Coquitlam, BC',
    phone: '+1 (604) 555-0987',
    email: 'membership@fitlifegym.ca',
    image: '/api/placeholder/300/200'
  }
];

export default function MembersDiscountPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: userPlanData, isLoading: planLoading } = useUserPlan();
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);

  const isLoading = authLoading || planLoading;
  const isMember = userPlanData?.success && userPlanData?.hasPlan && userPlanData?.subscription?.status === 'ACTIVE';
  const subscription = userPlanData?.subscription;
  const plan = userPlanData?.plan;

  // Show all businesses for non-members, or just member-exclusive ones for members
  const displayedBusinesses = isMember ? BUSINESSES : BUSINESSES.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading member benefits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Gift className="h-16 w-16 text-yellow-300 mr-4" />
              <h1 className="text-5xl font-bold">Members Discount</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8">
              Exclusive savings and special offers from our trusted partner businesses
            </p>
            
            {isMember ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-yellow-300 mr-3" />
                  <span className="text-2xl font-semibold">Active Member Benefits</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                    <span>Plan: {plan?.name || subscription?.tier}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                    <span>Status: Active</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                    <span>All Discounts Available</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-300 mr-3" />
                  <span className="text-2xl font-semibold">Become a Member</span>
                </div>
                <p className="text-blue-100 mb-4">
                  Subscribe to our plans to unlock exclusive member-only discounts and special offers
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3">
                      View Plans
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isMember ? 'Your Exclusive Member Discounts' : 'Available Business Discounts'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isMember 
              ? 'As a valued member, you have access to exclusive discounts from our partner businesses. Show your membership card or mention Fixwell when making purchases.'
              : 'Discover great deals from our partner businesses. Subscribe to our plans to unlock exclusive member-only discounts!'
            }
          </p>
        </div>

        {/* Business Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayedBusinesses.map((business) => (
            <Card key={business.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {business.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {business.category}
                      </Badge>
                      {business.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {business.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {isMember && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="h-3 w-3" />
                      Member
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Discount Badge */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Percent className="h-5 w-5 mr-2" />
                      <span className="font-semibold">{business.discount}</span>
                    </div>
                    {isMember && (
                      <Gift className="h-5 w-5 text-yellow-300" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {business.description}
                </p>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {business.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${business.phone}`} className="hover:text-blue-600">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${business.email}`} className="hover:text-blue-600">
                        {business.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={business.website} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  </Link>
                  {isMember && (
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      <Gift className="h-4 w-4 mr-2" />
                      Get Discount
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show More/Less Button for Non-Members */}
        {!isMember && (
          <div className="text-center">
            <Button
              onClick={() => setShowAllBusinesses(!showAllBusinesses)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              {showAllBusinesses ? (
                <>
                  <EyeOff className="h-5 w-5 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Show All Businesses
                </>
              )}
            </Button>
          </div>
        )}

        {/* Member Benefits Section */}
        {!isMember && (
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Unlock Exclusive Member Benefits
              </h3>
              <p className="text-gray-600">
                Subscribe to our plans and enjoy exclusive discounts, priority service, and more
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Exclusive Discounts</h4>
                <p className="text-sm text-gray-600">
                  Access to member-only deals from partner businesses
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Priority Service</h4>
                <p className="text-sm text-gray-600">
                  Get faster response times and priority booking
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Premium Support</h4>
                <p className="text-sm text-gray-600">
                  Dedicated customer support and personalized service
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold">
                  View Subscription Plans
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* How to Use Section */}
        {isMember && (
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How to Use Your Member Discounts
              </h3>
              <p className="text-gray-600">
                Follow these simple steps to redeem your exclusive member benefits
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact the Business</h4>
                <p className="text-sm text-gray-600">
                  Reach out to the partner business via phone, email, or visit their website
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Mention Fixwell</h4>
                <p className="text-sm text-gray-600">
                  Let them know you're a Fixwell member to access your exclusive discount
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Enjoy Your Savings</h4>
                <p className="text-sm text-gray-600">
                  Receive your discount and enjoy the quality service from our partners
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
