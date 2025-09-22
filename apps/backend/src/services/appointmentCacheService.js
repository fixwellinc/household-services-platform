import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

/**
 * Appointment Cache Service
 * Handles caching for appointment-related data to improve performance
 */
class AppointmentCacheService {
  constructor() {
    // Initialize cache with different TTL for different data types
    this.availabilityCache = new NodeCache({
      stdTTL: 300, // 5 minutes for availability data
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Better performance, but be careful with object mutations
    });

    this.appointmentCache = new NodeCache({
      stdTTL: 600, // 10 minutes for appointment data
      checkperiod: 120,
      useClones: false
    });

    this.calendarCache = new NodeCache({
      stdTTL: 900, // 15 minutes for calendar sync data
      checkperiod: 180,
      useClones: false
    });

    this.statsCache = new NodeCache({
      stdTTL: 1800, // 30 minutes for statistics
      checkperiod: 300,
      useClones: false
    });

    // Set up cache event listeners for monitoring
    this.setupCacheMonitoring();
  }

  /**
   * Set up cache monitoring and logging
   */
  setupCacheMonitoring() {
    const caches = {
      availability: this.availabilityCache,
      appointment: this.appointmentCache,
      calendar: this.calendarCache,
      stats: this.statsCache
    };

    Object.entries(caches).forEach(([name, cache]) => {
      cache.on('set', (key, value) => {
        logger.debug(`Cache SET [${name}]: ${key}`);
      });

      cache.on('del', (key, value) => {
        logger.debug(`Cache DEL [${name}]: ${key}`);
      });

      cache.on('expired', (key, value) => {
        logger.debug(`Cache EXPIRED [${name}]: ${key}`);
      });
    });
  }

