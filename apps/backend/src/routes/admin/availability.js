import express from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { validate, sanitize } from '../../middleware/validation.js';
import { ValidationError } from '../../middleware/error.js';
import availabilityService from '../../services/availabilityService.js';
import appointmentService from '../../services/appointmentService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 admin requests per windowMs
  message: {
    error: 'Too many admin requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply admin authentication and rate limiting to all routes
router.use(adminRateLimit);
router.use(requireAdmin);

// Validation schemas for availability rules
const availabilityValidationSchemas = {
  availabilityUpdate: {
    rules: (value) => {
      if (!Array.isArray(value)) {
        throw new ValidationError('Rules must be an array');
      }
      
      return value.map(rule => {
        // Validate dayOfWeek
        if (typeof rule.dayOfWeek !== 'number' || rule.dayOfWeek < 0 || rule.dayOfWeek > 6) {
          throw new ValidationError('dayOfWeek must be a number between 0 and 6');
        }
        
        // Validate isAvailable
        if (typeof rule.isAvailable !== 'boolean') {
          throw new ValidationError('isAvailable must be a boolean');
        }
        
        // Validate time format if available
        if (rule.isAvailable) {
          if (!rule.startTime || !rule.endTime) {
            throw new ValidationError('startTime and endTime are required when isAvailable is true');
          }
          
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(rule.startTime) || !timeRegex.test(rule.endTime)) {
            throw new ValidationError('Time must be in HH:MM format');
          }
          
          // Validate time order
          const [startHour, startMin] = rule.startTime.split(':').map(Number);
          const [endHour, endMin] = rule.endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          if (startMinutes >= endMinutes) {
            throw new ValidationError('startTime must be before endTime');
          }
        }
        
        // Validate serviceType if provided
        if (rule.serviceType && typeof rule.serviceType !== 'string') {
          throw new ValidationError('serviceType must be a string');
        }
        
        // Validate bufferMinutes if provided
        if (rule.bufferMinutes !== undefined) {
          const buffer = parseInt(rule.bufferMinutes);
          if (isNaN(buffer) || buffer < 0 || buffer > 120) {
            throw new ValidationError('bufferMinutes must be between 0 and 120');
          }
          rule.bufferMinutes = buffer;
        }
        
        // Validate maxBookingsPerDay if provided
        if (rule.maxBookingsPerDay !== undefined) {
          const maxBookings = parseInt(rule.maxBookingsPerDay);
          if (isNaN(maxBookings) || maxBookings < 1 || maxBookings > 50) {
            throw new ValidationError('maxBookingsPerDay must be between 1 and 50');
          }
          rule.maxBookingsPerDay = maxBookings;
        }
        
        return {
          dayOfWeek: rule.dayOfWeek,
          isAvailable: rule.isAvailable,
          startTime: rule.startTime || '09:00',
          endTime: rule.endTime || '17:00',
          serviceType: rule.serviceType?.trim() || null,
          bufferMinutes: rule.bufferMinutes || 30,
          maxBookingsPerDay: rule.maxBookingsPerDay || 8
        };
      });
    }
  }
};

