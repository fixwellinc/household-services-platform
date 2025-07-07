'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from '@/components/ui/shared';
import ServiceCard from '@/components/features/ServiceCard';

const categories = [
  'ALL',
  'CLEANING',
  'MAINTENANCE',
  'REPAIR',
  'ORGANIZATION',
  'SHOPPING',
  'OTHER'
]

const sampleServices = [
  {
    id: '1',
    name: 'Deep House Cleaning',
    description: 'Comprehensive cleaning service including kitchen, bathrooms, living areas, and bedrooms',
    category: 'CLEANING',
    complexity: 'MODERATE' as const,
    basePrice: 120,

    estimatedDuration: '3-4 hours',
    isPopular: true
  },
  {
    id: '2',
    name: 'Plumbing Repair',
    description: 'Expert plumbing services for leaks, clogs, and fixture installations',
    category: 'REPAIR',
    complexity: 'COMPLEX' as const,
    basePrice: 150,

    estimatedDuration: '2-3 hours'
  },
  {
    id: '3',
    name: 'Home Organization',
    description: 'Professional decluttering and organization of closets, garages, and living spaces',
    category: 'ORGANIZATION',
    complexity: 'SIMPLE' as const,
    basePrice: 95,

    estimatedDuration: '4-6 hours',
    isPopular: true
  },
  {
    id: '4',
    name: 'Grocery Shopping',
    description: 'Personal grocery shopping service with delivery to your doorstep',
    category: 'SHOPPING',
    complexity: 'SIMPLE' as const,
    basePrice: 25,

    estimatedDuration: '1-2 hours'
  },
  {
    id: '5',
    name: 'HVAC Maintenance',
    description: 'Regular maintenance and inspection of heating and cooling systems',
    category: 'MAINTENANCE',
    complexity: 'MODERATE' as const,
    basePrice: 180,

    estimatedDuration: '2-3 hours'
  },
  {
    id: '6',
    name: 'Electrical Repair',
    description: 'Electrical troubleshooting, repairs, and fixture installations',
    category: 'REPAIR',
    complexity: 'COMPLEX' as const,
    basePrice: 200,

    estimatedDuration: '3-4 hours'
  }
]

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name')

  const filteredServices = sampleServices
    .filter(service => {
      const matchesCategory = selectedCategory === 'ALL' || service.category === selectedCategory
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.basePrice - b.basePrice
        case 'rating':
          return 0 // Remove rating sort since there are no providers
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleBook = (serviceId: string) => {
    console.log('Booking service:', serviceId)
    // TODO: Implement booking logic
  }

  const handleViewDetails = (serviceId: string) => {
    console.log('Viewing details for service:', serviceId)
    // TODO: Navigate to service details page
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h1>
            <p className="text-xl text-muted-foreground">
              Find the perfect service for your household needs. All services are professionally managed.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'rating')}
                className="border border-input bg-background px-3 py-1 rounded-md text-sm"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>

              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>No services found</CardTitle>
                  <CardDescription>
                    Try adjusting your search or filter criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('ALL')
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-muted-foreground">
                  Showing {filteredServices.length} of {sampleServices.length} services
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onBook={handleBook}
                    onView={handleViewDetails}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Can&apos;t find what you&apos;re looking for?</CardTitle>
              <CardDescription>
                We&apos;re always adding new services. Let us know what you need!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Request a Service
                </Button>
                <Button variant="outline" size="lg">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
} 