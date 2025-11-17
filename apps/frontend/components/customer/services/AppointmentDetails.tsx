'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge, Button } from '@/components/ui/shared';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Edit,
  X,
  ArrowLeft
} from 'lucide-react';
import { useCustomerAppointment } from '@/hooks/use-customer-appointments';
import { useCancelAppointment } from '@/hooks/use-customer-appointments';
import { format } from 'date-fns';
import Link from 'next/link';

interface AppointmentDetailsProps {
  appointmentId: string;
  onBack?: () => void;
  onReschedule?: (id: string) => void;
}

export function AppointmentDetails({ 
  appointmentId, 
  onBack,
  onReschedule 
}: AppointmentDetailsProps) {
  const { data: appointment, isLoading, error } = useCustomerAppointment(appointmentId);
  const cancelMutation = useCancelAppointment();

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelMutation.mutateAsync(appointmentId);
        if (onBack) onBack();
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !appointment) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load appointment details.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

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
    <div className="space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {appointment.serviceType?.displayName || appointment.serviceType?.name || 'Appointment Details'}
            </CardTitle>
            <Badge variant={getStatusBadge(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appointment Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(appointment.scheduledDate), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(appointment.scheduledDate), 'h:mm a')}
                    {appointment.duration && ` (${appointment.duration} minutes)`}
                  </p>
                </div>
              </div>
              {appointment.propertyAddress && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{appointment.propertyAddress}</p>
                  </div>
                </div>
              )}
              {appointment.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          {appointment.customer && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{appointment.customerName || appointment.customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{appointment.customerEmail || appointment.customer.email}</p>
                  </div>
                </div>
                {(appointment.customerPhone || appointment.customer.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">
                        {appointment.customerPhone || appointment.customer.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {onReschedule && (
                <Button
                  onClick={() => onReschedule(appointment.id)}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Reschedule Appointment
                </Button>
              )}
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={cancelMutation.isPending}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

