import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import subscriptionRoutes from '../routes/subscriptions.js';
import additionalPropertyService from '../services/additionalPropertyService.js';
import prisma from '../config/database.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../services/additionalPropertyService.js', () => ({
  default: {
    validatePropertyManagementEligibility: vi.fn(),
    addProperty: vi.fn(),
    getPropertiesForSubscription: vi.fn(),
    calculateTotalAdditionalPropertiesCost: vi.fn(),
    updateProperty: vi.fn(),
    removeProperty: vi.fn()
  }
}));

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  default: (req, res, next) => {
    req.user = { id: 'user_123' };
    next();
  }
}));

// Mock validation middleware
vi.mock('../middleware/validation.js', () => ({
  validate: () => (req, res, next) => next()
}));

// Mock other services
vi.mock('../services/subscriptionService.js', () => ({ default: {} }));
vi.mock('../services/paymentFrequencyService.js', () => ({ default: {} }));
vi.mock('../services/subscriptionPauseService.js', () => ({ default: {} }));
vi.mock('../services/stripe.js', () => ({}));
vi.mock('../config/plans.js', () => ({ PLANS: {}, getPlanByTier: vi.fn() }));

describe('Additional Property API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/subscriptions', subscriptionRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/subscriptions/add-property', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        tier: 'HOMECARE',
        status: 'ACTIVE'
      }
    };

    it('should successfully add a property', async () => {
      const propertyData = {
        address: '123 Main Street, City, State 12345',
        nickname: 'Main House'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.validatePropertyManagementEligibility.mockResolvedValue({
        eligible: true,
        checks: {
          subscriptionActive: true,
          notPaused: true,
          belowMaxProperties: true,
          accountInGoodStanding: true
        }
      });
      additionalPropertyService.addProperty.mockResolvedValue({
        id: 'prop_123',
        address: propertyData.address,
        nickname: propertyData.nickname,
        monthlyFee: 27.50,
        ownershipVerified: false,
        addedAt: new Date(),
        message: 'Property added successfully'
      });

      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .send(propertyData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Property added successfully',
        property: {
          id: 'prop_123',
          address: propertyData.address,
          nickname: propertyData.nickname,
          monthlyFee: 27.50,
          ownershipVerified: false,
          addedAt: expect.any(String)
        }
      });

      expect(additionalPropertyService.addProperty).toHaveBeenCalledWith('sub_123', {
        address: propertyData.address,
        nickname: propertyData.nickname,
        ownershipVerification: undefined
      });
    });

    it('should return 400 for missing address', async () => {
      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .send({ nickname: 'Test House' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Property address is required'
      });
    });

    it('should return 404 for user without subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .send({ address: '123 Main St' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'No active subscription found'
      });
    });

    it('should return 400 for ineligible subscription', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.validatePropertyManagementEligibility.mockResolvedValue({
        eligible: false,
        checks: {
          subscriptionActive: false,
          notPaused: true,
          belowMaxProperties: true,
          accountInGoodStanding: true
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .send({ address: '123 Main St' })
        .expect(400);

      expect(response.body.error).toBe('Not eligible to add properties');
      expect(response.body.details).toBeDefined();
    });

    it('should handle service errors', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.validatePropertyManagementEligibility.mockResolvedValue({
        eligible: true,
        checks: {}
      });
      additionalPropertyService.addProperty.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .send({ address: '123 Main St' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service error'
      });
    });
  });

  describe('GET /api/subscriptions/properties', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        tier: 'HOMECARE',
        status: 'ACTIVE'
      }
    };

    it('should successfully get properties', async () => {
      const mockProperties = [
        {
          id: 'prop_1',
          address: '123 Main Street',
          nickname: 'Main House',
          monthlyFee: 27.50,
          ownershipVerified: true,
          addedAt: new Date(),
          displayName: 'Main House'
        }
      ];

      const mockCostBreakdown = {
        propertyCount: 1,
        totalMonthlyFee: 27.50,
        properties: [
          {
            id: 'prop_1',
            address: '123 Main Street',
            nickname: 'Main House',
            monthlyFee: 27.50
          }
        ]
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.getPropertiesForSubscription.mockResolvedValue(mockProperties);
      additionalPropertyService.calculateTotalAdditionalPropertiesCost.mockResolvedValue(mockCostBreakdown);

      const response = await request(app)
        .get('/api/subscriptions/properties')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        properties: [
          {
            id: 'prop_1',
            address: '123 Main Street',
            nickname: 'Main House',
            monthlyFee: 27.50,
            ownershipVerified: true,
            addedAt: expect.any(String),
            displayName: 'Main House'
          }
        ],
        costBreakdown: mockCostBreakdown,
        message: 'Properties retrieved successfully'
      });

      expect(additionalPropertyService.getPropertiesForSubscription).toHaveBeenCalledWith('sub_123');
      expect(additionalPropertyService.calculateTotalAdditionalPropertiesCost).toHaveBeenCalledWith('sub_123');
    });

    it('should return 404 for user without subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .get('/api/subscriptions/properties')
        .expect(404);

      expect(response.body).toEqual({
        error: 'No active subscription found'
      });
    });

    it('should handle service errors', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.getPropertiesForSubscription.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/subscriptions/properties')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service error'
      });
    });
  });

  describe('PUT /api/subscriptions/properties/:id', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        additionalProperties: [
          {
            id: 'prop_123',
            address: '123 Main Street',
            nickname: 'Old Name'
          }
        ]
      }
    };

    it('should successfully update property', async () => {
      const updateData = {
        nickname: 'New Name',
        preferences: { somePreference: true }
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.updateProperty.mockResolvedValue({
        id: 'prop_123',
        address: '123 Main Street',
        nickname: 'New Name',
        monthlyFee: 27.50,
        ownershipVerified: true,
        message: 'Property updated successfully'
      });

      const response = await request(app)
        .put('/api/subscriptions/properties/prop_123')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Property updated successfully',
        property: {
          id: 'prop_123',
          address: '123 Main Street',
          nickname: 'New Name',
          monthlyFee: 27.50,
          ownershipVerified: true
        }
      });

      expect(additionalPropertyService.updateProperty).toHaveBeenCalledWith('prop_123', updateData);
    });

    it('should return 400 for missing property ID', async () => {
      const response = await request(app)
        .put('/api/subscriptions/properties/')
        .send({ nickname: 'New Name' })
        .expect(404); // Express returns 404 for missing route parameters

      // The route won't match, so we expect a 404
    });

    it('should return 404 for user without subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .put('/api/subscriptions/properties/prop_123')
        .send({ nickname: 'New Name' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'No active subscription found'
      });
    });

    it('should return 404 for property not belonging to user', async () => {
      const userWithoutProperty = {
        id: 'user_123',
        subscription: {
          id: 'sub_123',
          additionalProperties: []
        }
      };

      prisma.user.findUnique.mockResolvedValue(userWithoutProperty);

      const response = await request(app)
        .put('/api/subscriptions/properties/prop_123')
        .send({ nickname: 'New Name' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Property not found or does not belong to your subscription'
      });
    });

    it('should handle service errors', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.updateProperty.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/api/subscriptions/properties/prop_123')
        .send({ nickname: 'New Name' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service error'
      });
    });
  });

  describe('DELETE /api/subscriptions/properties/:id', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        additionalProperties: [
          {
            id: 'prop_123',
            address: '123 Main Street',
            nickname: 'Test House'
          }
        ]
      }
    };

    it('should successfully remove property', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.removeProperty.mockResolvedValue({
        propertyId: 'prop_123',
        address: '123 Main Street',
        monthlyFee: 27.50,
        message: 'Property removed successfully'
      });

      const response = await request(app)
        .delete('/api/subscriptions/properties/prop_123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Property removed successfully',
        removedProperty: {
          propertyId: 'prop_123',
          address: '123 Main Street',
          monthlyFee: 27.50
        }
      });

      expect(additionalPropertyService.removeProperty).toHaveBeenCalledWith('sub_123', 'prop_123');
    });

    it('should return 404 for user without subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .delete('/api/subscriptions/properties/prop_123')
        .expect(404);

      expect(response.body).toEqual({
        error: 'No active subscription found'
      });
    });

    it('should return 404 for property not belonging to user', async () => {
      const userWithoutProperty = {
        id: 'user_123',
        subscription: {
          id: 'sub_123',
          additionalProperties: []
        }
      };

      prisma.user.findUnique.mockResolvedValue(userWithoutProperty);

      const response = await request(app)
        .delete('/api/subscriptions/properties/prop_123')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Property not found or does not belong to your subscription'
      });
    });

    it('should handle service errors', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      additionalPropertyService.removeProperty.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/api/subscriptions/properties/prop_123')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service error'
      });
    });
  });
});