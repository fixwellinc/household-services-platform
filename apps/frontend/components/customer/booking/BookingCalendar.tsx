'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TimeSlotPicker } from './TimeSlotPicker';
import { BookingForm } from './BookingForm';
import { EnhancedBookingForm } from './EnhancedBookingForm';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  Appointment, 
  AvailabilityResponse, 
  BookingRequest, 
  BookingResponse,
  SERVICE_TYPES 
} from '@/types/appointments';
import 'react-day-picker/dist/style.css';

interface BookingCalendarProps {
  serviceTypes?: string[];
  onBookingComplete?: (appointment: BookingResponse) => void;
  className?: string;
}

export function BookingCalendar({ 
  serviceTypes = SERVICE_TYPES, 
  onBookingComplete,
  className 
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedServiceType, setSelectedServiceType] = useState<string>(serviceTypes[0]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState<BookingResponse | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability when date or service type changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate, selectedServiceType);
    }
  }, [selectedDate, selectedServiceType]);

  const fetchAvailability = async (date: Date, serviceType: string) => {
    setIsLoadingAvailability(true);
    setError(null);
    
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(
        `/api/appointments/availability?date=${dateStr}&serviceType=${encodeURIComponent(serviceType)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const data: AvailabilityResponse = await response.json();
      setAvailability(data);
      setSelectedTime(undefined); // Reset selected time when availability changes
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load available time slots. Please try again.');
      setAvailability(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && date > new Date()) {
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleProceedToBooking = () => {
    if (selectedDate && selectedTime) {
      setShowBookingForm(true);
    }
  };

  const handleBookingSubmit = async (formData: Omit<BookingRequest, 'scheduledDate' | 'serviceType'>) => {
    if (!selectedDate || !selectedTime) return;

    setIsBooking(true);
    setError(null);

    try {
      // Real-time availability check before booking
      await checkAvailabilityBeforeBooking(selectedDate, selectedTime, selectedServiceType);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const bookingRequest: BookingRequest = {
        ...formData,
        scheduledDate: scheduledDateTime.toISOString(),
        serviceType: selectedServiceType,
      };

      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      const booking: BookingResponse = await response.json();
      setBookingData(booking);
      setShowBookingForm(false);
      setShowConfirmation(true);
      
      if (onBookingComplete) {
        onBookingComplete(booking);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const checkAvailabilityBeforeBooking = async (date: Date, time: string, serviceType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(
      `/api/appointments/availability?date=${dateStr}&serviceType=${encodeURIComponent(serviceType)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to verify availability');
    }
    
    const data: AvailabilityResponse = await response.json();
    const isStillAvailable = data.availableSlots.some(slot => slot.time === time);
    
    if (!isStillAvailable) {
      throw new Error('This time slot is no longer available. Please select a different time.');
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setAvailability(null);
    setBookingData(null);
  };

  const disabledDays = {
    before: new Date(),
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Book Your Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Service Type
            </label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Date
            </label>
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={disabledDays}
                className="border rounded-lg p-4"
                classNames={{
                  day_selected: 'bg-blue-500 text-white',
                  day_today: 'bg-blue-100 text-blue-900',
                  day_disabled: 'text-gray-300',
                }}
              />
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Available Times for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </label>
              {isLoadingAvailability ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : availability ? (
                <TimeSlotPicker
                  slots={availability.availableSlots}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                />
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No available time slots for this date.
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Proceed Button */}
          {selectedDate && selectedTime && (
            <div className="flex justify-center">
              <Button
                onClick={handleProceedToBooking}
                className="px-8 py-2"
                disabled={isLoadingAvailability}
              >
                Proceed to Booking Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Booking Form Modal */}
      {showBookingForm && selectedDate && selectedTime && (
        <EnhancedBookingForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          serviceType={selectedServiceType}
          onSubmit={handleBookingSubmit}
          onCancel={() => setShowBookingForm(false)}
          isLoading={isBooking}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmation && bookingData && (
        <ConfirmationModal
          booking={bookingData}
          selectedDate={selectedDate!}
          selectedTime={selectedTime!}
          serviceType={selectedServiceType}
          onClose={handleConfirmationClose}
        />
      )}
    </div>
  );
}