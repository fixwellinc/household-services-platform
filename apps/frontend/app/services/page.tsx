'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useUserPlan } from '@/hooks/use-plans';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Star, 
  Shield, 
  Clock, 
  MapPin, 
  Heart,
  Eye,
  BookOpen,
  Sparkles,
  Zap,
  Home,
  Wrench,
  Sparkle,
  Award,
  CheckCircle,
  ArrowRight,
  Users,
  ThumbsUp,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import LocationPromptModal from '@/components/location/LocationPromptModal';
import QuoteRequestModal from '@/components/QuoteRequestModal';

export const dynamic = 'force-dynamic';

const categories = [
  { id: 'ALL', name: 'All Services', icon: Star, color: 'from-blue-500 to-purple-500' },
  { id: 'CLEANING', name: 'Cleaning', icon: Home, color: 'from-green-500 to-emerald-500' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: Wrench, color: 'from-blue-500 to-cyan-500' },
  { id: 'REPAIR', name: 'Repair', icon: Zap, color: 'from-orange-500 to-red-500' },
  { id: 'ORGANIZATION', name: 'Organization', icon: Sparkle, color: 'from-purple-500 to-pink-500' },

  { id: 'OTHER', name: 'Other', icon: Star, color: 'from-gray-500 to-slate-500' }
];

