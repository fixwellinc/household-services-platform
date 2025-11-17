'use client';

import { Wrench, Star, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category?: string;
  complexity?: string;
}

interface ServicesSectionProps {
  className?: string;
}

export default function ServicesSection({ className }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services', {
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }
        const data = await response.json();
        // Get only active services, limit to 6 for homepage
        const activeServices = Array.isArray(data.services) 
          ? data.services
              .filter((s: Service) => s && s.name) // Ensure service exists and has name
              .slice(0, 6)
          : [];
        setServices(activeServices);
        if (activeServices.length === 0 && !error) {
          setError(null); // Clear error if we got empty array but no error
        }
      } catch (err: any) {
        console.error('Error fetching services:', err);
        // Don't set error if it's just a timeout or abort - show empty state gracefully
        if (err.name !== 'AbortError' && err.name !== 'TimeoutError') {
          setError('Failed to load services');
        }
        // Always set empty array on error to prevent crashes
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServices();
  }, []);

  // Helper function to get rating based on service (mock for now)
  const getRating = (serviceName: string) => {
    const ratings: Record<string, number> = {
      'House Cleaning': 4.8,
      'Plumbing Repair': 4.9,
      'Electrical Work': 4.7,
      'Home Organization': 4.6,
    };
    return ratings[serviceName] || 4.5;
  };

  // Helper function to get duration estimate
  const getDuration = (complexity?: string) => {
    switch (complexity) {
      case 'SIMPLE': return '1-2 hours';
      case 'MODERATE': return '2-3 hours';
      case 'COMPLEX': return '3-4 hours';
      default: return '2-3 hours';
    }
  };

  if (isLoading) {
    return (
      <section className={`py-16 bg-gray-50 ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Wrench className="h-4 w-4" />
              Professional Services
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading services...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || services.length === 0) {
    return (
      <section className={`py-16 bg-gray-50 ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Wrench className="h-4 w-4" />
              Professional Services
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {error || 'No services available at the moment'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gray-50 ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Wrench className="h-4 w-4" />
            Professional Services
          </div>
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from our wide range of professional home services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold flex-1">{service.name}</h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{getRating(service.name)}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[3.75rem]">{service.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{getDuration(service.complexity)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>All areas</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-2xl font-bold text-green-600">
                    ${service.basePrice}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}