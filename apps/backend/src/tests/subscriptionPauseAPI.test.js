import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import subscriptionRoutes from '../routes/subscriptions.js';
import auth from '../middleware/auth.js';
import { errorHandler } from '../middleware/error.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn()
    },
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    subscriptionPause: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('../services/subscriptionPauseService.js', () => ({
  default: {
    pauseSubscription: vi.fn(),
    resumeSubscription: vi.fn(),
    getPauseStatus: vi.fn()
  }
}));

vi.mock('../middleware/auth.js', () => ({
  default: vi.fn((req, res, next) => {
    req.user = { id: 'user_123' };
    next();
  })
}));

describe('Subscription Pause API Endpoints', () => {
  let app;
  let mockPrisma;
  let mockPauseService;

  beforeEach(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/subscriptions', subscriptionRoutes);
    app.use(errorHandler);

    // Get mocked modules
    const { default: prisma } = await import('../config/database.js');
    const { default: pauseService } = await import('../services/subscriptionPauseService.js');
    
    mockPrisma = prisma;
    mockPauseService = pauseService;

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/subscriptions/pause', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        userId: 'user_123',
        status: 'ACTIVE',
        isPaused: false,
        tier: 'HOMECARE'
      }
    };

    it('should successfully pause a subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPauseService.pauseSubscription.mockResolvedValue({
        pauseId: 'pause_123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
        durationMonths: 1,
        reason: 'Vacation',
        message: 'Subscription paused successfully'
      });

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 1,
          reason: 'Vacation'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subscription paused successfully');
      expect(response.body.pause).toMatchObject({
        id: 'pause_123',
        durationMonths: 1,
        reason: 'Vacation'
      });
      expect(mockPauseService.pauseSubscription).toHaveBeenCalledWith('sub_123', 1, 'Vacation');
    });

    it('should reject invalid duration', async () => {
      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 0,
          reason: 'Invalid duration'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Duration in months is required');
    });

    it('should reject duration over 6 months', async () => {
      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 7,
          reason: 'Too long'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Duration must be between 1 and 6 months');
    });

    it('should reject missing duration', async () => {
      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          reason: 'No duration'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Duration in months is required');
    });

    it('should handle user with no subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 1,
          reason: 'No subscription'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No active subscription found');
    });

    it('should reject pausing already paused subscription', async () => {
      const pausedUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          isPaused: true
        }
      };
      mockPrisma.user.findUnique.mockResolvedValue(pausedUser);

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 1,
          reason: 'Already paused'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Subscription is already paused');
    });

    it('should handle service errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPauseService.pauseSubscription.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 1,
          reason: 'Service error test'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('POST /api/subscriptions/resume', () => {
    const mockPausedUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        userId: 'user_123',
        status: 'ACTIVE',
        isPaused: true,
        tier: 'HOMECARE'
      }
    };

    it('should successfully resume a paused subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockPausedUser);
      mockPauseService.resumeSubscription.mockResolvedValue({
        resumeDate: new Date('2024-01-15'),
        pauseDuration: 15,
        message: 'Subscription resumed successfully'
      });

      const response = await request(app)
        .post('/api/subscriptions/resume');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subscription resumed successfully');
      expect(response.body.resume).toMatchObject({
        pauseDuration: 15
      });
      expect(mockPauseService.resumeSubscription).toHaveBeenCalledWith('sub_123');
    });

    it('should handle user with no subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .post('/api/subscriptions/resume');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No subscription found');
    });

    it('should reject resuming non-paused subscription', async () => {
      const activeUser = {
        ...mockPausedUser,
        subscription: {
          ...mockPausedUser.subscription,
          isPaused: false
        }
      };
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const response = await request(app)
        .post('/api/subscriptions/resume');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Subscription is not currently paused');
    });

    it('should handle service errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockPausedUser);
      mockPauseService.resumeSubscription.mockRejectedValue(new Error('Resume error'));

      const response = await request(app)
        .post('/api/subscriptions/resume');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Resume error');
    });
  });

  describe('GET /api/subscriptions/pause-status', () => {
    const mockUser = {
      id: 'user_123',
      subscription: {
        id: 'sub_123',
        userId: 'user_123',
        status: 'ACTIVE',
        isPaused: true,
        tier: 'HOMECARE'
      }
    };

    it('should return pause status for subscription', async () => {
      const mockPauseStatus = {
        isPaused: true,
        currentPause: {
          id: 'pause_123',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-02-01'),
          reason: 'Vacation',
          daysRemaining: 15
        },
        pauseHistory: [
          {
            id: 'pause_123',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-02-01'),
            reason: 'Vacation',
            status: 'ACTIVE',
            duration: 31
          }
        ],
        canPause: false
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPauseService.getPauseStatus.mockResolvedValue(mockPauseStatus);

      const response = await request(app)
        .get('/api/subscriptions/pause-status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pauseStatus).toMatchObject({
        isPaused: true,
        canPause: false
      });
      expect(response.body.pauseStatus.currentPause).toMatchObject({
        id: 'pause_123',
        reason: 'Vacation',
        daysRemaining: 15
      });
      expect(mockPauseService.getPauseStatus).toHaveBeenCalledWith('sub_123');
    });

    it('should handle user with no subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_123',
        subscription: null
      });

      const response = await request(app)
        .get('/api/subscriptions/pause-status');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No subscription found');
    });

    it('should handle service errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPauseService.getPauseStatus.mockRejectedValue(new Error('Status error'));

      const response = await request(app)
        .get('/api/subscriptions/pause-status');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Status error');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for pause endpoint', async () => {
      // Mock auth to reject
      vi.mocked(auth).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .send({
          durationMonths: 1,
          reason: 'Test'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for resume endpoint', async () => {
      // Mock auth to reject
      vi.mocked(auth).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/subscriptions/resume');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should require authentication for pause-status endpoint', async () => {
      // Mock auth to reject
      vi.mocked(auth).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/subscriptions/pause-status');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});