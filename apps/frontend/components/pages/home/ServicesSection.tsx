'use client';

import { useServices } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/shared';
import ModernServiceCard from '@/components/ui/cards/ModernServiceCard';
import { ProgressiveReveal } from '@/components/ui/animations/ProgressiveReveal';
import { StaggeredGrid } from '@/components/ui/animations/StaggeredGrid';
import { Wrench, Star } from 'lucide-react';

interface ServicesSectionProps {
  className?: string;
}

export default function ServicesSection({ className }: ServicesSectionProps) {
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const router = useRouter();

  const services = servicesData?.services || [];

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

  return (
    <section className={`py-20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 ${className || ''}`}>
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
              const contractorPrice = getContractorPrice(service.name, service.category, service.basePrice);
              const savings = contractorPrice - service.basePrice;
              const savingsPercentage = Math.round((savings / contractorPrice) * 100);

              // Determine if this should be a featured card (every 3rd card)
              const isFeatured = index % 3 === 1;
              
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
  );
}