import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import advancedSchedulingService from '../services/advancedSchedulingService.js';
import serviceTypeService from '../services/serviceTypeService.js';
import availabilityService from '../services/availabilityService.js';
import prisma from '../config/database.js';

// Mock the dependencies
vi.mock('../config/database.js', () => ({
  default: {
    appointment: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock('../services/serviceTypeService.js', () => ({
  default: {
    getServiceTypeById: vi.fn(),
    isBookingAllowedOnDay: vi.fn(),
    validateAdvanceBookingTime: vi.fn(),
    isExclusiveOnDay: vi.fn(),
    getExclusiveServiceConflicts: vi.fn()
  }
}));

vi.mock('../services/availabilityService.js', () => ({
  default: {
    isSlotAvailable: vi.fn(),
    calculateAvailableSlots: vi.fn()
  }
}));

describe('AdvancedSchedulingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAdvancedBooking', () => {
    const mockBookingRequest = {
      serviceTypeId: 'service-1',
      scheduledDate: new Date('2024-01-15T10:00:00Z'),
      duration: 60,
      customerId: 'customer-1'
    };

    const mockServiceType = {
      id: 'service-1',
      name: 'test-service',
      displayName: 'Test Service',
      isActive: true,
      maxBookingsPerDay: 5,
      bufferMinutes: 30,
      allowedDays: [1, 2, 3, 4, 5],
      isExclusive: false,
      exclusiveDays: []
    };

    it('should return valid result when all checks pass', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({ isValid: true });
      serviceTypeService.isExclusiveOnDay.mockResolvedValue(false);
      availabilityService.isSlotAvailable.mockResolvedValue(true);
      prisma.appointment.count.mockResolvedValue(2); // Under daily limit
      prisma.appointment.findMany.mockResolvedValue([]); // No overlapping appointments

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should return invalid result for inactive service type', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue({
        ...mockServiceType,
        isActive: false
      });

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('INVALID_SERVICE_TYPE');
    });

    it('should return invalid result when daily limit exceeded', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({ isValid: true });
      serviceTypeService.isExclusiveOnDay.mockResolvedValue(false);
      availabilityService.isSlotAvailable.mockResolvedValue(true);
      prisma.appointment.count.mockResolvedValue(5); // At daily limit
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(false);
      expect(result.conflicts.some(c => c.type === 'DAILY_LIMIT_EXCEEDED')).toBe(true);
    });

    it('should return invalid result when service not allowed on day', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(false);

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(false);
      expect(result.conflicts.some(c => c.type === 'DAY_NOT_ALLOWED')).toBe(true);
    });

    it('should return invalid result for advance time violation', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({
        isValid: false,
        message: 'Too soon'
      });

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(false);
      expect(result.conflicts.some(c => c.type === 'ADVANCE_TIME_VIOLATION')).toBe(true);
    });

    it('should return invalid result when slot not available', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({ isValid: true });
      availabilityService.isSlotAvailable.mockResolvedValue(false);

      const result = await advancedSchedulingService.validateAdvancedBooking(mockBookingRequest);

      expect(result.isValid).toBe(false);
      expect(result.conflicts.some(c => c.type === 'SLOT_NOT_AVAILABLE')).toBe(true);
    });
  });

  describe('checkDailyBookingLimits', () => {
    const mockServiceType = {
      id: 'service-1',
      maxBookingsPerDay: 3
    };

    it('should return valid when under daily limit', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      prisma.appointment.count.mockResolvedValue(2);

      const result = await advancedSchedulingService.checkDailyBookingLimits(
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when at daily limit', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      prisma.appointment.count.mockResolvedValue(3);

      const result = await advancedSchedulingService.checkDailyBookingLimits(
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(false);
      expect(result.conflict.type).toBe('DAILY_LIMIT_EXCEEDED');
      expect(result.conflict.currentCount).toBe(3);
      expect(result.conflict.maxAllowed).toBe(3);
    });

    it('should exclude specified appointment from count', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      prisma.appointment.count.mockResolvedValue(2); // Would be 3 without exclusion

      const result = await advancedSchedulingService.checkDailyBookingLimits(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        'exclude-apt-1'
      );

      expect(result.isValid).toBe(true);
      expect(prisma.appointment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { not: 'exclude-apt-1' }
        })
      });
    });
  });

  describe('checkServiceSpecificAvailability', () => {
    const mockServiceType = {
      id: 'service-1',
      displayName: 'Test Service',
      allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
    };

    it('should return valid when all availability checks pass', async () => {
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({ isValid: true });
      availabilityService.isSlotAvailable.mockResolvedValue(true);

      const result = await advancedSchedulingService.checkServiceSpecificAvailability(
        'service-1',
        new Date('2024-01-15T10:00:00Z'), // Monday
        60
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return invalid when day not allowed', async () => {
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(false);
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);

      const result = await advancedSchedulingService.checkServiceSpecificAvailability(
        'service-1',
        new Date('2024-01-14T10:00:00Z'), // Sunday
        60
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('DAY_NOT_ALLOWED');
      expect(result.conflicts[0].requestedDay).toBe('Sunday');
    });

    it('should return invalid when advance time violated', async () => {
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({
        isValid: false,
        message: 'Must book 24 hours in advance'
      });

      const result = await advancedSchedulingService.checkServiceSpecificAvailability(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('ADVANCE_TIME_VIOLATION');
      expect(result.conflicts[0].message).toBe('Must book 24 hours in advance');
    });

    it('should return invalid when slot not available', async () => {
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(true);
      serviceTypeService.validateAdvanceBookingTime.mockResolvedValue({ isValid: true });
      availabilityService.isSlotAvailable.mockResolvedValue(false);
      availabilityService.calculateAvailableSlots.mockResolvedValue([
        { time: '11:00', endTime: '12:00', duration: 60 }
      ]);

      const result = await advancedSchedulingService.checkServiceSpecificAvailability(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('SLOT_NOT_AVAILABLE');
      expect(result.suggestions).toHaveLength(1);
    });
  });

  describe('checkOverlappingServiceRequirements', () => {
    const mockServiceType = {
      id: 'service-1',
      bufferMinutes: 30
    };

    it('should return valid when no overlapping appointments', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await advancedSchedulingService.checkOverlappingServiceRequirements(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return invalid when appointments overlap', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      
      const overlappingAppointment = {
        id: 'apt-1',
        scheduledDate: new Date('2024-01-15T09:30:00Z'),
        duration: 60,
        serviceType: {
          displayName: 'Other Service',
          bufferMinutes: 15
        }
      };

      prisma.appointment.findMany.mockResolvedValue([overlappingAppointment]);

      const result = await advancedSchedulingService.checkOverlappingServiceRequirements(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('OVERLAPPING_APPOINTMENT');
      expect(result.conflicts[0].conflictingAppointment.id).toBe('apt-1');
    });

    it('should exclude specified appointment from overlap check', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      prisma.appointment.findMany.mockResolvedValue([]);

      await advancedSchedulingService.checkOverlappingServiceRequirements(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60,
        'exclude-apt-1'
      );

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { not: 'exclude-apt-1' }
        }),
        include: { serviceType: true }
      });
    });
  });

  describe('checkExclusiveServiceConflicts', () => {
    it('should return valid when service is not exclusive', async () => {
      serviceTypeService.isExclusiveOnDay.mockResolvedValue(false);

      const result = await advancedSchedulingService.checkExclusiveServiceConflicts(
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return valid when exclusive service has no conflicts', async () => {
      serviceTypeService.isExclusiveOnDay.mockResolvedValue(true);
      serviceTypeService.getExclusiveServiceConflicts.mockResolvedValue([]);

      const result = await advancedSchedulingService.checkExclusiveServiceConflicts(
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return invalid when exclusive service has conflicts', async () => {
      const mockServiceType = {
        id: 'service-1',
        displayName: 'Exclusive Service'
      };

      const conflicts = [
        {
          id: 'apt-1',
          scheduledDate: new Date('2024-01-15T09:00:00Z'),
          serviceType: { displayName: 'Other Service' }
        }
      ];

      serviceTypeService.isExclusiveOnDay.mockResolvedValue(true);
      serviceTypeService.getExclusiveServiceConflicts.mockResolvedValue(conflicts);
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);

      const result = await advancedSchedulingService.checkExclusiveServiceConflicts(
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('EXCLUSIVE_SERVICE_CONFLICT');
      expect(result.conflicts[0].conflictingAppointments).toHaveLength(1);
    });
  });

  describe('checkCustomerBookingRestrictions', () => {
    it('should return valid when customer has no restrictions', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(1) // pending appointments
        .mockResolvedValueOnce(0); // recent cancellations
      prisma.appointment.findMany.mockResolvedValue([]); // same day appointments

      const result = await advancedSchedulingService.checkCustomerBookingRestrictions(
        'customer-1',
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return invalid when customer has too many pending appointments', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(3) // pending appointments (at limit)
        .mockResolvedValueOnce(0); // recent cancellations
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await advancedSchedulingService.checkCustomerBookingRestrictions(
        'customer-1',
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('TOO_MANY_PENDING');
      expect(result.conflicts[0].currentCount).toBe(3);
    });

    it('should return invalid when customer has same day appointments', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(1) // pending appointments
        .mockResolvedValueOnce(0); // recent cancellations
      
      const sameDayAppointment = {
        id: 'apt-1',
        scheduledDate: new Date('2024-01-15T09:00:00Z'),
        serviceType: { displayName: 'Other Service' }
      };
      
      prisma.appointment.findMany.mockResolvedValue([sameDayAppointment]);

      const result = await advancedSchedulingService.checkCustomerBookingRestrictions(
        'customer-1',
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('CUSTOMER_SAME_DAY_CONFLICT');
      expect(result.conflicts[0].existingAppointments).toHaveLength(1);
    });

    it('should return invalid when customer has too many recent cancellations', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(1) // pending appointments
        .mockResolvedValueOnce(2); // recent cancellations (at limit)
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await advancedSchedulingService.checkCustomerBookingRestrictions(
        'customer-1',
        'service-1',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(result.isValid).toBe(false);
      expect(result.conflicts[0].type).toBe('TOO_MANY_RECENT_CANCELLATIONS');
      expect(result.conflicts[0].currentCount).toBe(2);
    });
  });

  describe('checkBookingWarnings', () => {
    const mockServiceType = {
      id: 'service-1',
      minAdvanceHours: 24,
      requiresApproval: false
    };

    it('should return short notice warning for bookings close to minimum advance time', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue({
        ...mockServiceType,
        minAdvanceHours: 24
      });

      // Date 30 hours from now (1.25 * 24 = 30, which is < 1.5 * 24 = 36)
      const futureDate = new Date(Date.now() + 30 * 60 * 60 * 1000);

      const warnings = await advancedSchedulingService.checkBookingWarnings(
        'service-1',
        futureDate,
        60
      );

      expect(warnings.some(w => w.type === 'SHORT_NOTICE_BOOKING')).toBe(true);
    });

    it('should return busy day warning for typically busy days', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);

      const mondayDate = new Date('2024-01-15T10:00:00Z'); // Monday

      const warnings = await advancedSchedulingService.checkBookingWarnings(
        'service-1',
        mondayDate,
        60
      );

      expect(warnings.some(w => w.type === 'BUSY_DAY_BOOKING')).toBe(true);
    });

    it('should return approval required warning for services requiring approval', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue({
        ...mockServiceType,
        requiresApproval: true
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const warnings = await advancedSchedulingService.checkBookingWarnings(
        'service-1',
        futureDate,
        60
      );

      expect(warnings.some(w => w.type === 'REQUIRES_APPROVAL')).toBe(true);
    });

    it('should return no warnings for normal bookings', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const fridayDate = new Date('2024-01-19T10:00:00Z'); // Friday (not typically busy)

      const warnings = await advancedSchedulingService.checkBookingWarnings(
        'service-1',
        fridayDate,
        60
      );

      expect(warnings).toHaveLength(0);
    });
  });

  describe('findAlternativeDates', () => {
    const mockServiceType = {
      id: 'service-1',
      allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
    };

    it('should find alternative dates within allowed days', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockImplementation((serviceTypeId, dayOfWeek) => {
        return Promise.resolve(mockServiceType.allowedDays.includes(dayOfWeek));
      });
      prisma.appointment.count.mockResolvedValue(2); // Under daily limit

      const originalDate = new Date('2024-01-14T10:00:00Z'); // Sunday
      const alternatives = await advancedSchedulingService.findAlternativeDates(
        'service-1',
        originalDate,
        7
      );

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.length).toBeLessThanOrEqual(3); // Returns top 3
      expect(alternatives[0]).toHaveProperty('date');
      expect(alternatives[0]).toHaveProperty('dayName');
    });

    it('should return empty array when no alternatives found', async () => {
      serviceTypeService.getServiceTypeById.mockResolvedValue(mockServiceType);
      serviceTypeService.isBookingAllowedOnDay.mockResolvedValue(false);

      const originalDate = new Date('2024-01-14T10:00:00Z');
      const alternatives = await advancedSchedulingService.findAlternativeDates(
        'service-1',
        originalDate,
        7
      );

      expect(alternatives).toHaveLength(0);
    });
  });

  describe('findAlternativeTimeSlots', () => {
    it('should return available time slots', async () => {
      const mockSlots = [
        { time: '09:00', endTime: '10:00', duration: 60 },
        { time: '11:00', endTime: '12:00', duration: 60 },
        { time: '14:00', endTime: '15:00', duration: 60 }
      ];

      availabilityService.calculateAvailableSlots.mockResolvedValue(mockSlots);

      const alternatives = await advancedSchedulingService.findAlternativeTimeSlots(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(alternatives).toHaveLength(3);
      expect(alternatives[0]).toHaveProperty('time', '09:00');
      expect(alternatives[0]).toHaveProperty('endTime', '10:00');
      expect(alternatives[0]).toHaveProperty('duration', 60);
    });

    it('should limit results to 5 slots', async () => {
      const mockSlots = Array.from({ length: 10 }, (_, i) => ({
        time: `${9 + i}:00`,
        endTime: `${10 + i}:00`,
        duration: 60
      }));

      availabilityService.calculateAvailableSlots.mockResolvedValue(mockSlots);

      const alternatives = await advancedSchedulingService.findAlternativeTimeSlots(
        'service-1',
        new Date('2024-01-15T10:00:00Z'),
        60
      );

      expect(alternatives).toHaveLength(5);
    });
  });
});