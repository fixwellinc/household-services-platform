import prisma from '../config/database.js';
import availabilityService from './availabilityService.js';
import serviceTypeService from './serviceTypeService.js';
import advancedSchedulingService from './advancedSchedulingService.js';
import appointmentSocketService from './appointmentSocketService.js';
import notificationDeliveryService from './notificationDeliveryService.js';
import appointmentCacheService from './appointmentCacheService.js';
import appointmentPerformanceService from './appointmentPerformanceService.js';

class AppointmentService {
  /**
   * Create a new appointment booking
   * @param {Object} appointmentData - The appointment data
   * @returns {Promise<Object>} The created appointment
   */
  async createAppointment(appointmentData) {
    const timer = appointmentPerformanceService.monitorAppointmentOperation('creation', 'new');
    
    try {
      const {
        customerId,
        serviceTypeId,
        scheduledDate,
        duration, // Will be overridden by service type default
        customerName,
        customerEmail,
        customerPhone,
        propertyAddress,
        notes
      } = appointmentData;

      // Validate required fields
      this._validateAppointmentData(appointmentData);

      // Get service type details and validate
      const serviceType = await serviceTypeService.getServiceTypeById(serviceTypeId);
      if (!serviceType || !serviceType.isActive) {
        throw new Error('Invalid or inactive service type');
      }

      // Use service type default duration
      const actualDuration = serviceType.duration;

      // Parse scheduled date
      const appointmentDate = new Date(scheduledDate);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid scheduled date format');
      }

      // Check if the appointment is in the future
      if (appointmentDate <= new Date()) {
        throw new Error('Appointment must be scheduled for a future date and time');
      }

      // Validate advance booking time limits
      const advanceValidation = await serviceTypeService.validateAdvanceBookingTime(serviceTypeId, appointmentDate);
      if (!advanceValidation.isValid) {
        throw new Error(advanceValidation.message);
      }

      // Extract time components for availability checking
      const dayOfWeek = appointmentDate.getDay();
      const startTime = this._formatTimeFromDate(appointmentDate);
      
      // Check if service type allows booking on this day
      const isAllowedOnDay = await serviceTypeService.isBookingAllowedOnDay(serviceTypeId, dayOfWeek);
      if (!isAllowedOnDay) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        throw new Error(`${serviceType.displayName} is not available on ${dayNames[dayOfWeek]}`);
      }

      // Use advanced scheduling validation
      const validationResult = await advancedSchedulingService.validateAdvancedBooking({
        serviceTypeId,
        scheduledDate: appointmentDate,
        duration: actualDuration,
        customerId
      });

