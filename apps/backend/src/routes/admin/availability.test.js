import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock the service imports first
vi.mock('../../services/availabilityService.js', () => ({
  default: {
    getAvailabilityRules: vi.fn(),
    updateAvailabilityRules: vi.fn()
  }
}));

vi.mock('../../services/appointmentService.js', () => ({
  default: {
    getAppointments: vi.fn(),
    getAppointmentStats: vi.fn(),
    updateAppointment: vi.fn(),
    confirmAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    completeAppointment: vi.fn()
  }
}));

// Mock Prisma
vi.mock('../../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

// Mock express-rate-limit
vi.mock('express-rate-limit', () => ({
  default: () => (req, res, next) => next()
}));

// Now import the modules
import availabilityRoutes from './availability.js';
import { sanitize } from '../../middleware/validation.js';
import { errorHandler } from '../../middleware/error.js';
import availabilityService from '../../services/availabilityService.js';
import appointmentService from '../../services/appointmentService.js';

// Test app setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(sanitize);
  
  // Mock auth middleware for testing
  app.use((req, res, next) => {
    req.user = {
      id: 'admin-user-id',
      email: 'admin@test.com',
      role: 'ADMIN'
    };
    next();
  });
  
  app.use('/api/admin/availability', availabilityRoutes);
  app.use(errorHandler);
  
  return app;
};

