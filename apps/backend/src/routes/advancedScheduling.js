import express from 'express';
import advancedSchedulingService from '../services/advancedSchedulingService.js';
import serviceTypeService from '../services/serviceTypeService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Validate a booking request against advanced scheduling rules
 * POST /api/advanced-scheduling/validate
 */
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const {
      serviceTypeId,
      scheduledDate,
      duration,
      customerId,
      excludeAppointmentId
    } = req.body;

    // Validate required fields
    if (!serviceTypeId || !scheduledDate || !customerId) {
      return res.status(400).json({
        success: false,
        error: 'serviceTypeId, scheduledDate, and customerId are required'
      });
    }

    // Validate date format
    const appointmentDate = new Date(scheduledDate);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scheduledDate format'
      });
    }

    // Get service type to determine duration if not provided
    const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    const actualDuration = duration || serviceType.duration;

    // Validate the booking request
    const validationResult = await advancedSchedulingService.validateAdvancedBooking({
      serviceTypeId,
      scheduledDate: appointmentDate,
      duration: actualDuration,
      customerId,
      excludeAppointmentId
    });

    res.json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        conflicts: validationResult.conflicts,
        suggestions: validationResult.suggestions,
        warnings: validationResult.warnings,
        serviceType: {
          id: serviceType.id,
          name: serviceType.name,
          displayName: serviceType.displayName,
          duration: serviceType.duration,
          requiresApproval: serviceType.requiresApproval
        }
      }
    });
  } catch (error) {
    console.error('Error validating advanced booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get alternative booking suggestions
 * POST /api/advanced-scheduling/alternatives
 */
router.post('/alternatives', authMiddleware, async (req, res) => {
  try {
    const {
      serviceTypeId,
      originalDate,
      duration,
      searchDays = 7
    } = req.body;

    // Validate required fields
    if (!serviceTypeId || !originalDate) {
      return res.status(400).json({
        success: false,
        error: 'serviceTypeId and originalDate are required'
      });
    }

    // Validate date format
    const requestedDate = new Date(originalDate);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid originalDate format'
      });
    }

    // Get service type
    const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    const actualDuration = duration || serviceType.duration;

    // Find alternative dates
    const alternativeDates = await advancedSchedulingService.findAlternativeDates(
      serviceTypeId,
      requestedDate,
      searchDays
    );

    // Find alternative time slots for the original date
    const alternativeTimeSlots = await advancedSchedulingService.findAlternativeTimeSlots(
      serviceTypeId,
      requestedDate,
      actualDuration
    );

    res.json({
      success: true,
      data: {
        originalDate: requestedDate.toISOString(),
        serviceType: {
          id: serviceType.id,
          name: serviceType.name,
          displayName: serviceType.displayName,
          duration: serviceType.duration
        },
        alternativeDates,
        alternativeTimeSlots,
        searchParameters: {
          searchDays,
          duration: actualDuration
        }
      }
    });
  } catch (error) {
    console.error('Error finding booking alternatives:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check daily booking limits for a service type
 * GET /api/advanced-scheduling/daily-limits/:serviceTypeId/:date
 */
router.get('/daily-limits/:serviceTypeId/:date', authMiddleware, async (req, res) => {
  try {
    const { serviceTypeId, date } = req.params;

    // Validate date format
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Get service type
    const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    // Check daily limits
    const limitCheck = await advancedSchedulingService.checkDailyBookingLimits(
      serviceTypeId,
      checkDate
    );

    res.json({
      success: true,
      data: {
        date: checkDate.toISOString().split('T')[0],
        serviceType: {
          id: serviceType.id,
          displayName: serviceType.displayName,
          maxBookingsPerDay: serviceType.maxBookingsPerDay
        },
        isValid: limitCheck.isValid,
        conflict: limitCheck.conflict || null,
        suggestions: limitCheck.suggestions || []
      }
    });
  } catch (error) {
    console.error('Error checking daily booking limits:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get service type scheduling configuration
 * GET /api/advanced-scheduling/service-types/:id/config
 */
router.get('/service-types/:id/config', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await serviceTypeService.getServiceTypeById(id);
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      success: true,
      data: {
        id: serviceType.id,
        name: serviceType.name,
        displayName: serviceType.displayName,
        description: serviceType.description,
        duration: serviceType.duration,
        bufferMinutes: serviceType.bufferMinutes,
        maxBookingsPerDay: serviceType.maxBookingsPerDay,
        requiresApproval: serviceType.requiresApproval,
        isExclusive: serviceType.isExclusive,
        minAdvanceHours: serviceType.minAdvanceHours,
        maxAdvanceDays: serviceType.maxAdvanceDays,
        allowedDays: serviceType.allowedDays.map(day => ({
          dayOfWeek: day,
          dayName: dayNames[day]
        })),
        exclusiveDays: serviceType.exclusiveDays.map(day => ({
          dayOfWeek: day,
          dayName: dayNames[day]
        })),
        isActive: serviceType.isActive,
        color: serviceType.color
      }
    });
  } catch (error) {
    console.error('Error getting service type config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get all active service types with their scheduling configurations
 * GET /api/advanced-scheduling/service-types
 */
router.get('/service-types', authMiddleware, async (req, res) => {
  try {
    const serviceTypes = await serviceTypeService.getServiceTypes();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const serviceTypesWithConfig = serviceTypes.map(serviceType => ({
      id: serviceType.id,
      name: serviceType.name,
      displayName: serviceType.displayName,
      description: serviceType.description,
      duration: serviceType.duration,
      bufferMinutes: serviceType.bufferMinutes,
      maxBookingsPerDay: serviceType.maxBookingsPerDay,
      requiresApproval: serviceType.requiresApproval,
      isExclusive: serviceType.isExclusive,
      minAdvanceHours: serviceType.minAdvanceHours,
      maxAdvanceDays: serviceType.maxAdvanceDays,
      allowedDays: serviceType.allowedDays.map(day => ({
        dayOfWeek: day,
        dayName: dayNames[day]
      })),
      exclusiveDays: serviceType.exclusiveDays.map(day => ({
        dayOfWeek: day,
        dayName: dayNames[day]
      })),
      isActive: serviceType.isActive,
      color: serviceType.color,
      appointmentCount: serviceType._count?.appointments || 0,
      availabilityRuleCount: serviceType._count?.availabilityRules || 0
    }));

    res.json({
      success: true,
      data: serviceTypesWithConfig
    });
  } catch (error) {
    console.error('Error getting service types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;