import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRoutes from './appointments.js';
import appointmentService from '../services/appointmentService.js';
import availabilityService from '../services/availabilityService.js';

// Mock services
vi.mock('../services/appointmentService.js', () => ({
  default: {
    createAppointment: vi.fn(),
    getAppointments: vi.fn(),
    getAppointmentById: vi.fn(),
    updateAppointment: vi.fn(),
    confirmAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    completeAppointment: vi.fn(),
    getAppointmentStats: vi.fn()
  }
}));

vi.mock('../services/availabilityService.js', () => ({
  default: {
    calculateAvailableSlots: vi.fn()
  }
}));

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    // Mock authenticated user
    req.user = {
      id: 'user-123',
      role: 'CUSTOMER',
      email: 'test@example.com'
    };
    next();
  },
  requireCustomer: (req, res, next) => next(),
  requireCustomerOrAdmin: (req, res, next) => next()
}));

// Mock error middleware
vi.mock('../middleware/error.js', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/appointments', appointmentRoutes);
  
  // Error handling middleware
  app.use((error, req, res, next) => {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
};

describe('Appointment Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('GET /api/appointments/availability', () => {
    it('should return available slots for a given date', async () => {
      const mockSlots = [
        { time: '09:00', duration: 60, endTime: '10:00' },
        { time: '10:30', duration: 60, endTime: '11:30' },
        { time: '14:00', duration: 60, endTime: '15:00' }
      ];

      availabilityService.calculateAvailableSlots.mockResolvedValue(mockSlots);

      const response = await request(app)
        .get('/api/appointments/availability')
        .query({ date: '2025-01-20' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        date: '2025-01-20',
        serviceType: null,
        availableSlots: mockSlots
      });

      expect(availabilityService.calculateAvailableSlots).toHaveBeenCalledWith(
        new Date('2025-01-20'),
        undefined,
        60
      );
    });

    it('should return available slots for specific service type', async () => {
      const mockSlots = [
        { time: '09:00', duration: 60, endTime: '10:00' }
      ];

      availabilityService.calculateAvailableSlots.mockResolvedValue(mockSlots);

      const response = await request(app)
        .get('/api/appointments/availability')
        .query({ 
          date: '2025-01-20',
          serviceType: 'consultation'
        });

      expect(response.status).toBe(200);
      expect(response.body.serviceType).toBe('consultation');
      expect(availabilityService.calculateAvailableSlots).toHaveBeenCalledWith(
        new Date('2025-01-20'),
        'consultation',
        60
      );
    });

    it('should return 400 for missing date parameter', async () => {
      const response = await request(app)
        .get('/api/appointments/availability');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Date parameter is required');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/appointments/availability')
        .query({ date: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid date format');
    });
  });

  describe('POST /api/appointments/book', () => {
    const validBookingData = {
      scheduledDate: '2025-06-20T14:00:00Z',
      serviceType: 'consultation',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      propertyAddress: '123 Main St, City, State',
      duration: 60,
      notes: 'Initial consultation'
    };

    it('should create a new appointment successfully', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        ...validBookingData,
        status: 'PENDING',
        createdAt: new Date()
      };

      appointmentService.createAppointment.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .post('/api/appointments/book')
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment booked successfully');
      expect(response.body.appointment.id).toBe('appointment-123');
      expect(response.body.appointment.confirmationNumber).toMatch(/^APT-[A-Z0-9]{8}$/);

      expect(appointmentService.createAppointment).toHaveBeenCalledWith({
        customerId: 'guest',
        serviceType: 'consultation',
        scheduledDate: '2025-06-20T14:00:00.000Z',
        duration: 60,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        propertyAddress: '123 Main St, City, State',
        notes: 'Initial consultation'
      });
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { ...validBookingData };
      delete invalidData.customerName;

      const response = await request(app)
        .post('/api/appointments/book')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Customer name is required');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validBookingData,
        customerEmail: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should return 400 for past appointment date', async () => {
      const invalidData = {
        ...validBookingData,
        scheduledDate: '2020-01-01T14:00:00Z'
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Appointment must be scheduled for a future date and time');
    });

    it('should return 409 for booking conflicts', async () => {
      appointmentService.createAppointment.mockRejectedValue(
        new Error('The selected time slot is not available')
      );

      const response = await request(app)
        .post('/api/appointments/book')
        .send(validBookingData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Booking conflict');
      expect(response.body.message).toBe('The selected time slot is not available');
    });

    it('should validate phone number format', async () => {
      const invalidData = {
        ...validBookingData,
        customerPhone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid phone number format');
    });

    it('should validate duration limits', async () => {
      const invalidData = {
        ...validBookingData,
        duration: 10 // Too short
      };

      const response = await request(app)
        .post('/api/appointments/book')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Duration must be between 15 minutes and 8 hours');
    });
  });

  describe('GET /api/appointments', () => {
    it('should return user appointments with pagination', async () => {
      const mockResult = {
        appointments: [
          {
            id: 'appointment-1',
            customerName: 'John Doe',
            scheduledDate: '2024-01-20T14:00:00Z',
            status: 'PENDING'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      appointmentService.getAppointments.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/appointments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toEqual(mockResult.appointments);
      expect(response.body.pagination).toEqual(mockResult.pagination);

      expect(appointmentService.getAppointments).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'scheduledDate',
        sortOrder: 'asc',
        customerId: 'user-123' // Customer can only see their own appointments
      });
    });

    it('should apply query filters', async () => {
      appointmentService.getAppointments.mockResolvedValue({
        appointments: [],
        pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false }
      });

      await request(app)
        .get('/api/appointments')
        .query({
          status: 'PENDING',
          serviceType: 'consultation',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 2,
          limit: 5
        });

      expect(appointmentService.getAppointments).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        sortBy: 'scheduledDate',
        sortOrder: 'asc',
        customerId: 'user-123',
        status: 'PENDING',
        serviceType: 'consultation',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should return specific appointment', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'user-123',
        customerName: 'John Doe',
        scheduledDate: '2024-01-20T14:00:00Z',
        status: 'PENDING'
      };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .get('/api/appointments/appointment-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointment).toEqual(mockAppointment);
    });

    it('should return 404 for non-existent appointment', async () => {
      appointmentService.getAppointmentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/appointments/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Appointment not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'other-user', // Different customer
        customerName: 'Jane Doe'
      };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .get('/api/appointments/appointment-123');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/appointments/:id/cancel', () => {
    it('should cancel appointment successfully', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'user-123',
        status: 'PENDING'
      };

      const mockCancelledAppointment = {
        ...mockAppointment,
        status: 'CANCELLED'
      };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);
      appointmentService.cancelAppointment.mockResolvedValue(mockCancelledAppointment);

      const response = await request(app)
        .post('/api/appointments/appointment-123/cancel')
        .send({ reason: 'Customer request' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment cancelled successfully');
      expect(response.body.appointment.status).toBe('CANCELLED');

      expect(appointmentService.cancelAppointment).toHaveBeenCalledWith(
        'appointment-123',
        'Customer request'
      );
    });

    it('should return 403 for unauthorized cancellation', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'other-user', // Different customer
        status: 'PENDING'
      };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .post('/api/appointments/appointment-123/cancel');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 409 for already cancelled appointment', async () => {
      const mockAppointment = {
        id: 'appointment-123',
        customerId: 'user-123',
        status: 'PENDING'
      };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);
      appointmentService.cancelAppointment.mockRejectedValue(
        new Error('Appointment is already cancelled')
      );

      const response = await request(app)
        .post('/api/appointments/appointment-123/cancel');

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Cannot cancel');
    });
  });

  describe('Admin-only endpoints', () => {
    let adminApp;
    
    beforeEach(() => {
      // Create admin test app with admin user mock
      adminApp = express();
      adminApp.use(express.json());
      
      // Mock admin auth middleware
      adminApp.use((req, res, next) => {
        req.user = {
          id: 'admin-123',
          role: 'ADMIN',
          email: 'admin@example.com'
        };
        next();
      });
      
      adminApp.use('/api/appointments', appointmentRoutes);
      
      // Error handling middleware
      adminApp.use((error, req, res, next) => {
        if (error.name === 'ValidationError') {
          return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
      });
    });

    describe('POST /api/appointments/:id/confirm', () => {
      it('should confirm appointment successfully', async () => {
        const mockConfirmedAppointment = {
          id: 'appointment-123',
          status: 'CONFIRMED'
        };

        appointmentService.confirmAppointment.mockResolvedValue(mockConfirmedAppointment);

        const response = await request(adminApp)
          .post('/api/appointments/appointment-123/confirm');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.appointment.status).toBe('CONFIRMED');
      });
    });

    describe('POST /api/appointments/:id/complete', () => {
      it('should complete appointment successfully', async () => {
        const mockCompletedAppointment = {
          id: 'appointment-123',
          status: 'COMPLETED'
        };

        appointmentService.completeAppointment.mockResolvedValue(mockCompletedAppointment);

        const response = await request(adminApp)
          .post('/api/appointments/appointment-123/complete')
          .send({ notes: 'Service completed successfully' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.appointment.status).toBe('COMPLETED');

        expect(appointmentService.completeAppointment).toHaveBeenCalledWith(
          'appointment-123',
          { notes: 'Service completed successfully' }
        );
      });
    });

    describe('GET /api/appointments/admin/stats', () => {
      it('should return appointment statistics', async () => {
        const mockStats = {
          total: 100,
          pending: 20,
          confirmed: 30,
          completed: 40,
          cancelled: 10,
          completionRate: 40,
          cancellationRate: 10
        };

        appointmentService.getAppointmentStats.mockResolvedValue(mockStats);

        const response = await request(adminApp)
          .get('/api/appointments/admin/stats');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.stats).toEqual(mockStats);
      });

      it('should apply date filters to stats', async () => {
        appointmentService.getAppointmentStats.mockResolvedValue({});

        await request(adminApp)
          .get('/api/appointments/admin/stats')
          .query({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            serviceType: 'consultation'
          });

        expect(appointmentService.getAppointmentStats).toHaveBeenCalledWith({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          serviceType: 'consultation'
        });
      });
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to booking endpoint', async () => {
      // This test would require more complex setup to test rate limiting
      // For now, we just verify the endpoint exists and works
      appointmentService.createAppointment.mockResolvedValue({
        id: 'appointment-123',
        status: 'PENDING',
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/api/appointments/book')
        .send({
          scheduledDate: '2024-01-20T14:00:00Z',
          serviceType: 'consultation',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          propertyAddress: '123 Main St, City, State'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      appointmentService.createAppointment.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/appointments/book')
        .send({
          scheduledDate: '2024-01-20T14:00:00Z',
          serviceType: 'consultation',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          propertyAddress: '123 Main St, City, State'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});