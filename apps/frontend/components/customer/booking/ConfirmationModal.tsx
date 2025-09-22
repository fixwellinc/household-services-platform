'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingResponse } from '@/types/appointments';

import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  FileText, 
  Mail, 
  Phone,
  Copy,
  X 
} from 'lucide-react';
import { useState } from 'react';

interface ConfirmationModalProps {
  booking: BookingResponse;
  selectedDate: Date;
  selectedTime: string;
  serviceType: string;
  onClose: () => void;
}

export function ConfirmationModal({
  booking,
  selectedDate,
  selectedTime,
  serviceType,
  onClose,
}: ConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const copyConfirmationNumber = async () => {
    try {
      await navigator.clipboard.writeText(booking.confirmationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy confirmation number:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Booking Confirmed!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your appointment has been successfully scheduled.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Confirmation Number */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Confirmation Number
                </p>
                <p className="text-lg font-bold text-green-900">
                  {booking.confirmationNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyConfirmationNumber}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Appointment Details</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Date</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{formatTime(selectedTime)}</p>
                  <p className="text-sm text-gray-600">Time (60 minutes estimated)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{serviceType}</p>
                  <p className="text-sm text-gray-600">Service Type</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email with all the details</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>We may call to confirm details before your appointment</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive a reminder 24 hours before your appointment</span>
              </li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Please be available at the scheduled time</li>
              <li>If you need to reschedule, contact us at least 24 hours in advance</li>
              <li>Our technician will call when they're on their way</li>
              <li>Keep your confirmation number for reference</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Need to make changes or have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm">
              <a 
                href="mailto:support@fixwell.com" 
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                support@fixwell.com
              </a>
              <a 
                href="tel:+1-555-0123" 
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                (555) 012-3456
              </a>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} className="px-8">
              Close
            </Button>
          </div>
        </CardContent>

        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </Card>
    </div>
  );
}