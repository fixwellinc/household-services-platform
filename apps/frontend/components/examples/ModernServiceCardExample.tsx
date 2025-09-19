'use client';

import { useState } from 'react';
import ModernServiceCard from '../ui/cards/ModernServiceCard';
import { Button } from '../ui/shared';

const sampleServices = [
  {
    id: '1',
    name: 'Premium House Cleaning',
    description: 'Deep cleaning service with eco-friendly products and professional team',
    category: 'CLEANING',
    basePrice: 120,
    complexity: 'EASY',
    features: [
      'Deep cleaning of all rooms',
      'Eco-friendly cleaning products',
      'Insured and bonded professionals',
      'Satisfaction guarantee',
      'Flexible scheduling'
    ],
    rating: 4.9,
    reviewCount: 234,
    estimatedTime: '2-3 hours',
    popularity: 'high' as const,
    contractorPrice: 180,
    savingsPercentage: 33
  },
  {
    id: '2',
    name: 'HVAC Maintenance',
    description: 'Complete heating and cooling system maintenance and inspection',
    category: 'MAINTENANCE',
    basePrice: 89,
    complexity: 'MEDIUM',
    features: [
      'Filter replacement',
      'System inspection',
      'Performance optimization',
      'Safety check'
    ],
    rating: 4.7,
    reviewCount: 156,
    estimatedTime: '1-2 hours',
    popularity: 'medium' as const,
    contractorPrice: 140,
    savingsPercentage: 36
  },
  {
    id: '3',
    name: 'Electrical Repair',
    description: 'Professional electrical troubleshooting and repair services',
    category: 'REPAIR',
    basePrice: 95,
    complexity: 'HARD',
    features: [
      'Licensed electrician',
      'Safety inspection',
      'Code compliance',
      'Emergency service available'
    ],
    rating: 4.8,
    reviewCount: 89,
    estimatedTime: '1-4 hours',
    popularity: 'high' as const,
    contractorPrice: 150,
    savingsPercentage: 37
  },
  {
    id: '4',
    name: 'Home Organization',
    description: 'Professional organizing service for closets, pantries, and storage areas',
    category: 'ORGANIZATION',
    basePrice: 75,
    complexity: 'EASY',
    features: [
      'Custom organization systems',
      'Decluttering assistance',
      'Storage solutions',
      'Maintenance tips'
    ],
    rating: 4.6,
    reviewCount: 67,
    estimatedTime: '2-4 hours',
    popularity: 'low' as const,
    contractorPrice: 110,
    savingsPercentage: 32
  }
];

export default function ModernServiceCardExample() {
  const [selectedVariant, setSelectedVariant] = useState<'standard' | 'featured' | 'compact'>('standard');
  const [showPricingComparison, setShowPricingComparison] = useState(false);

  const handleBook = (serviceId: string) => {
    console.log('Booking service:', serviceId);
    alert(`Booking service ${serviceId}`);
  };

  const handleView = (serviceId: string) => {
    console.log('Viewing service:', serviceId);
    alert(`Viewing details for service ${serviceId}`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Service Cards
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Glassmorphism design with progressive disclosure and interactive elements
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Variant:</span>
              {(['standard', 'featured', 'compact'] as const).map((variant) => (
                <Button
                  key={variant}
                  variant={selectedVariant === variant ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedVariant(variant)}
                  className="capitalize"
                >
                  {variant}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pricing-comparison"
                checked={showPricingComparison}
                onChange={(e) => setShowPricingComparison(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="pricing-comparison" className="text-sm font-medium text-gray-700">
                Show Pricing Comparison
              </label>
            </div>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className={`grid gap-6 ${
          selectedVariant === 'compact' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {sampleServices.map((service, index) => (
            <ModernServiceCard
              key={service.id}
              service={service}
              variant={index === 0 && selectedVariant === 'featured' ? 'featured' : selectedVariant}
              onBook={handleBook}
              onView={handleView}
              showPricingComparison={showPricingComparison}
              className={selectedVariant === 'featured' && index === 0 ? 'relative' : ''}
            />
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Glassmorphism Design
            </h3>
            <p className="text-gray-600 text-sm">
              Semi-transparent backgrounds with backdrop blur effects create a modern, layered appearance.
            </p>
          </div>
          
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Progressive Disclosure
            </h3>
            <p className="text-gray-600 text-sm">
              Expandable sections reveal additional details without overwhelming the initial view.
            </p>
          </div>
          
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Interactive Elements
            </h3>
            <p className="text-gray-600 text-sm">
              Animated icons, hover effects, and micro-interactions enhance user engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}