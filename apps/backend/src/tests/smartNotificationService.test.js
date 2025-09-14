import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SmartNotificationService from '../services/smartNotificationService.js';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  subscription: {
    update: vi.fn(),
  },
};

// Mock email service
vi.mock('../services/email.js', () => ({
  default: {
    sendEmail: vi.fn(),
  },
}));

// Mock SMS service
vi.mock('../services/sms.js', () => ({
  default: {
    sendChatNotification: vi.fn(),
  },
}));

// Mock notification service
vi.mock('../services/notificationService.js', () => ({
  default: {
    sendPaymentFailureNotification: vi.fn(),
  },
}));

describe('SmartNotificationService', () => {
  let smartNotificationService;
  let mockEmailService;
  let mockSmsService;
  let mockNotificationService;

  beforeEach(async () => {
    // Import mocked services
    const emailService = await import('../services/email.js');
    const smsService = await import('../services/sms.js');
    const notificationService = await import('../services/notificationService.js');
    
    mockEmailService = emailService.default;
    mockSmsService = smsService.default;
    mockNotificationService = notificationService.default;

    smartNotificationService = new SmartNotificationService(mockPrisma);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendPaymentReminder', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      notifications: { sms: true, email: true },
      subscription: {
        id: 'sub-1',
        tier: 'HOMECARE',
      },
    };

    const mockReminderData = {
      daysUntilDue: 3,
      amount: 59.99,
      dueDate: new Date('2024-01-15'),
    };

    it('should send email reminder for normal urgency', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: 'email-123' });

      const result = await smartNotificationService.sendPaymentReminder('user-1', mockReminderData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(false);
      expect(result.urgency).toBe('NORMAL');
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Payment Reminder'),
        })
      );
    });

    it('should send both email and SMS for urgent reminders', async () => {
      const urgentReminderData = { ...mockReminderData, daysUntilDue: 0 };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: 'email-123' });
      mockSmsService.sendChatNotification.mockResolvedValue({ success: true, sid: 'sms-123' });

      const result = await smartNotificationService.sendPaymentReminder('user-1', urgentReminderData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.urgency).toBe('URGENT');
      expect(mockSmsService.sendChatNotification).toHaveBeenCalledWith(
        '+1234567890',
        'Fixwell Services',
        expect.stringContaining('URGENT'),
        'payment-reminder'
      );
    });

    it('should handle user not found error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await smartNotificationService.sendPaymentReminder('user-1', mockReminderData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User or subscription not found');
    });

    it('should determine correct urgency levels', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      // Test HIGH urgency (1-3 days)
      const highUrgencyData = { ...mockReminderData, daysUntilDue: 2 };
      const highResult = await smartNotificationService.sendPaymentReminder('user-1', highUrgencyData);
      expect(highResult.urgency).toBe('HIGH');

      // Test URGENT urgency (0-1 days)
      const urgentData = { ...mockReminderData, daysUntilDue: 1 };
      const urgentResult = await smartNotificationService.sendPaymentReminder('user-1', urgentData);
      expect(urgentResult.urgency).toBe('URGENT');

      // Test NORMAL urgency (>3 days)
      const normalData = { ...mockReminderData, daysUntilDue: 7 };
      const normalResult = await smartNotificationService.sendPaymentReminder('user-1', normalData);
      expect(normalResult.urgency).toBe('NORMAL');
    });
  });

  describe('handlePaymentFailure', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      subscription: {
        id: 'sub-1',
        tier: 'HOMECARE',
      },
    };

    const mockFailureData = {
      attemptNumber: 1,
      lastFailureReason: 'Insufficient funds',
      nextRetryDate: new Date('2024-01-10'),
    };

    it('should handle payment failure and update subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscription.update.mockResolvedValue({ id: 'sub-1' });
      mockNotificationService.sendPaymentFailureNotification.mockResolvedValue({ success: true });

      const result = await smartNotificationService.handlePaymentFailure('user-1', mockFailureData);

      expect(result.success).toBe(true);
      expect(result.gracePeriodEnd).toBeInstanceOf(Date);
      expect(result.notificationSent).toBe(true);
      
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          isPaused: true,
          status: 'PAST_DUE',
          pauseStartDate: expect.any(Date),
          pauseEndDate: expect.any(Date),
        }),
      });
    });

    it('should calculate correct grace period end date', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscription.update.mockResolvedValue({ id: 'sub-1' });
      mockNotificationService.sendPaymentFailureNotification.mockResolvedValue({ success: true });

      const result = await smartNotificationService.handlePaymentFailure('user-1', mockFailureData);

      const expectedGracePeriodEnd = new Date();
      expectedGracePeriodEnd.setDate(expectedGracePeriodEnd.getDate() + 7);
      
      expect(result.gracePeriodEnd.getDate()).toBe(expectedGracePeriodEnd.getDate());
    });
  });

  describe('sendUpgradeSuggestion', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      subscription: {
        id: 'sub-1',
        tier: 'STARTER',
      },
      subscriptionUsage: {
        priorityBookingCount: 8,
      },
    };

    const mockUsageData = {
      currentUsage: 8,
      planLimit: 10,
      utilizationRate: 0.85,
      suggestedTier: 'HOMECARE',
      potentialSavings: 15.99,
    };

    it('should send upgrade suggestion for high utilization', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: 'email-123' });

      const result = await smartNotificationService.sendUpgradeSuggestion('user-1', mockUsageData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.suggestedTier).toBe('HOMECARE');
      expect(result.potentialSavings).toBe(15.99);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Upgrade to HOMECARE Plan'),
        })
      );
    });

    it('should not send upgrade suggestion for low utilization', async () => {
      const lowUsageData = { ...mockUsageData, utilizationRate: 0.5 };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await smartNotificationService.sendUpgradeSuggestion('user-1', lowUsageData);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Upgrade not recommended');
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should not send upgrade suggestion without suggested tier', async () => {
      const noTierData = { ...mockUsageData, suggestedTier: null };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await smartNotificationService.sendUpgradeSuggestion('user-1', noTierData);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Upgrade not recommended');
    });
  });

  describe('sendEngagementReminder', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      subscription: {
        id: 'sub-1',
        tier: 'HOMECARE',
      },
    };

    const mockEngagementData = {
      daysSinceLastService: 45,
      suggestedServices: ['Gutter Cleaning', 'HVAC Filter Change', 'Caulking Touch-up'],
      tier: 'HOMECARE',
    };

    it('should send engagement reminder for inactive users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: 'email-123' });

      const result = await smartNotificationService.sendEngagementReminder('user-1', mockEngagementData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.daysSinceLastService).toBe(45);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('We Miss You'),
        })
      );
    });

    it('should include suggested services in email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      await smartNotificationService.sendEngagementReminder('user-1', mockEngagementData);

      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Gutter Cleaning');
      expect(emailCall.html).toContain('HVAC Filter Change');
      expect(emailCall.html).toContain('Caulking Touch-up');
    });
  });

  describe('_scheduleEscalatingNotifications', () => {
    it('should calculate correct escalation schedule', async () => {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

      const scheduleData = {
        gracePeriodEnd,
        attemptNumber: 1,
        tier: 'HOMECARE',
      };

      const result = await smartNotificationService._scheduleEscalatingNotifications('user-1', scheduleData);

      expect(result.midGracePeriodNotification).toBeInstanceOf(Date);
      expect(result.lateGracePeriodNotification).toBeInstanceOf(Date);
      expect(result.finalNotification).toEqual(gracePeriodEnd);
      
      // Mid grace period should be around 3.5 days from now
      const expectedMid = new Date();
      expectedMid.setDate(expectedMid.getDate() + 3.5);
      expect(Math.abs(result.midGracePeriodNotification - expectedMid)).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
    });
  });

  describe('Email Generation Methods', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should generate payment reminder email with correct urgency styling', () => {
      const reminderData = {
        daysUntilDue: 0,
        amount: 59.99,
        dueDate: new Date('2024-01-15'),
        urgency: 'URGENT',
        tier: 'HOMECARE',
      };

      const html = smartNotificationService._generatePaymentReminderEmail(mockUser, reminderData);

      expect(html).toContain('Test User');
      expect(html).toContain('URGENT');
      expect(html).toContain('$59.99');
      expect(html).toContain('HOMECARE');
      expect(html).toContain('#dc3545'); // Urgent color
    });

    it('should generate upgrade email with usage statistics', () => {
      const upgradeData = {
        currentTier: 'STARTER',
        suggestedTier: 'HOMECARE',
        currentUsage: 8,
        planLimit: 10,
        utilizationRate: 0.8,
        potentialSavings: 15.99,
      };

      const html = smartNotificationService._generateUpgradeEmail(mockUser, upgradeData);

      expect(html).toContain('Test User');
      expect(html).toContain('STARTER');
      expect(html).toContain('HOMECARE');
      expect(html).toContain('8/10');
      expect(html).toContain('80%');
      expect(html).toContain('$15.99');
    });

    it('should generate engagement email with suggested services', () => {
      const engagementData = {
        daysSinceLastService: 45,
        suggestedServices: ['Service 1', 'Service 2'],
        tier: 'HOMECARE',
      };

      const html = smartNotificationService._generateEngagementEmail(mockUser, engagementData);

      expect(html).toContain('Test User');
      expect(html).toContain('45 days');
      expect(html).toContain('Service 1');
      expect(html).toContain('Service 2');
      expect(html).toContain('HOMECARE');
    });
  });

  describe('_getPaymentReminderSubject', () => {
    it('should return correct subject for different urgency levels', () => {
      expect(smartNotificationService._getPaymentReminderSubject(0, 'URGENT'))
        .toBe('URGENT: Payment Due Today - Fixwell Services');
      
      expect(smartNotificationService._getPaymentReminderSubject(1, 'URGENT'))
        .toBe('URGENT: Payment Due Tomorrow - Fixwell Services');
      
      expect(smartNotificationService._getPaymentReminderSubject(2, 'HIGH'))
        .toBe('Important: Payment Due in 2 Days - Fixwell Services');
      
      expect(smartNotificationService._getPaymentReminderSubject(7, 'NORMAL'))
        .toBe('Payment Reminder: Due in 7 Days - Fixwell Services');
    });
  });
});