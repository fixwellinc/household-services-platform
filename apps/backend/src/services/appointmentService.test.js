import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database import
vi.mock('../config/database.js', () => ({
  default: {
    appointment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    }
  }
}));

// Mock availability service
vi.mock('./availabilityService.js', () => ({
  default: {
    isSlotAvailable: vi.fn()
  }
}));

import appointmentService from './appointmentService.js';
import availabilityService from './availabilityService.js';
import prisma from '../config/database.js';

describe('AppointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set a fixed date for consistent testing
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAppointment', () => {
    const validAppointmentData = {
      customerId: 'customer-123',
      serviceType: 'consultation',
      scheduledDate: '2024-01-20T14:00:00Z',
      duration: 60,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      propertyAddress: '123 Main St, City, State',
      notes: 'Initial consultation'
    };

    it('should create an appointment successfully', async () => {
      const mockCreatedAppointment = {
        id: 'appointment-123',
        ...validAppointmentData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      availabilityService.isSlotAvailable.mockResolvedValue(true);
      prisma.appointment.findMany.mockResolvedValue([]); // No conflicts
      prisma.appointment.create.mockResolvedValue(mockCreatedAppointment);

      const result = await appointmentService.createAppointment(validAppointmentData);

      expect(result).toEqual(mockCreatedAppointment);
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-123',
          serviceType: 'consultation',
          scheduledDate: new Date('2024-01-20T14:00:00Z'),
          duration: 60,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+1234567890',
          propertyAddress: '123 Main St, City, State',
          notes: 'Initial consultation',
          status: 'PENDING'
        }
      });
    });

    it('should throw error for missing required fields', async () => {
      const invalidData = { ...validAppointmentData };
      delete invalidData.customerName;

      await expect(appointmentService.createAppointment(invalidData))
        .rejects.toThrow('customerName is required');
    });

    it('should throw error for invalid email format', async () => {
      const invalidData = {
        ...validAppointmentData,
        customerEmail: 'invalid-email'
      };

      await expect(appointmentService.createAppointment(invalidData))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid phone format', async () => {
      const invalidData = {
        ...validAppointmentData,
        customerPhone: 'invalid-phone'
      };

      await expect(appointmentService.createAppointment(invalidData))
        .rejects.toThrow('Invalid phone number format');
    });

    it('should throw error for past appointment date', async () => {
      const pastData = {
        ...validAppointmentData,
        scheduledDate: '2024-01-10T14:00:00Z' // Past date
      };

      await expect(appointmentService.createAppointment(pastData))
        .rejects.toThrow('Appointment must be scheduled for a future date and time');
    });

    it('should throw error when time slot is not available', async () => {
      availabilityService.isSlotAvailable.mockResolvedValue(false);

      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects.toThrow('The selected time slot is not available');
    });

    it('should throw error for conflicting appointments', async () => {
      availabilityService.isSlotAvailable.mockResolvedValue(true);
      
      // Mock conflicting appointment
      prisma.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-appointment',
          scheduledDate: new Date('2024-01-20T14:30:00Z'),
          duration: 60
        }
      ]);

      await expect(appointmentService.createAppointment(validAppointmentData))
        .rejects.toThrow('Time slot conflicts with an existing appointment');
    });

    it('should validate duration limits', async () => {
      const invalidDurationData = {
        ...validAppointmentData,
        duration: 10 // Too short
      };

      await expect(appointmentService.createAppointment(invalidDurationData))
        .rejects.toThrow('Duration must be between 15 minutes and 8 hours');
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment with customer details', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'customer-123',
        serviceType: 'consultation',
        scheduledDate: new Date('2024-01-20T14:00:00Z'),
        status: 'PENDING',
        customer: {
          id: 'customer-123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        }
      };

      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await appointmentService.getAppointmentById('appointment-123');

      expect(result).toEqual(mockAppointment);
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
    });

    it('should return null for non-existent appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      const result = await appointmentService.getAppointmentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAppointments', () => {
    it('should return appointments with pagination', async () => {
      const mockAppointments = [
        { id: 'appointment-1', customerName: 'John Doe' },
        { id: 'appointment-2', customerName: 'Jane Smith' }
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);
      prisma.appointment.count.mockResolvedValue(15);

      const result = await appointmentService.getAppointments({
        page: 2,
        limit: 5
      });

      expect(result.appointments).toEqual(mockAppointments);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        totalCount: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should apply filters correctly', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      await appointmentService.getAppointments({
        customerId: 'customer-123',
        status: 'PENDING',
        serviceType: 'consultation',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          status: 'PENDING',
          serviceType: 'consultation',
          scheduledDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        },
        skip: 0,
        take: 10
      });
    });
  });

  describe('updateAppointment', () => {
    const mockExistingAppointment = {
      id: 'appointment-123',
      customerId: 'customer-123',
      serviceType: 'consultation',
      scheduledDate: new Date('2024-01-20T14:00:00Z'),
      duration: 60,
      status: 'PENDING'
    };

    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(mockExistingAppointment);
    });

    it('should update appointment successfully', async () => {
      const updateData = {
        customerName: 'John Updated',
        notes: 'Updated notes'
      };

      const mockUpdatedAppointment = {
        ...mockExistingAppointment,
        ...updateData,
        updatedAt: new Date()
      };

      prisma.appointment.update.mockResolvedValue(mockUpdatedAppointment);

      const result = await appointmentService.updateAppointment('appointment-123', updateData);

      expect(result).toEqual(mockUpdatedAppointment);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
    });

    it('should throw error for non-existent appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      await expect(appointmentService.updateAppointment('non-existent', {}))
        .rejects.toThrow('Appointment not found');
    });

    it('should validate new scheduled date', async () => {
      const updateData = {
        scheduledDate: '2024-01-25T16:00:00Z'
      };

      availabilityService.isSlotAvailable.mockResolvedValue(true);
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.update.mockResolvedValue({});

      await appointmentService.updateAppointment('appointment-123', updateData);

      expect(availabilityService.isSlotAvailable).toHaveBeenCalledWith(
        new Date('2024-01-25T16:00:00Z'),
        '16:00',
        60,
        'consultation'
      );
    });

    it('should validate status transitions', async () => {
      const updateData = { status: 'COMPLETED' };

      await expect(appointmentService.updateAppointment('appointment-123', updateData))
        .rejects.toThrow('Invalid status transition from PENDING to COMPLETED');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        status: 'PENDING',
        notes: 'Original notes'
      };

      const mockCancelledAppointment = {
        ...mockAppointment,
        status: 'CANCELLED',
        notes: 'Original notes\nCancellation reason: Customer request',
        updatedAt: new Date()
      };

      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue(mockCancelledAppointment);

      const result = await appointmentService.cancelAppointment('appointment-123', 'Customer request');

      expect(result).toEqual(mockCancelledAppointment);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: 'CANCELLED',
          notes: 'Original notes\nCancellation reason: Customer request',
          updatedAt: expect.any(Date)
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
    });

    it('should throw error for already cancelled appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        status: 'CANCELLED'
      });

      await expect(appointmentService.cancelAppointment('appointment-123'))
        .rejects.toThrow('Appointment is already cancelled');
    });

    it('should throw error for completed appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        status: 'COMPLETED'
      });

      await expect(appointmentService.cancelAppointment('appointment-123'))
        .rejects.toThrow('Cannot cancel a completed appointment');
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm pending appointment', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        status: 'PENDING'
      };

      const mockConfirmedAppointment = {
        ...mockAppointment,
        status: 'CONFIRMED',
        updatedAt: new Date()
      };

      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue(mockConfirmedAppointment);

      const result = await appointmentService.confirmAppointment('appointment-123');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw error for non-pending appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        status: 'CONFIRMED'
      });

      await expect(appointmentService.confirmAppointment('appointment-123'))
        .rejects.toThrow('Only pending appointments can be confirmed');
    });
  });

  describe('completeAppointment', () => {
    it('should complete confirmed appointment', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        status: 'CONFIRMED',
        notes: 'Original notes'
      };

      const mockCompletedAppointment = {
        ...mockAppointment,
        status: 'COMPLETED',
        notes: 'Completed successfully',
        updatedAt: new Date()
      };

      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue(mockCompletedAppointment);

      const result = await appointmentService.completeAppointment('appointment-123', {
        notes: 'Completed successfully'
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.notes).toBe('Completed successfully');
    });

    it('should throw error for non-confirmed appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        status: 'PENDING'
      });

      await expect(appointmentService.completeAppointment('appointment-123'))
        .rejects.toThrow('Only confirmed appointments can be completed');
    });
  });

  describe('getAppointmentsForDate', () => {
    it('should return appointments for specific date', async () => {
      const mockAppointments = [
        { id: 'appointment-1', scheduledDate: new Date('2024-01-20T10:00:00Z') },
        { id: 'appointment-2', scheduledDate: new Date('2024-01-20T14:00:00Z') }
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await appointmentService.getAppointmentsForDate('2024-01-20');

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: new Date('2024-01-20T00:00:00.000Z'),
            lte: new Date('2024-01-20T23:59:59.999Z')
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      });
    });
  });

  describe('hasCustomerConflicts', () => {
    it('should detect overlapping appointments', async () => {
      const conflictingAppointments = [
        {
          id: 'existing-appointment',
          scheduledDate: new Date('2024-01-20T14:30:00Z'),
          duration: 60
        }
      ];

      prisma.appointment.findMany.mockResolvedValue(conflictingAppointments);

      const hasConflict = await appointmentService.hasCustomerConflicts(
        'customer-123',
        new Date('2024-01-20T14:00:00Z'),
        60
      );

      expect(hasConflict).toBe(true);
    });

    it('should return false for non-overlapping appointments', async () => {
      const nonConflictingAppointments = [
        {
          id: 'existing-appointment',
          scheduledDate: new Date('2024-01-20T16:00:00Z'),
          duration: 60
        }
      ];

      prisma.appointment.findMany.mockResolvedValue(nonConflictingAppointments);

      const hasConflict = await appointmentService.hasCustomerConflicts(
        'customer-123',
        new Date('2024-01-20T14:00:00Z'),
        60
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('getAppointmentStats', () => {
    it('should return appointment statistics', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // pending
        .mockResolvedValueOnce(30)  // confirmed
        .mockResolvedValueOnce(40)  // completed
        .mockResolvedValueOnce(10); // cancelled

      const result = await appointmentService.getAppointmentStats();

      expect(result).toEqual({
        total: 100,
        pending: 20,
        confirmed: 30,
        completed: 40,
        cancelled: 10,
        completionRate: 40,
        cancellationRate: 10
      });
    });

    it('should handle zero appointments', async () => {
      prisma.appointment.count.mockResolvedValue(0);

      const result = await appointmentService.getAppointmentStats();

      expect(result.completionRate).toBe(0);
      expect(result.cancellationRate).toBe(0);
    });
  });

  describe('_validateAppointmentData', () => {
    it('should validate required fields', () => {
      const invalidData = {
        customerId: 'customer-123',
        serviceType: 'consultation'
        // Missing required fields
      };

      expect(() => appointmentService._validateAppointmentData(invalidData))
        .toThrow('scheduledDate is required');
    });

    it('should validate email format', () => {
      const invalidData = {
        customerId: 'customer-123',
        serviceType: 'consultation',
        scheduledDate: '2024-01-20T14:00:00Z',
        customerName: 'John Doe',
        customerEmail: 'invalid-email',
        propertyAddress: '123 Main St'
      };

      expect(() => appointmentService._validateAppointmentData(invalidData))
        .toThrow('Invalid email format');
    });
  });

  describe('_validateStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(() => appointmentService._validateStatusTransition('PENDING', 'CONFIRMED'))
        .not.toThrow();
      
      expect(() => appointmentService._validateStatusTransition('CONFIRMED', 'COMPLETED'))
        .not.toThrow();
    });

    it('should reject invalid transitions', () => {
      expect(() => appointmentService._validateStatusTransition('PENDING', 'COMPLETED'))
        .toThrow('Invalid status transition from PENDING to COMPLETED');
      
      expect(() => appointmentService._validateStatusTransition('COMPLETED', 'CANCELLED'))
        .toThrow('Invalid status transition from COMPLETED to CANCELLED');
    });
  });
});