      if (!validationResult.isValid) {
        const primaryConflict = validationResult.conflicts[0];
        let errorMessage = primaryConflict.message;
        
        // Add suggestions if available
        if (validationResult.suggestions.length > 0) {
          const suggestion = validationResult.suggestions[0];
          if (suggestion.date) {
            errorMessage += ` Suggested alternative: ${suggestion.dayName || suggestion.date.toDateString()}`;
          } else if (suggestion.time) {
            errorMessage += ` Suggested alternative time: ${suggestion.time}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Create the appointment
      const appointment = await prisma.appointment.create({
        data: {
          customerId,
          serviceTypeId,
          scheduledDate: appointmentDate,
          duration: actualDuration,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          propertyAddress,
          notes: notes || null,
          status: serviceType.requiresApproval ? 'PENDING' : 'CONFIRMED'
        },
        include: {
          serviceType: true,
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

      // Emit real-time notification for new booking
      try {
        appointmentSocketService.notifyNewBooking(appointment);
        appointmentSocketService.notifyAvailabilityUpdate(appointmentDate, serviceTypeId, 'slot_booked');
      } catch (socketError) {
        console.warn('Failed to emit socket notification for new booking:', socketError.message);
      }

      // Send appointment confirmation notification
      try {
        await notificationDeliveryService.sendAppointmentNotification(
          appointment,
          'appointment_confirmation'
        );
      } catch (notificationError) {
        console.warn('Failed to send appointment confirmation notification:', notificationError.message);
      }

      // Invalidate availability cache for the appointment date
      appointmentCacheService.invalidateAvailability(appointmentDate, serviceTypeId);
      
      timer.end(true, { appointmentId: appointment.id, serviceTypeId });
      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      timer.end(false, { error: error.message });
      throw error;
    }
  }

  /**
   * Get appointment by ID
   * @param {string} id - The appointment ID
   * @returns {Promise<Object|null>} The appointment or null
   */
  async getAppointmentById(id) {
    const timer = appointmentPerformanceService.monitorAppointmentOperation('get', id);
    
    try {
      // Check cache first
      const cached = appointmentCacheService.getAppointment(id);
      if (cached) {
        timer.end(true, { cacheHit: true });
        return cached;
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          serviceType: true,
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

      // Cache the result if found
      if (appointment) {
        appointmentCacheService.setAppointment(id, appointment);
      }
      
      timer.end(true, { cacheHit: false, found: !!appointment });
      return appointment;
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      timer.end(false, { cacheHit: false, error: error.message });
      throw error;
    }
  }

  /**
   * Get appointments with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Appointments with pagination info
   */
  async getAppointments(options = {}) {
    try {
      const {
        customerId,
        status,
        serviceTypeId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'asc'
      } = options;

      // Build where clause
      const where = {};
      
      if (customerId) {
        where.customerId = customerId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (serviceTypeId) {
        where.serviceTypeId = serviceTypeId;
      }
      
      if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) {
          where.scheduledDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.scheduledDate.lte = new Date(endDate);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get appointments with count
      const [appointments, totalCount] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            serviceType: true,
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
            [sortBy]: sortOrder
          },
          skip,
          take: limit
        }),
        prisma.appointment.count({ where })
      ]);

      return {
        appointments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  }

  /**
   * Update an appointment
   * @param {string} id - The appointment ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated appointment
   */
  async updateAppointment(id, updateData) {
    try {
      const existingAppointment = await this.getAppointmentById(id);
      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      // Validate update data
      if (updateData.scheduledDate || updateData.serviceTypeId) {
        const newScheduledDate = updateData.scheduledDate 
          ? new Date(updateData.scheduledDate)
          : existingAppointment.scheduledDate;
        const newServiceTypeId = updateData.serviceTypeId || existingAppointment.serviceTypeId;

        // Get service type details
        const serviceType = await serviceTypeService.getServiceTypeById(newServiceTypeId);
        if (!serviceType || !serviceType.isActive) {
          throw new Error('Invalid or inactive service type');
        }

        const newDuration = serviceType.duration;

        // Check if new time is in the future
        if (newScheduledDate <= new Date()) {
          throw new Error('Appointment must be scheduled for a future date and time');
        }

        // Validate advance booking time limits
        const advanceValidation = await serviceTypeService.validateAdvanceBookingTime(newServiceTypeId, newScheduledDate);
        if (!advanceValidation.isValid) {
          throw new Error(advanceValidation.message);
        }

        // Check if service type allows booking on this day
        const dayOfWeek = newScheduledDate.getDay();
        const isAllowedOnDay = await serviceTypeService.isBookingAllowedOnDay(newServiceTypeId, dayOfWeek);
        if (!isAllowedOnDay) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          throw new Error(`${serviceType.displayName} is not available on ${dayNames[dayOfWeek]}`);
        }

        // Use advanced scheduling validation (excluding current appointment)
        const validationResult = await advancedSchedulingService.validateAdvancedBooking({
          serviceTypeId: newServiceTypeId,
          scheduledDate: newScheduledDate,
          duration: newDuration,
          customerId: existingAppointment.customerId,
          excludeAppointmentId: id
        });

        if (!validationResult.isValid) {
          const primaryConflict = validationResult.conflicts[0];
          let errorMessage = primaryConflict.message;
          
          // Add suggestions if available
          if (validationResult.suggestions.length > 0) {
            const suggestion = validationResult.suggestions[0];
            if (suggestion.date) {
              errorMessage += ` Suggested alternative: ${suggestion.dayName || suggestion.date.toDateString()}`;
            } else if (suggestion.time) {
              errorMessage += ` Suggested alternative time: ${suggestion.time}`;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Update duration if service type changed
        if (updateData.serviceTypeId && updateData.serviceTypeId !== existingAppointment.serviceTypeId) {
          updateData.duration = newDuration;
        }
      }

      // Validate status transitions
      if (updateData.status) {
        this._validateStatusTransition(existingAppointment.status, updateData.status);
      }

      // Update the appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          serviceType: true,
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

      // Emit real-time notifications for appointment updates
      try {
        // Status change notification
        if (updateData.status && updateData.status !== existingAppointment.status) {
          appointmentSocketService.notifyStatusChange(updatedAppointment, existingAppointment.status);
        }

        // Reschedule notification
        if (updateData.scheduledDate && updateData.scheduledDate !== existingAppointment.scheduledDate) {
          appointmentSocketService.notifyReschedule(updatedAppointment, existingAppointment.scheduledDate);
        }

        // Availability updates for date changes
        if (updateData.scheduledDate && updateData.scheduledDate !== existingAppointment.scheduledDate) {
          appointmentSocketService.notifyAvailabilityUpdate(existingAppointment.scheduledDate, existingAppointment.serviceTypeId, 'slot_freed');
          appointmentSocketService.notifyAvailabilityUpdate(new Date(updateData.scheduledDate), updateData.serviceTypeId || existingAppointment.serviceTypeId, 'slot_booked');
        }
      } catch (socketError) {
        console.warn('Failed to emit socket notification for appointment update:', socketError.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   * @param {string} id - The appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} The cancelled appointment
   */
  async cancelAppointment(id, reason = null) {
    try {
      const appointment = await this.getAppointmentById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status === 'CANCELLED') {
        throw new Error('Appointment is already cancelled');
      }

      if (appointment.status === 'COMPLETED') {
        throw new Error('Cannot cancel a completed appointment');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}`.trim() : appointment.notes,
          updatedAt: new Date()
        },
        include: {
          serviceType: true,
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

      // Emit real-time notification for cancellation
      try {
        appointmentSocketService.notifyCancellation(updatedAppointment, reason);
      } catch (socketError) {
        console.warn('Failed to emit socket notification for appointment cancellation:', socketError.message);
      }

      // Send appointment cancellation notification
      try {
        await notificationDeliveryService.sendAppointmentNotification(
          updatedAppointment,
          'appointment_cancellation',
          { reason }
        );
      } catch (notificationError) {
        console.warn('Failed to send appointment cancellation notification:', notificationError.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Confirm an appointment
   * @param {string} id - The appointment ID
   * @returns {Promise<Object>} The confirmed appointment
   */
  async confirmAppointment(id) {
    try {
      const appointment = await this.getAppointmentById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'PENDING') {
        throw new Error('Only pending appointments can be confirmed');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          updatedAt: new Date()
        },
        include: {
          serviceType: true,
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

      // Emit real-time notification for confirmation
      try {
        appointmentSocketService.notifyConfirmation(updatedAppointment);
      } catch (socketError) {
        console.warn('Failed to emit socket notification for appointment confirmation:', socketError.message);
      }

      // Send appointment status change notification
      try {
        await notificationDeliveryService.sendAppointmentNotification(
          updatedAppointment,
          'appointment_status_change',
          { previousStatus: 'PENDING', newStatus: 'CONFIRMED' }
        );
      } catch (notificationError) {
        console.warn('Failed to send appointment status change notification:', notificationError.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  }

  /**
   * Complete an appointment
   * @param {string} id - The appointment ID
   * @param {Object} completionData - Completion data (notes, etc.)
   * @returns {Promise<Object>} The completed appointment
   */
  async completeAppointment(id, completionData = {}) {
    try {
      const appointment = await this.getAppointmentById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'CONFIRMED') {
        throw new Error('Only confirmed appointments can be completed');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes: completionData.notes || appointment.notes,
          updatedAt: new Date()
        },
        include: {
          serviceType: true,
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

      // Emit real-time notification for completion
      try {
        appointmentSocketService.notifyCompletion(updatedAppointment);
      } catch (socketError) {
        console.warn('Failed to emit socket notification for appointment completion:', socketError.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific date
   * @param {Date|string} date - The date to get appointments for
   * @returns {Promise<Array>} Array of appointments for the date
   */
  async getAppointmentsForDate(date) {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const appointments = await prisma.appointment.findMany({
        where: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['PENDING', 'CONFIRMED'] // Only active appointments
          }
        },
        include: {
          serviceType: true,
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

      return appointments;
    } catch (error) {
      console.error('Error getting appointments for date:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a customer
   * @param {string} customerId - The customer ID
   * @param {number} limit - Maximum number of appointments to return
   * @returns {Promise<Array>} Array of upcoming appointments
   */
  async getUpcomingAppointments(customerId, limit = 5) {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          customerId,
          scheduledDate: {
            gte: new Date()
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        },
        take: limit,
        include: {
          serviceType: true,
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

      return appointments;
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Check if a customer has any conflicting appointments
   * @param {string} customerId - The customer ID
   * @param {Date} scheduledDate - The proposed appointment date
   * @param {number} duration - The appointment duration in minutes
   * @param {string} excludeId - Appointment ID to exclude from conflict check
   * @returns {Promise<boolean>} True if there are conflicts
   */
  async hasCustomerConflicts(customerId, scheduledDate, duration, excludeId = null) {
    try {
      const appointmentDate = new Date(scheduledDate);
      const endTime = new Date(appointmentDate.getTime() + (duration * 60 * 1000));

      const where = {
        customerId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        OR: [
          {
            // Appointment starts during the proposed time
            scheduledDate: {
              gte: appointmentDate,
              lt: endTime
            }
          },
          {
            // Appointment ends during the proposed time
            AND: [
              {
                scheduledDate: {
                  lt: appointmentDate
                }
              },
              // We need to calculate the end time of existing appointments
              // This is a simplified check - in practice, you might want to use raw SQL
            ]
          }
        ]
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const conflictingAppointments = await prisma.appointment.findMany({
        where,
        select: { id: true, scheduledDate: true, duration: true }
      });

      // Additional check for overlapping appointments
      for (const appointment of conflictingAppointments) {
        const existingEnd = new Date(appointment.scheduledDate.getTime() + (appointment.duration * 60 * 1000));
        
        // Check if appointments overlap
        if (appointmentDate < existingEnd && endTime > appointment.scheduledDate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking customer conflicts:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics
   * @param {Object} filters - Optional filters (dateRange, serviceType, etc.)
   * @returns {Promise<Object>} Appointment statistics
   */
  async getAppointmentStats(filters = {}) {
    try {
      const { startDate, endDate, serviceTypeId } = filters;
      
      const where = {};
      
      if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) where.scheduledDate.gte = new Date(startDate);
        if (endDate) where.scheduledDate.lte = new Date(endDate);
      }
      
      if (serviceTypeId) {
        where.serviceTypeId = serviceTypeId;
      }

      const [
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments
      ] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.count({ where: { ...where, status: 'PENDING' } }),
        prisma.appointment.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } })
      ]);

      return {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate appointment data
   * @param {Object} appointmentData - The appointment data to validate
   */
  _validateAppointmentData(appointmentData) {
    const required = ['customerId', 'serviceTypeId', 'scheduledDate', 'customerName', 'customerEmail', 'propertyAddress'];
    
    for (const field of required) {
      if (!appointmentData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointmentData.customerEmail)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format if provided
    if (appointmentData.customerPhone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(appointmentData.customerPhone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Invalid phone number format');
      }
    }

    // Validate duration
    if (appointmentData.duration && (appointmentData.duration < 15 || appointmentData.duration > 480)) {
      throw new Error('Duration must be between 15 minutes and 8 hours');
    }
  }

  /**
   * Check for booking conflicts
   * @param {Date} scheduledDate - The appointment date
   * @param {number} duration - The appointment duration
   * @param {string} excludeId - Appointment ID to exclude from conflict check
   */
  async _checkBookingConflicts(scheduledDate, duration, excludeId = null) {
    const endTime = new Date(scheduledDate.getTime() + (duration * 60 * 1000));
    
    const where = {
      status: {
        in: ['PENDING', 'CONFIRMED']
      },
      OR: [
        {
          // Existing appointment starts during the proposed time
          scheduledDate: {
            gte: scheduledDate,
            lt: endTime
          }
        }
      ]
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    // Get potentially conflicting appointments
    const conflictingAppointments = await prisma.appointment.findMany({
      where,
      select: { id: true, scheduledDate: true, duration: true }
    });

    // Check for actual overlaps
    for (const appointment of conflictingAppointments) {
      const existingEnd = new Date(appointment.scheduledDate.getTime() + (appointment.duration * 60 * 1000));
      
      // Check if appointments overlap
      if (scheduledDate < existingEnd && endTime > appointment.scheduledDate) {
        throw new Error('Time slot conflicts with an existing appointment');
      }
    }
  }

  /**
   * Validate status transitions
   * @param {string} currentStatus - Current appointment status
   * @param {string} newStatus - New appointment status
   */
  _validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': [] // No transitions from cancelled
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Format time from a Date object
   * @param {Date} date - Date object
   * @returns {string} Time in HH:MM format
   */
  _formatTimeFromDate(date) {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

export default new AppointmentService();