const sampleServices = [
  {
    id: '1',
    name: 'Deep House Cleaning',
    description: 'Transform your home with our comprehensive cleaning service. Professional attention to every detail, from kitchen to bedrooms.',
    category: 'CLEANING',
    complexity: 'MODERATE' as const,
    estimatedDuration: '3-4 hours',
    isPopular: true,
    features: ['Eco-friendly products', 'Professional quality assurance', 'Flexible scheduling'],
    benefits: ['Healthier living environment', 'More time for family', 'Professional results'],
    icon: Home
  },
  {
    id: '2',
    name: 'Plumbing Repair',
    description: 'Expert plumbing solutions for all your home needs. From minor leaks to major installations, we handle it all.',
    category: 'REPAIR',
    complexity: 'COMPLEX' as const,
    estimatedDuration: '2-3 hours',
    features: ['Licensed professionals', 'Emergency service available', 'Warranty included'],
    benefits: ['Prevent water damage', 'Save on utility bills', 'Peace of mind'],
    icon: Zap
  },
  {
    id: '3',
    name: 'Home Organization',
    description: 'Declutter and organize your space with our professional organization service. Create a more functional and beautiful home.',
    category: 'ORGANIZATION',
    complexity: 'SIMPLE' as const,
    estimatedDuration: '4-6 hours',
    isPopular: true,
    features: ['Custom solutions', 'Donation coordination', 'Storage optimization'],
    benefits: ['Reduced stress', 'Increased productivity', 'Better home flow'],
    icon: Sparkle
  },

  {
    id: '4',
    name: 'HVAC Maintenance',
    description: 'Keep your heating and cooling systems running efficiently with our comprehensive maintenance service.',
    category: 'MAINTENANCE',
    complexity: 'MODERATE' as const,
    estimatedDuration: '2-3 hours',
    features: ['System inspection', 'Filter replacement', 'Performance optimization'],
    benefits: ['Lower energy costs', 'Extended system life', 'Improved air quality'],
    icon: Wrench
  },
  {
    id: '5',
    name: 'Electrical Repair',
    description: 'Safe and reliable electrical services for your home. From troubleshooting to installations, we ensure your safety.',
    category: 'REPAIR',
    complexity: 'COMPLEX' as const,
    estimatedDuration: '3-4 hours',
    features: ['Licensed electricians', 'Safety certified', 'Code compliant'],
    benefits: ['Enhanced safety', 'Reliable power', 'Modern upgrades'],
    icon: Zap
  }
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedService, setSelectedService] = useState<{ id: string; name: string } | null>(null)
  const { user, isAuthenticated } = useAuth();
  const { userLocation, userCity, isInBC, setUserLocation } = useLocation();
  const { data: userPlanData } = useUserPlan();
  const router = useRouter();

  // Check if user is subscribed
  const isSubscribed = userPlanData?.success && userPlanData?.hasPlan && userPlanData?.subscription?.status === 'ACTIVE';

  const filteredServices = sampleServices
    .filter(service => {
      const matchesCategory = selectedCategory === 'ALL' || service.category === selectedCategory
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })

  const handleBook = (serviceId: string) => {
    console.log('Booking service:', serviceId)
    
    // If user is not authenticated, check location first
    if (!isAuthenticated) {
      // If no location is set, show location modal
      if (!userLocation || !isInBC) {
        setShowLocationModal(true);
        return;
      }
      
      // If location is valid, redirect to sign up
      router.push(`/register?redirect=${encodeURIComponent('/services')}`);
      return;
    }
    
    // If user is authenticated, redirect to booking page
    router.push(`/dashboard/customer/book-service?service=${serviceId}`);
  }

  const handleViewDetails = (serviceId: string) => {
    console.log('Opening quote request for service:', serviceId)
    
    // Find the service details
    const service = sampleServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService({ id: serviceId, name: service.name });
      setShowQuoteModal(true);
    } else {
      console.log('Service not found:', serviceId);
    }
  }

  const handleViewServiceDetails = (serviceId: string) => {
    console.log('Viewing details for service:', serviceId)
    
    // Find the service details and navigate to the appropriate page
    const service = sampleServices.find(s => s.id === serviceId);
    if (service) {
      // Map service IDs to their detail page routes based on service names
      const serviceRoutes: { [key: string]: string } = {
        '1': '/services/deep-house-cleaning',      // Deep House Cleaning
        '2': '/services/plumbing-repair',         // Plumbing Repair
        '3': '/services/home-organization',       // Home Organization
        '4': '/services/hvac-maintenance',        // HVAC Maintenance
        '5': '/services/electrical-repair'        // Electrical Repair
      };
      
      const route = serviceRoutes[serviceId];
      if (route) {
        console.log('Navigating to:', route);
        router.push(route);
      } else {
        console.log('No route found for service ID:', serviceId);
        // Fallback to services page if no specific route found
        router.push('/services');
      }
    } else {
      console.log('Service not found:', serviceId);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              Our Services
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Discover our comprehensive range of professional household services. 
              Quality, reliability, and professional excellence assured.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">10K+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">50+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">99%</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-6 sm:py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-6 sm:mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm'
                    }`}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">No services found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                Try adjusting your search or filter criteria. We're always adding new services!
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 px-6 py-2 sm:px-8 sm:py-3"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8 sm:mb-12">
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  Showing {filteredServices.length} of {sampleServices.length} services
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Card 
                      key={service.id}
                      className="group relative overflow-hidden transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                    >
                      {/* Popular Badge */}
                      {service.isPopular && (
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}

                      {/* Header with Icon */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-purple-200/20 dark:from-blue-400/20 dark:to-purple-400/20" />
                        <div className="text-6xl opacity-20 transition-all duration-500 group-hover:scale-110 rotate-12">
                          <Icon />
                        </div>
                        
                        {/* Floating Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 shadow-lg transition-all duration-300">
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(service.id)}
                            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg transition-all duration-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <CardHeader className="pb-4 px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                              {service.name}
                              {service.isPopular && <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-pulse" />}
                            </CardTitle>
                            <CardDescription className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2 text-sm sm:text-base">
                              {service.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs sm:text-sm">
                            {service.category}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                        {/* Service Features */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          {service.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Benefits */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            Key Benefits
                          </h4>
                          <div className="space-y-1">
                            {service.benefits.map((benefit, index) => (
                              <div key={index} className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-400 dark:bg-blue-300 rounded-full" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Service Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                              {service.estimatedDuration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400" />
                              Professional
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-xs sm:text-sm self-start sm:self-auto">
                            {service.complexity}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {!isAuthenticated ? (
                            // Single button for non-authenticated users
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                              onClick={() => {
                                if (!userLocation || !isInBC) {
                                  setShowLocationModal(true);
                                } else {
                                  router.push(`/register?redirect=${encodeURIComponent('/services')}`);
                                }
                              }}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Let's Get You Started
                            </Button>
                          ) : (
                            // Three buttons for authenticated users (considered subscribers)
                            <>
                              <Button 
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                                onClick={() => handleBook(service.id)}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Book Now
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300"
                                onClick={() => handleViewDetails(service.id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Request Quote
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400"
                                onClick={() => handleViewServiceDetails(service.id)}
                                title="View Service Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Can't find what you're looking for?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-6 sm:mb-8">
              We're always expanding our services. Let us know what you need and we'll make it happen!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                onClick={() => {
                  if (!isAuthenticated) {
                    if (!userLocation || !isInBC) {
                      setShowLocationModal(true);
                    } else {
                      router.push(`/register?redirect=${encodeURIComponent('/services')}`);
                    }
                  } else {
                    // For authenticated users, redirect to booking page
                    router.push('/dashboard/customer/book-service');
                  }
                }}
              >
                <Users className="h-4 w-5 mr-2" />
                {isAuthenticated ? 'Book Now' : 'Let\'s Get You Started'}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-white dark:border-gray-800 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium"
                onClick={() => {
                  setSelectedService({ id: 'custom', name: 'Custom Service' });
                  setShowQuoteModal(true);
                }}
              >
                <MessageCircle className="h-4 w-5 mr-2" />
                Request Custom Quote
              </Button>
            </div>
          </div>
        </div>
      </section>
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedService(null);
        }}
        serviceName={selectedService?.name || ''}
        serviceId={selectedService?.id || ''}
      />
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={() => {
          // After location is set, redirect to sign up
          router.push(`/register?redirect=${encodeURIComponent('/services')}`);
          setShowLocationModal(false);
        }}
        planName="service"
      />
    </div>
  )
} 