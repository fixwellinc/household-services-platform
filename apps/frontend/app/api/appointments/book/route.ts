import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const bookingSchema = z.object({
  scheduledDate: z.string().datetime(),
  serviceType: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  propertyAddress: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    const scheduledDate = new Date(validatedData.scheduledDate);
    const dayOfWeek = scheduledDate.getDay();

    // Check if the time slot is still available
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        dayOfWeek,
        isAvailable: true,
        OR: [
          { serviceType: validatedData.serviceType },
          { serviceType: null },
        ],
      },
    });

    if (availabilityRules.length === 0) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 400 }
      );
    }

    // Check for conflicts with existing appointments
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: new Date(scheduledDate.getTime() - 30 * 60000), // 30 minutes before
          lte: new Date(scheduledDate.getTime() + 30 * 60000), // 30 minutes after
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Selected time slot is no longer available' },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: '', // Will be set when customer authentication is implemented
        serviceType: validatedData.serviceType,
        scheduledDate,
        duration: 60, // Default 1 hour duration
        status: 'PENDING',
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        propertyAddress: validatedData.propertyAddress,
        notes: validatedData.notes,
      },
    });

    // Generate confirmation number
    const confirmationNumber = `APT-${appointment.id.slice(-8).toUpperCase()}`;

    return NextResponse.json({
      appointmentId: appointment.id,
      confirmationNumber,
      status: appointment.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}