export interface Appointment {
  id: string;
  customerId: string;
  serviceType: string;
  scheduledDate: Date;
  duration: number; // minutes
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  propertyAddress: string;
  notes?: string;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isAvailable: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  serviceType?: string;
  bufferMinutes: number;
  maxBookingsPerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableSlot {
  time: string; // HH:MM format
  duration: number; // minutes
}

export interface AvailabilityResponse {
  date: string;
  availableSlots: AvailableSlot[];
}

export interface BookingRequest {
  scheduledDate: string; // ISO datetime
  serviceType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  propertyAddress: string;
  notes?: string;
}

export interface BookingResponse {
  appointmentId: string;
  confirmationNumber: string;
  status: string;
}

export const SERVICE_TYPES = [
  'General Consultation',
  'Plumbing Assessment',
  'Electrical Assessment',
  'HVAC Assessment',
  'Home Inspection',
  'Maintenance Check',
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

export const APPOINTMENT_STATUS = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
] as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[number];