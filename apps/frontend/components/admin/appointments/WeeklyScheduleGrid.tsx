'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Minus, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityRule {
  id?: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  serviceType?: string | null;
  bufferMinutes: number;
  maxBookingsPerDay: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
  bookingCount?: number;
}

interface WeeklyScheduleGridProps {
  rules: AvailabilityRule[];
  onRuleUpdate?: (dayOfWeek: number, updates: Partial<AvailabilityRule>) => void;
  showBookings?: boolean;
  bookingData?: { [key: string]: number }; // dayOfWeek-time -> booking count
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate time slots from 6 AM to 10 PM in 30-minute intervals
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function WeeklyScheduleGrid({ 
  rules, 
  onRuleUpdate, 
  showBookings = false,
  bookingData = {}
}: WeeklyScheduleGridProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'available' | 'unavailable'>('available');

  // Convert time string to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if a time slot is available for a given day
  const isTimeSlotAvailable = (dayOfWeek: number, time: string): boolean => {
    const rule = rules.find(r => r.dayOfWeek === dayOfWeek);
    if (!rule || !rule.isAvailable) return false;
    
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(rule.startTime);
    const endMinutes = timeToMinutes(rule.endTime);
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  // Get booking count for a specific day and time
  const getBookingCount = (dayOfWeek: number, time: string): number => {
    const key = `${dayOfWeek}-${time}`;
    return bookingData[key] || 0;
  };

  // Handle cell selection
  const handleCellMouseDown = (dayOfWeek: number, time: string) => {
    const cellKey = `${dayOfWeek}-${time}`;
    const isCurrentlyAvailable = isTimeSlotAvailable(dayOfWeek, time);
    
    setIsSelecting(true);
    setSelectionMode(isCurrentlyAvailable ? 'unavailable' : 'available');
    setSelectedCells(new Set([cellKey]));
  };

  const handleCellMouseEnter = (dayOfWeek: number, time: string) => {
    if (!isSelecting) return;
    
    const cellKey = `${dayOfWeek}-${time}`;
    setSelectedCells(prev => new Set([...prev, cellKey]));
  };

  const handleCellMouseUp = () => {
    if (!isSelecting || selectedCells.size === 0) {
      setIsSelecting(false);
      setSelectedCells(new Set());
      return;
    }

    // Apply changes to selected cells
    const dayUpdates: { [dayOfWeek: number]: { startTime?: string; endTime?: string; isAvailable: boolean } } = {};
    
    selectedCells.forEach(cellKey => {
      const [dayOfWeek, time] = cellKey.split('-');
      const day = parseInt(dayOfWeek);
      
      if (!dayUpdates[day]) {
        const rule = rules.find(r => r.dayOfWeek === day);
        dayUpdates[day] = {
          startTime: rule?.startTime || '09:00',
          endTime: rule?.endTime || '17:00',
          isAvailable: selectionMode === 'available'
        };
      }
      
      if (selectionMode === 'available') {
        // Extend availability to include this time slot
        const timeMinutes = timeToMinutes(time);
        const currentStart = timeToMinutes(dayUpdates[day].startTime!);
        const currentEnd = timeToMinutes(dayUpdates[day].endTime!);
        
        if (timeMinutes < currentStart) {
          dayUpdates[day].startTime = time;
        }
        if (timeMinutes >= currentEnd) {
          // Add 30 minutes to end time to include this slot
          const endMinutes = timeMinutes + 30;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          dayUpdates[day].endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        }
      }
    });

    // Apply updates
    Object.entries(dayUpdates).forEach(([dayOfWeek, updates]) => {
      onRuleUpdate?.(parseInt(dayOfWeek), updates);
    });

    setIsSelecting(false);
    setSelectedCells(new Set());
  };

  // Handle mouse leave to stop selection
  const handleMouseLeave = () => {
    if (isSelecting) {
      handleCellMouseUp();
    }
  };

  // Quick actions for common schedules
  const applyQuickSchedule = (schedule: 'business' | 'weekend' | 'full' | 'clear') => {
    switch (schedule) {
      case 'business':
        // Monday to Friday, 9 AM to 5 PM
        DAYS_OF_WEEK.forEach((_, dayOfWeek) => {
          onRuleUpdate?.(dayOfWeek, {
            isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
            startTime: '09:00',
            endTime: '17:00'
          });
        });
        break;
      case 'weekend':
        // Saturday and Sunday, 10 AM to 4 PM
        DAYS_OF_WEEK.forEach((_, dayOfWeek) => {
          onRuleUpdate?.(dayOfWeek, {
            isAvailable: dayOfWeek === 0 || dayOfWeek === 6,
            startTime: '10:00',
            endTime: '16:00'
          });
        });
        break;
      case 'full':
        // All days, 8 AM to 8 PM
        DAYS_OF_WEEK.forEach((_, dayOfWeek) => {
          onRuleUpdate?.(dayOfWeek, {
            isAvailable: true,
            startTime: '08:00',
            endTime: '20:00'
          });
        });
        break;
      case 'clear':
        // No availability
        DAYS_OF_WEEK.forEach((_, dayOfWeek) => {
          onRuleUpdate?.(dayOfWeek, {
            isAvailable: false
          });
        });
        break;
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule Grid
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyQuickSchedule('business')}
              >
                Business Hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyQuickSchedule('weekend')}
              >
                Weekends Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyQuickSchedule('full')}
              >
                Full Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyQuickSchedule('clear')}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click and drag to select time slots. Green cells are available, gray cells are unavailable.
              {showBookings && ' Numbers show current booking counts.'}
            </AlertDescription>
          </Alert>
          
