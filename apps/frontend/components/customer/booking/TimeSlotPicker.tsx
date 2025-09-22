'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AvailableSlot } from '@/types/appointments';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  slots: AvailableSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  className?: string;
}

export function TimeSlotPicker({ 
  slots, 
  selectedTime, 
  onTimeSelect, 
  className 
}: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No available time slots for this date.</p>
        <p className="text-sm text-gray-400 mt-2">
          Please select a different date or contact us directly.
        </p>
      </div>
    );
  }

  // Group slots by time period
  const groupSlotsByPeriod = (slots: AvailableSlot[]) => {
    const morning: AvailableSlot[] = [];
    const afternoon: AvailableSlot[] = [];
    const evening: AvailableSlot[] = [];

    slots.forEach(slot => {
      const [hours] = slot.time.split(':').map(Number);
      if (hours < 12) {
        morning.push(slot);
      } else if (hours < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderTimeSlots = (slots: AvailableSlot[], title: string) => {
    if (slots.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeSelect(slot.time)}
              className="text-sm py-2 px-3 h-auto"
            >
              {formatTime(slot.time)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          Select your preferred time slot
        </span>
      </div>

      {renderTimeSlots(morning, 'Morning')}
      {renderTimeSlots(afternoon, 'Afternoon')}
      {renderTimeSlots(evening, 'Evening')}

      {selectedTime && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected time:</strong> {formatTime(selectedTime)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Duration: 60 minutes (estimated)
          </p>
        </div>
      )}
    </div>
  );
}