import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import additionalPropertyService from '../services/additionalPropertyService.js';
import prisma from '../config/database.js';
import { getPlanByTier } from '../config/plans.js';

// Mock Prisma
vi.mock('../config/database.js', () => ({
  default: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    additionalProperty: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }
  }
}));

// Mock plans config
vi.mock('../config/plans.js', () => ({
  getPlanByTier: vi.fn()
}));

describe('AdditionalPropertyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addProperty', () => {
    const mockSubscription = {
      id: 'sub_123',
      tier: 'HOMECARE',
      status: 'ACTIVE',
      additionalProperties: [],
      user: { id: 'user_123', email: 'test@example.com' }
    };

    const mockPlan = {
      monthlyPrice: 54.99
    };

    beforeEach(() => {
      getPlanByTier.mockReturnValue(mockPlan);
    });

    it('should successfully add a property', async () => {
      const propertyData = {
        address: '123 Main Street, City, State 12345',
        nickname: 'Main House',
        ownershipVerification: null
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.additionalProperty.create.mockResolvedValue({
        id: 'prop_123',
        subscriptionId: 'sub_123',
        address: propertyData.address,
        nickname: propertyData.nickname,
        monthlyFee: 27.50,
        ownershipVerified: false,
        addedAt: new Date()
      });
      prisma.subscription.update.mockResolvedValue({});

      const result = await additionalPropertyService.addProperty('sub_123', propertyData);

      expect(result).toEqual({
        id: 'prop_123',
        address: propertyData.address,
        nickname: propertyData.nickname,
        monthlyFee: 27.50,
        ownershipVerified: false,
        addedAt: expect.any(Date),
        message: 'Property added successfully'
      });

      expect(prisma.additionalProperty.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub_123',
          address: propertyData.address,
          nickname: propertyData.nickname,
          monthlyFee: 27.50,
          ownershipVerified: false,
          verificationDocument: null
        }
      });
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        additionalPropertyService.addProperty('', { address: '123 Main St' })
      ).rejects.toThrow('Subscription ID and address are required');

      await expect(
        additionalPropertyService.addProperty('sub_123', { nickname: 'Test' })
      ).rejects.toThrow('Subscription ID and address are required');
    });

    it('should throw error for non-existent subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(
        additionalPropertyService.addProperty('sub_123', { address: '123 Main St' })
      ).rejects.toThrow('Subscription not found');
    });

    it('should throw error for inactive subscription', async () => {
      const inactiveSubscription = { ...mockSubscription, status: 'CANCELLED' };
      prisma.subscription.findUnique.mockResolvedValue(inactiveSubscription);

      await expect(
        additionalPropertyService.addProperty('sub_123', { address: '123 Main St' })
      ).rejects.toThrow('Can only add properties to active subscriptions');
    });

    it('should throw error when maximum properties limit is reached', async () => {
      const subscriptionWithMaxProperties = {
        ...mockSubscription,
        additionalProperties: new Array(5).fill({ id: 'prop' })
      };
      prisma.subscription.findUnique.mockResolvedValue(subscriptionWithMaxProperties);

      await expect(
        additionalPropertyService.addProperty('sub_123', { address: '123 Main St' })
      ).rejects.toThrow('Maximum 5 additional properties allowed');
    });

    it('should throw error for duplicate address', async () => {
      const subscriptionWithProperty = {
        ...mockSubscription,
        additionalProperties: [{ address: '123 Main Street, City, State 12345' }]
      };
      prisma.subscription.findUnique.mockResolvedValue(subscriptionWithProperty);

      await expect(
        additionalPropertyService.addProperty('sub_123', { 
          address: '123 Main Street, City, State 12345' 
        })
      ).rejects.toThrow('Property address already exists in this subscription');
    });

    it('should throw error for invalid address format', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      await expect(
        additionalPropertyService.addProperty('sub_123', { address: '123' })
      ).rejects.toThrow('Invalid address format');

      await expect(
        additionalPropertyService.addProperty('sub_123', { address: 'No numbers here' })
      ).rejects.toThrow('Invalid address format');
    });
  });

  describe('removeProperty', () => {
    const mockProperty = {
      id: 'prop_123',
      subscriptionId: 'sub_123',
      address: '123 Main Street',
      monthlyFee: 27.50,
      subscription: { id: 'sub_123' }
    };

    it('should successfully remove a property', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(mockProperty);
      prisma.additionalProperty.delete.mockResolvedValue(mockProperty);
      
      // Mock the subscription for updateSubscriptionPricing
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub_123',
        tier: 'HOMECARE',
        paymentFrequency: 'MONTHLY',
        additionalProperties: []
      });
      prisma.subscription.update.mockResolvedValue({});

      // Mock getPlanByTier for updateSubscriptionPricing
      getPlanByTier.mockReturnValue({
        monthlyPrice: 54.99,
        yearlyPrice: 593.89
      });

      // Mock checkActiveBookingsForProperty to return 0
      vi.spyOn(additionalPropertyService, 'checkActiveBookingsForProperty')
        .mockResolvedValue(0);

      const result = await additionalPropertyService.removeProperty('sub_123', 'prop_123');

      expect(result).toEqual({
        propertyId: 'prop_123',
        address: '123 Main Street',
        monthlyFee: 27.50,
        message: 'Property removed successfully'
      });

      expect(prisma.additionalProperty.delete).toHaveBeenCalledWith({
        where: { id: 'prop_123' }
      });
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        additionalPropertyService.removeProperty('', 'prop_123')
      ).rejects.toThrow('Subscription ID and property ID are required');

      await expect(
        additionalPropertyService.removeProperty('sub_123', '')
      ).rejects.toThrow('Subscription ID and property ID are required');
    });

    it('should throw error for non-existent property', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(null);

      await expect(
        additionalPropertyService.removeProperty('sub_123', 'prop_123')
      ).rejects.toThrow('Property not found');
    });

    it('should throw error when property belongs to different subscription', async () => {
      const wrongProperty = { ...mockProperty, subscriptionId: 'sub_456' };
      prisma.additionalProperty.findUnique.mockResolvedValue(wrongProperty);

      await expect(
        additionalPropertyService.removeProperty('sub_123', 'prop_123')
      ).rejects.toThrow('Property does not belong to this subscription');
    });

    it('should throw error when property has active bookings', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(mockProperty);
      
      // Mock checkActiveBookingsForProperty to return active bookings
      vi.spyOn(additionalPropertyService, 'checkActiveBookingsForProperty')
        .mockResolvedValue(2);

      await expect(
        additionalPropertyService.removeProperty('sub_123', 'prop_123')
      ).rejects.toThrow('Cannot remove property with active service appointments');
    });
  });

  describe('updateProperty', () => {
    const mockProperty = {
      id: 'prop_123',
      address: '123 Main Street',
      nickname: 'Old Nickname',
      monthlyFee: 27.50,
      ownershipVerified: true
    };

    it('should successfully update property nickname', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(mockProperty);
      prisma.additionalProperty.update.mockResolvedValue({
        ...mockProperty,
        nickname: 'New Nickname'
      });

      const result = await additionalPropertyService.updateProperty('prop_123', {
        nickname: 'New Nickname'
      });

      expect(result).toEqual({
        id: 'prop_123',
        address: '123 Main Street',
        nickname: 'New Nickname',
        monthlyFee: 27.50,
        ownershipVerified: true,
        message: 'Property updated successfully'
      });

      expect(prisma.additionalProperty.update).toHaveBeenCalledWith({
        where: { id: 'prop_123' },
        data: { nickname: 'New Nickname' }
      });
    });

    it('should handle empty nickname by setting to null', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(mockProperty);
      prisma.additionalProperty.update.mockResolvedValue({
        ...mockProperty,
        nickname: null
      });

      await additionalPropertyService.updateProperty('prop_123', {
        nickname: ''
      });

      expect(prisma.additionalProperty.update).toHaveBeenCalledWith({
        where: { id: 'prop_123' },
        data: { nickname: null }
      });
    });

    it('should throw error for missing property ID', async () => {
      await expect(
        additionalPropertyService.updateProperty('', { nickname: 'Test' })
      ).rejects.toThrow('Property ID is required');
    });

    it('should throw error for non-existent property', async () => {
      prisma.additionalProperty.findUnique.mockResolvedValue(null);

      await expect(
        additionalPropertyService.updateProperty('prop_123', { nickname: 'Test' })
      ).rejects.toThrow('Property not found');
    });
  });

  describe('getPropertiesForSubscription', () => {
    it('should return formatted list of properties', async () => {
      const mockProperties = [
        {
          id: 'prop_1',
          address: '123 Main Street',
          nickname: 'Main House',
          monthlyFee: 27.50,
          ownershipVerified: true,
          addedAt: new Date('2024-01-01')
        },
        {
          id: 'prop_2',
          address: '456 Oak Avenue',
          nickname: null,
          monthlyFee: 27.50,
          ownershipVerified: false,
          addedAt: new Date('2024-01-02')
        }
      ];

      prisma.additionalProperty.findMany.mockResolvedValue(mockProperties);

      const result = await additionalPropertyService.getPropertiesForSubscription('sub_123');

      expect(result).toEqual([
        {
          id: 'prop_1',
          address: '123 Main Street',
          nickname: 'Main House',
          monthlyFee: 27.50,
          ownershipVerified: true,
          addedAt: new Date('2024-01-01'),
          displayName: 'Main House'
        },
        {
          id: 'prop_2',
          address: '456 Oak Avenue',
          nickname: null,
          monthlyFee: 27.50,
          ownershipVerified: false,
          addedAt: new Date('2024-01-02'),
          displayName: '456 Oak Avenue'
        }
      ]);

      expect(prisma.additionalProperty.findMany).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub_123' },
        orderBy: { addedAt: 'asc' }
      });
    });

    it('should throw error for missing subscription ID', async () => {
      await expect(
        additionalPropertyService.getPropertiesForSubscription('')
      ).rejects.toThrow('Subscription ID is required');
    });
  });

  describe('calculateAdditionalPropertyFee', () => {
    it('should calculate 50% of monthly plan price', () => {
      getPlanByTier.mockReturnValue({ monthlyPrice: 54.99 });

      const fee = additionalPropertyService.calculateAdditionalPropertyFee('HOMECARE');

      expect(fee).toBe(27.50); // 54.99 * 0.5 = 27.495, rounded to 27.50
    });

    it('should throw error for invalid plan tier', () => {
      getPlanByTier.mockReturnValue(null);

      expect(() => {
        additionalPropertyService.calculateAdditionalPropertyFee('INVALID');
      }).toThrow('Invalid plan tier: INVALID');
    });
  });

  describe('calculateTotalAdditionalPropertiesCost', () => {
    it('should calculate total cost for multiple properties', async () => {
      const mockProperties = [
        { id: 'prop_1', address: '123 Main St', nickname: 'Main', monthlyFee: 27.50 },
        { id: 'prop_2', address: '456 Oak Ave', nickname: null, monthlyFee: 27.50 }
      ];

      vi.spyOn(additionalPropertyService, 'getPropertiesForSubscription')
        .mockResolvedValue(mockProperties);

      const result = await additionalPropertyService.calculateTotalAdditionalPropertiesCost('sub_123');

      expect(result).toEqual({
        propertyCount: 2,
        totalMonthlyFee: 55.00,
        properties: [
          { id: 'prop_1', address: '123 Main St', nickname: 'Main', monthlyFee: 27.50 },
          { id: 'prop_2', address: '456 Oak Ave', nickname: null, monthlyFee: 27.50 }
        ]
      });
    });
  });

  describe('validateAddress', () => {
    it('should validate correct addresses', () => {
      expect(additionalPropertyService.validateAddress('123 Main Street, City, State 12345')).toBe(true);
      expect(additionalPropertyService.validateAddress('456 Oak Avenue Apt 2B')).toBe(true);
      expect(additionalPropertyService.validateAddress('789 Pine Road, Unit 5')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(additionalPropertyService.validateAddress('')).toBe(false);
      expect(additionalPropertyService.validateAddress('123')).toBe(false);
      expect(additionalPropertyService.validateAddress('No numbers here')).toBe(false);
      expect(additionalPropertyService.validateAddress('12345')).toBe(false);
      expect(additionalPropertyService.validateAddress(null)).toBe(false);
      expect(additionalPropertyService.validateAddress(undefined)).toBe(false);
    });
  });

  describe('processOwnershipVerification', () => {
    it('should process valid ownership verification', async () => {
      const verificationData = {
        documentType: 'deed',
        documentUrl: 'https://example.com/deed.pdf',
        notes: 'Property deed document'
      };

      prisma.additionalProperty.update.mockResolvedValue({});

      const result = await additionalPropertyService.processOwnershipVerification('prop_123', verificationData);

      expect(result).toEqual({
        propertyId: 'prop_123',
        documentType: 'deed',
        status: 'pending_verification',
        message: 'Ownership verification document submitted for review'
      });

      expect(prisma.additionalProperty.update).toHaveBeenCalledWith({
        where: { id: 'prop_123' },
        data: {
          verificationDocument: 'https://example.com/deed.pdf'
        }
      });
    });

    it('should reject unsupported document types', async () => {
      const verificationData = {
        documentType: 'invalid_type',
        documentUrl: 'https://example.com/doc.pdf'
      };

      await expect(
        additionalPropertyService.processOwnershipVerification('prop_123', verificationData)
      ).rejects.toThrow('Unsupported document type: invalid_type');
    });
  });

  describe('validatePropertyManagementEligibility', () => {
    it('should return eligible status for valid subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'ACTIVE',
        isPaused: false,
        additionalProperties: [{ id: 'prop_1' }],
        user: { id: 'user_123' }
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      const result = await additionalPropertyService.validatePropertyManagementEligibility('sub_123');

      expect(result).toEqual({
        eligible: true,
        checks: {
          subscriptionActive: true,
          notPaused: true,
          belowMaxProperties: true,
          accountInGoodStanding: true
        },
        currentPropertyCount: 1,
        maxProperties: 5,
        remainingSlots: 4
      });
    });

    it('should return ineligible status for suspended subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'SUSPENDED',
        isPaused: false,
        additionalProperties: [],
        user: { id: 'user_123' }
      };

      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      const result = await additionalPropertyService.validatePropertyManagementEligibility('sub_123');

      expect(result.eligible).toBe(false);
      expect(result.checks.subscriptionActive).toBe(false);
      expect(result.checks.accountInGoodStanding).toBe(false);
    });
  });

  describe('getPropertyManagementStatistics', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it('should return comprehensive statistics', async () => {
      // Mock the count calls with specific implementations
      prisma.additionalProperty.count = vi.fn()
        .mockResolvedValueOnce(10) // total properties
        .mockResolvedValueOnce(7); // verified properties
      
      prisma.subscription.count = vi.fn().mockResolvedValue(4); // subscriptions with properties

      const result = await additionalPropertyService.getPropertyManagementStatistics();

      expect(result).toEqual({
        totalAdditionalProperties: 10,
        verifiedProperties: 7,
        pendingVerification: 3,
        subscriptionsWithProperties: 4,
        averagePropertiesPerSubscription: 2.5,
        verificationRate: '70.00'
      });
    });

    it('should handle zero properties case', async () => {
      // Mock the count calls with specific implementations
      prisma.additionalProperty.count = vi.fn()
        .mockResolvedValueOnce(0) // total properties
        .mockResolvedValueOnce(0); // verified properties
      
      prisma.subscription.count = vi.fn().mockResolvedValue(0); // subscriptions with properties

      const result = await additionalPropertyService.getPropertyManagementStatistics();

      expect(result.verificationRate).toBe(0);
      expect(result.averagePropertiesPerSubscription).toBe(0);
    });
  });
});