          <div 
            className="grid grid-cols-8 gap-1 text-xs"
            onMouseLeave={handleMouseLeave}
          >
            {/* Header row */}
            <div className="p-2 font-medium text-center">Time</div>
            {DAYS_SHORT.map((day, index) => (
              <div key={day} className="p-2 font-medium text-center">
                {day}
              </div>
            ))}
            
            {/* Time slots */}
            {TIME_SLOTS.map((time) => (
              <React.Fragment key={time}>
                {/* Time label */}
                <div className="p-2 text-right font-mono text-gray-600 border-r">
                  {time}
                </div>
                
                {/* Day cells */}
                {DAYS_OF_WEEK.map((_, dayOfWeek) => {
                  const isAvailable = isTimeSlotAvailable(dayOfWeek, time);
                  const bookingCount = getBookingCount(dayOfWeek, time);
                  const cellKey = `${dayOfWeek}-${time}`;
                  const isSelected = selectedCells.has(cellKey);
                  const rule = rules.find(r => r.dayOfWeek === dayOfWeek);
                  
                  return (
                    <Tooltip key={cellKey}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'p-2 border cursor-pointer transition-colors min-h-[32px] flex items-center justify-center',
                            isAvailable 
                              ? 'bg-green-100 border-green-200 hover:bg-green-200' 
                              : 'bg-gray-100 border-gray-200 hover:bg-gray-200',
                            isSelected && 'ring-2 ring-blue-500',
                            bookingCount > 0 && 'font-medium'
                          )}
                          onMouseDown={() => handleCellMouseDown(dayOfWeek, time)}
                          onMouseEnter={() => handleCellMouseEnter(dayOfWeek, time)}
                          onMouseUp={handleCellMouseUp}
                        >
                          {showBookings && bookingCount > 0 && (
                            <span className={cn(
                              'text-xs',
                              bookingCount >= (rule?.maxBookingsPerDay || 8) 
                                ? 'text-red-600' 
                                : 'text-blue-600'
                            )}>
                              {bookingCount}
                            </span>
                          )}
                          {!showBookings && isAvailable && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                          {!showBookings && !isAvailable && (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-medium">{DAYS_OF_WEEK[dayOfWeek]} {time}</div>
                          <div>Status: {isAvailable ? 'Available' : 'Unavailable'}</div>
                          {showBookings && (
                            <div>Bookings: {bookingCount}</div>
                          )}
                          {rule && (
                            <>
                              <div>Hours: {rule.startTime} - {rule.endTime}</div>
                              <div>Buffer: {rule.bufferMinutes}min</div>
                              <div>Max/day: {rule.maxBookingsPerDay}</div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span>Unavailable</span>
            </div>
            {showBookings && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded flex items-center justify-center text-xs font-medium text-blue-600">
                    2
                  </div>
                  <span>Booking Count</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded flex items-center justify-center text-xs font-medium text-red-600">
                    8
                  </div>
                  <span>Fully Booked</span>
                </div>
              </>
            )}
          </div>
          
          {isSelecting && (
            <div className="mt-4 text-center">
              <Badge variant="outline">
                {selectionMode === 'available' ? 'Making Available' : 'Making Unavailable'} - 
                {selectedCells.size} slot{selectedCells.size !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}