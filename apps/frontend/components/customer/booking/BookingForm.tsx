'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BookingRequest } from '@/types/appointments';

import { Calendar, Clock, MapPin, User, Mail, Phone, FileText } from 'lucide-react';

const bookingFormSchema = z.object({
  customerName: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().optional(),
  propertyAddress: z.string().min(1, 'Property address is required').max(500, 'Address is too long'),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  serviceType: string;
  onSubmit: (data: Omit<BookingRequest, 'scheduledDate' | 'serviceType'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BookingForm({
  selectedDate,
  selectedTime,
  serviceType,
  onSubmit,
  onCancel,
  isLoading = false,
}: BookingFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onChange',
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit booking');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Complete Your Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900">Booking Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatTime(selectedTime)}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>{serviceType}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="customerName"
                {...register('customerName')}
                placeholder="Enter your full name"
                className="mt-1"
                disabled={isLoading}
              />
              {errors.customerName && (
                <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <Label htmlFor="customerEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="Enter your email address"
                className="mt-1"
                disabled={isLoading}
              />
              {errors.customerEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.customerEmail.message}</p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                {...register('customerPhone')}
                placeholder="Enter your phone number"
                className="mt-1"
                disabled={isLoading}
              />
              {errors.customerPhone && (
                <p className="text-red-600 text-sm mt-1">{errors.customerPhone.message}</p>
              )}
            </div>

            {/* Property Address */}
            <div>
              <Label htmlFor="propertyAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Property Address *
              </Label>
              <Textarea
                id="propertyAddress"
                {...register('propertyAddress')}
                placeholder="Enter the full address where the service will be performed"
                className="mt-1"
                rows={3}
                disabled={isLoading}
              />
              {errors.propertyAddress && (
                <p className="text-red-600 text-sm mt-1">{errors.propertyAddress.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional information or special requests..."
                className="mt-1"
                rows={3}
                disabled={isLoading}
              />
              {errors.notes && (
                <p className="text-red-600 text-sm mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </form>

          {/* Terms Notice */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>
              By confirming this booking, you agree to our terms of service and 
              cancellation policy. You will receive a confirmation email with 
              appointment details and our contact information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}