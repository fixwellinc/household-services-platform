import express from 'express';
import appointmentService from '../services/appointmentService.js';
import availabilityService from '../services/availabilityService.js';
import { authMiddleware, requireCustomer, requireCustomerOrAdmin } from '../middleware/auth.js';
import { validate, sanitize } from '../middleware/validation.js';
import { ValidationError } from '../middleware/error.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for booking endpoints
const bookingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 booking requests per windowMs
  message: {
    error: 'Too many booking requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const availabilityRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 availability requests per minute
  message: {
    error: 'Too many availability requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas for appointments
const appointmentValidationSchemas = {
  availability: {
    date: (value) => {
      if (!value) throw new ValidationError('Date is required');
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new ValidationError('Invalid date format');
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    },
    serviceType: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Service type must be a string');
      }
      return value?.trim() || null;
    }
  },
  
  booking: {
    scheduledDate: (value) => {
      if (!value) throw new ValidationError('Scheduled date is required');
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new ValidationError('Invalid date format');
      if (date <= new Date()) throw new ValidationError('Appointment must be scheduled for a future date and time');
      return date.toISOString();
    },
    serviceType: (value) => {
      if (!value) throw new ValidationError('Service type is required');
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError('Service type must be a non-empty string');
      }
      return value.trim();
    },
    customerName: (value) => {
      if (!value) throw new ValidationError('Customer name is required');
      if (typeof value !== 'string' || value.trim().length < 2) {
        throw new ValidationError('Customer name must be at least 2 characters');
      }
      if (value.length > 100) throw new ValidationError('Customer name must be less than 100 characters');
      return value.trim();
    },
    customerEmail: (value) => {
      if (!value) throw new ValidationError('Customer email is required');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) throw new ValidationError('Invalid email format');
      return value.toLowerCase().trim();
    },
    customerPhone: (value) => {
      if (value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          throw new ValidationError('Invalid phone number format');
        }
        return value.trim();
      }
      return null;
    },
    propertyAddress: (value) => {
      if (!value) throw new ValidationError('Property address is required');
      if (typeof value !== 'string' || value.trim().length < 10) {
        throw new ValidationError('Property address must be at least 10 characters');
      }
      if (value.length > 500) throw new ValidationError('Property address must be less than 500 characters');
      return value.trim();
    },
    duration: (value) => {
      if (value) {
        const duration = parseInt(value);
        if (isNaN(duration) || duration < 15 || duration > 480) {
          throw new ValidationError('Duration must be between 15 minutes and 8 hours');
        }
        return duration;
      }
      return 60; // Default duration
    },
    notes: (value) => {
      if (value && value.length > 1000) {
        throw new ValidationError('Notes must be less than 1000 characters');
      }
      return value?.trim() || null;
    }
  }
};

// Custom validation middleware for appointments
const validateAppointment = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = appointmentValidationSchemas[schemaName];
      if (!schema) {
        throw new ValidationError(`Validation schema '${schemaName}' not found`);
      }
      
      const validatedData = {};
      
      // Validate each field in the schema
      Object.keys(schema).forEach(field => {
        const value = req.body[field] || req.query[field];
        if (value !== undefined) {
          validatedData[field] = schema[field](value);
        }
      });
      
      // Merge validated data
      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// GET /api/appointments/availability - Check available time slots
