'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useServices, useCreateBooking } from '@/hooks/use-api';
import type { Service } from '@/lib/api';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock, User } from 'lucide-react';

const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTime: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function BookServiceForm() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const createBookingMutation = useCreateBooking();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedServiceId = watch('serviceId');

  // Get the selected service details
  const service = servicesData?.services?.find((s: any) => s.id === selectedServiceId);
  
  // Services are now admin-managed, no individual providers

  const onSubmit = async (data: BookingFormData) => {
    try {
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      
      const result = await createBookingMutation.mutateAsync({
        serviceId: data.serviceId,
        scheduledDate: scheduledDateTime.toISOString(),
        notes: data.notes,
      });
      console.log('Booking result:', result);
      
      toast.success('Booking created successfully!');
      reset();
      setSelectedService(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    }
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Service Selection */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Select Service</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicesData?.services?.map((service: any) => (
            <label
              key={service.id}
              className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none hover:border-primary ${
                selectedServiceId === service.id ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-300'
              }`}
            >
              <input
                {...register('serviceId')}
                type="radio"
                value={service.id}
                className="sr-only"
                onChange={() => setSelectedService(service)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{service.name}</h3>
                    <p className="text-xs text-gray-500">{service.category}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    ${service.basePrice}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                  {service.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.serviceId && (
          <p className="mt-2 text-sm text-red-600">{errors.serviceId.message}</p>
        )}
      </div>

      {/* Service Information */}
      {selectedServiceId && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Service Details</h2>
          
          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Professional Service</h3>
              <p className="text-xs text-gray-500">Professionally managed</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                ✓ Quality Guaranteed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling */}
      {selectedServiceId && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Schedule Appointment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('scheduledDate')}
                  type="date"
                  id="scheduledDate"
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              {errors.scheduledDate && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduledDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="mt-1 relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('scheduledTime')}
                  id="scheduledTime"
                  className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              {errors.scheduledTime && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduledTime.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {selectedServiceId && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Special Instructions (Optional)
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Any special requirements, access instructions, or additional details..."
            />
          </div>
        </div>
      )}

      {/* Service Summary */}
      {selectedService && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Service Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{selectedService.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Complexity:</span>
              <span className="font-medium">{selectedService.complexity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-semibold text-primary">${selectedService.basePrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {selectedServiceId && (
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setSelectedService(null);
            }}
            disabled={createBookingMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createBookingMutation.isPending}
            className="min-w-[120px]"
          >
            {createBookingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Book Service'
            )}
          </Button>
        </div>
      )}

      {createBookingMutation.isError && (
        <div className="text-sm text-red-600 text-center">
          {createBookingMutation.error?.message || 'An error occurred while creating the booking'}
        </div>
      )}
    </form>
  );
} 