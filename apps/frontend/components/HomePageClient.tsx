'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useServices, useCurrentUser } from '@/hooks/use-api';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { formatPrice } from '@/lib/utils';
import PricingSection from '@/components/PricingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import { 
  Loader2, 
  User, 
  Shield, 
  Star, 
  CheckCircle, 

  MapPin, 
  Sparkles,
  ArrowRight,
  Home,
  Wrench,
  Sparkle,
  Heart,
  Zap
} from 'lucide-react';

export default function HomePageClient() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const [isHydrated, setIsHydrated] = useState(false);

  const user = userData?.user;
  const services = servicesData?.services || [];

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Trusted by thousands of fixwells
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Your Home,
              <br />
              <span className="text-blue-600">Our Expertise</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with verified professionals for all your fixwell needs. 
              From cleaning to repairs, we&apos;ve got you covered.
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
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <span className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
                    <span className="flex items-center gap-2">
                      Sign In
                      <User className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                <div className="text-gray-600">Services Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10k+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of fixwell services, all professionally managed and delivered
            </p>
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
              {services.map((service) => (
                <Card key={service.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <div className="text-6xl opacity-20">
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
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-600">
                          {service.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                        {service.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatPrice(service.basePrice)}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {service.complexity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Professional Service</span>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make fixwell services simple, reliable, and hassle-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  All our services are professionally managed, thoroughly vetted, and insured for your complete peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Quality Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  We stand behind every service. If you&apos;re not 100% satisfied, we&apos;ll make it right or your money back.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Instant Booking</CardTitle>
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their fixwell needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                <span className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <span className="flex items-center gap-2">
                  Browse Services
                  <MapPin className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 