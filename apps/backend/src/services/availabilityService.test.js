import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import availabilityService from './availabilityService.js';
import prisma from '../config/database.js';

// Mock Prisma
vi.mock('../config/database.js', () => ({
  default: {
    availabilityRule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    appointment: {
      findMany: vi.fn()
    }
  }
}));

describe('AvailabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createAvailabilityRule', () => {
    it('should create a new availability rule with valid data', async () => {
      const ruleData = {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: '09:00',
        endTime: '17:00',
        serviceType: 'plumbing',
        bufferMinutes: 30,
        maxBookingsPerDay: 8
      };

      const mockCreatedRule = { id: 'rule1', ...ruleData };
      prisma.availabilityRule.create.mockResolvedValue(mockCreatedRule);
      prisma.availabilityRule.findMany.mockResolvedValue([]); // No conflicts

      const result = await availabilityService.createAvailabilityRule(ruleData);

      expect(prisma.availabilityRule.create).toHaveBeenCalledWith({
        data: {
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          serviceType: 'plumbing',
          bufferMinutes: 30,
          maxBookingsPerDay: 8
        }
      });
      expect(result).toEqual(mockCreatedRule);
    });

    it('should create rule with default values when optional fields are not provided', async () => {
      const ruleData = {
        dayOfWeek: 2,
        isAvailable: true,
        startTime: '10:00',
        endTime: '16:00'
      };

      const mockCreatedRule = { id: 'rule2', ...ruleData, serviceType: null, bufferMinutes: 30, maxBookingsPerDay: 8 };
      prisma.availabilityRule.create.mockResolvedValue(mockCreatedRule);
      prisma.availabilityRule.findMany.mockResolvedValue([]);

      const result = await availabilityService.createAvailabilityRule(ruleData);

      expect(prisma.availabilityRule.create).toHaveBeenCalledWith({
        data: {
          dayOfWeek: 2,
          isAvailable: true,
          startTime: '10:00',
          endTime: '16:00',
          serviceType: null,
          bufferMinutes: 30,
          maxBookingsPerDay: 8
        }
      });
      expect(result).toEqual(mockCreatedRule);
    });

    it('should throw error for invalid day of week', async () => {
      const ruleData = {
        dayOfWeek: 7, // Invalid
        isAvailable: true,
        startTime: '09:00',
        endTime: '17:00'
      };

      await expect(availabilityService.createAvailabilityRule(ruleData))
        .rejects.toThrow('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    });

    it('should throw error for invalid time format', async () => {
      const ruleData = {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: '25:00', // Invalid hour
        endTime: '17:00'
      };

      await expect(availabilityService.createAvailabilityRule(ruleData))
        .rejects.toThrow('Time must be in HH:MM format');
    });

    it('should throw error when start time is after end time', async () => {
      const ruleData = {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: '17:00',
        endTime: '09:00' // End before start
      };

      await expect(availabilityService.createAvailabilityRule(ruleData))
        .rejects.toThrow('Start time must be before end time');
    });

    it('should throw error for conflicting time slots', async () => {
      const ruleData = {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: '10:00',
        endTime: '14:00',
        serviceType: 'plumbing'
      };

      // Mock existing conflicting rule
      prisma.availabilityRule.findMany.mockResolvedValue([
        {
          id: 'existing1',
          dayOfWeek: 1,
          serviceType: 'plumbing',
          startTime: '12:00',
          endTime: '16:00'
        }
      ]);

      await expect(availabilityService.createAvailabilityRule(ruleData))
        .rejects.toThrow('Time slot conflicts with existing rule: 12:00-16:00');
    });
  });

  describe('getAvailabilityRules', () => {
    it('should return all availability rules without filters', async () => {
      const mockRules = [
        { id: 'rule1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { id: 'rule2', dayOfWeek: 2, startTime: '10:00', endTime: '16:00' }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);

      const result = await availabilityService.getAvailabilityRules();

      expect(prisma.availabilityRule.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
      expect(result).toEqual(mockRules);
    });

    it('should return filtered availability rules', async () => {
      const filters = {
        dayOfWeek: 1,
        serviceType: 'plumbing',
        isAvailable: true
      };

      const mockRules = [
        { id: 'rule1', dayOfWeek: 1, serviceType: 'plumbing', isAvailable: true }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);

      const result = await availabilityService.getAvailabilityRules(filters);

      expect(prisma.availabilityRule.findMany).toHaveBeenCalledWith({
        where: {
          dayOfWeek: 1,
          serviceType: 'plumbing',
          isAvailable: true
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
      expect(result).toEqual(mockRules);
    });
  });

  describe('getAvailabilityRuleById', () => {
    it('should return availability rule by ID', async () => {
      const mockRule = { id: 'rule1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };
      prisma.availabilityRule.findUnique.mockResolvedValue(mockRule);

      const result = await availabilityService.getAvailabilityRuleById('rule1');

      expect(prisma.availabilityRule.findUnique).toHaveBeenCalledWith({
        where: { id: 'rule1' }
      });
      expect(result).toEqual(mockRule);
    });

    it('should return null for non-existent rule', async () => {
      prisma.availabilityRule.findUnique.mockResolvedValue(null);

      const result = await availabilityService.getAvailabilityRuleById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateAvailabilityRule', () => {
    it('should update availability rule with valid data', async () => {
      const existingRule = {
        id: 'rule1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        serviceType: 'plumbing'
      };

      const updateData = {
        startTime: '08:00',
        endTime: '18:00'
      };

      const updatedRule = { ...existingRule, ...updateData };

      prisma.availabilityRule.findUnique.mockResolvedValue(existingRule);
      prisma.availabilityRule.findMany.mockResolvedValue([]); // No conflicts
      prisma.availabilityRule.update.mockResolvedValue(updatedRule);

      const result = await availabilityService.updateAvailabilityRule('rule1', updateData);

      expect(prisma.availabilityRule.update).toHaveBeenCalledWith({
        where: { id: 'rule1' },
        data: updateData
      });
      expect(result).toEqual(updatedRule);
    });

    it('should throw error for non-existent rule', async () => {
      prisma.availabilityRule.findUnique.mockResolvedValue(null);

      await expect(availabilityService.updateAvailabilityRule('nonexistent', {}))
        .rejects.toThrow('Availability rule not found');
    });

    it('should validate updated time range', async () => {
      const existingRule = {
        id: 'rule1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00'
      };

      const updateData = {
        startTime: '18:00', // After existing end time
        endTime: '17:00'
      };

      prisma.availabilityRule.findUnique.mockResolvedValue(existingRule);

      await expect(availabilityService.updateAvailabilityRule('rule1', updateData))
        .rejects.toThrow('Start time must be before end time');
    });
  });

  describe('deleteAvailabilityRule', () => {
    it('should delete availability rule', async () => {
      const existingRule = { id: 'rule1', dayOfWeek: 1 };
      prisma.availabilityRule.findUnique.mockResolvedValue(existingRule);
      prisma.availabilityRule.delete.mockResolvedValue(existingRule);

      const result = await availabilityService.deleteAvailabilityRule('rule1');

      expect(prisma.availabilityRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule1' }
      });
      expect(result).toEqual(existingRule);
    });

    it('should throw error for non-existent rule', async () => {
      prisma.availabilityRule.findUnique.mockResolvedValue(null);

      await expect(availabilityService.deleteAvailabilityRule('nonexistent'))
        .rejects.toThrow('Availability rule not found');
    });
  });

  describe('getAvailabilityForDay', () => {
    it('should return service-specific rules when available', async () => {
      const serviceSpecificRules = [
        { id: 'rule1', dayOfWeek: 1, serviceType: 'plumbing', startTime: '09:00', endTime: '17:00' }
      ];

      const generalRules = [
        { id: 'rule2', dayOfWeek: 1, serviceType: null, startTime: '08:00', endTime: '18:00' }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue([...serviceSpecificRules, ...generalRules]);

      const result = await availabilityService.getAvailabilityForDay(1, 'plumbing');

      expect(result).toEqual(serviceSpecificRules);
    });

    it('should return general rules when no service-specific rules exist', async () => {
      const generalRules = [
        { id: 'rule1', dayOfWeek: 1, serviceType: null, startTime: '09:00', endTime: '17:00' }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(generalRules);

      const result = await availabilityService.getAvailabilityForDay(1, 'plumbing');

      expect(result).toEqual(generalRules);
    });

    it('should throw error for invalid day of week', async () => {
      await expect(availabilityService.getAvailabilityForDay(7))
        .rejects.toThrow('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    });
  });

  describe('isTimeSlotAvailable', () => {
    it('should return true for available time slot', async () => {
      const mockRules = [
        { id: 'rule1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', serviceType: null, isAvailable: true }
      ];

      // Mock the findMany call that getAvailabilityForDay makes
      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);

      const result = await availabilityService.isTimeSlotAvailable(1, '10:00', '11:00');

      expect(result).toBe(true);
    });

    it('should return false for unavailable time slot', async () => {
      const mockRules = [
        { id: 'rule1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', serviceType: null, isAvailable: true }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);

      const result = await availabilityService.isTimeSlotAvailable(1, '08:00', '09:30'); // Starts before available time

      expect(result).toBe(false);
    });

    it('should return false when no rules exist for the day', async () => {
      prisma.availabilityRule.findMany.mockResolvedValue([]);

      const result = await availabilityService.isTimeSlotAvailable(1, '10:00', '11:00');

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdateAvailabilityRules', () => {
    it('should create new rules and update existing ones', async () => {
      const rulesData = [
        {
          // New rule (no ID)
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00'
        },
        {
          // Update existing rule
          id: 'rule1',
          startTime: '08:00'
        }
      ];

      const existingRule = {
        id: 'rule1',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '16:00'
      };

      const newRule = { id: 'rule2', ...rulesData[0] };
      const updatedRule = { ...existingRule, startTime: '08:00' };

      // Mock for new rule creation
      prisma.availabilityRule.create.mockResolvedValueOnce(newRule);
      prisma.availabilityRule.findMany.mockResolvedValue([]); // No conflicts

      // Mock for existing rule update
      prisma.availabilityRule.findUnique.mockResolvedValueOnce(existingRule);
      prisma.availabilityRule.update.mockResolvedValueOnce(updatedRule);

      const result = await availabilityService.bulkUpdateAvailabilityRules(rulesData);

      expect(result).toEqual([newRule, updatedRule]);
      expect(prisma.availabilityRule.create).toHaveBeenCalledTimes(1);
      expect(prisma.availabilityRule.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('_compareTime', () => {
    it('should compare times correctly', () => {
      // Access private method for testing
      const service = availabilityService;
      
      expect(service._compareTime('09:00', '10:00')).toBe(-1);
      expect(service._compareTime('10:00', '09:00')).toBe(1);
      expect(service._compareTime('09:30', '09:30')).toBe(0);
      expect(service._compareTime('09:15', '09:30')).toBe(-1);
    });
  });

  describe('_timesOverlap', () => {
    it('should detect overlapping time ranges', () => {
      const service = availabilityService;
      
      // Overlapping ranges
      expect(service._timesOverlap('09:00', '12:00', '10:00', '14:00')).toBe(true);
      expect(service._timesOverlap('10:00', '14:00', '09:00', '12:00')).toBe(true);
      
      // Non-overlapping ranges
      expect(service._timesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
      expect(service._timesOverlap('11:00', '12:00', '09:00', '10:00')).toBe(false);
      
      // Adjacent ranges (should not overlap)
      expect(service._timesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    });
  });

  describe('calculateAvailableSlots', () => {
    it('should calculate available slots for a date with no existing appointments', async () => {
      const testDate = new Date('2024-01-15'); // Monday
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          bufferMinutes: 30,
          serviceType: null
        }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);
      prisma.appointment.findMany.mockResolvedValue([]); // No existing appointments

      const result = await availabilityService.calculateAvailableSlots(testDate, null, 60);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('time');
      expect(result[0]).toHaveProperty('duration', 60);
      expect(result[0]).toHaveProperty('date', '2024-01-15');
    });

    it('should exclude slots that conflict with existing appointments', async () => {
      const testDate = new Date('2024-01-15');
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          bufferMinutes: 30,
          serviceType: null
        }
      ];

      const mockAppointments = [
        {
          scheduledDate: new Date('2024-01-15T10:00:00Z'),
          duration: 60,
          serviceType: 'plumbing'
        }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);
      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await availabilityService.calculateAvailableSlots(testDate, null, 60);

      // Should not include slots that conflict with the 10:00-11:00 appointment
      const conflictingSlot = result.find(slot => slot.time === '10:00');
      expect(conflictingSlot).toBeUndefined();
    });

    it('should return empty array when no availability rules exist', async () => {
      const testDate = new Date('2024-01-15');
      
      prisma.availabilityRule.findMany.mockResolvedValue([]);

      const result = await availabilityService.calculateAvailableSlots(testDate, null, 60);

      expect(result).toEqual([]);
    });
  });

  describe('calculateAvailableSlotsForRange', () => {
    it('should calculate slots for multiple dates', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1, // Monday
          isAvailable: true,
          startTime: '09:00',
          endTime: '12:00',
          bufferMinutes: 30,
          serviceType: null
        },
        {
          id: 'rule2',
          dayOfWeek: 2, // Tuesday
          isAvailable: true,
          startTime: '10:00',
          endTime: '14:00',
          bufferMinutes: 30,
          serviceType: null
        }
      ];

      prisma.availabilityRule.findMany
        .mockResolvedValueOnce([mockRules[0]]) // Monday
        .mockResolvedValueOnce([mockRules[1]]); // Tuesday
      
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await availabilityService.calculateAvailableSlotsForRange(startDate, endDate, null, 60);

      expect(result).toHaveProperty('2024-01-15');
      expect(result).toHaveProperty('2024-01-16');
      expect(Array.isArray(result['2024-01-15'])).toBe(true);
      expect(Array.isArray(result['2024-01-16'])).toBe(true);
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for available slot', async () => {
      const testDate = new Date('2024-01-15');
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          maxBookingsPerDay: 8,
          serviceType: null
        }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await availabilityService.isSlotAvailable(testDate, '10:00', 60);

      expect(result).toBe(true);
    });

    it('should return false when daily booking limit is reached', async () => {
      const testDate = new Date('2024-01-15');
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          maxBookingsPerDay: 2,
          serviceType: null
        }
      ];

      const mockAppointments = [
        { scheduledDate: new Date('2024-01-15T09:00:00Z'), duration: 60 },
        { scheduledDate: new Date('2024-01-15T11:00:00Z'), duration: 60 }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);
      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await availabilityService.isSlotAvailable(testDate, '14:00', 60);

      expect(result).toBe(false);
    });
  });

  describe('getNextAvailableSlot', () => {
    it('should find next available slot after specified time', async () => {
      const testDate = new Date('2024-01-15');
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          bufferMinutes: 30,
          serviceType: null
        }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await availabilityService.getNextAvailableSlot(testDate, '12:00', 60);

      expect(result).toHaveProperty('date', '2024-01-15');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('duration', 60);
      expect(availabilityService._compareTime(result.time, '12:00')).toBeGreaterThan(0);
    });

    it('should return null when no slots available within search range', async () => {
      const testDate = new Date('2024-01-15');
      
      prisma.availabilityRule.findMany.mockResolvedValue([]);

      const result = await availabilityService.getNextAvailableSlot(testDate, '12:00', 60, null, 1);

      expect(result).toBeNull();
    });
  });

  describe('getBufferTimeForService', () => {
    it('should return service-specific buffer time', async () => {
      const mockRules = [
        {
          id: 'rule1',
          dayOfWeek: 1,
          serviceType: 'plumbing',
          bufferMinutes: 45,
          isAvailable: true
        }
      ];

      prisma.availabilityRule.findMany.mockResolvedValue(mockRules);

      const result = await availabilityService.getBufferTimeForService('plumbing', 1);

      expect(result).toBe(45);
    });

    it('should return default buffer time when no rules exist', async () => {
      prisma.availabilityRule.findMany.mockResolvedValue([]);

      const result = await availabilityService.getBufferTimeForService('plumbing', 1);

      expect(result).toBe(30);
    });
  });

  describe('_timeToMinutes', () => {
    it('should convert time string to minutes', () => {
      const service = availabilityService;
      
      expect(service._timeToMinutes('00:00')).toBe(0);
      expect(service._timeToMinutes('01:00')).toBe(60);
      expect(service._timeToMinutes('09:30')).toBe(570);
      expect(service._timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('_minutesToTime', () => {
    it('should convert minutes to time string', () => {
      const service = availabilityService;
      
      expect(service._minutesToTime(0)).toBe('00:00');
      expect(service._minutesToTime(60)).toBe('01:00');
      expect(service._minutesToTime(570)).toBe('09:30');
      expect(service._minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('_addMinutesToTime', () => {
    it('should add minutes to time string', () => {
      const service = availabilityService;
      
      expect(service._addMinutesToTime('09:00', 30)).toBe('09:30');
      expect(service._addMinutesToTime('09:30', 60)).toBe('10:30');
      expect(service._addMinutesToTime('23:30', 30)).toBe('24:00');
    });
  });

  describe('_formatTimeFromDate', () => {
    it('should format time from Date object', () => {
      const service = availabilityService;
      
      // Use local time instead of UTC to avoid timezone issues
      const date1 = new Date('2024-01-15T09:30:00');
      const date2 = new Date('2024-01-15T14:05:00');
      
      expect(service._formatTimeFromDate(date1)).toBe('09:30');
      expect(service._formatTimeFromDate(date2)).toBe('14:05');
    });
  });

  describe('_checkAppointmentConflicts', () => {
    it('should detect conflicts with existing appointments', () => {
      const service = availabilityService;
      const appointments = [
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '14:00', endTime: '15:30' }
      ];
      
      expect(service._checkAppointmentConflicts('09:30', '10:30', appointments)).toBe(true);
      expect(service._checkAppointmentConflicts('12:00', '13:00', appointments)).toBe(false);
      expect(service._checkAppointmentConflicts('15:00', '16:00', appointments)).toBe(true);
    });
  });
});