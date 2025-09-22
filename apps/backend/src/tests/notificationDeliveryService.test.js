import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import notificationDeliveryService from '../services/notificationDeliveryService.js';
import notificationPreferenceService from '../services/notificationPreferenceService.js';
import appointmentNotificationService from '../services/appointmentNotificationService.js';
import smsService from '../services/sms.js';
import prisma from '../config/database.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    notificationDelivery: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    notificationTemplate: {
      findFirst: vi.fn(),
    }
  }
}));

vi.mock('../services/notificationPreferenceService.js', () => ({
  default: {
    shouldReceiveNotification: vi.fn(),
    getDeliverySettings: vi.fn(),
    getUserPreferences: vi.fn(),
    getAdminNotificationRecipients: vi.fn(),
  }
}));

vi.mock('../services/appointmentNotificationService.js', () => ({
  default: {
    sendEmail: vi.fn(),
  }
}));

vi.mock('../services/sms.js', () => ({
  default: {
    sendSMS: vi.fn(),
  }
}));

describe('NotificationDeliveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send notification when user preferences allow it', async () => {
      const notificationData = {
        userId: 'user123',
        appointmentId: 'apt123',
        type: 'email',
        channel: 'appointment_confirmation',
        recipient: 'user@example.com',
        subject: 'Test Subject',
        content: 'Test Content'
      };

      const mockDelivery = {
        id: 'delivery123',
        ...notificationData,
        status: 'PENDING'
      };

      const mockDeliverySettings = {
        maxRetryAttempts: 3,
        retryIntervalMinutes: 30
      };

      notificationPreferenceService.shouldReceiveNotification.mockResolvedValue(true);
      notificationPreferenceService.getDeliverySettings.mockResolvedValue(mockDeliverySettings);
      prisma.notificationDelivery.create.mockResolvedValue(mockDelivery);
      prisma.notificationDelivery.update.mockResolvedValue({ ...mockDelivery, status: 'SENT' });
      appointmentNotificationService.sendEmail.mockResolvedValue(true);

      const result = await notificationDeliveryService.sendNotification(notificationData);

      expect(result).toEqual(mockDelivery);
      expect(notificationPreferenceService.shouldReceiveNotification).toHaveBeenCalledWith(
        'user123',
        'appointment_confirmation',
        'email'
      );
      expect(prisma.notificationDelivery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          type: 'email',
          status: 'PENDING',
          maxAttempts: 3
        })
      });
    });

    it('should skip notification when user preferences disallow it', async () => {
      const notificationData = {
        userId: 'user123',
        type: 'email',
        channel: 'appointment_confirmation',
        recipient: 'user@example.com',
        content: 'Test Content'
      };

      notificationPreferenceService.shouldReceiveNotification.mockResolvedValue(false);

      const result = await notificationDeliveryService.sendNotification(notificationData);

      expect(result).toBeNull();
      expect(prisma.notificationDelivery.create).not.toHaveBeenCalled();
    });

    it('should validate required notification data', async () => {
      const invalidData = {
        userId: 'user123',
        // Missing required fields
      };

      await expect(
        notificationDeliveryService.sendNotification(invalidData)
      ).rejects.toThrow('type is required');
    });

    it('should validate email format for email notifications', async () => {
      const invalidData = {
        userId: 'user123',
        type: 'email',
        channel: 'test',
        recipient: 'invalid-email',
        content: 'test'
      };

      await expect(
        notificationDeliveryService.sendNotification(invalidData)
      ).rejects.toThrow('Invalid email address');
    });
  });

  describe('sendAppointmentNotification', () => {
    it('should send email notification with fallback to SMS', async () => {
      const appointmentData = {
        id: 'apt123',
        customerId: 'user123',
        customerEmail: 'user@example.com',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        serviceType: 'Plumbing',
        scheduledDate: new Date(),
        propertyAddress: '123 Main St'
      };

      const mockPreferences = {
        emailEnabled: true,
        smsEnabled: true
      };

      const mockEmailDelivery = {
        id: 'delivery123',
        type: 'email',
        status: 'SENT'
      };

      notificationPreferenceService.getUserPreferences.mockResolvedValue(mockPreferences);
      prisma.notificationTemplate.findFirst.mockResolvedValue(null); // Use default template
      notificationPreferenceService.shouldReceiveNotification.mockResolvedValue(true);
      notificationPreferenceService.getDeliverySettings.mockResolvedValue({ maxRetryAttempts: 3 });
      prisma.notificationDelivery.create.mockResolvedValue(mockEmailDelivery);
      prisma.notificationDelivery.update.mockResolvedValue({ ...mockEmailDelivery, status: 'SENT' });
      appointmentNotificationService.sendEmail.mockResolvedValue(true);

      const result = await notificationDeliveryService.sendAppointmentNotification(
        appointmentData,
        'appointment_confirmation'
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('email');
      expect(appointmentNotificationService.sendEmail).toHaveBeenCalled();
    });

    it('should fallback to SMS when email fails', async () => {
      const appointmentData = {
        id: 'apt123',
        customerId: 'user123',
        customerEmail: 'user@example.com',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        serviceType: 'Plumbing',
        scheduledDate: new Date(),
        propertyAddress: '123 Main St'
      };

      const mockPreferences = {
        emailEnabled: true,
        smsEnabled: true
      };

      const mockSmsDelivery = {
        id: 'delivery123',
        type: 'sms',
        status: 'SENT'
      };

      notificationPreferenceService.getUserPreferences.mockResolvedValue(mockPreferences);
      prisma.notificationTemplate.findFirst.mockResolvedValue(null);
      
      // Email notification should fail
      notificationPreferenceService.shouldReceiveNotification
        .mockResolvedValueOnce(false) // Email disabled/failed
        .mockResolvedValueOnce(true);  // SMS enabled

      notificationPreferenceService.getDeliverySettings.mockResolvedValue({ maxRetryAttempts: 3 });
      prisma.notificationDelivery.create.mockResolvedValue(mockSmsDelivery);
      prisma.notificationDelivery.update.mockResolvedValue({ ...mockSmsDelivery, status: 'SENT' });
      smsService.sendSMS.mockResolvedValue(true);

      const result = await notificationDeliveryService.sendAppointmentNotification(
        appointmentData,
        'appointment_confirmation'
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('sms');
      expect(smsService.sendSMS).toHaveBeenCalled();
    });
  });

  describe('sendAdminNotification', () => {
    it('should send notifications to eligible admins', async () => {
      const mockAdmins = [
        {
          id: 'admin1',
          email: 'admin1@example.com',
          name: 'Admin One',
          notificationPreferences: {
            emailEnabled: true,
            smsEnabled: false
          }
        },
        {
          id: 'admin2',
          email: 'admin2@example.com',
          name: 'Admin Two',
          phone: '+1234567890',
          notificationPreferences: {
            emailEnabled: false,
            smsEnabled: true
          }
        }
      ];

      const mockDeliveries = [
        { id: 'delivery1', type: 'email', userId: 'admin1' },
        { id: 'delivery2', type: 'sms', userId: 'admin2' }
      ];

      notificationPreferenceService.getAdminNotificationRecipients.mockResolvedValue(mockAdmins);
      prisma.notificationTemplate.findFirst.mockResolvedValue(null);
      notificationPreferenceService.shouldReceiveNotification.mockResolvedValue(true);
      notificationPreferenceService.getDeliverySettings.mockResolvedValue({ maxRetryAttempts: 3 });
      prisma.notificationDelivery.create
        .mockResolvedValueOnce(mockDeliveries[0])
        .mockResolvedValueOnce(mockDeliveries[1]);
      prisma.notificationDelivery.update
        .mockResolvedValueOnce({ ...mockDeliveries[0], status: 'SENT' })
        .mockResolvedValueOnce({ ...mockDeliveries[1], status: 'SENT' });
      appointmentNotificationService.sendEmail.mockResolvedValue(true);
      smsService.sendSMS.mockResolvedValue(true);

      const result = await notificationDeliveryService.sendAdminNotification(
        'new_booking_alert',
        { appointmentId: 'apt123' }
      );

      expect(result).toHaveLength(2);
      expect(appointmentNotificationService.sendEmail).toHaveBeenCalled();
      expect(smsService.sendSMS).toHaveBeenCalled();
    });
  });

  describe('retryFailedNotifications', () => {
    it('should retry failed notifications', async () => {
      const failedDeliveries = [
        {
          id: 'delivery1',
          type: 'email',
          recipient: 'user@example.com',
          content: 'Test',
          attempts: 1,
          maxAttempts: 3
        },
        {
          id: 'delivery2',
          type: 'sms',
          recipient: '+1234567890',
          content: 'Test',
          attempts: 2,
          maxAttempts: 3
        }
      ];

      prisma.notificationDelivery.findMany.mockResolvedValue(failedDeliveries);
      prisma.notificationDelivery.update.mockResolvedValue({});
      appointmentNotificationService.sendEmail.mockResolvedValue(true);
      smsService.sendSMS.mockResolvedValue(true);

      const result = await notificationDeliveryService.retryFailedNotifications();

      expect(result).toBe(2);
      expect(prisma.notificationDelivery.update).toHaveBeenCalledTimes(4); // 2 for attempt update, 2 for final status
    });

    it('should not retry if already processing', async () => {
      // Set processing flag
      notificationDeliveryService.isProcessingRetries = true;

      const result = await notificationDeliveryService.retryFailedNotifications();

      expect(result).toBe(0);
      expect(prisma.notificationDelivery.findMany).not.toHaveBeenCalled();

      // Reset flag
      notificationDeliveryService.isProcessingRetries = false;
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      prisma.notificationDelivery.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // sent
        .mockResolvedValueOnce(15)  // failed
        .mockResolvedValueOnce(3)   // pending
        .mockResolvedValueOnce(2);  // retry

      const result = await notificationDeliveryService.getDeliveryStats();

      expect(result).toEqual({
        total: 100,
        sent: 80,
        failed: 15,
        pending: 3,
        retry: 2,
        successRate: 80,
        failureRate: 15
      });
    });

    it('should handle filters correctly', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'email',
        channel: 'appointment_reminder'
      };

      prisma.notificationDelivery.count.mockResolvedValue(50);

      await notificationDeliveryService.getDeliveryStats(filters);

      expect(prisma.notificationDelivery.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          },
          type: 'email',
          channel: 'appointment_reminder'
        }
      });
    });
  });

  describe('getUserDeliveryHistory', () => {
    it('should return paginated delivery history for a user', async () => {
      const mockDeliveries = [
        {
          id: 'delivery1',
          type: 'email',
          status: 'SENT',
          appointment: {
            id: 'apt1',
            serviceType: 'Plumbing'
          }
        }
      ];

      prisma.notificationDelivery.findMany.mockResolvedValue(mockDeliveries);
      prisma.notificationDelivery.count.mockResolvedValue(25);

      const result = await notificationDeliveryService.getUserDeliveryHistory('user123', {
        page: 2,
        limit: 10
      });

      expect(result).toEqual({
        deliveries: mockDeliveries,
        pagination: {
          page: 2,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true
        }
      });

      expect(prisma.notificationDelivery.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: {
          appointment: {
            select: {
              id: true,
              serviceType: true,
              scheduledDate: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10
      });
    });
  });

  describe('Template rendering', () => {
    it('should use database template when available', async () => {
      const mockTemplate = {
        subject: 'Hello {{customerName}}',
        content: 'Your appointment for {{serviceType}} is confirmed'
      };

      prisma.notificationTemplate.findFirst.mockResolvedValue(mockTemplate);

      const result = await notificationDeliveryService._renderTemplate(
        'appointment_confirmation',
        'email',
        { customerName: 'John', serviceType: 'Plumbing' }
      );

      expect(result).toEqual({
        subject: 'Hello John',
        content: 'Your appointment for Plumbing is confirmed'
      });
    });

    it('should use default template when database template not found', async () => {
      prisma.notificationTemplate.findFirst.mockResolvedValue(null);

      const result = await notificationDeliveryService._renderTemplate(
        'appointment_confirmation',
        'email',
        { customerName: 'John', serviceType: 'Plumbing' }
      );

      expect(result.content).toContain('John');
      expect(result.content).toContain('Plumbing');
      expect(result.subject).toContain('Plumbing');
    });
  });

  describe('Template interpolation', () => {
    it('should interpolate simple variables', () => {
      const template = 'Hello {{name}}, your {{service}} is ready';
      const data = { name: 'John', service: 'repair' };

      const result = notificationDeliveryService._interpolateTemplate(template, data);

      expect(result).toBe('Hello John, your repair is ready');
    });

    it('should interpolate nested variables', () => {
      const template = 'Hello {{user.name}}, your {{appointment.service}} is ready';
      const data = {
        user: { name: 'John' },
        appointment: { service: 'repair' }
      };

      const result = notificationDeliveryService._interpolateTemplate(template, data);

      expect(result).toBe('Hello John, your repair is ready');
    });

    it('should leave unmatched variables unchanged', () => {
      const template = 'Hello {{name}}, your {{unknown}} is ready';
      const data = { name: 'John' };

      const result = notificationDeliveryService._interpolateTemplate(template, data);

      expect(result).toBe('Hello John, your {{unknown}} is ready');
    });
  });

  describe('Validation', () => {
    it('should validate email addresses', () => {
      expect(notificationDeliveryService._isValidEmail('user@example.com')).toBe(true);
      expect(notificationDeliveryService._isValidEmail('invalid-email')).toBe(false);
      expect(notificationDeliveryService._isValidEmail('user@')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(notificationDeliveryService._isValidPhone('+1234567890')).toBe(true);
      expect(notificationDeliveryService._isValidPhone('1234567890')).toBe(true);
      expect(notificationDeliveryService._isValidPhone('+1 (234) 567-8900')).toBe(true);
      expect(notificationDeliveryService._isValidPhone('invalid-phone')).toBe(false);
      expect(notificationDeliveryService._isValidPhone('123')).toBe(false);
    });
  });
});