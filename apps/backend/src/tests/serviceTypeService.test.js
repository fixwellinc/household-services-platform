import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import serviceTypeService from '../services/serviceTypeService.js';
import prisma from '../config/database.js';

// Mock the database
vi.mock('../config/database.js', () => ({
  default: {
    serviceType: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    appointment: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

describe('ServiceTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createServiceType', () => {
    it('should create a new service type with valid data', async () => {
      const serviceTypeData = {
        name: 'test-service',
        displayName: 'Test Service',
        description: 'A test service',
        duration: 60,
        bufferMinutes: 30,
        color: '#FF0000',
        maxBookingsPerDay: 5,
        requiresApproval: false,
        isExclusive: false,
        exclusiveDays: [],
        allowedDays: [1, 2, 3, 4, 5],
        minAdvanceHours: 24,
        maxAdvanceDays: 30
      };

      const mockCreatedServiceType = { id: 'service-1', ...serviceTypeData };

      prisma.serviceType.findUnique.mockResolvedValue(null); // No existing service type
      prisma.serviceType.create.mockResolvedValue(mockCreatedServiceType);

      const result = await serviceTypeService.createServiceType(serviceTypeData);

      expect(prisma.serviceType.findUnique).toHaveBeenCalledWith({
        where: { name: 'test-service' }
      });
      expect(prisma.serviceType.create).toHaveBeenCalledWith({
        data: serviceTypeData
      });
      expect(result).toEqual(mockCreatedServiceType);
    });

    it('should throw error if service type name already exists', async () => {
      const serviceTypeData = {
        name: 'existing-service',
        displayName: 'Existing Service',
        duration: 60
      };

      prisma.serviceType.findUnique.mockResolvedValue({ id: 'existing-1', name: 'existing-service' });

      await expect(serviceTypeService.createServiceType(serviceTypeData))
        .rejects.toThrow('Service type with this name already exists');
    });

    it('should throw error for invalid duration', async () => {
      const serviceTypeData = {
        name: 'test-service',
        displayName: 'Test Service',
        duration: 10 // Too short
      };

      await expect(serviceTypeService.createServiceType(serviceTypeData))
        .rejects.toThrow('Duration must be between 15 minutes and 8 hours (480 minutes)');
    });

    it('should throw error for invalid color format', async () => {
      const serviceTypeData = {
        name: 'test-service',
        displayName: 'Test Service',
        duration: 60,
        color: 'invalid-color'
      };

      await expect(serviceTypeService.createServiceType(serviceTypeData))
        .rejects.toThrow('Color must be a valid hex color code (e.g., #FF0000)');
    });

    it('should throw error for invalid allowed days', async () => {
      const serviceTypeData = {
        name: 'test-service',
        displayName: 'Test Service',
        duration: 60,
        allowedDays: [7, 8] // Invalid day numbers
      };

      await expect(serviceTypeService.createServiceType(serviceTypeData))
        .rejects.toThrow('Allowed days must contain numbers between 0 and 6 (Sunday to Saturday)');
    });

    it('should throw error for exclusive days not in allowed days', async () => {
      const serviceTypeData = {
        name: 'test-service',
        displayName: 'Test Service',
        duration: 60,
        allowedDays: [1, 2, 3],
        exclusiveDays: [4, 5] // Not in allowed days
      };

      await expect(serviceTypeService.createServiceType(serviceTypeData))
        .rejects.toThrow('Exclusive days must be a subset of allowed days');
    });
  });

  describe('getServiceTypes', () => {
    it('should return all active service types by default', async () => {
      const mockServiceTypes = [
        { id: '1', name: 'service-1', isActive: true, _count: { appointments: 5, availabilityRules: 2 } },
        { id: '2', name: 'service-2', isActive: true, _count: { appointments: 3, availabilityRules: 1 } }
      ];

      prisma.serviceType.findMany.mockResolvedValue(mockServiceTypes);

      const result = await serviceTypeService.getServiceTypes();

      expect(prisma.serviceType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { displayName: 'asc' },
        include: {
          _count: {
            select: {
              appointments: true,
              availabilityRules: true
            }
          }
        }
      });
      expect(result).toEqual(mockServiceTypes);
    });

    it('should include inactive service types when requested', async () => {
      const mockServiceTypes = [
        { id: '1', name: 'service-1', isActive: true },
        { id: '2', name: 'service-2', isActive: false }
      ];

      prisma.serviceType.findMany.mockResolvedValue(mockServiceTypes);

      await serviceTypeService.getServiceTypes({ includeInactive: true });

      expect(prisma.serviceType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { displayName: 'asc' },
        include: {
          _count: {
            select: {
              appointments: true,
              availabilityRules: true
            }
          }
        }
      });
    });
  });

  describe('getServiceTypeById', () => {
    it('should return service type with availability rules', async () => {
      const mockServiceType = {
        id: 'service-1',
        name: 'test-service',
        availabilityRules: [
          { id: 'rule-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }
        ],
        _count: { appointments: 5 }
      };

      prisma.serviceType.findUnique.mockResolvedValue(mockServiceType);

      const result = await serviceTypeService.getServiceTypeById('service-1');

      expect(prisma.serviceType.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-1' },
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
      expect(result).toEqual(mockServiceType);
    });

    it('should return null if service type not found', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);

      const result = await serviceTypeService.getServiceTypeById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateServiceType', () => {
    it('should update service type with valid data', async () => {
      const existingServiceType = {
        id: 'service-1',
        name: 'test-service',
        displayName: 'Test Service',
        duration: 60,
        allowedDays: [1, 2, 3, 4, 5],
        exclusiveDays: []
      };

      const updateData = {
        displayName: 'Updated Test Service',
        duration: 90
      };

      const updatedServiceType = { ...existingServiceType, ...updateData };

      prisma.serviceType.findUnique.mockResolvedValue(existingServiceType);
      prisma.serviceType.update.mockResolvedValue(updatedServiceType);

      const result = await serviceTypeService.updateServiceType('service-1', updateData);

      expect(prisma.serviceType.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
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
      expect(result).toEqual(updatedServiceType);
    });

    it('should throw error if service type not found', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);

      await expect(serviceTypeService.updateServiceType('non-existent', {}))
        .rejects.toThrow('Service type not found');
    });

    it('should throw error if new name already exists', async () => {
      const existingServiceType = { id: 'service-1', name: 'test-service' };
      const updateData = { name: 'existing-name' };

      prisma.serviceType.findUnique
        .mockResolvedValueOnce(existingServiceType) // First call for getting existing service type
        .mockResolvedValueOnce({ id: 'other-service', name: 'existing-name' }); // Second call for checking name conflict

      await expect(serviceTypeService.updateServiceType('service-1', updateData))
        .rejects.toThrow('Service type with this name already exists');
    });
  });

  describe('deleteServiceType', () => {
    it('should soft delete service type when no active appointments', async () => {
      const existingServiceType = { id: 'service-1', name: 'test-service' };
      const deletedServiceType = { ...existingServiceType, isActive: false };

      prisma.serviceType.findUnique.mockResolvedValue(existingServiceType);
      prisma.appointment.count.mockResolvedValue(0); // No active appointments
      prisma.serviceType.update.mockResolvedValue(deletedServiceType);

      const result = await serviceTypeService.deleteServiceType('service-1');

      expect(prisma.appointment.count).toHaveBeenCalledWith({
        where: {
          serviceTypeId: 'service-1',
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });
      expect(prisma.serviceType.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });
      expect(result).toEqual(deletedServiceType);
    });

    it('should throw error if service type has active appointments', async () => {
      const existingServiceType = { id: 'service-1', name: 'test-service' };

      prisma.serviceType.findUnique.mockResolvedValue(existingServiceType);
      prisma.appointment.count.mockResolvedValue(3); // Has active appointments

      await expect(serviceTypeService.deleteServiceType('service-1'))
        .rejects.toThrow('Cannot delete service type with active appointments. Please cancel or complete all appointments first.');
    });
  });

  describe('isBookingAllowedOnDay', () => {
    it('should return true if service type allows booking on the day', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: true,
        allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isBookingAllowedOnDay('service-1', 3); // Wednesday

      expect(result).toBe(true);
    });

    it('should return false if service type does not allow booking on the day', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: true,
        allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isBookingAllowedOnDay('service-1', 0); // Sunday

      expect(result).toBe(false);
    });

    it('should return false if service type is not active', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: false,
        allowedDays: [1, 2, 3, 4, 5]
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isBookingAllowedOnDay('service-1', 3);

      expect(result).toBe(false);
    });
  });

  describe('isExclusiveOnDay', () => {
    it('should return true if service is exclusive on the specified day', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: true,
        isExclusive: true,
        exclusiveDays: [0, 6] // Sunday and Saturday
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isExclusiveOnDay('service-1', 0); // Sunday

      expect(result).toBe(true);
    });

    it('should return false if service is not exclusive', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: true,
        isExclusive: false,
        exclusiveDays: []
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isExclusiveOnDay('service-1', 0);

      expect(result).toBe(false);
    });

    it('should return false if service is exclusive but not on the specified day', async () => {
      const serviceType = {
        id: 'service-1',
        isActive: true,
        isExclusive: true,
        exclusiveDays: [0, 6] // Sunday and Saturday
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const result = await serviceTypeService.isExclusiveOnDay('service-1', 3); // Wednesday

      expect(result).toBe(false);
    });
  });

  describe('validateAdvanceBookingTime', () => {
    it('should return valid for booking within time limits', async () => {
      const serviceType = {
        id: 'service-1',
        minAdvanceHours: 24,
        maxAdvanceDays: 30
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const result = await serviceTypeService.validateAdvanceBookingTime('service-1', futureDate);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Booking time is valid');
    });

    it('should return invalid for booking too soon', async () => {
      const serviceType = {
        id: 'service-1',
        minAdvanceHours: 48,
        maxAdvanceDays: 30
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 12); // 12 hours from now

      const result = await serviceTypeService.validateAdvanceBookingTime('service-1', soonDate);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Appointments must be booked at least 48 hours in advance');
    });

    it('should return invalid for booking too far in advance', async () => {
      const serviceType = {
        id: 'service-1',
        minAdvanceHours: 24,
        maxAdvanceDays: 14
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 30); // 30 days from now

      const result = await serviceTypeService.validateAdvanceBookingTime('service-1', farDate);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Appointments cannot be booked more than 14 days in advance');
    });
  });

  describe('getExclusiveServiceConflicts', () => {
    it('should return conflicts for exclusive service on exclusive day', async () => {
      const serviceType = {
        id: 'service-1',
        isExclusive: true,
        exclusiveDays: [0] // Sunday
      };

      const conflictingAppointments = [
        {
          id: 'apt-1',
          scheduledDate: new Date('2024-01-07T10:00:00Z'), // Sunday
          serviceType: { name: 'other-service', displayName: 'Other Service' }
        }
      ];

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);
      prisma.appointment.findMany.mockResolvedValue(conflictingAppointments);

      const testDate = new Date('2024-01-07T14:00:00Z'); // Sunday
      const result = await serviceTypeService.getExclusiveServiceConflicts('service-1', testDate);

      expect(result).toEqual(conflictingAppointments);
    });

    it('should return empty array for non-exclusive service', async () => {
      const serviceType = {
        id: 'service-1',
        isExclusive: false,
        exclusiveDays: []
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const testDate = new Date('2024-01-07T14:00:00Z');
      const result = await serviceTypeService.getExclusiveServiceConflicts('service-1', testDate);

      expect(result).toEqual([]);
    });

    it('should return empty array for exclusive service on non-exclusive day', async () => {
      const serviceType = {
        id: 'service-1',
        isExclusive: true,
        exclusiveDays: [6] // Saturday
      };

      prisma.serviceType.findUnique.mockResolvedValue(serviceType);

      const testDate = new Date('2024-01-07T14:00:00Z'); // Sunday
      const result = await serviceTypeService.getExclusiveServiceConflicts('service-1', testDate);

      expect(result).toEqual([]);
    });
  });

  describe('getServiceTypeStats', () => {
    it('should return statistics for service type', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2)  // pending
        .mockResolvedValueOnce(3)  // confirmed
        .mockResolvedValueOnce(4)  // completed
        .mockResolvedValueOnce(1); // cancelled

      const result = await serviceTypeService.getServiceTypeStats('service-1');

      expect(result).toEqual({
        serviceTypeId: 'service-1',
        totalAppointments: 10,
        pendingAppointments: 2,
        confirmedAppointments: 3,
        completedAppointments: 4,
        cancelledAppointments: 1,
        completionRate: 40, // 4/10 * 100
        cancellationRate: 10 // 1/10 * 100
      });
    });

    it('should handle zero appointments correctly', async () => {
      prisma.appointment.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0) // confirmed
        .mockResolvedValueOnce(0) // completed
        .mockResolvedValueOnce(0); // cancelled

      const result = await serviceTypeService.getServiceTypeStats('service-1');

      expect(result.completionRate).toBe(0);
      expect(result.cancellationRate).toBe(0);
    });
  });
});