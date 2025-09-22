import prisma from '../config/database.js';

class ServiceTypeService {
  /**
   * Create a new service type
   * @param {Object} serviceTypeData - The service type data
   * @returns {Promise<Object>} The created service type
   */
  async createServiceType(serviceTypeData) {
    try {
      const {
        name,
        displayName,
        description,
        duration,
        bufferMinutes = 30,
        color,
        maxBookingsPerDay = 8,
        requiresApproval = false,
        isExclusive = false,
        exclusiveDays = [],
        allowedDays = [0, 1, 2, 3, 4, 5, 6],
        minAdvanceHours = 24,
        maxAdvanceDays = 30
      } = serviceTypeData;

      // Validate required fields
      this._validateServiceTypeData(serviceTypeData);

      // Check if service type name already exists
      const existingServiceType = await prisma.serviceType.findUnique({
        where: { name }
      });

      if (existingServiceType) {
        throw new Error('Service type with this name already exists');
      }

      // Create the service type
      const serviceType = await prisma.serviceType.create({
        data: {
          name,
          displayName,
          description,
          duration,
          bufferMinutes,
          color,
          maxBookingsPerDay,
          requiresApproval,
          isExclusive,
          exclusiveDays,
          allowedDays,
          minAdvanceHours,
          maxAdvanceDays
        }
      });

      return serviceType;
    } catch (error) {
      console.error('Error creating service type:', error);
      throw error;
    }
  }

