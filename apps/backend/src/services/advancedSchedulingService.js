import prisma from '../config/database.js';
import serviceTypeService from './serviceTypeService.js';
import availabilityService from './availabilityService.js';

class AdvancedSchedulingService {
  /**
   * Check if a booking can be made considering all advanced scheduling rules
   * @param {Object} bookingRequest - The booking request details
   * @returns {Promise<Object>} Validation result with isValid, conflicts, and suggestions
   */
  async validateAdvancedBooking(bookingRequest) {
    try {
      const {
        serviceTypeId,
        scheduledDate,
        duration,
        customerId,
        excludeAppointmentId = null
      } = bookingRequest;

      const appointmentDate = new Date(scheduledDate);
      const dayOfWeek = appointmentDate.getDay();
      const dateString = appointmentDate.toISOString().split('T')[0];

      const validationResult = {
        isValid: true,
        conflicts: [],
        suggestions: [],
        warnings: []
      };

      // Get service type details
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      if (!serviceType || !serviceType.isActive) {
        validationResult.isValid = false;
        validationResult.conflicts.push({
          type: 'INVALID_SERVICE_TYPE',
          message: 'Invalid or inactive service type'
        });
        return validationResult;
      }

      // Check daily booking limits for this service type
      const dailyLimitCheck = await this.checkDailyBookingLimits(
        serviceTypeId,
        appointmentDate,
        excludeAppointmentId
      );
      if (!dailyLimitCheck.isValid) {
        validationResult.isValid = false;
        validationResult.conflicts.push(dailyLimitCheck.conflict);
        validationResult.suggestions.push(...dailyLimitCheck.suggestions);
      }

      // Check service-specific availability patterns
      const availabilityCheck = await this.checkServiceSpecificAvailability(
        serviceTypeId,
        appointmentDate,
        duration
      );
      if (!availabilityCheck.isValid) {
        validationResult.isValid = false;
        validationResult.conflicts.push(...availabilityCheck.conflicts);
        validationResult.suggestions.push(...availabilityCheck.suggestions);
      }

      // Check for overlapping service requirements
      const overlapCheck = await this.checkOverlappingServiceRequirements(
        serviceTypeId,
        appointmentDate,
        duration,
        excludeAppointmentId
      );
      if (!overlapCheck.isValid) {
        validationResult.isValid = false;
        validationResult.conflicts.push(...overlapCheck.conflicts);
        validationResult.suggestions.push(...overlapCheck.suggestions);
      }

      // Check for exclusive service conflicts
      const exclusiveCheck = await this.checkExclusiveServiceConflicts(
        serviceTypeId,
        appointmentDate,
        excludeAppointmentId
      );
      if (!exclusiveCheck.isValid) {
        validationResult.isValid = false;
        validationResult.conflicts.push(...exclusiveCheck.conflicts);
        validationResult.suggestions.push(...exclusiveCheck.suggestions);
      }

      // Check customer-specific restrictions
      const customerCheck = await this.checkCustomerBookingRestrictions(
        customerId,
        serviceTypeId,
        appointmentDate,
        excludeAppointmentId
      );
      if (!customerCheck.isValid) {
        validationResult.isValid = false;
        validationResult.conflicts.push(...customerCheck.conflicts);
      }

      // Add warnings for potential issues
      const warnings = await this.checkBookingWarnings(
        serviceTypeId,
        appointmentDate,
        duration
      );
      validationResult.warnings.push(...warnings);

      return validationResult;
    } catch (error) {
      console.error('Error validating advanced booking:', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'VALIDATION_ERROR',
          message: 'Error validating booking request'
        }],
        suggestions: [],
        warnings: []
      };
    }
  }

  /**
   * Check daily booking limits for a service type
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {string} excludeAppointmentId - Appointment ID to exclude
   * @returns {Promise<Object>} Validation result
   */
  async checkDailyBookingLimits(serviceTypeId, date, excludeAppointmentId = null) {
    try {
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      const dateString = date.toISOString().split('T')[0];
      
      // Get existing appointments for this service type on this date
      const where = {
        serviceTypeId,
        scheduledDate: {
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lte: new Date(`${dateString}T23:59:59.999Z`)
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      };

      if (excludeAppointmentId) {
        where.id = { not: excludeAppointmentId };
      }

      const existingAppointments = await prisma.appointment.count({ where });

      if (existingAppointments >= serviceType.maxBookingsPerDay) {
        // Find alternative dates
        const suggestions = await this.findAlternativeDates(
          serviceTypeId,
          date,
          7 // Look ahead 7 days
        );

        return {
          isValid: false,
          conflict: {
            type: 'DAILY_LIMIT_EXCEEDED',
            message: `Maximum ${serviceType.maxBookingsPerDay} bookings per day reached for ${serviceType.displayName}`,
            currentCount: existingAppointments,
            maxAllowed: serviceType.maxBookingsPerDay
          },
          suggestions
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error checking daily booking limits:', error);
      return {
        isValid: false,
        conflict: {
          type: 'LIMIT_CHECK_ERROR',
          message: 'Error checking daily booking limits'
        },
        suggestions: []
      };
    }
  }

  /**
   * Check service-specific availability patterns
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {number} duration - Appointment duration
   * @returns {Promise<Object>} Validation result
   */
  async checkServiceSpecificAvailability(serviceTypeId, date, duration) {
    try {
      const dayOfWeek = date.getDay();
      const startTime = this._formatTimeFromDate(date);
      
      // Check if service type allows booking on this day
      const isAllowedOnDay = await serviceTypeService.isBookingAllowedOnDay(serviceTypeId, dayOfWeek);
      if (!isAllowedOnDay) {
        const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Find alternative days
        const suggestions = await this.findAlternativeDaysForService(serviceTypeId, date);

        return {
          isValid: false,
          conflicts: [{
            type: 'DAY_NOT_ALLOWED',
            message: `${serviceType.displayName} is not available on ${dayNames[dayOfWeek]}`,
            serviceType: serviceType.displayName,
            requestedDay: dayNames[dayOfWeek],
            allowedDays: serviceType.allowedDays.map(day => dayNames[day])
          }],
          suggestions
        };
      }

      // Check advance booking time limits
      const advanceValidation = await serviceTypeService.validateAdvanceBookingTime(serviceTypeId, date);
      if (!advanceValidation.isValid) {
        return {
          isValid: false,
          conflicts: [{
            type: 'ADVANCE_TIME_VIOLATION',
            message: advanceValidation.message
          }],
          suggestions: []
        };
      }

      // Check if slot is available according to availability rules
      const isSlotAvailable = await availabilityService.isSlotAvailable(
        date,
        startTime,
        duration,
        serviceTypeId
      );

      if (!isSlotAvailable) {
        // Find alternative time slots
        const suggestions = await this.findAlternativeTimeSlots(
          serviceTypeId,
          date,
          duration
        );

        return {
          isValid: false,
          conflicts: [{
            type: 'SLOT_NOT_AVAILABLE',
            message: 'The requested time slot is not available for this service type'
          }],
          suggestions
        };
      }

      return { isValid: true, conflicts: [], suggestions: [] };
    } catch (error) {
      console.error('Error checking service-specific availability:', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'AVAILABILITY_CHECK_ERROR',
          message: 'Error checking service availability'
        }],
        suggestions: []
      };
    }
  }

  /**
   * Check for overlapping service requirements
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {number} duration - Appointment duration
   * @param {string} excludeAppointmentId - Appointment ID to exclude
   * @returns {Promise<Object>} Validation result
   */
  async checkOverlappingServiceRequirements(serviceTypeId, date, duration, excludeAppointmentId = null) {
    try {
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      const startTime = date;
      const endTime = new Date(date.getTime() + (duration * 60 * 1000));
      const bufferTime = serviceType.bufferMinutes * 60 * 1000; // Convert to milliseconds

      // Get all appointments that might overlap (including buffer time)
      const bufferStartTime = new Date(startTime.getTime() - bufferTime);
      const bufferEndTime = new Date(endTime.getTime() + bufferTime);

      const where = {
        scheduledDate: {
          gte: bufferStartTime,
          lte: bufferEndTime
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      };

      if (excludeAppointmentId) {
        where.id = { not: excludeAppointmentId };
      }

      const overlappingAppointments = await prisma.appointment.findMany({
        where,
        include: {
          serviceType: true
        }
      });

      const conflicts = [];
      const conflictingAppointments = [];

      for (const appointment of overlappingAppointments) {
        const appointmentStart = appointment.scheduledDate;
        const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60 * 1000));
        const appointmentBufferTime = appointment.serviceType.bufferMinutes * 60 * 1000;

        // Check if appointments overlap considering buffer times
        const appointmentBufferStart = new Date(appointmentStart.getTime() - appointmentBufferTime);
        const appointmentBufferEnd = new Date(appointmentEnd.getTime() + appointmentBufferTime);

        if (this._timeRangesOverlap(startTime, endTime, appointmentBufferStart, appointmentBufferEnd)) {
          conflictingAppointments.push(appointment);
          conflicts.push({
            type: 'OVERLAPPING_APPOINTMENT',
            message: `Conflicts with existing ${appointment.serviceType.displayName} appointment`,
            conflictingAppointment: {
              id: appointment.id,
              serviceType: appointment.serviceType.displayName,
              scheduledDate: appointment.scheduledDate,
              duration: appointment.duration,
              bufferMinutes: appointment.serviceType.bufferMinutes
            }
          });
        }
      }

      if (conflicts.length > 0) {
        // Find alternative time slots that don't conflict
        const suggestions = await this.findNonConflictingTimeSlots(
          serviceTypeId,
          date,
          duration,
          conflictingAppointments
        );

        return {
          isValid: false,
          conflicts,
          suggestions
        };
      }

      return { isValid: true, conflicts: [], suggestions: [] };
    } catch (error) {
      console.error('Error checking overlapping service requirements:', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'OVERLAP_CHECK_ERROR',
          message: 'Error checking for overlapping appointments'
        }],
        suggestions: []
      };
    }
  }

  /**
   * Check for exclusive service conflicts
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {string} excludeAppointmentId - Appointment ID to exclude
   * @returns {Promise<Object>} Validation result
   */
  async checkExclusiveServiceConflicts(serviceTypeId, date, excludeAppointmentId = null) {
    try {
      const dayOfWeek = date.getDay();
      const isExclusiveOnDay = await serviceTypeService.isExclusiveOnDay(serviceTypeId, dayOfWeek);

      if (!isExclusiveOnDay) {
        return { isValid: true, conflicts: [], suggestions: [] };
      }

      // Check for any other appointments on this day
      const conflicts = await serviceTypeService.getExclusiveServiceConflicts(
        serviceTypeId,
        date,
        excludeAppointmentId
      );

      if (conflicts.length > 0) {
        const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
        
        // Find alternative dates where this service can be exclusive
        const suggestions = await this.findExclusiveDatesForService(serviceTypeId, date);

        return {
          isValid: false,
          conflicts: [{
            type: 'EXCLUSIVE_SERVICE_CONFLICT',
            message: `${serviceType.displayName} requires exclusive booking on this day, but there are ${conflicts.length} existing appointment(s)`,
            conflictingAppointments: conflicts.map(apt => ({
              id: apt.id,
              serviceType: apt.serviceType.displayName,
              scheduledDate: apt.scheduledDate
            }))
          }],
          suggestions
        };
      }

      return { isValid: true, conflicts: [], suggestions: [] };
    } catch (error) {
      console.error('Error checking exclusive service conflicts:', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'EXCLUSIVE_CHECK_ERROR',
          message: 'Error checking exclusive service conflicts'
        }],
        suggestions: []
      };
    }
  }

  /**
   * Check customer-specific booking restrictions
   * @param {string} customerId - Customer ID
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {string} excludeAppointmentId - Appointment ID to exclude
   * @returns {Promise<Object>} Validation result
   */
  async checkCustomerBookingRestrictions(customerId, serviceTypeId, date, excludeAppointmentId = null) {
    try {
      const conflicts = [];

      // Check if customer has too many pending appointments
      const pendingAppointments = await prisma.appointment.count({
        where: {
          customerId,
          status: 'PENDING',
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined
        }
      });

      const MAX_PENDING_APPOINTMENTS = 3;
      if (pendingAppointments >= MAX_PENDING_APPOINTMENTS) {
        conflicts.push({
          type: 'TOO_MANY_PENDING',
          message: `Customer has ${pendingAppointments} pending appointments. Maximum allowed: ${MAX_PENDING_APPOINTMENTS}`,
          currentCount: pendingAppointments,
          maxAllowed: MAX_PENDING_APPOINTMENTS
        });
      }

      // Check if customer has conflicting appointments on the same day
      const dateString = date.toISOString().split('T')[0];
      const sameDay = await prisma.appointment.findMany({
        where: {
          customerId,
          scheduledDate: {
            gte: new Date(`${dateString}T00:00:00.000Z`),
            lte: new Date(`${dateString}T23:59:59.999Z`)
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined
        },
        include: {
          serviceType: true
        }
      });

      if (sameDay.length > 0) {
        conflicts.push({
          type: 'CUSTOMER_SAME_DAY_CONFLICT',
          message: `Customer already has ${sameDay.length} appointment(s) on this day`,
          existingAppointments: sameDay.map(apt => ({
            id: apt.id,
            serviceType: apt.serviceType.displayName,
            scheduledDate: apt.scheduledDate
          }))
        });
      }

      // Check if customer has recently cancelled appointments for this service type
      const recentCancellations = await prisma.appointment.count({
        where: {
          customerId,
          serviceTypeId,
          status: 'CANCELLED',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      const MAX_RECENT_CANCELLATIONS = 2;
      if (recentCancellations >= MAX_RECENT_CANCELLATIONS) {
        conflicts.push({
          type: 'TOO_MANY_RECENT_CANCELLATIONS',
          message: `Customer has cancelled ${recentCancellations} appointments for this service type in the last 7 days`,
          currentCount: recentCancellations,
          maxAllowed: MAX_RECENT_CANCELLATIONS
        });
      }

      return {
        isValid: conflicts.length === 0,
        conflicts,
        suggestions: []
      };
    } catch (error) {
      console.error('Error checking customer booking restrictions:', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'CUSTOMER_CHECK_ERROR',
          message: 'Error checking customer booking restrictions'
        }],
        suggestions: []
      };
    }
  }

  /**
   * Check for booking warnings (non-blocking issues)
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {number} duration - Appointment duration
   * @returns {Promise<Array>} Array of warnings
   */
  async checkBookingWarnings(serviceTypeId, date, duration) {
    try {
      const warnings = [];
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);

      // Check if booking is very close to the minimum advance time
      const now = new Date();
      const hoursInAdvance = (date - now) / (1000 * 60 * 60);
      
      if (hoursInAdvance < serviceType.minAdvanceHours * 1.5) {
        warnings.push({
          type: 'SHORT_NOTICE_BOOKING',
          message: `Booking is only ${Math.round(hoursInAdvance)} hours in advance. Consider booking earlier for better availability.`,
          severity: 'medium'
        });
      }

      // Check if booking is on a typically busy day
      const dayOfWeek = date.getDay();
      const busyDays = [1, 2, 3]; // Monday, Tuesday, Wednesday typically busy
      
      if (busyDays.includes(dayOfWeek)) {
        warnings.push({
          type: 'BUSY_DAY_BOOKING',
          message: 'This is typically a busy day. Consider alternative days for more flexibility.',
          severity: 'low'
        });
      }

      // Check if service requires approval
      if (serviceType.requiresApproval) {
        warnings.push({
          type: 'REQUIRES_APPROVAL',
          message: 'This service type requires admin approval before confirmation.',
          severity: 'info'
        });
      }

      return warnings;
    } catch (error) {
      console.error('Error checking booking warnings:', error);
      return [];
    }
  }

  // Helper methods for finding alternatives

  /**
   * Find alternative dates for booking
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} originalDate - Original requested date
   * @param {number} daysToSearch - Number of days to search ahead
   * @returns {Promise<Array>} Array of alternative dates
   */
  async findAlternativeDates(serviceTypeId, originalDate, daysToSearch = 7) {
    try {
      const alternatives = [];
      const currentDate = new Date(originalDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start from next day

      for (let i = 0; i < daysToSearch; i++) {
        const dayOfWeek = currentDate.getDay();
        const isAllowed = await serviceTypeService.isBookingAllowedOnDay(serviceTypeId, dayOfWeek);
        
        if (isAllowed) {
          const dailyLimitCheck = await this.checkDailyBookingLimits(serviceTypeId, currentDate);
          if (dailyLimitCheck.isValid) {
            alternatives.push({
              date: new Date(currentDate),
              dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return alternatives.slice(0, 3); // Return top 3 alternatives
    } catch (error) {
      console.error('Error finding alternative dates:', error);
      return [];
    }
  }

  /**
   * Find alternative days for a service type
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} originalDate - Original requested date
   * @returns {Promise<Array>} Array of alternative day suggestions
   */
  async findAlternativeDaysForService(serviceTypeId, originalDate) {
    try {
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return serviceType.allowedDays.map(dayNum => ({
        dayOfWeek: dayNum,
        dayName: dayNames[dayNum]
      }));
    } catch (error) {
      console.error('Error finding alternative days:', error);
      return [];
    }
  }

  /**
   * Find alternative time slots on the same day
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {number} duration - Appointment duration
   * @returns {Promise<Array>} Array of alternative time slots
   */
  async findAlternativeTimeSlots(serviceTypeId, date, duration) {
    try {
      const availableSlots = await availabilityService.calculateAvailableSlots(
        date,
        serviceTypeId,
        duration
      );

      return availableSlots.slice(0, 5).map(slot => ({
        time: slot.time,
        endTime: slot.endTime,
        duration: slot.duration
      }));
    } catch (error) {
      console.error('Error finding alternative time slots:', error);
      return [];
    }
  }

  /**
   * Find non-conflicting time slots
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} date - Appointment date
   * @param {number} duration - Appointment duration
   * @param {Array} conflictingAppointments - Array of conflicting appointments
   * @returns {Promise<Array>} Array of non-conflicting time slots
   */
  async findNonConflictingTimeSlots(serviceTypeId, date, duration, conflictingAppointments) {
    try {
      const availableSlots = await availabilityService.calculateAvailableSlots(
        date,
        serviceTypeId,
        duration
      );

      // Filter out slots that would conflict with existing appointments
      const nonConflictingSlots = availableSlots.filter(slot => {
        const slotStart = new Date(`${slot.date}T${slot.time}:00.000Z`);
        const slotEnd = new Date(slotStart.getTime() + (slot.duration * 60 * 1000));

        return !conflictingAppointments.some(appointment => {
          const appointmentStart = appointment.scheduledDate;
          const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60 * 1000));
          const bufferTime = appointment.serviceType.bufferMinutes * 60 * 1000;
          
          const bufferedStart = new Date(appointmentStart.getTime() - bufferTime);
          const bufferedEnd = new Date(appointmentEnd.getTime() + bufferTime);

          return this._timeRangesOverlap(slotStart, slotEnd, bufferedStart, bufferedEnd);
        });
      });

      return nonConflictingSlots.slice(0, 3);
    } catch (error) {
      console.error('Error finding non-conflicting time slots:', error);
      return [];
    }
  }

  /**
   * Find exclusive dates for a service
   * @param {string} serviceTypeId - Service type ID
   * @param {Date} originalDate - Original requested date
   * @returns {Promise<Array>} Array of dates where service can be exclusive
   */
  async findExclusiveDatesForService(serviceTypeId, originalDate) {
    try {
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      const alternatives = [];
      const currentDate = new Date(originalDate);
      currentDate.setDate(currentDate.getDate() + 1);

      for (let i = 0; i < 14; i++) { // Search 2 weeks ahead
        const dayOfWeek = currentDate.getDay();
        
        if (serviceType.exclusiveDays.includes(dayOfWeek)) {
          const conflicts = await serviceTypeService.getExclusiveServiceConflicts(
            serviceTypeId,
            currentDate
          );
          
          if (conflicts.length === 0) {
            alternatives.push({
              date: new Date(currentDate),
              dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return alternatives.slice(0, 3);
    } catch (error) {
      console.error('Error finding exclusive dates:', error);
      return [];
    }
  }

  // Private helper methods

  /**
   * Check if two time ranges overlap
   * @param {Date} start1 - Start of first range
   * @param {Date} end1 - End of first range
   * @param {Date} start2 - Start of second range
   * @param {Date} end2 - End of second range
   * @returns {boolean} True if ranges overlap
   */
  _timeRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Format time from a Date object
   * @param {Date} date - Date object
   * @returns {string} Time in HH:MM format
   */
  _formatTimeFromDate(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

export default new AdvancedSchedulingService();