  /**
   * Generate cache key for availability data
   */
  getAvailabilityKey(date, serviceType = null, duration = 60) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return `availability:${dateStr}:${serviceType || 'all'}:${duration}`;
  }

  /**
   * Generate cache key for appointment data
   */
  getAppointmentKey(id) {
    return `appointment:${id}`;
  }

  /**
   * Generate cache key for appointment list
   */
  getAppointmentListKey(filters = {}) {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `appointments:${filterStr}`;
  }

  /**
   * Generate cache key for calendar sync data
   */
  getCalendarSyncKey(provider, calendarId, startDate, endDate) {
    return `calendar:${provider}:${calendarId}:${startDate}:${endDate}`;
  }

  /**
   * Generate cache key for statistics
   */
  getStatsKey(filters = {}) {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `stats:${filterStr}`;
  }

  /**
   * Cache availability data
   */
  setAvailability(date, serviceType, duration, slots) {
    const key = this.getAvailabilityKey(date, serviceType, duration);
    this.availabilityCache.set(key, slots);
    logger.debug(`Cached availability: ${key} (${slots.length} slots)`);
  }

  /**
   * Get cached availability data
   */
  getAvailability(date, serviceType, duration) {
    const key = this.getAvailabilityKey(date, serviceType, duration);
    const cached = this.availabilityCache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Cache appointment data
   */
  setAppointment(id, appointment) {
    const key = this.getAppointmentKey(id);
    this.appointmentCache.set(key, appointment);
    logger.debug(`Cached appointment: ${key}`);
  }

  /**
   * Get cached appointment data
   */
  getAppointment(id) {
    const key = this.getAppointmentKey(id);
    const cached = this.appointmentCache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Cache appointment list
   */
  setAppointmentList(filters, appointments, pagination) {
    const key = this.getAppointmentListKey(filters);
    const data = { appointments, pagination, cachedAt: new Date() };
    this.appointmentCache.set(key, data);
    logger.debug(`Cached appointment list: ${key} (${appointments.length} items)`);
  }

  /**
   * Get cached appointment list
   */
  getAppointmentList(filters) {
    const key = this.getAppointmentListKey(filters);
    const cached = this.appointmentCache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Cache calendar sync data
   */
  setCalendarSync(provider, calendarId, startDate, endDate, events) {
    const key = this.getCalendarSyncKey(provider, calendarId, startDate, endDate);
    this.calendarCache.set(key, events);
    logger.debug(`Cached calendar sync: ${key} (${events.length} events)`);
  }

  /**
   * Get cached calendar sync data
   */
  getCalendarSync(provider, calendarId, startDate, endDate) {
    const key = this.getCalendarSyncKey(provider, calendarId, startDate, endDate);
    const cached = this.calendarCache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Cache statistics data
   */
  setStats(filters, stats) {
    const key = this.getStatsKey(filters);
    this.statsCache.set(key, { ...stats, cachedAt: new Date() });
    logger.debug(`Cached stats: ${key}`);
  }

  /**
   * Get cached statistics data
   */
  getStats(filters) {
    const key = this.getStatsKey(filters);
    const cached = this.statsCache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Invalidate availability cache for a specific date
   */
  invalidateAvailability(date, serviceType = null) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const keys = this.availabilityCache.keys();
    
    const keysToDelete = keys.filter(key => {
      if (serviceType) {
        return key.startsWith(`availability:${dateStr}:${serviceType}:`);
      }
      return key.startsWith(`availability:${dateStr}:`);
    });

    keysToDelete.forEach(key => {
      this.availabilityCache.del(key);
      logger.debug(`Invalidated availability cache: ${key}`);
    });

    return keysToDelete.length;
  }

  /**
   * Invalidate appointment cache
   */
  invalidateAppointment(id) {
    const key = this.getAppointmentKey(id);
    const deleted = this.appointmentCache.del(key);
    if (deleted) {
      logger.debug(`Invalidated appointment cache: ${key}`);
    }
    
    // Also invalidate appointment lists that might contain this appointment
    this.invalidateAppointmentLists();
    
    return deleted;
  }

  /**
   * Invalidate all appointment lists
   */
  invalidateAppointmentLists() {
    const keys = this.appointmentCache.keys();
    const listKeys = keys.filter(key => key.startsWith('appointments:'));
    
    listKeys.forEach(key => {
      this.appointmentCache.del(key);
      logger.debug(`Invalidated appointment list cache: ${key}`);
    });

    return listKeys.length;
  }

  /**
   * Invalidate calendar cache for a provider
   */
  invalidateCalendarSync(provider, calendarId = null) {
    const keys = this.calendarCache.keys();
    
    const keysToDelete = keys.filter(key => {
      if (calendarId) {
        return key.startsWith(`calendar:${provider}:${calendarId}:`);
      }
      return key.startsWith(`calendar:${provider}:`);
    });

    keysToDelete.forEach(key => {
      this.calendarCache.del(key);
      logger.debug(`Invalidated calendar cache: ${key}`);
    });

    return keysToDelete.length;
  }

  /**
   * Invalidate statistics cache
   */
  invalidateStats() {
    const keys = this.statsCache.keys();
    const statsKeys = keys.filter(key => key.startsWith('stats:'));
    
    statsKeys.forEach(key => {
      this.statsCache.del(key);
      logger.debug(`Invalidated stats cache: ${key}`);
    });

    return statsKeys.length;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    const counts = {
      availability: this.availabilityCache.keys().length,
      appointment: this.appointmentCache.keys().length,
      calendar: this.calendarCache.keys().length,
      stats: this.statsCache.keys().length
    };

    this.availabilityCache.flushAll();
    this.appointmentCache.flushAll();
    this.calendarCache.flushAll();
    this.statsCache.flushAll();

    logger.info('Cleared all appointment caches', counts);
    return counts;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      availability: {
        keys: this.availabilityCache.keys().length,
        hits: this.availabilityCache.getStats().hits,
        misses: this.availabilityCache.getStats().misses,
        hitRate: this.availabilityCache.getStats().hits / 
                (this.availabilityCache.getStats().hits + this.availabilityCache.getStats().misses) || 0
      },
      appointment: {
        keys: this.appointmentCache.keys().length,
        hits: this.appointmentCache.getStats().hits,
        misses: this.appointmentCache.getStats().misses,
        hitRate: this.appointmentCache.getStats().hits / 
                (this.appointmentCache.getStats().hits + this.appointmentCache.getStats().misses) || 0
      },
      calendar: {
        keys: this.calendarCache.keys().length,
        hits: this.calendarCache.getStats().hits,
        misses: this.calendarCache.getStats().misses,
        hitRate: this.calendarCache.getStats().hits / 
                (this.calendarCache.getStats().hits + this.calendarCache.getStats().misses) || 0
      },
      stats: {
        keys: this.statsCache.keys().length,
        hits: this.statsCache.getStats().hits,
        misses: this.statsCache.getStats().misses,
        hitRate: this.statsCache.getStats().hits / 
                (this.statsCache.getStats().hits + this.statsCache.getStats().misses) || 0
      }
    };
  }

  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(availabilityService, appointmentService) {
    try {
      logger.info('Starting cache warm-up...');
      
      // Warm up availability for next 7 days
      const today = new Date();
      const warmUpPromises = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Warm up for common service types and durations
        const serviceTypes = [null, 'CLEANING', 'MAINTENANCE', 'REPAIR'];
        const durations = [30, 60, 90, 120];
        
        serviceTypes.forEach(serviceType => {
          durations.forEach(duration => {
            warmUpPromises.push(
              availabilityService.calculateAvailableSlots(date, serviceType, duration)
                .then(slots => {
                  this.setAvailability(date, serviceType, duration, slots);
                })
                .catch(error => {
                  logger.warn(`Failed to warm up availability cache for ${date.toISOString().split('T')[0]}:`, error.message);
                })
            );
          });
        });
      }

      // Warm up recent appointments
      warmUpPromises.push(
        appointmentService.getAppointments({ 
          page: 1, 
          limit: 50, 
          sortBy: 'scheduledDate', 
          sortOrder: 'desc' 
        })
        .then(result => {
          this.setAppointmentList({}, result.appointments, result.pagination);
          
          // Cache individual appointments
          result.appointments.forEach(appointment => {
            this.setAppointment(appointment.id, appointment);
          });
        })
        .catch(error => {
          logger.warn('Failed to warm up appointment cache:', error.message);
        })
      );

      await Promise.allSettled(warmUpPromises);
      logger.info('Cache warm-up completed');
      
    } catch (error) {
      logger.error('Cache warm-up failed:', error);
    }
  }
}

// Create singleton instance
const appointmentCacheService = new AppointmentCacheService();

export default appointmentCacheService;