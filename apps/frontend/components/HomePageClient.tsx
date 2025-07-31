'use client';

import { useServices, useCurrentUser } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
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
  Clock
} from 'lucide-react';
import LocationPromptModal from '@/components/location/LocationPromptModal';
import { useState } from 'react';

export default function HomePageClient() {
  const { isHydrated } = useAuth();
  const { data: userData, isLoading: userLoading } = useCurrentUser(isHydrated);
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { userLocation, userCity, isInBC, isLoading: locationLoading } = useLocation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const user = userData?.user;
  const services = servicesData?.services || [];

  const handleGetStarted = () => {
    console.log('=== HomePageClient handleGetStarted called ===');
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
      router.push(`/register?redirect=${encodeURIComponent('/')}`);
      return;
    }
    
    console.log('User is authenticated, redirecting to dashboard');
    // If user is authenticated, redirect to dashboard
    router.push('/dashboard');
  };

  if (userLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-green-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="h-4 w-4" />
              {isInBC && userCity ? `Trusted by ${userCity} homeowners` : 'Trusted by Lower Mainland homeowners'}
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="w-56 h-56 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                <Image 
                  src="/fixwell.png" 
                  alt="Fixwell Logo" 
                  width={224} 
                  height={224}
                  className="rounded-lg"
                  priority
                />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Your Home,
              <br />
              <span className="text-blue-600">Home Solutions</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Connect with verified professionals for all your household needs. Choose from Starter Plan, HomeCare Plan, or Priority Plan.
            </p>
            
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800">Welcome back, {user.name}!</span>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  {user.role}
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/pricing">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <span className="flex items-center gap-2">
                      View Plans
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" onClick={handleGetStarted}>
                  <span className="flex items-center gap-2">
                    Let's Get You Started
                    <User className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                <div className="text-gray-600 font-medium">Services Available</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl font-bold text-purple-600 mb-2">10k+</div>
                <div className="text-gray-600 font-medium">Happy Members</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                              <div className="text-4xl font-bold text-green-600 mb-2">$1k+</div>
              <div className="text-gray-600 font-medium">Possible Annual Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Wrench className="h-4 w-4" />
              Professional Services
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Professional Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Choose from our wide range of household services, all professionally managed and delivered across the Lower Mainland
            </p>
            
            {/* Cost Comparison Banner */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Contractor Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Fixwell Service</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                💡 <strong>Save up to 40%</strong> compared to traditional contractor rates while getting professional, insured, and guaranteed services
              </p>
            </div>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                // Calculate contractor price and savings based on service category
                const getContractorPrice = (category: string, basePrice: number) => {
                  const multipliers: Record<string, number> = {
                    'CLEANING': 1.8,      // Contractors charge ~80% more
                    'MAINTENANCE': 2.2,   // Contractors charge ~120% more
                    'REPAIR': 2.5,        // Contractors charge ~150% more
                    'ORGANIZATION': 1.6,  // Contractors charge ~60% more
                    'SHOPPING': 1.4,      // Contractors charge ~40% more
                    'OTHER': 1.9          // Contractors charge ~90% more
                  };
                  return Math.round(basePrice * (multipliers[category] || 1.8));
                };

                const contractorPrice = getContractorPrice(service.category, service.basePrice);
                const savings = contractorPrice - service.basePrice;
                const savingsPercentage = Math.round((savings / contractorPrice) * 100);

                return (
                  <Card key={service.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden bg-white">
                    <div className="h-48 bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                      <div className="text-6xl opacity-30 relative z-10">
                        {service.category === 'CLEANING' && <Home />}
                        {service.category === 'MAINTENANCE' && <Wrench />}
                        {service.category === 'REPAIR' && <Zap />}
                        {service.category === 'ORGANIZATION' && <Sparkle />}
                        {service.category === 'SHOPPING' && <Heart />}
                        {service.category === 'OTHER' && <Star />}
                      </div>
                    </div>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors font-bold">
                            {service.name}
                          </CardTitle>
                          <CardDescription className="mt-3 text-gray-600 leading-relaxed">
                            {service.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 font-medium">
                          {service.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Price Comparison */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Contractor Rate:</span>
                          <span className="text-sm line-through text-red-600 font-medium">
                            ${contractorPrice}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Fixwell Rate:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ${service.basePrice}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">You Save:</span>
                          <span className="text-sm font-bold text-green-600">
                            ${savings} ({savingsPercentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Service Benefits */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Professional & Insured</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Satisfaction Guaranteed</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Same-day booking available</span>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="max-w-md mx-auto border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">No services available</h3>
                <p className="text-gray-600 mb-6">
                  Check back soon for amazing new services.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              Why Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We make household services simple, reliable, and hassle-free for Lower Mainland residents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  All our services are professionally managed, thoroughly vetted, and insured for your complete peace of mind across the Lower Mainland.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Quality Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  We stand behind every service. If you&apos;re not 100% satisfied, we&apos;ll make it right or your money back.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Instant Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Book services in minutes with our streamlined platform. No phone calls, no waiting - just instant confirmation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Get Started Today
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied Lower Mainland customers who trust us with their household needs
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 font-medium" 
              onClick={handleGetStarted}
            >
              <span className="flex items-center gap-2">
                Let's Get You Started
                <ArrowRight className="h-5 w-5" />
              </span>
            </Button>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 font-medium transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center gap-2">
                  Browse Services
                  <MapPin className="h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => {
          console.log('LocationPromptModal onClose called');
          setShowLocationModal(false);
        }}
        onLocationSet={() => {
          console.log('LocationPromptModal onLocationSet called');
          // After location is set, redirect to sign up
          router.push(`/register?redirect=${encodeURIComponent('/')}`);
          setShowLocationModal(false);
        }}
        planName="service"
      />
    </div>
  );
} 