  /**
   * Get all service types
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of service types
   */
  async getServiceTypes(options = {}) {
    try {
      const { includeInactive = false, sortBy = 'displayName', sortOrder = 'asc' } = options;

      const where = {};
      if (!includeInactive) {
        where.isActive = true;
      }

      const serviceTypes = await prisma.serviceType.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          _count: {
            select: {
              appointments: true,
              availabilityRules: true
            }
          }
        }
      });

      return serviceTypes;
    } catch (error) {
      console.error('Error getting service types:', error);
      throw error;
    }
  }

  /**
   * Get service type by ID
   * @param {string} id - The service type ID
   * @returns {Promise<Object|null>} The service type or null
   */
  async getServiceTypeById(id) {
    try {
      const serviceType = await prisma.serviceType.findUnique({
        where: { id },
        include: {
          availabilityRules: {
            orderBy: { dayOfWeek: 'asc' }
          },
          _count: {
            select: {
              appointments: true
            }
          }
        }
      });

      return serviceType;
    } catch (error) {
      console.error('Error getting service type by ID:', error);
      throw error;
    }
  }

  /**
   * Get service type by name
   * @param {string} name - The service type name
   * @returns {Promise<Object|null>} The service type or null
   */
  async getServiceTypeByName(name) {
    try {
      const serviceType = await prisma.serviceType.findUnique({
        where: { name },
        include: {
          availabilityRules: {
            orderBy: { dayOfWeek: 'asc' }
          }
        }
      });

      return serviceType;
    } catch (error) {
      console.error('Error getting service type by name:', error);
      throw error;
    }
  }

  /**
   * Update a service type
   * @param {string} id - The service type ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated service type
   */
  async updateServiceType(id, updateData) {
    try {
      const existingServiceType = await this.getServiceTypeById(id);
      if (!existingServiceType) {
        throw new Error('Service type not found');
      }

      // Validate update data
      if (updateData.name && updateData.name !== existingServiceType.name) {
        const nameExists = await prisma.serviceType.findUnique({
          where: { name: updateData.name }
        });
        if (nameExists) {
          throw new Error('Service type with this name already exists');
        }
      }

      // Validate other fields if provided
      if (updateData.duration !== undefined) {
        this._validateDuration(updateData.duration);
      }

      if (updateData.allowedDays !== undefined) {
        this._validateAllowedDays(updateData.allowedDays);
      }

      if (updateData.exclusiveDays !== undefined) {
        this._validateExclusiveDays(updateData.exclusiveDays, updateData.allowedDays || existingServiceType.allowedDays);
      }

      // Update the service type
      const updatedServiceType = await prisma.serviceType.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          availabilityRules: {
            orderBy: { dayOfWeek: 'asc' }
          },
          _count: {
            select: {
              appointments: true
            }
          }
        }
      });

      return updatedServiceType;
    } catch (error) {
      console.error('Error updating service type:', error);
      throw error;
    }
  }

  /**
   * Delete a service type
   * @param {string} id - The service type ID
   * @returns {Promise<Object>} The deleted service type
   */
  async deleteServiceType(id) {
    try {
      const existingServiceType = await this.getServiceTypeById(id);
      if (!existingServiceType) {
        throw new Error('Service type not found');
      }

      // Check if service type has active appointments
      const activeAppointments = await prisma.appointment.count({
        where: {
          serviceTypeId: id,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      if (activeAppointments > 0) {
        throw new Error('Cannot delete service type with active appointments. Please cancel or complete all appointments first.');
      }

      // Soft delete by setting isActive to false
      const deletedServiceType = await prisma.serviceType.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return deletedServiceType;
    } catch (error) {
      console.error('Error deleting service type:', error);
      throw error;
    }
  }

  /**
   * Check if a service type allows booking on a specific day
   * @param {string} serviceTypeId - The service type ID
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Promise<boolean>} True if booking is allowed
   */
  async isBookingAllowedOnDay(serviceTypeId, dayOfWeek) {
    try {
      const serviceType = await this.getServiceTypeById(serviceTypeId);
      if (!serviceType || !serviceType.isActive) {
        return false;
      }

      return serviceType.allowedDays.includes(dayOfWeek);
    } catch (error) {
      console.error('Error checking if booking is allowed on day:', error);
      return false;
    }
  }

  /**
   * Check if a service type is exclusive on a specific day
   * @param {string} serviceTypeId - The service type ID
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Promise<boolean>} True if service is exclusive on this day
   */
  async isExclusiveOnDay(serviceTypeId, dayOfWeek) {
    try {
      const serviceType = await this.getServiceTypeById(serviceTypeId);
      if (!serviceType || !serviceType.isActive) {
        return false;
      }

      return serviceType.isExclusive && serviceType.exclusiveDays.includes(dayOfWeek);
    } catch (error) {
      console.error('Error checking if service is exclusive on day:', error);
      return false;
    }
  }

  /**
   * Get service types available for a specific day
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Promise<Array>} Array of available service types
   */
  async getAvailableServiceTypesForDay(dayOfWeek) {
    try {
      const serviceTypes = await prisma.serviceType.findMany({
        where: {
          isActive: true,
          allowedDays: {
            has: dayOfWeek
          }
        },
        orderBy: {
          displayName: 'asc'
        }
      });

      return serviceTypes;
    } catch (error) {
      console.error('Error getting available service types for day:', error);
      throw error;
    }
  }

  /**
   * Check if booking is within advance time limits
   * @param {string} serviceTypeId - The service type ID
   * @param {Date} scheduledDate - The proposed appointment date
   * @returns {Promise<Object>} Validation result with isValid and message
   */
  async validateAdvanceBookingTime(serviceTypeId, scheduledDate) {
    try {
      const serviceType = await this.getServiceTypeById(serviceTypeId);
      if (!serviceType) {
        return { isValid: false, message: 'Service type not found' };
      }

      const now = new Date();
      const appointmentDate = new Date(scheduledDate);
      const hoursInAdvance = (appointmentDate - now) / (1000 * 60 * 60);
      const daysInAdvance = hoursInAdvance / 24;

      if (hoursInAdvance < serviceType.minAdvanceHours) {
        return {
          isValid: false,
          message: `Appointments must be booked at least ${serviceType.minAdvanceHours} hours in advance`
        };
      }

      if (daysInAdvance > serviceType.maxAdvanceDays) {
        return {
          isValid: false,
          message: `Appointments cannot be booked more than ${serviceType.maxAdvanceDays} days in advance`
        };
      }

      return { isValid: true, message: 'Booking time is valid' };
    } catch (error) {
      console.error('Error validating advance booking time:', error);
      return { isValid: false, message: 'Error validating booking time' };
    }
  }

  /**
   * Get booking conflicts for exclusive services
   * @param {string} serviceTypeId - The service type ID
   * @param {Date} scheduledDate - The proposed appointment date
   * @param {string} excludeAppointmentId - Appointment ID to exclude from conflict check
   * @returns {Promise<Array>} Array of conflicting appointments
   */
  async getExclusiveServiceConflicts(serviceTypeId, scheduledDate, excludeAppointmentId = null) {
    try {
      const serviceType = await this.getServiceTypeById(serviceTypeId);
      if (!serviceType || !serviceType.isExclusive) {
        return [];
      }

      const appointmentDate = new Date(scheduledDate);
      const dayOfWeek = appointmentDate.getDay();

      // Check if this service is exclusive on this day
      if (!serviceType.exclusiveDays.includes(dayOfWeek)) {
        return [];
      }

      // Get start and end of the day
      const startOfDay = new Date(appointmentDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(appointmentDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const where = {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      };

      if (excludeAppointmentId) {
        where.id = { not: excludeAppointmentId };
      }

      const conflictingAppointments = await prisma.appointment.findMany({
        where,
        include: {
          serviceType: {
            select: {
              name: true,
              displayName: true
            }
          }
        }
      });

      return conflictingAppointments;
    } catch (error) {
      console.error('Error getting exclusive service conflicts:', error);
      throw error;
    }
  }

  /**
   * Get service type statistics
   * @param {string} serviceTypeId - The service type ID
   * @param {Object} dateRange - Optional date range filter
   * @returns {Promise<Object>} Service type statistics
   */
  async getServiceTypeStats(serviceTypeId, dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      
      const where = { serviceTypeId };
      
      if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) where.scheduledDate.gte = new Date(startDate);
        if (endDate) where.scheduledDate.lte = new Date(endDate);
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
        serviceTypeId,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting service type stats:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate service type data
   * @param {Object} serviceTypeData - The service type data to validate
   */
  _validateServiceTypeData(serviceTypeData) {
    const required = ['name', 'displayName', 'duration'];
    
    for (const field of required) {
      if (!serviceTypeData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate duration
    this._validateDuration(serviceTypeData.duration);

    // Validate allowed days
    if (serviceTypeData.allowedDays) {
      this._validateAllowedDays(serviceTypeData.allowedDays);
    }

    // Validate exclusive days
    if (serviceTypeData.exclusiveDays) {
      this._validateExclusiveDays(serviceTypeData.exclusiveDays, serviceTypeData.allowedDays || [0, 1, 2, 3, 4, 5, 6]);
    }

    // Validate color format if provided
    if (serviceTypeData.color && !/^#[0-9A-F]{6}$/i.test(serviceTypeData.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF0000)');
    }

    // Validate numeric fields
    if (serviceTypeData.bufferMinutes !== undefined && (serviceTypeData.bufferMinutes < 0 || serviceTypeData.bufferMinutes > 240)) {
      throw new Error('Buffer minutes must be between 0 and 240');
    }

    if (serviceTypeData.maxBookingsPerDay !== undefined && (serviceTypeData.maxBookingsPerDay < 1 || serviceTypeData.maxBookingsPerDay > 50)) {
      throw new Error('Max bookings per day must be between 1 and 50');
    }

    if (serviceTypeData.minAdvanceHours !== undefined && (serviceTypeData.minAdvanceHours < 0 || serviceTypeData.minAdvanceHours > 8760)) {
      throw new Error('Min advance hours must be between 0 and 8760 (1 year)');
    }

    if (serviceTypeData.maxAdvanceDays !== undefined && (serviceTypeData.maxAdvanceDays < 1 || serviceTypeData.maxAdvanceDays > 365)) {
      throw new Error('Max advance days must be between 1 and 365');
    }
  }

  /**
   * Validate duration
   * @param {number} duration - Duration in minutes
   */
  _validateDuration(duration) {
    if (typeof duration !== 'number' || duration < 15 || duration > 480) {
      throw new Error('Duration must be between 15 minutes and 8 hours (480 minutes)');
    }
  }

  /**
   * Validate allowed days
   * @param {Array} allowedDays - Array of day numbers (0-6)
   */
  _validateAllowedDays(allowedDays) {
    if (!Array.isArray(allowedDays) || allowedDays.length === 0) {
      throw new Error('Allowed days must be a non-empty array');
    }

    for (const day of allowedDays) {
      if (typeof day !== 'number' || day < 0 || day > 6) {
        throw new Error('Allowed days must contain numbers between 0 and 6 (Sunday to Saturday)');
      }
    }

    // Remove duplicates
    const uniqueDays = [...new Set(allowedDays)];
    if (uniqueDays.length !== allowedDays.length) {
      throw new Error('Allowed days cannot contain duplicates');
    }
  }

  /**
   * Validate exclusive days
   * @param {Array} exclusiveDays - Array of day numbers (0-6)
   * @param {Array} allowedDays - Array of allowed day numbers
   */
  _validateExclusiveDays(exclusiveDays, allowedDays) {
    if (!Array.isArray(exclusiveDays)) {
      throw new Error('Exclusive days must be an array');
    }

    for (const day of exclusiveDays) {
      if (typeof day !== 'number' || day < 0 || day > 6) {
        throw new Error('Exclusive days must contain numbers between 0 and 6 (Sunday to Saturday)');
      }

      if (!allowedDays.includes(day)) {
        throw new Error('Exclusive days must be a subset of allowed days');
      }
    }

    // Remove duplicates
    const uniqueDays = [...new Set(exclusiveDays)];
    if (uniqueDays.length !== exclusiveDays.length) {
      throw new Error('Exclusive days cannot contain duplicates');
    }
  }
}

export default new ServiceTypeService();