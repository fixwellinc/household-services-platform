import prisma from '../config/database.js';

class AvailabilityService {
  /**
   * Create a new availability rule
   * @param {Object} ruleData - The availability rule data
   * @returns {Promise<Object>} The created availability rule
   */
  async createAvailabilityRule(ruleData) {
    try {
      const { dayOfWeek, isAvailable, startTime, endTime, serviceType, bufferMinutes, maxBookingsPerDay } = ruleData;

      // Validate day of week
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error('Time must be in HH:MM format');
      }

      // Validate time range
      if (this._compareTime(startTime, endTime) >= 0) {
        throw new Error('Start time must be before end time');
      }

      // Check for existing rule conflicts
      await this._checkRuleConflicts(dayOfWeek, serviceType, startTime, endTime);

      const rule = await prisma.availabilityRule.create({
        data: {
          dayOfWeek,
          isAvailable,
          startTime,
          endTime,
          serviceType: serviceType || null,
          bufferMinutes: bufferMinutes || 30,
          maxBookingsPerDay: maxBookingsPerDay || 8
        }
      });

      return rule;
    } catch (error) {
      console.error('Error creating availability rule:', error);
      throw error;
    }
  }

  /**
   * Get all availability rules
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of availability rules
   */
  async getAvailabilityRules(filters = {}) {
    try {
      const where = {};
      
      if (filters.dayOfWeek !== undefined) {
        where.dayOfWeek = filters.dayOfWeek;
      }
      
      if (filters.serviceType !== undefined) {
        where.serviceType = filters.serviceType;
      }
      
      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      const rules = await prisma.availabilityRule.findMany({
        where,
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });

      return rules;
    } catch (error) {
      console.error('Error getting availability rules:', error);
      throw error;
    }
  }

  /**
   * Get availability rule by ID
   * @param {string} id - The rule ID
   * @returns {Promise<Object|null>} The availability rule or null
   */
  async getAvailabilityRuleById(id) {
    try {
      const rule = await prisma.availabilityRule.findUnique({
        where: { id }
      });

      return rule;
    } catch (error) {
      console.error('Error getting availability rule by ID:', error);
      throw error;
    }
  }

  /**
   * Update an availability rule
   * @param {string} id - The rule ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated availability rule
   */
  async updateAvailabilityRule(id, updateData) {
    try {
      const existingRule = await this.getAvailabilityRuleById(id);
      if (!existingRule) {
        throw new Error('Availability rule not found');
      }

      // Validate updated data
      if (updateData.dayOfWeek !== undefined && (updateData.dayOfWeek < 0 || updateData.dayOfWeek > 6)) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (updateData.startTime && !timeRegex.test(updateData.startTime)) {
        throw new Error('Start time must be in HH:MM format');
      }
      if (updateData.endTime && !timeRegex.test(updateData.endTime)) {
        throw new Error('End time must be in HH:MM format');
      }

      // Validate time range if both times are being updated
      const startTime = updateData.startTime || existingRule.startTime;
      const endTime = updateData.endTime || existingRule.endTime;
      if (this._compareTime(startTime, endTime) >= 0) {
        throw new Error('Start time must be before end time');
      }

      // Check for conflicts if key fields are being updated
      const dayOfWeek = updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : existingRule.dayOfWeek;
      const serviceType = updateData.serviceType !== undefined ? updateData.serviceType : existingRule.serviceType;
      
      if (updateData.dayOfWeek !== undefined || updateData.serviceType !== undefined || 
          updateData.startTime || updateData.endTime) {
        await this._checkRuleConflicts(dayOfWeek, serviceType, startTime, endTime, id);
      }

      const updatedRule = await prisma.availabilityRule.update({
        where: { id },
        data: updateData
      });

      return updatedRule;
    } catch (error) {
      console.error('Error updating availability rule:', error);
      throw error;
    }
  }

  /**
   * Delete an availability rule
   * @param {string} id - The rule ID
   * @returns {Promise<Object>} The deleted availability rule
   */
  async deleteAvailabilityRule(id) {
    try {
      const existingRule = await this.getAvailabilityRuleById(id);
      if (!existingRule) {
        throw new Error('Availability rule not found');
      }

      const deletedRule = await prisma.availabilityRule.delete({
        where: { id }
      });

      return deletedRule;
    } catch (error) {
      console.error('Error deleting availability rule:', error);
      throw error;
    }
  }

  /**
   * Get availability rules for a specific day
   * @param {number} dayOfWeek - Day of week (0-6)
   * @param {string} serviceType - Optional service type filter
   * @returns {Promise<Array>} Array of availability rules for the day
   */
  async getAvailabilityForDay(dayOfWeek, serviceType = null) {
    try {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }

      const where = {
        dayOfWeek,
        isAvailable: true
      };

      // Get both general rules (serviceType is null) and service-specific rules
      const rules = await prisma.availabilityRule.findMany({
        where: {
          ...where,
          OR: [
            { serviceType: null },
            { serviceType: serviceType }
          ]
        },
        orderBy: { startTime: 'asc' }
      });

      // If service-specific rules exist, they override general rules
      const serviceSpecificRules = rules.filter(rule => rule.serviceType === serviceType);
      if (serviceSpecificRules.length > 0) {
        return serviceSpecificRules;
      }

      // Return general rules if no service-specific rules exist
      return rules.filter(rule => rule.serviceType === null);
    } catch (error) {
      console.error('Error getting availability for day:', error);
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available
   * @param {number} dayOfWeek - Day of week (0-6)
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @param {string} serviceType - Optional service type
   * @returns {Promise<boolean>} True if the time slot is available
   */
  async isTimeSlotAvailable(dayOfWeek, startTime, endTime, serviceType = null) {
    try {
      const rules = await this.getAvailabilityForDay(dayOfWeek, serviceType);
      
      if (rules.length === 0) {
        return false; // No availability rules for this day
      }

      // Check if the requested time slot falls within any available rule
      for (const rule of rules) {
        if (this._compareTime(startTime, rule.startTime) >= 0 && 
            this._compareTime(endTime, rule.endTime) <= 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  /**
   * Bulk update availability rules
   * @param {Array} rulesData - Array of rule data objects
   * @returns {Promise<Array>} Array of updated/created rules
   */
  async bulkUpdateAvailabilityRules(rulesData) {
    try {
      const results = [];

      for (const ruleData of rulesData) {
        if (ruleData.id) {
          // Update existing rule
          const { id, ...updateData } = ruleData;
          const updatedRule = await this.updateAvailabilityRule(id, updateData);
          results.push(updatedRule);
        } else {
          // Create new rule
          const newRule = await this.createAvailabilityRule(ruleData);
          results.push(newRule);
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk updating availability rules:', error);
      throw error;
    }
  }

  /**
   * Calculate available time slots for a specific date
   * @param {Date} date - The date to calculate slots for
   * @param {string} serviceType - Optional service type filter
   * @param {number} duration - Duration in minutes for each slot
   * @returns {Promise<Array>} Array of available time slots
   */
  async calculateAvailableSlots(date, serviceType = null, duration = 60) {
    try {
      const dayOfWeek = date.getDay();
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Get availability rules for the day
      const rules = await this.getAvailabilityForDay(dayOfWeek, serviceType);
      
      if (rules.length === 0) {
        return []; // No availability rules for this day
      }

      // Get existing appointments for the date
      const existingAppointments = await this._getAppointmentsForDate(dateString);

      const availableSlots = [];

      for (const rule of rules) {
        if (!rule.isAvailable) continue;

        const slots = this._generateSlotsForRule(rule, duration, existingAppointments, dateString);
        availableSlots.push(...slots);
      }

      // Sort slots by time and remove duplicates
      return this._sortAndDeduplicateSlots(availableSlots);
    } catch (error) {
      console.error('Error calculating available slots:', error);
      throw error;
    }
  }

  /**
   * Calculate available slots for a date range
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @param {string} serviceType - Optional service type filter
   * @param {number} duration - Duration in minutes for each slot
   * @returns {Promise<Object>} Object with dates as keys and available slots as values
   */
  async calculateAvailableSlotsForRange(startDate, endDate, serviceType = null, duration = 60) {
    try {
      const result = {};
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const slots = await this.calculateAvailableSlots(currentDate, serviceType, duration);
        result[dateString] = slots;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error) {
      console.error('Error calculating available slots for range:', error);
      throw error;
    }
  }

  /**
   * Check if a specific date and time slot is available
   * @param {Date} date - The date to check
   * @param {string} startTime - Start time in HH:MM format
   * @param {number} duration - Duration in minutes
   * @param {string} serviceType - Optional service type
   * @returns {Promise<boolean>} True if the slot is available
   */
  async isSlotAvailable(date, startTime, duration, serviceType = null) {
    try {
      const dayOfWeek = date.getDay();
      const endTime = this._addMinutesToTime(startTime, duration);
      const dateString = date.toISOString().split('T')[0];

      // Check if the time slot falls within availability rules
      const isWithinRules = await this.isTimeSlotAvailable(dayOfWeek, startTime, endTime, serviceType);
      if (!isWithinRules) {
        return false;
      }

      // Check for conflicts with existing appointments
      const existingAppointments = await this._getAppointmentsForDate(dateString);
      const hasConflict = this._checkAppointmentConflicts(startTime, endTime, existingAppointments);
      
      if (hasConflict) {
        return false;
      }

      // Check daily booking limits
      const rules = await this.getAvailabilityForDay(dayOfWeek, serviceType);
      const maxBookings = Math.max(...rules.map(rule => rule.maxBookingsPerDay));
      
      if (existingAppointments.length >= maxBookings) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      throw error;
    }
  }

  /**
   * Get the next available slot after a given date and time
   * @param {Date} fromDate - Starting date to search from
   * @param {string} fromTime - Starting time to search from (HH:MM)
   * @param {number} duration - Duration in minutes
   * @param {string} serviceType - Optional service type
   * @param {number} maxDaysToSearch - Maximum days to search ahead (default: 30)
   * @returns {Promise<Object|null>} Next available slot or null if none found
   */
  async getNextAvailableSlot(fromDate, fromTime = '00:00', duration = 60, serviceType = null, maxDaysToSearch = 30) {
    try {
      const searchEndDate = new Date(fromDate);
      searchEndDate.setDate(searchEndDate.getDate() + maxDaysToSearch);

      const currentDate = new Date(fromDate);
      
      while (currentDate <= searchEndDate) {
        const slots = await this.calculateAvailableSlots(currentDate, serviceType, duration);
        
        // Filter slots that are after the specified time (only for the first day)
        const filteredSlots = currentDate.toDateString() === fromDate.toDateString() 
          ? slots.filter(slot => this._compareTime(slot.time, fromTime) > 0)
          : slots;

        if (filteredSlots.length > 0) {
          return {
            date: currentDate.toISOString().split('T')[0],
            time: filteredSlots[0].time,
            duration: filteredSlots[0].duration
          };
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return null; // No available slots found
    } catch (error) {
      console.error('Error getting next available slot:', error);
      throw error;
    }
  }

  /**
   * Calculate buffer time requirements for a service type
   * @param {string} serviceType - The service type
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Promise<number>} Buffer time in minutes
   */
  async getBufferTimeForService(serviceType, dayOfWeek) {
    try {
      const rules = await this.getAvailabilityForDay(dayOfWeek, serviceType);
      
      if (rules.length === 0) {
        return 30; // Default buffer time
      }

      // Return the maximum buffer time from applicable rules
      return Math.max(...rules.map(rule => rule.bufferMinutes));
    } catch (error) {
      console.error('Error getting buffer time for service:', error);
      return 30; // Default fallback
    }
  }

  // Private helper methods

  /**
   * Get existing appointments for a specific date
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of appointments
   */
  async _getAppointmentsForDate(dateString) {
    try {
      const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

      const appointments = await prisma.appointment.findMany({
        where: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['PENDING', 'CONFIRMED'] // Only consider active appointments
          }
        },
        select: {
          scheduledDate: true,
          duration: true,
          serviceType: true
        }
      });

      return appointments.map(apt => ({
        startTime: this._formatTimeFromDate(apt.scheduledDate),
        endTime: this._addMinutesToTime(this._formatTimeFromDate(apt.scheduledDate), apt.duration),
        duration: apt.duration,
        serviceType: apt.serviceType
      }));
    } catch (error) {
      console.error('Error getting appointments for date:', error);
      return [];
    }
  }

  /**
   * Generate time slots for a specific availability rule
   * @param {Object} rule - The availability rule
   * @param {number} duration - Slot duration in minutes
   * @param {Array} existingAppointments - Existing appointments for the day
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Array} Array of available time slots
   */
  _generateSlotsForRule(rule, duration, existingAppointments, dateString) {
    const slots = [];
    const startMinutes = this._timeToMinutes(rule.startTime);
    const endMinutes = this._timeToMinutes(rule.endTime);
    const bufferMinutes = rule.bufferMinutes || 30;

    let currentMinutes = startMinutes;

    while (currentMinutes + duration <= endMinutes) {
      const slotStartTime = this._minutesToTime(currentMinutes);
      const slotEndTime = this._minutesToTime(currentMinutes + duration);

      // Check if this slot conflicts with existing appointments
      const hasConflict = this._checkAppointmentConflicts(slotStartTime, slotEndTime, existingAppointments);

      if (!hasConflict) {
        slots.push({
          time: slotStartTime,
          duration: duration,
          endTime: slotEndTime,
          date: dateString
        });
      }

      // Move to next slot (duration + buffer time)
      currentMinutes += duration + bufferMinutes;
    }

    return slots;
  }

  /**
   * Check if a time slot conflicts with existing appointments
   * @param {string} startTime - Slot start time
   * @param {string} endTime - Slot end time
   * @param {Array} appointments - Existing appointments
   * @returns {boolean} True if there's a conflict
   */
  _checkAppointmentConflicts(startTime, endTime, appointments) {
    for (const appointment of appointments) {
      if (this._timesOverlap(startTime, endTime, appointment.startTime, appointment.endTime)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sort and remove duplicate time slots
   * @param {Array} slots - Array of time slots
   * @returns {Array} Sorted and deduplicated slots
   */
  _sortAndDeduplicateSlots(slots) {
    // Remove duplicates based on time
    const uniqueSlots = slots.filter((slot, index, self) => 
      index === self.findIndex(s => s.time === slot.time)
    );

    // Sort by time
    return uniqueSlots.sort((a, b) => this._compareTime(a.time, b.time));
  }

  /**
   * Convert time string to minutes since midnight
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Minutes since midnight
   */
  _timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   * @param {number} minutes - Minutes since midnight
   * @returns {string} Time in HH:MM format
   */
  _minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Add minutes to a time string
   * @param {string} timeString - Time in HH:MM format
   * @param {number} minutesToAdd - Minutes to add
   * @returns {string} New time in HH:MM format
   */
  _addMinutesToTime(timeString, minutesToAdd) {
    const totalMinutes = this._timeToMinutes(timeString) + minutesToAdd;
    return this._minutesToTime(totalMinutes);
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

  /**
   * Compare two time strings in HH:MM format
   * @param {string} time1 - First time
   * @param {string} time2 - Second time
   * @returns {number} -1 if time1 < time2, 0 if equal, 1 if time1 > time2
   */
  _compareTime(time1, time2) {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;
    
    if (totalMinutes1 < totalMinutes2) return -1;
    if (totalMinutes1 > totalMinutes2) return 1;
    return 0;
  }

  /**
   * Check for rule conflicts when creating or updating rules
   * @param {number} dayOfWeek - Day of week
   * @param {string} serviceType - Service type (can be null)
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @param {string} excludeId - Rule ID to exclude from conflict check (for updates)
   */
  async _checkRuleConflicts(dayOfWeek, serviceType, startTime, endTime, excludeId = null) {
    const where = {
      dayOfWeek,
      serviceType: serviceType || null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existingRules = await prisma.availabilityRule.findMany({
      where
    });

    for (const rule of existingRules) {
      // Check for time overlap
      if (this._timesOverlap(startTime, endTime, rule.startTime, rule.endTime)) {
        throw new Error(`Time slot conflicts with existing rule: ${rule.startTime}-${rule.endTime}`);
      }
    }
  }

  /**
   * Check if two time ranges overlap
   * @param {string} start1 - Start time of first range
   * @param {string} end1 - End time of first range
   * @param {string} start2 - Start time of second range
   * @param {string} end2 - End time of second range
   * @returns {boolean} True if ranges overlap
   */
  _timesOverlap(start1, end1, start2, end2) {
    return this._compareTime(start1, end2) < 0 && this._compareTime(start2, end1) < 0;
  }
}

export default new AvailabilityService();