'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/shared';
import { Badge, Button } from '@/components/ui/shared';
import { Calendar, Clock, MapPin, Edit, X } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: {
    id: string;
    scheduledDate: string;
    duration?: number;
    status: string;
    propertyAddress?: string;
    notes?: string;
    serviceType?: {
      displayName?: string;
      name?: string;
    };
  };
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function AppointmentCard({ 
  appointment, 
  onReschedule, 
  onCancel, 
  onViewDetails 
}: AppointmentCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'CONFIRMED': 'default',
      'COMPLETED': 'secondary',
      'CANCELLED': 'destructive',
    };
    return variants[status] || 'outline';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-900">
                {appointment.serviceType?.displayName || appointment.serviceType?.name || 'Service'}
              </h3>
              <Badge variant={getStatusBadge(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(appointment.scheduledDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(appointment.scheduledDate), 'h:mm a')}
                  {appointment.duration && ` (${appointment.duration} min)`}
                </span>
              </div>
              {appointment.propertyAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{appointment.propertyAddress}</span>
                </div>
              )}
              {appointment.notes && (
                <p className="text-gray-500 mt-2">{appointment.notes}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
              <>
                {onReschedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReschedule(appointment.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )}
                {onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(appointment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </>
            )}
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(appointment.id)}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

