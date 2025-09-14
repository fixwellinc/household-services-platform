import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import subscriptionPauseService from '../services/subscriptionPauseService.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn()
    },
    subscriptionPause: {
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn()
    },
    booking: {
      count: vi.fn()
    }
  }
}));

vi.mock('../services/stripe.js', () => ({
  pauseSubscription: vi.fn(),
  resumeSubscription: vi.fn()
}));

vi.mock('../services/notificationService.js', () => ({
  default: {
    sendPauseConfirmation: vi.fn(),
    sendResumeConfirmation: vi.fn()
  }
}));

describe('SubscriptionPauseService', () => {
  let mockPrisma;
  let mockStripe;
  let mockNotificationService;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get mocked modules
    const { default: prisma } = await import('../config/database.js');
    const stripe = await import('../services/stripe.js');
    const { default: notificationService } = await import('../services/notificationService.js');
    
    mockPrisma = prisma;
    mockStripe = stripe;
    mockNotificationService = notificationService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('pauseSubscription', () => {
    const mockSubscription = {
      id: 'sub_123',
      userId: 'user_123',
      status: 'ACTIVE',
      isPaused: false,
      tier: 'HOMECARE',
      stripeSubscriptionId: 'stripe_sub_123',
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      },
      subscriptionPauses: []
    };

    it('should successfully pause a subscription', async () => {
      // Setup mocks
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.subscriptionPause.create.mockResolvedValue({
        id: 'pause_123',
        subscriptionId: 'sub_123',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason: 'Vacation',
        status: 'ACTIVE'
      });
      mockPrisma.subscription.update.mockResolvedValue(mockSubscription);
      mockStripe.pauseSubscription.mockResolvedValue({ id: 'stripe_sub_123', status: 'paused' });
      mockNotificationService.sendPauseConfirmation.mockResolvedValue({ success: true });

      const result = await subscriptionPauseService.pauseSubscription('sub_123', 1, 'Vacation');

      expect(result).toMatchObject({
        durationMonths: 1,
        reason: 'Vacation',
        message: 'Subscription paused successfully'
      });
      expect(mockPrisma.subscriptionPause.create).toHaveBeenCalled();
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
      expect(mockStripe.pauseSubscription).toHaveBeenCalled();
      expect(mockNotificationService.sendPauseConfirmation).toHaveBeenCalled();
    });

    it('should reject pause duration outside 1-6 months range', async () => {
      await expect(subscriptionPauseService.pauseSubscription('sub_123', 0, 'Invalid'))
        .rejects.toThrow('Pause duration must be between 1 and 6 months');

      await expect(subscriptionPauseService.pauseSubscription('sub_123', 7, 'Invalid'))
        .rejects.toThrow('Pause duration must be between 1 and 6 months');
    });

    it('should reject pausing non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(subscriptionPauseService.pauseSubscription('sub_nonexistent', 1))
        .rejects.toThrow('Subscription not found');
    });

    it('should reject pausing already paused subscription', async () => {
      const pausedSubscription = {
        ...mockSubscription,
        isPaused: true,
        subscriptionPauses: [{ id: 'pause_existing', status: 'ACTIVE' }]
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(pausedSubscription);

      await expect(subscriptionPauseService.pauseSubscription('sub_123', 1))
        .rejects.toThrow('Subscription is already paused');
    });

    it('should reject pausing inactive subscription', async () => {
      const inactiveSubscription = {
        ...mockSubscription,
        status: 'CANCELLED'
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(inactiveSubscription);

      await expect(subscriptionPauseService.pauseSubscription('sub_123', 1))
        .rejects.toThrow('Only active subscriptions can be paused');
    });

    it('should reject pausing subscription with active bookings', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.booking.count.mockResolvedValue(2); // Has active bookings

      await expect(subscriptionPauseService.pauseSubscription('sub_123', 1))
        .rejects.toThrow('Cannot pause subscription with active service appointments');
    });

    it('should continue with pause even if Stripe fails', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.subscriptionPause.create.mockResolvedValue({
        id: 'pause_123',
        subscriptionId: 'sub_123',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reason: null,
        status: 'ACTIVE'
      });
      mockPrisma.subscription.update.mockResolvedValue(mockSubscription);
      mockStripe.pauseSubscription.mockRejectedValue(new Error('Stripe error'));
      mockNotificationService.sendPauseConfirmation.mockResolvedValue({ success: true });

      const result = await subscriptionPauseService.pauseSubscription('sub_123', 1);

      expect(result.message).toBe('Subscription paused successfully');
      expect(mockPrisma.subscriptionPause.create).toHaveBeenCalled();
    });
  });

  describe('resumeSubscription', () => {
    const mockPausedSubscription = {
      id: 'sub_123',
      userId: 'user_123',
      status: 'ACTIVE',
      isPaused: true,
      tier: 'HOMECARE',
      stripeSubscriptionId: 'stripe_sub_123',
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      },
      subscriptionPauses: [{
        id: 'pause_123',
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
      }]
    };

    it('should successfully resume a paused subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(mockPausedSubscription);
      mockPrisma.subscriptionPause.update.mockResolvedValue({});
      mockPrisma.subscription.update.mockResolvedValue({});
      mockStripe.resumeSubscription.mockResolvedValue({ id: 'stripe_sub_123', status: 'active' });
      mockNotificationService.sendResumeConfirmation.mockResolvedValue({ success: true });

      const result = await subscriptionPauseService.resumeSubscription('sub_123');

      expect(result.message).toBe('Subscription resumed successfully');
      expect(mockPrisma.subscriptionPause.update).toHaveBeenCalledWith({
        where: { id: 'pause_123' },
        data: { status: 'COMPLETED' }
      });
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub_123' },
        data: {
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null,
          status: 'ACTIVE'
        }
      });
    });

    it('should reject resuming non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(subscriptionPauseService.resumeSubscription('sub_nonexistent'))
        .rejects.toThrow('Subscription not found');
    });

    it('should reject resuming non-paused subscription', async () => {
      const activeSubscription = {
        ...mockPausedSubscription,
        isPaused: false,
        subscriptionPauses: []
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);

      await expect(subscriptionPauseService.resumeSubscription('sub_123'))
        .rejects.toThrow('Subscription is not currently paused');
    });

    it('should continue with resume even if Stripe fails', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(mockPausedSubscription);
      mockPrisma.subscriptionPause.update.mockResolvedValue({});
      mockPrisma.subscription.update.mockResolvedValue({});
      mockStripe.resumeSubscription.mockRejectedValue(new Error('Stripe error'));
      mockNotificationService.sendResumeConfirmation.mockResolvedValue({ success: true });

      const result = await subscriptionPauseService.resumeSubscription('sub_123');

      expect(result.message).toBe('Subscription resumed successfully');
    });
  });

  describe('getPauseStatus', () => {
    it('should return pause status for subscription', async () => {
      const subscriptionWithPauses = {
        id: 'sub_123',
        isPaused: true,
        subscriptionPauses: [
          {
            id: 'pause_active',
            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            reason: 'Vacation',
            status: 'ACTIVE'
          },
          {
            id: 'pause_completed',
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            reason: 'Travel',
            status: 'COMPLETED'
          }
        ]
      };

      mockPrisma.subscription.findUnique.mockResolvedValue(subscriptionWithPauses);

      const result = await subscriptionPauseService.getPauseStatus('sub_123');

      expect(result.isPaused).toBe(true);
      expect(result.currentPause).toMatchObject({
        id: 'pause_active',
        reason: 'Vacation'
      });
      expect(result.pauseHistory).toHaveLength(2);
      expect(result.canPause).toBe(false);
    });

    it('should return status for non-paused subscription', async () => {
      const activeSubscription = {
        id: 'sub_123',
        isPaused: false,
        status: 'ACTIVE',
        subscriptionPauses: []
      };

      mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);

      const result = await subscriptionPauseService.getPauseStatus('sub_123');

      expect(result.isPaused).toBe(false);
      expect(result.currentPause).toBeNull();
      expect(result.pauseHistory).toHaveLength(0);
      expect(result.canPause).toBe(true);
    });
  });

  describe('validatePauseEligibility', () => {
    it('should validate subscription with no active bookings', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        user: { subscriptionUsage: null }
      });
      mockPrisma.booking.count.mockResolvedValue(0);

      const result = await subscriptionPauseService.validatePauseEligibility('sub_123');

      expect(result).toBe(true);
    });

    it('should reject subscription with active bookings', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        user: { subscriptionUsage: null }
      });
      mockPrisma.booking.count.mockResolvedValue(2);

      await expect(subscriptionPauseService.validatePauseEligibility('sub_123'))
        .rejects.toThrow('Cannot pause subscription with active service appointments');
    });
  });

  describe('processAutomaticResumes', () => {
    it('should process subscriptions ready for resume', async () => {
      const subscriptionsToResume = [
        {
          id: 'sub_1',
          isPaused: true,
          pauseEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          subscriptionPauses: [{ status: 'ACTIVE' }]
        },
        {
          id: 'sub_2',
          isPaused: true,
          pauseEndDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          subscriptionPauses: [{ status: 'ACTIVE' }]
        }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptionsToResume);
      
      // Mock the resume calls for each subscription
      subscriptionsToResume.forEach(sub => {
        mockPrisma.subscription.findUnique
          .mockResolvedValueOnce({
            ...sub,
            user: { email: 'test@example.com', name: 'Test User' },
            stripeSubscriptionId: 'stripe_sub_123'
          });
        mockPrisma.subscriptionPause.update.mockResolvedValueOnce({});
        mockPrisma.subscription.update.mockResolvedValueOnce({});
      });

      mockStripe.resumeSubscription.mockResolvedValue({ status: 'active' });
      mockNotificationService.sendResumeConfirmation.mockResolvedValue({ success: true });

      const result = await subscriptionPauseService.processAutomaticResumes();

      expect(result.processed).toBe(2);
      expect(result.message).toBe('Processed 2 automatic resumes');
    });
  });

  describe('utility methods', () => {
    it('should calculate days remaining correctly', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      const result = subscriptionPauseService.calculateDaysRemaining(futureDate);
      expect(result).toBe(5);
    });

    it('should return 0 for past dates', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const result = subscriptionPauseService.calculateDaysRemaining(pastDate);
      expect(result).toBe(0);
    });

    it('should calculate pause duration correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = subscriptionPauseService.calculatePauseDuration(startDate, endDate);
      expect(result).toBe(30);
    });

    it('should check if date is within specified days', () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

      expect(subscriptionPauseService.isWithinDays(recentDate, 30)).toBe(true);
      expect(subscriptionPauseService.isWithinDays(oldDate, 30)).toBe(false);
    });
  });

  describe('getPauseStatistics', () => {
    it('should return pause statistics', async () => {
      mockPrisma.subscriptionPause.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // active
        .mockResolvedValueOnce(7); // completed

      mockPrisma.subscriptionPause.findMany.mockResolvedValue([
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        },
        {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-15')
        }
      ]);

      const result = await subscriptionPauseService.getPauseStatistics();

      expect(result).toMatchObject({
        totalPauses: 10,
        activePauses: 3,
        completedPauses: 7,
        averageDurationDays: 22, // (30 + 14) / 2 = 22
        pauseRate: '30.00'
      });
    });
  });
});