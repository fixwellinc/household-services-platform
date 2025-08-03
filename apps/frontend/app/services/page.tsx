'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
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
    features: ['Eco-friendly products', 'Satisfaction guaranteed', 'Flexible scheduling'],
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
  const { user, isAuthenticated } = useAuth();
  const { userLocation, userCity, isInBC, setUserLocation } = useLocation();
  const router = useRouter();

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
    
    // If user is authenticated, proceed with booking
    // TODO: Implement booking logic for authenticated users
    console.log('Proceeding with booking for authenticated user');
  }

  const handleViewDetails = (serviceId: string) => {
    console.log('Viewing details for service:', serviceId)
    // TODO: Navigate to service details page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />
        
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-sm">
              <Award className="h-4 w-4" />
              Professional Services
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Our Services
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover our comprehensive range of professional household services. 
              Quality, reliability, and satisfaction guaranteed.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-sm text-gray-600">Expert Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl shadow-sm"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
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
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No services found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Try adjusting your search or filter criteria. We're always adding new services!
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <p className="text-gray-600 text-lg">
                  Showing {filteredServices.length} of {sampleServices.length} services
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Card 
                      key={service.id}
                      className="group relative overflow-hidden transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm"
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
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-purple-200/20" />
                        <div className="text-6xl opacity-20 transition-all duration-500 group-hover:scale-110 rotate-12">
                          <Icon />
                        </div>
                        
                        {/* Floating Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 shadow-lg transition-all duration-300">
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(service.id)}
                            className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-blue-600 shadow-lg transition-all duration-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300 flex items-center gap-2">
                              {service.name}
                              {service.isPopular && <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />}
                            </CardTitle>
                            <CardDescription className="mt-2 text-gray-600 line-clamp-2">
                              {service.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            {service.category}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Service Features */}
                        <div className="space-y-3 mb-6">
                          {service.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Benefits */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Key Benefits
                          </h4>
                          <div className="space-y-1">
                            {service.benefits.map((benefit, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-400 rounded-full" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Service Info */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-blue-500" />
                              {service.estimatedDuration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-4 w-4 text-green-500" />
                              Professional
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                            {service.complexity}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                            onClick={() => handleBook(service.id)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            {isAuthenticated ? 'Book Now' : 'Let\'s Get You Started'}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                            onClick={() => handleViewDetails(service.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Can't find what you're looking for?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We're always expanding our services. Let us know what you need and we'll make it happen!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={() => {
                  if (!isAuthenticated) {
                    if (!userLocation || !isInBC) {
                      setShowLocationModal(true);
                    } else {
                      router.push(`/register?redirect=${encodeURIComponent('/services')}`);
                    }
                  } else {
                    // For authenticated users, maybe redirect to booking or dashboard
                    router.push('/dashboard');
                  }
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                Let's Get You Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 border-2 border-white px-8 py-4 text-lg font-medium"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>
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