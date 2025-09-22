'use client';

import React from 'react';
import { BookingCalendar } from '@/components/customer/booking';
import { BookingResponse } from '@/types/appointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function BookAppointmentPage() {
  const handleBookingComplete = (booking: BookingResponse) => {
    console.log('Booking completed:', booking);
    // Here you could redirect to a success page or show additional information
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Book Your Service Appointment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Schedule a convenient time for our expert technicians to visit your property 
            and provide you with a detailed service quote.
          </p>
        </div>

        {/* Service Information */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
              <p className="text-sm text-gray-600">
                Choose from available time slots that work with your schedule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Quick Assessment</h3>
              <p className="text-sm text-gray-600">
                Most appointments take 30-60 minutes for a thorough evaluation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No Obligation</h3>
              <p className="text-sm text-gray-600">
                Free consultation with detailed quote - no commitment required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Calendar */}
        <BookingCalendar 
          onBookingComplete={handleBookingComplete}
          className="max-w-3xl mx-auto"
        />

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            What to Expect
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Before Your Appointment</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You'll receive a confirmation email with details</li>
                <li>• We'll call 30 minutes before arrival</li>
                <li>• Please ensure access to the service area</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">During the Visit</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Professional assessment of your needs</li>
                <li>• Detailed explanation of recommended services</li>
                <li>• Written quote provided on the spot</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">
            Need help or have questions?
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a 
              href="mailto:support@fixwell.com" 
              className="text-blue-600 hover:text-blue-800"
            >
              support@fixwell.com
            </a>
            <a 
              href="tel:+1-555-0123" 
              className="text-blue-600 hover:text-blue-800"
            >
              (555) 012-3456
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}