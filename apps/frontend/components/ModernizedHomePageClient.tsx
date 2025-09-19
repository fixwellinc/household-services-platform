'use client';

import { useServices, useCurrentUser } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { EnhancedHeroSection } from '@/components/ui/hero/EnhancedHeroSection';
import ModernServiceCard from '@/components/ui/cards/ModernServiceCard';
import { ProgressiveReveal } from '@/components/ui/animations/ProgressiveReveal';
import { StaggeredGrid } from '@/components/ui/animations/StaggeredGrid';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  User,
  Star,
  Shield,
  Sparkles,
  Home,
  Wrench,
  Zap,
  Sparkle,
  Heart,
  Loader2,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ModernizedHomePageClient() {
  const { isHydrated } = useAuth();
  const { data: userData, isLoading: userLoading } = useCurrentUser(isHydrated);
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { userLocation, userCity, isInBC, isLoading: locationLoading } = useLocation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const user = userData?.user;
  const services = servicesData?.services || [];

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <EnhancedHeroSection 
        variant="gradient-mesh"
        showStats={true}
        showTrustIndicators={true}
      />

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <ProgressiveReveal delay={200}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Wrench className="h-4 w-4" />
                Professional Services
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Professional Services
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
                Choose from our wide range of household services, all professionally managed and delivered across the Lower Mainland
              </p>
              
              {/* Cost Comparison Banner */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contractor Average</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fixwell Service</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  💡 <strong>Save up to 40%</strong> compared to traditional contractor rates while getting professional, insured, and reliable services
                </p>
              </div>
            </div>
          </ProgressiveReveal>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length > 0 ? (
            <StaggeredGrid
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              staggerDelay={100}
            >
              {services.map((service, index) => {
                // Calculate contractor price and savings based on service category
                const getContractorPrice = (serviceName: string, category: string, basePrice: number) => {
                  // Special case for Plumbing Repair - fixed contractor rate
                  if (serviceName === 'Plumbing Repair') {
                    return 250;
                  }
                  
                  // Special case for Home Organization - fixed contractor rate
                  if (serviceName === 'Home Organization') {
                    return 150;
                  }
                  
                  // For other services, use the multiplier system
                  const multipliers: Record<string, number> = {
                    'CLEANING': 1.67,     // ~40% savings
                    'MAINTENANCE': 1.67,  // ~40% savings
                    'REPAIR': 1.67,       // ~40% savings
                    'ORGANIZATION': 1.67, // ~40% savings
                    'OTHER': 1.67         // ~40% savings
                  };
                  return Math.round(basePrice * (multipliers[category] || 1.67));
                };

                const contractorPrice = getContractorPrice(service.name, service.category, service.basePrice);
                const savings = contractorPrice - service.basePrice;
                const savingsPercentage = Math.round((savings / contractorPrice) * 100);

                // Determine if this should be a featured card (every 3rd card or high popularity)
                const isFeatured = index % 3 === 1 || service.popularity === 'high';
                
                // Enhanced service object with additional properties for ModernServiceCard
                const enhancedService = {
                  ...service,
                  contractorPrice,
                  savingsPercentage,
                  rating: 4.8, // Default rating
                  reviewCount: Math.floor(Math.random() * 200) + 50, // Random review count
                  estimatedTime: service.category === 'CLEANING' ? '2-3 hours' : 
                                service.category === 'REPAIR' ? '1-2 hours' :
                                service.category === 'MAINTENANCE' ? '1-4 hours' : '2-4 hours',
                  popularity: isFeatured ? 'high' as const : 'medium' as const,
                  features: [
                    'Professional & Insured Service',
                    'Same-day booking available',
                    'Quality guarantee included',
                    'Local Lower Mainland professionals',
                    'Transparent pricing with no hidden fees'
                  ]
                };

                return (
                  <ModernServiceCard
                    key={service.id}
                    service={enhancedService}
                    variant={isFeatured ? 'featured' : 'standard'}
                    showPricingComparison={true}
                    onBook={() => router.push('/register')}
                    onView={() => router.push(`/services/${service.id}`)}
                  />
                );
              })}
            </StaggeredGrid>
          ) : (
            <Card className="max-w-md mx-auto border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">No services available</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Check back soon for amazing new services.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <ProgressiveReveal delay={300}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Why Choose Us
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Why Choose Us?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
                While other platforms focus on contracts, We focus on you.
              </p>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We make household services simple, reliable, and hassle-free for Lower Mainland residents
              </p>
            </div>
          </ProgressiveReveal>

          <StaggeredGrid
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            staggerDelay={150}
          >
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  All our services are professionally managed, thoroughly vetted, and insured for your complete peace of mind across the Lower Mainland.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Quality Assured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We stand behind every service with our professional quality assurance. Our team of verified experts ensures exceptional results every time.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Instant Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Book services in minutes with our streamlined platform. No phone calls, no waiting - just instant confirmation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Save Up to 40%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get professional quality at contractor rates. Save up to 40% compared to traditional contractor prices while getting better service and quality assurance.
                </p>
              </CardContent>
            </Card>
          </StaggeredGrid>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-700 dark:via-purple-700 dark:to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <ProgressiveReveal delay={400}>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Get Started Today
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied Lower Mainland customers who trust us with their household needs
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-100 dark:text-blue-700 dark:hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 font-medium" 
              >
                <span className="flex items-center gap-2">
                  Let's Get You Started
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white px-8 py-4 font-medium transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center gap-2">
                  Browse Services
                  <MapPin className="h-5 w-5" />
                </span>
              </Button>
            </Link>
            </div>
          </ProgressiveReveal>
        </div>
      </section>
    </div>
  );
}