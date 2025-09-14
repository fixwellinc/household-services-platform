import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PaymentMethodService from '../services/paymentMethodService.js';

// Mock Stripe
const mockStripe = {
  paymentMethods: {
    attach: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
    detach: vi.fn(),
  },
  customers: {
    update: vi.fn(),
  },
  subscriptions: {
    update: vi.fn(),
  },
  paymentIntents: {
    confirm: vi.fn(),
  },
};

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  subscription: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

// Mock services
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

vi.mock('../services/email.js', () => ({
  default: {
    sendEmail: vi.fn(),
  },
}));

vi.mock('../services/sms.js', () => ({
  default: {
    sendChatNotification: vi.fn(),
  },
}));

describe('PaymentMethodService', () => {
  let paymentMethodService;
  let mockEmailService;
  let mockSmsService;

  beforeEach(async () => {
    // Import mocked services
    const emailService = await import('../services/email.js');
    const smsService = await import('../services/sms.js');
    
    mockEmailService = emailService.default;
    mockSmsService = smsService.default;

    paymentMethodService = new PaymentMethodService(mockPrisma);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updatePaymentMethod', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      subscription: {
        id: 'sub-1',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      },
    };

    const mockPaymentMethod = {
      id: 'pm_123',
      type: 'card',
      card: {
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
        brand: 'visa',
      },
    };

    it('should successfully update payment method', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.attach.mockResolvedValue({});
      mockStripe.customers.update.mockResolvedValue({});
      mockStripe.subscriptions.update.mockResolvedValue({});
      mockStripe.paymentMethods.retrieve.mockResolvedValue(mockPaymentMethod);

      const result = await paymentMethodService.updatePaymentMethod('user-1', 'pm_123');

      expect(result.success).toBe(true);
      expect(result.paymentMethod.id).toBe('pm_123');
      expect(result.paymentMethod.last4).toBe('4242');
      expect(result.paymentMethod.brand).toBe('visa');

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_123', {
        customer: 'cus_123',
      });
      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_123', {
        invoice_settings: {
          default_payment_method: 'pm_123',
        },
      });
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        default_payment_method: 'pm_123',
      });
    });

    it('should handle user not found error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await paymentMethodService.updatePaymentMethod('user-1', 'pm_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User or subscription not found');
    });

    it('should handle Stripe API errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.attach.mockRejectedValue(new Error('Invalid payment method'));

      const result = await paymentMethodService.updatePaymentMethod('user-1', 'pm_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid payment method');
    });
  });

  describe('getPaymentMethods', () => {
    const mockUser = {
      id: 'user-1',
      subscription: {
        stripeCustomerId: 'cus_123',
      },
    };

    const mockPaymentMethods = {
      data: [
        {
          id: 'pm_1',
          type: 'card',
          card: {
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
            brand: 'visa',
          },
        },
        {
          id: 'pm_2',
          type: 'card',
          card: {
            last4: '1234',
            exp_month: 6,
            exp_year: 2024,
            brand: 'mastercard',
          },
        },
      ],
    };

    it('should retrieve payment methods successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await paymentMethodService.getPaymentMethods('user-1');

      expect(result.success).toBe(true);
      expect(result.paymentMethods).toHaveLength(2);
      expect(result.paymentMethods[0].id).toBe('pm_1');
      expect(result.paymentMethods[0].last4).toBe('4242');
      expect(result.paymentMethods[1].id).toBe('pm_2');
      expect(result.paymentMethods[1].last4).toBe('1234');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        type: 'card',
      });
    });

    it('should identify expiring cards', async () => {
      // Mock a card expiring soon
      const expiringCardMethods = {
        data: [
          {
            id: 'pm_1',
            type: 'card',
            card: {
              last4: '4242',
              exp_month: new Date().getMonth() + 1, // Next month
              exp_year: new Date().getFullYear(),
              brand: 'visa',
            },
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.list.mockResolvedValue(expiringCardMethods);

      const result = await paymentMethodService.getPaymentMethods('user-1');

      expect(result.success).toBe(true);
      expect(result.paymentMethods[0].isExpiringSoon).toBe(true);
    });
  });

  describe('removePaymentMethod', () => {
    const mockUser = {
      id: 'user-1',
      subscription: {
        stripeCustomerId: 'cus_123',
      },
    };

    it('should remove payment method successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [{ id: 'pm_1' }, { id: 'pm_2' }], // Multiple payment methods
      });
      mockStripe.paymentMethods.detach.mockResolvedValue({});

      const result = await paymentMethodService.removePaymentMethod('user-1', 'pm_1');

      expect(result.success).toBe(true);
      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith('pm_1');
    });

    it('should prevent removing the only payment method', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [{ id: 'pm_1' }], // Only one payment method
      });

      const result = await paymentMethodService.removePaymentMethod('user-1', 'pm_1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot remove the only payment method');
      expect(mockStripe.paymentMethods.detach).not.toHaveBeenCalled();
    });
  });

  describe('monitorExpiringPaymentMethods', () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        stripeCustomerId: 'cus_123',
        user: { id: 'user-1', email: 'test1@example.com', name: 'User 1' },
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        stripeCustomerId: 'cus_456',
        user: { id: 'user-2', email: 'test2@example.com', name: 'User 2' },
      },
    ];

    it('should monitor and send reminders for expiring cards', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);
      
      // Mock expiring card for first customer
      mockStripe.paymentMethods.list
        .mockResolvedValueOnce({
          data: [
            {
              id: 'pm_1',
              card: {
                last4: '4242',
                exp_month: new Date().getMonth() + 1,
                exp_year: new Date().getFullYear(),
                brand: 'visa',
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [], // No cards for second customer
        });

      // Mock user lookup for expiration reminder
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test1@example.com',
        name: 'User 1',
        subscription: { tier: 'HOMECARE' }
      });

      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      const result = await paymentMethodService.monitorExpiringPaymentMethods();

      expect(result.success).toBe(true);
      expect(result.expiringCardsFound).toBe(1);
      expect(result.remindersSent).toBe(1);
    });

    it('should handle errors gracefully for individual subscriptions', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);
      
      // First call succeeds, second call fails
      mockStripe.paymentMethods.list
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(new Error('Stripe API error'));

      const result = await paymentMethodService.monitorExpiringPaymentMethods();

      expect(result.success).toBe(true);
      expect(result.expiringCardsFound).toBe(0);
    });
  });

  describe('sendExpirationReminder', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      notifications: { sms: true },
      subscription: { tier: 'HOMECARE' },
    };

    const mockCardData = {
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2024,
      daysUntilExpiry: 5,
    };

    it('should send expiration reminder email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      const result = await paymentMethodService.sendExpirationReminder('user-1', mockCardData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.urgency).toBe('URGENT'); // 5 days is urgent
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('URGENT'),
        })
      );
    });

    it('should send SMS for urgent reminders', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });
      mockSmsService.sendChatNotification.mockResolvedValue({ success: true });

      const result = await paymentMethodService.sendExpirationReminder('user-1', mockCardData);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(mockSmsService.sendChatNotification).toHaveBeenCalledWith(
        '+1234567890',
        'Fixwell Services',
        expect.stringContaining('URGENT'),
        'card-expiration'
      );
    });

    it('should determine correct urgency levels', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      // Test URGENT (≤7 days)
      const urgentCard = { ...mockCardData, daysUntilExpiry: 5 };
      const urgentResult = await paymentMethodService.sendExpirationReminder('user-1', urgentCard);
      expect(urgentResult.urgency).toBe('URGENT');

      // Test HIGH (≤14 days)
      const highCard = { ...mockCardData, daysUntilExpiry: 10 };
      const highResult = await paymentMethodService.sendExpirationReminder('user-1', highCard);
      expect(highResult.urgency).toBe('HIGH');

      // Test NORMAL (>14 days)
      const normalCard = { ...mockCardData, daysUntilExpiry: 20 };
      const normalResult = await paymentMethodService.sendExpirationReminder('user-1', normalCard);
      expect(normalResult.urgency).toBe('NORMAL');
    });
  });

  describe('retryFailedPayment', () => {
    const mockUser = {
      id: 'user-1',
      subscription: {
        id: 'sub-1',
      },
    };

    const mockRetryData = {
      attemptNumber: 1,
      lastFailureReason: 'Insufficient funds',
      paymentIntentId: 'pi_123',
    };

    it('should successfully retry payment', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentIntents.confirm.mockResolvedValue({ status: 'succeeded' });
      mockPrisma.subscription.update.mockResolvedValue({});

      const result = await paymentMethodService.retryFailedPayment('user-1', mockRetryData);

      expect(result.success).toBe(true);
      expect(result.attemptNumber).toBe(1);
      expect(result.nextRetryDate).toBeNull();
      expect(result.shouldSuspend).toBe(false);

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'ACTIVE',
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null,
        },
      });
    });

    it('should handle failed retry and schedule next attempt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        status: 'failed',
        last_payment_error: { message: 'Card declined' },
      });

      const result = await paymentMethodService.retryFailedPayment('user-1', mockRetryData);

      expect(result.success).toBe(false);
      expect(result.attemptNumber).toBe(1);
      expect(result.nextRetryDate).toBeInstanceOf(Date);
      expect(result.shouldSuspend).toBe(false);
    });

    it('should indicate suspension after max retry attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const maxRetryData = { ...mockRetryData, attemptNumber: 4 }; // Exceeds max attempts (3)
      const result = await paymentMethodService.retryFailedPayment('user-1', maxRetryData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum retry attempts exceeded');
      expect(result.shouldSuspend).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should correctly identify expiring cards', () => {
      const now = new Date();
      const nextMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Card expiring next month should be flagged
      expect(paymentMethodService._isCardExpiringSoon(nextMonth, currentYear)).toBe(true);

      // Card expiring in 6 months should not be flagged
      const futureMonth = (now.getMonth() + 6) % 12 + 1;
      const futureYear = now.getMonth() + 6 >= 12 ? currentYear + 1 : currentYear;
      expect(paymentMethodService._isCardExpiringSoon(futureMonth, futureYear)).toBe(false);
    });

    it('should calculate days until expiry correctly', () => {
      const now = new Date();
      // Use a future date that's definitely in the future
      const futureMonth = now.getMonth() + 2; // 2 months from now
      const futureYear = futureMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
      const adjustedMonth = futureMonth > 12 ? futureMonth - 12 : futureMonth;

      const days = paymentMethodService._getDaysUntilExpiry(adjustedMonth, futureYear);
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThan(70); // Should be within 2 months
    });

    it('should calculate next retry date correctly', () => {
      const retrySchedule = [1, 3, 7]; // Days between retries

      // First attempt should retry in 1 day
      const firstRetry = paymentMethodService._calculateNextRetryDate(1);
      const expectedFirst = new Date();
      expectedFirst.setDate(expectedFirst.getDate() + 1);
      expect(firstRetry.getDate()).toBe(expectedFirst.getDate());

      // Second attempt should retry in 3 days
      const secondRetry = paymentMethodService._calculateNextRetryDate(2);
      const expectedSecond = new Date();
      expectedSecond.setDate(expectedSecond.getDate() + 3);
      expect(secondRetry.getDate()).toBe(expectedSecond.getDate());

      // Fourth attempt should use last schedule value (7 days)
      const fourthRetry = paymentMethodService._calculateNextRetryDate(4);
      const expectedFourth = new Date();
      expectedFourth.setDate(expectedFourth.getDate() + 7);
      expect(fourthRetry.getDate()).toBe(expectedFourth.getDate());
    });
  });

  describe('Email Generation', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should generate expiration reminder email with correct urgency', () => {
      const cardData = {
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2024,
        daysUntilExpiry: 5,
        urgency: 'URGENT',
        tier: 'HOMECARE',
      };

      const html = paymentMethodService._generateExpirationReminderEmail(mockUser, cardData);

      expect(html).toContain('Test User');
      expect(html).toContain('visa');
      expect(html).toContain('4242');
      expect(html).toContain('12/2024');
      expect(html).toContain('5');
      expect(html).toContain('URGENT');
      expect(html).toContain('#dc3545'); // Urgent color
    });

    it('should generate payment recovery email', () => {
      const mockUserWithSub = {
        ...mockUser,
        subscription: {
          currentPeriodEnd: new Date('2024-02-15'),
        },
      };

      const html = paymentMethodService._generatePaymentRecoveryEmail(mockUserWithSub);

      expect(html).toContain('Test User');
      expect(html).toContain('Payment Successful');
      expect(html).toContain('Active');
    });
  });
});