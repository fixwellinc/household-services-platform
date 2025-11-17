'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { Zap, Star, Clock, ArrowRight } from 'lucide-react';
import { useServiceHistory } from '@/hooks/use-customer-service-requests';
import { useCreateAppointment } from '@/hooks/use-customer-appointments';
import Link from 'next/link';

interface QuickBookServiceProps {
  onServiceSelect?: (serviceId: string) => void;
}

// Common services for quick booking
const commonServices = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', category: 'REPAIR' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', category: 'REPAIR' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', category: 'CLEANING' },
  { id: 'maintenance', name: 'Maintenance', icon: '🛠️', category: 'MAINTENANCE' },
];

export function QuickBookService({ onServiceSelect }: QuickBookServiceProps) {
  const { data: history } = useServiceHistory({ limit: 5 });
  const createMutation = useCreateAppointment();

  // Get recommended services based on history
  const getRecommendedServices = () => {
    if (!history?.data || history.data.length === 0) {
      return commonServices.slice(0, 4);
    }

    // Get most used service categories from history
    const serviceCounts = new Map<string, number>();
    history.data.forEach((job: any) => {
      const serviceId = job.serviceRequest?.service?.id || 'other';
      serviceCounts.set(serviceId, (serviceCounts.get(serviceId) || 0) + 1);
    });

    // Sort by count and return top services
    const sorted = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return sorted.map(([id]) => {
      const service = commonServices.find(s => s.id === id);
      return service || commonServices[0];
    });
  };

  const recommendedServices = getRecommendedServices();

  const handleQuickBook = (serviceId: string) => {
    if (onServiceSelect) {
      onServiceSelect(serviceId);
    } else {
      // Navigate to booking form with service pre-selected
      window.location.href = `/book-appointment?service=${serviceId}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Quick Book Service
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Book your most common services with one click
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendedServices.map((service) => (
            <Button
              key={service.id}
              variant="outline"
              className="h-auto flex-col p-4 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => handleQuickBook(service.id)}
            >
              <span className="text-3xl mb-2">{service.icon}</span>
              <span className="font-medium">{service.name}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/book-appointment">
              <ArrowRight className="h-4 w-4 mr-2" />
              View All Services
            </Link>
          </Button>
        </div>

        {/* Priority Booking Indicator */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">
              Priority booking available for subscribers
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