router.get('/availability', 
  availabilityRateLimit,
  sanitize,
  validateAppointment('availability'),
  async (req, res, next) => {
    try {
      const { date, serviceType } = req.validatedData;
      
      if (!date) {
        return res.status(400).json({
          error: 'Date parameter is required',
          message: 'Please provide a date in YYYY-MM-DD format'
        });
      }

      // Calculate available slots for the requested date
      const targetDate = new Date(date);
      const availableSlots = await availabilityService.calculateAvailableSlots(
        targetDate,
        serviceType,
        60 // Default 60-minute slots
      );

      res.json({
        date,
        serviceType: serviceType || null,
        availableSlots: availableSlots.map(slot => ({
          time: slot.time,
          duration: slot.duration,
          endTime: slot.endTime
        }))
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      next(error);
    }
  }
);

// POST /api/appointments/book - Create a new appointment booking
router.post('/book',
  bookingRateLimit,
  sanitize,
  validateAppointment('booking'),
  async (req, res, next) => {
    try {
      const appointmentData = {
        customerId: req.validatedData.customerId || 'guest', // Allow guest bookings
        serviceType: req.validatedData.serviceType,
        scheduledDate: req.validatedData.scheduledDate,
        duration: req.validatedData.duration,
        customerName: req.validatedData.customerName,
        customerEmail: req.validatedData.customerEmail,
        customerPhone: req.validatedData.customerPhone,
        propertyAddress: req.validatedData.propertyAddress,
        notes: req.validatedData.notes
      };

      // Create the appointment
      const appointment = await appointmentService.createAppointment(appointmentData);

      // Generate confirmation number
      const confirmationNumber = `APT-${appointment.id.slice(-8).toUpperCase()}`;

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        appointment: {
          id: appointment.id,
          confirmationNumber,
          scheduledDate: appointment.scheduledDate,
          serviceType: appointment.serviceType,
          duration: appointment.duration,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          propertyAddress: appointment.propertyAddress,
          status: appointment.status,
          createdAt: appointment.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Handle specific error types
      if (error.message.includes('not available') || 
          error.message.includes('conflicts') ||
          error.message.includes('future date')) {
        return res.status(409).json({
          error: 'Booking conflict',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// GET /api/appointments - Get appointments (authenticated users only)
router.get('/',
  authMiddleware,
  async (req, res, next) => {
    try {
      const {
        status,
        serviceType,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'asc'
      } = req.query;

      // Build filter options
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      // Customers can only see their own appointments
      if (req.user.role === 'CUSTOMER') {
        options.customerId = req.user.id;
      }

      // Apply filters
      if (status) options.status = status;
      if (serviceType) options.serviceType = serviceType;
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;

      const result = await appointmentService.getAppointments(options);

      res.json({
        success: true,
        appointments: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting appointments:', error);
      next(error);
    }
  }
);

// GET /api/appointments/:id - Get specific appointment
router.get('/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: 'The requested appointment does not exist'
        });
      }

      // Check authorization - customers can only see their own appointments
      if (req.user.role === 'CUSTOMER' && appointment.customerId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own appointments'
        });
      }

      res.json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error getting appointment:', error);
      next(error);
    }
  }
);

// PUT /api/appointments/:id - Update appointment (admin only for now)
router.put('/:id',
  authMiddleware,
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Only admins can update appointments for now
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can update appointments'
        });
      }

      const updateData = {};
      const allowedFields = ['status', 'notes', 'scheduledDate', 'duration'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          message: 'Please provide at least one field to update'
        });
      }

      const updatedAppointment = await appointmentService.updateAppointment(id, updateData);

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: error.message
        });
      }
      
      if (error.message.includes('transition') || 
          error.message.includes('not available') ||
          error.message.includes('conflicts')) {
        return res.status(409).json({
          error: 'Update conflict',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// POST /api/appointments/:id/confirm - Confirm appointment (admin only)
router.post('/:id/confirm',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Only admins can confirm appointments
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can confirm appointments'
        });
      }

      const confirmedAppointment = await appointmentService.confirmAppointment(id);

      res.json({
        success: true,
        message: 'Appointment confirmed successfully',
        appointment: confirmedAppointment
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: error.message
        });
      }
      
      if (error.message.includes('pending')) {
        return res.status(409).json({
          error: 'Invalid status',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// POST /api/appointments/:id/cancel - Cancel appointment
router.post('/:id/cancel',
  authMiddleware,
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Get appointment to check ownership
      const appointment = await appointmentService.getAppointmentById(id);
      if (!appointment) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: 'The requested appointment does not exist'
        });
      }

      // Check authorization - customers can only cancel their own appointments
      if (req.user.role === 'CUSTOMER' && appointment.customerId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only cancel your own appointments'
        });
      }

      const cancelledAppointment = await appointmentService.cancelAppointment(id, reason);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: cancelledAppointment
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: error.message
        });
      }
      
      if (error.message.includes('already cancelled') || 
          error.message.includes('completed')) {
        return res.status(409).json({
          error: 'Cannot cancel',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// POST /api/appointments/:id/complete - Complete appointment (admin only)
router.post('/:id/complete',
  authMiddleware,
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Only admins can complete appointments
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can complete appointments'
        });
      }

      const completedAppointment = await appointmentService.completeAppointment(id, { notes });

      res.json({
        success: true,
        message: 'Appointment completed successfully',
        appointment: completedAppointment
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: error.message
        });
      }
      
      if (error.message.includes('confirmed')) {
        return res.status(409).json({
          error: 'Invalid status',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// GET /api/appointments/stats - Get appointment statistics (admin only)
router.get('/admin/stats',
  authMiddleware,
  async (req, res, next) => {
    try {
      // Only admins can view statistics
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can view appointment statistics'
        });
      }

      const { startDate, endDate, serviceType } = req.query;
      
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (serviceType) filters.serviceType = serviceType;

      const stats = await appointmentService.getAppointmentStats(filters);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      next(error);
    }
  }
);

export default router;