// Custom validation middleware for availability
const validateAvailability = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = availabilityValidationSchemas[schemaName];
      if (!schema) {
        throw new ValidationError(`Validation schema '${schemaName}' not found`);
      }
      
      const validatedData = {};
      
      // Validate each field in the schema
      Object.keys(schema).forEach(field => {
        const value = req.body[field];
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

// GET /api/admin/availability - Get current availability rules
router.get('/', async (req, res, next) => {
  try {
    const { serviceType } = req.query;
    
    const rules = await availabilityService.getAvailabilityRules(serviceType);
    
    res.json({
      success: true,
      rules: rules.map(rule => ({
        id: rule.id,
        dayOfWeek: rule.dayOfWeek,
        isAvailable: rule.isAvailable,
        startTime: rule.startTime,
        endTime: rule.endTime,
        serviceType: rule.serviceType,
        bufferMinutes: rule.bufferMinutes,
        maxBookingsPerDay: rule.maxBookingsPerDay,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error getting availability rules:', error);
    next(error);
  }
});

// PUT /api/admin/availability - Update availability rules
router.put('/',
  sanitize,
  validateAvailability('availabilityUpdate'),
  async (req, res, next) => {
    try {
      const { rules } = req.validatedData;
      
      if (!rules || rules.length === 0) {
        return res.status(400).json({
          error: 'No rules provided',
          message: 'Please provide at least one availability rule'
        });
      }
      
      // Update availability rules
      const updatedRules = await availabilityService.updateAvailabilityRules(rules);
      
      res.json({
        success: true,
        message: 'Availability rules updated successfully',
        rules: updatedRules.map(rule => ({
          id: rule.id,
          dayOfWeek: rule.dayOfWeek,
          isAvailable: rule.isAvailable,
          startTime: rule.startTime,
          endTime: rule.endTime,
          serviceType: rule.serviceType,
          bufferMinutes: rule.bufferMinutes,
          maxBookingsPerDay: rule.maxBookingsPerDay,
          updatedAt: rule.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error updating availability rules:', error);
      
      if (error.message.includes('conflict') || error.message.includes('overlapping')) {
        return res.status(409).json({
          error: 'Rule conflict',
          message: error.message
        });
      }
      
      next(error);
    }
  }
);

// GET /api/admin/appointments - Get appointments for admin management
router.get('/appointments', async (req, res, next) => {
  try {
    const {
      status,
      serviceType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
      search
    } = req.query;

    // Build filter options
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Cap at 100 for performance
      sortBy,
      sortOrder
    };

    // Apply filters
    if (status) options.status = status;
    if (serviceType) options.serviceType = serviceType;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (search) options.search = search;

    const result = await appointmentService.getAppointments(options);

    res.json({
      success: true,
      appointments: result.appointments.map(appointment => ({
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        scheduledDate: appointment.scheduledDate,
        duration: appointment.duration,
        serviceType: appointment.serviceType,
        propertyAddress: appointment.propertyAddress,
        status: appointment.status,
        notes: appointment.notes,
        calendarEventId: appointment.calendarEventId,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      })),
      pagination: result.pagination,
      summary: {
        total: result.pagination.totalCount,
        pending: result.appointments.filter(a => a.status === 'PENDING').length,
        confirmed: result.appointments.filter(a => a.status === 'CONFIRMED').length,
        completed: result.appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: result.appointments.filter(a => a.status === 'CANCELLED').length
      }
    });
  } catch (error) {
    console.error('Error getting admin appointments:', error);
    next(error);
  }
});

// GET /api/admin/appointments/stats - Get appointment statistics
router.get('/appointments/stats', async (req, res, next) => {
  try {
    const { startDate, endDate, serviceType } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (serviceType) filters.serviceType = serviceType;

    const stats = await appointmentService.getAppointmentStats(filters);

    res.json({
      success: true,
      stats: {
        ...stats,
        period: {
          startDate: startDate || 'all time',
          endDate: endDate || 'present'
        }
      }
    });
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    next(error);
  }
});

// PUT /api/admin/appointments/:id - Update appointment
router.put('/appointments/:id',
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const updateData = {};
      const allowedFields = ['status', 'notes', 'scheduledDate', 'duration', 'serviceType'];
      
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
        appointment: {
          id: updatedAppointment.id,
          customerName: updatedAppointment.customerName,
          customerEmail: updatedAppointment.customerEmail,
          scheduledDate: updatedAppointment.scheduledDate,
          duration: updatedAppointment.duration,
          serviceType: updatedAppointment.serviceType,
          status: updatedAppointment.status,
          notes: updatedAppointment.notes,
          updatedAt: updatedAppointment.updatedAt
        }
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

// POST /api/admin/appointments/:id/confirm - Confirm appointment
router.post('/appointments/:id/confirm', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const confirmedAppointment = await appointmentService.confirmAppointment(id);

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      appointment: {
        id: confirmedAppointment.id,
        customerName: confirmedAppointment.customerName,
        customerEmail: confirmedAppointment.customerEmail,
        scheduledDate: confirmedAppointment.scheduledDate,
        status: confirmedAppointment.status,
        updatedAt: confirmedAppointment.updatedAt
      }
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
});

// POST /api/admin/appointments/:id/cancel - Cancel appointment
router.post('/appointments/:id/cancel',
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const cancelledAppointment = await appointmentService.cancelAppointment(id, reason);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: {
          id: cancelledAppointment.id,
          customerName: cancelledAppointment.customerName,
          customerEmail: cancelledAppointment.customerEmail,
          scheduledDate: cancelledAppointment.scheduledDate,
          status: cancelledAppointment.status,
          updatedAt: cancelledAppointment.updatedAt
        }
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

// POST /api/admin/appointments/:id/complete - Complete appointment
router.post('/appointments/:id/complete',
  sanitize,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const completedAppointment = await appointmentService.completeAppointment(id, { notes });

      res.json({
        success: true,
        message: 'Appointment completed successfully',
        appointment: {
          id: completedAppointment.id,
          customerName: completedAppointment.customerName,
          customerEmail: completedAppointment.customerEmail,
          scheduledDate: completedAppointment.scheduledDate,
          status: completedAppointment.status,
          notes: completedAppointment.notes,
          updatedAt: completedAppointment.updatedAt
        }
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

export default router;