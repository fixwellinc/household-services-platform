import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceType = searchParams.get('serviceType');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse the date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Get availability rules for the day
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        dayOfWeek,
        isAvailable: true,
        ...(serviceType && { serviceType }),
      },
    });

    if (availabilityRules.length === 0) {
      return NextResponse.json({
        date,
        availableSlots: [],
      });
    }

    // Get existing appointments for the date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    // Generate available slots
    const availableSlots = [];
    
    for (const rule of availabilityRules) {
      const [startHour, startMinute] = rule.startTime.split(':').map(Number);
      const [endHour, endMinute] = rule.endTime.split(':').map(Number);
      
      const startTime = new Date(requestedDate);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(requestedDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Generate 30-minute slots
      const slotDuration = 30; // minutes
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime.getTime() + slotDuration * 60000);
        
        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.scheduledDate);
          const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
          
          return (
            (currentTime >= appointmentStart && currentTime < appointmentEnd) ||
            (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
            (currentTime <= appointmentStart && slotEndTime >= appointmentEnd)
          );
        });
        
        if (!hasConflict) {
          availableSlots.push({
            time: currentTime.toTimeString().slice(0, 5), // HH:MM format
            duration: slotDuration,
          });
        }
        
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }
    }

    return NextResponse.json({
      date,
      availableSlots,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}