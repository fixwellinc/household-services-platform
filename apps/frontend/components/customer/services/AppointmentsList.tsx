'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { Calendar, Clock, MapPin, User, MoreVertical, Edit, X } from 'lucide-react';
import { useCustomerAppointments } from '@/hooks/use-customer-appointments';
import { useCancelAppointment, useUpdateAppointment } from '@/hooks/use-customer-appointments';
import { format } from 'date-fns';
import Link from 'next/link';

interface AppointmentsListProps {
  limit?: number;
  showActions?: boolean;
}

export function AppointmentsList({ limit = 10, showActions = true }: AppointmentsListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const { data, isLoading, error } = useCustomerAppointments({ 
    status: selectedStatus,
    limit 
  });
  const cancelMutation = useCancelAppointment();
  const updateMutation = useUpdateAppointment();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'CONFIRMED': 'default',
      'COMPLETED': 'secondary',
      'CANCELLED': 'destructive',
    };
    return variants[status] || 'outline';
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load appointments. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const appointments = data?.data || [];

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No appointments found</p>
          <Button asChild className="mt-4">
            <Link href="/book-appointment">Book an Appointment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment: any) => (
        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {appointment.serviceType?.displayName || appointment.serviceType?.name || 'Service'}
                    </h3>
                    <Badge variant={getStatusBadge(appointment.status)} className="mt-1">
                      {appointment.status}
                    </Badge>
                  </div>
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

              {showActions && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle reschedule - would open a modal
                          console.log('Reschedule appointment:', appointment.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appointment.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/appointments/${appointment.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {data?.pagination?.hasMore && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/appointments">View All Appointments</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