describe('Admin Availability API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
    
    // Set up JWT secret for tests
    process.env.JWT_SECRET = 'test-secret';
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/availability', () => {
    it('should get availability rules successfully', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          serviceType: null,
          bufferMinutes: 30,
          maxBookingsPerDay: 8,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      availabilityService.getAvailabilityRules.mockResolvedValue(mockRules);
      
      const response = await request(app)
        .get('/api/admin/availability')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toHaveLength(1);
      expect(response.body.rules[0].dayOfWeek).toBe(1);
      expect(availabilityService.getAvailabilityRules).toHaveBeenCalledWith(undefined);
    });
    
    it('should filter by service type when provided', async () => {
      availabilityService.getAvailabilityRules.mockResolvedValue([]);
      
      await request(app)
        .get('/api/admin/availability?serviceType=consultation')
        .expect(200);
      
      expect(availabilityService.getAvailabilityRules).toHaveBeenCalledWith('consultation');
    });
    
    it('should handle service errors', async () => {
      availabilityService.getAvailabilityRules.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/admin/availability')
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/admin/availability', () => {
    it('should update availability rules successfully', async () => {
      const inputRules = [
        {
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          serviceType: null,
          bufferMinutes: 30,
          maxBookingsPerDay: 8
        }
      ];
      
      const mockUpdatedRules = [
        {
          id: 'rule-1',
          ...inputRules[0],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      availabilityService.updateAvailabilityRules.mockResolvedValue(mockUpdatedRules);
      
      const response = await request(app)
        .put('/api/admin/availability')
        .send({ rules: inputRules })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Availability rules updated successfully');
      expect(response.body.rules).toHaveLength(1);
      expect(availabilityService.updateAvailabilityRules).toHaveBeenCalledWith(inputRules);
    });
    
    it('should validate rule structure', async () => {
      const invalidRules = [
        {
          dayOfWeek: 8, // Invalid day
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00'
        }
      ];
      
      const response = await request(app)
        .put('/api/admin/availability')
        .send({ rules: invalidRules })
        .expect(400);
      
      expect(response.body.details).toContain('dayOfWeek must be a number between 0 and 6');
    });
    
    it('should validate time format', async () => {
      const invalidRules = [
        {
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '25:00', // Invalid time
          endTime: '17:00'
        }
      ];
      
      const response = await request(app)
        .put('/api/admin/availability')
        .send({ rules: invalidRules })
        .expect(400);
      
      expect(response.body.details).toContain('Time must be in HH:MM format');
    });
    
    it('should validate time order', async () => {
      const invalidRules = [
        {
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '17:00',
          endTime: '09:00' // End before start
        }
      ];
      
      const response = await request(app)
        .put('/api/admin/availability')
        .send({ rules: invalidRules })
        .expect(400);
      
      expect(response.body.details).toContain('startTime must be before endTime');
    });
    
    it('should require rules array', async () => {
      const response = await request(app)
        .put('/api/admin/availability')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('No rules provided');
    });
    
    it('should handle service conflicts', async () => {
      const rules = [
        {
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00'
        }
      ];
      
      availabilityService.updateAvailabilityRules.mockRejectedValue(
        new Error('Rule conflict detected')
      );
      
      const response = await request(app)
        .put('/api/admin/availability')
        .send({ rules })
        .expect(409);
      
      expect(response.body.error).toBe('Rule conflict');
    });
  });

  describe('GET /api/admin/availability/appointments', () => {
    it('should get appointments successfully', async () => {
      const mockAppointments = [
        {
          id: 'apt-1',
          customerName: 'John Doe',
          customerEmail: 'john@test.com',
          customerPhone: '+1234567890',
          scheduledDate: new Date(),
          duration: 60,
          serviceType: 'consultation',
          propertyAddress: '123 Test St',
          status: 'PENDING',
          notes: 'Test appointment',
          calendarEventId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const mockResult = {
        appointments: mockAppointments,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalCount: 1
        }
      };
      
      appointmentService.getAppointments.mockResolvedValue(mockResult);
      
      const response = await request(app)
        .get('/api/admin/availability/appointments')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.pending).toBe(1);
    });
    
    it('should apply filters correctly', async () => {
      appointmentService.getAppointments.mockResolvedValue({
        appointments: [],
        pagination: { page: 1, limit: 20, totalPages: 0, totalCount: 0 }
      });
      
      await request(app)
        .get('/api/admin/availability/appointments?status=CONFIRMED&serviceType=consultation&startDate=2024-01-01')
        .expect(200);
      
      expect(appointmentService.getAppointments).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'scheduledDate',
        sortOrder: 'asc',
        status: 'CONFIRMED',
        serviceType: 'consultation',
        startDate: '2024-01-01'
      });
    });
    
    it('should limit results to maximum 100', async () => {
      appointmentService.getAppointments.mockResolvedValue({
        appointments: [],
        pagination: { page: 1, limit: 100, totalPages: 0, totalCount: 0 }
      });
      
      await request(app)
        .get('/api/admin/availability/appointments?limit=200')
        .expect(200);
      
      expect(appointmentService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  describe('GET /api/admin/availability/appointments/stats', () => {
    it('should get appointment statistics', async () => {
      const mockStats = {
        total: 100,
        pending: 20,
        confirmed: 60,
        completed: 15,
        cancelled: 5,
        byServiceType: {
          consultation: 40,
          repair: 35,
          maintenance: 25
        },
        byStatus: {
          PENDING: 20,
          CONFIRMED: 60,
          COMPLETED: 15,
          CANCELLED: 5
        }
      };
      
      appointmentService.getAppointmentStats.mockResolvedValue(mockStats);
      
      const response = await request(app)
        .get('/api/admin/availability/appointments/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.stats.total).toBe(100);
      expect(response.body.stats.period).toBeDefined();
    });
    
    it('should apply date filters to stats', async () => {
      appointmentService.getAppointmentStats.mockResolvedValue({});
      
      await request(app)
        .get('/api/admin/availability/appointments/stats?startDate=2024-01-01&endDate=2024-12-31&serviceType=consultation')
        .expect(200);
      
      expect(appointmentService.getAppointmentStats).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        serviceType: 'consultation'
      });
    });
  });

  describe('PUT /api/admin/availability/appointments/:id', () => {
    it('should update appointment successfully', async () => {
      const mockUpdatedAppointment = {
        id: 'apt-1',
        customerName: 'John Doe',
        customerEmail: 'john@test.com',
        scheduledDate: new Date(),
        duration: 90,
        serviceType: 'consultation',
        status: 'CONFIRMED',
        notes: 'Updated notes',
        updatedAt: new Date()
      };
      
      appointmentService.updateAppointment.mockResolvedValue(mockUpdatedAppointment);
      
      const response = await request(app)
        .put('/api/admin/availability/appointments/apt-1')
        .send({
          status: 'CONFIRMED',
          duration: 90,
          notes: 'Updated notes'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment updated successfully');
      expect(response.body.appointment.status).toBe('CONFIRMED');
      expect(appointmentService.updateAppointment).toHaveBeenCalledWith('apt-1', {
        status: 'CONFIRMED',
        duration: 90,
        notes: 'Updated notes'
      });
    });
    
    it('should reject updates with no valid fields', async () => {
      const response = await request(app)
        .put('/api/admin/availability/appointments/apt-1')
        .send({ invalidField: 'value' })
        .expect(400);
      
      expect(response.body.error).toBe('No valid fields to update');
    });
    
    it('should handle appointment not found', async () => {
      appointmentService.updateAppointment.mockRejectedValue(
        new Error('Appointment not found')
      );
      
      const response = await request(app)
        .put('/api/admin/availability/appointments/nonexistent')
        .send({ status: 'CONFIRMED' })
        .expect(404);
      
      expect(response.body.error).toBe('Appointment not found');
    });
    
    it('should handle update conflicts', async () => {
      appointmentService.updateAppointment.mockRejectedValue(
        new Error('Time slot not available')
      );
      
      const response = await request(app)
        .put('/api/admin/availability/appointments/apt-1')
        .send({ scheduledDate: '2024-12-25T10:00:00Z' })
        .expect(409);
      
      expect(response.body.error).toBe('Update conflict');
    });
  });

  describe('POST /api/admin/availability/appointments/:id/confirm', () => {
    it('should confirm appointment successfully', async () => {
      const mockConfirmedAppointment = {
        id: 'apt-1',
        customerName: 'John Doe',
        customerEmail: 'john@test.com',
        scheduledDate: new Date(),
        status: 'CONFIRMED',
        updatedAt: new Date()
      };
      
      appointmentService.confirmAppointment.mockResolvedValue(mockConfirmedAppointment);
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/confirm')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment confirmed successfully');
      expect(response.body.appointment.status).toBe('CONFIRMED');
      expect(appointmentService.confirmAppointment).toHaveBeenCalledWith('apt-1');
    });
    
    it('should handle invalid status transitions', async () => {
      appointmentService.confirmAppointment.mockRejectedValue(
        new Error('Appointment must be pending to confirm')
      );
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/confirm')
        .expect(409);
      
      expect(response.body.error).toBe('Invalid status');
    });
  });

  describe('POST /api/admin/availability/appointments/:id/cancel', () => {
    it('should cancel appointment successfully', async () => {
      const mockCancelledAppointment = {
        id: 'apt-1',
        customerName: 'John Doe',
        customerEmail: 'john@test.com',
        scheduledDate: new Date(),
        status: 'CANCELLED',
        updatedAt: new Date()
      };
      
      appointmentService.cancelAppointment.mockResolvedValue(mockCancelledAppointment);
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/cancel')
        .send({ reason: 'Customer requested cancellation' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment cancelled successfully');
      expect(response.body.appointment.status).toBe('CANCELLED');
      expect(appointmentService.cancelAppointment).toHaveBeenCalledWith(
        'apt-1',
        'Customer requested cancellation'
      );
    });
    
    it('should handle already cancelled appointments', async () => {
      appointmentService.cancelAppointment.mockRejectedValue(
        new Error('Appointment is already cancelled')
      );
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/cancel')
        .send({ reason: 'Test' })
        .expect(409);
      
      expect(response.body.error).toBe('Cannot cancel');
    });
  });

  describe('POST /api/admin/availability/appointments/:id/complete', () => {
    it('should complete appointment successfully', async () => {
      const mockCompletedAppointment = {
        id: 'apt-1',
        customerName: 'John Doe',
        customerEmail: 'john@test.com',
        scheduledDate: new Date(),
        status: 'COMPLETED',
        notes: 'Service completed successfully',
        updatedAt: new Date()
      };
      
      appointmentService.completeAppointment.mockResolvedValue(mockCompletedAppointment);
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/complete')
        .send({ notes: 'Service completed successfully' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment completed successfully');
      expect(response.body.appointment.status).toBe('COMPLETED');
      expect(appointmentService.completeAppointment).toHaveBeenCalledWith('apt-1', {
        notes: 'Service completed successfully'
      });
    });
    
    it('should handle invalid status for completion', async () => {
      appointmentService.completeAppointment.mockRejectedValue(
        new Error('Appointment must be confirmed to complete')
      );
      
      const response = await request(app)
        .post('/api/admin/availability/appointments/apt-1/complete')
        .send({ notes: 'Test' })
        .expect(409);
      
      expect(response.body.error).toBe('Invalid status');
    });
  });
});