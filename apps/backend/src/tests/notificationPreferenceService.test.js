import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import notificationPreferenceService from '../services/notificationPreferenceService.js';
import prisma from '../config/database.js';

// Mock Prisma
vi.mock('../config/database.js', () => ({
  default: {
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    }
  }
}));

describe('NotificationPreferenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should return existing preferences for a user', async () => {
      const mockPreferences = {
        id: 'pref123',
        userId: 'user123',
        emailEnabled: true,
        smsEnabled: false,
        appointmentReminder: true
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await notificationPreferenceService.getUserPreferences('user123');

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });

    it('should create default preferences if none exist', async () => {
      const mockDefaultPreferences = {
        id: 'pref123',
        userId: 'user123',
        emailEnabled: true,
        smsEnabled: false,
        appointmentReminder: true
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.notificationPreference.create.mockResolvedValue(mockDefaultPreferences);

      const result = await notificationPreferenceService.getUserPreferences('user123');

      expect(result).toEqual(mockDefaultPreferences);
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true
        })
      });
    });
  });

  describe('updateUserPreferences', () => {
    it('should update existing preferences', async () => {
      const updates = {
        emailEnabled: false,
        smsEnabled: true,
        appointmentReminder: false
      };

      const mockUpdatedPreferences = {
        id: 'pref123',
        userId: 'user123',
        ...updates
      };

      prisma.notificationPreference.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await notificationPreferenceService.updateUserPreferences('user123', updates);

      expect(result).toEqual(mockUpdatedPreferences);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        update: expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Date)
        }),
        create: expect.objectContaining({
          userId: 'user123',
          ...updates
        })
      });
    });

    it('should validate preference updates', async () => {
      const invalidUpdates = {
        emailEnabled: 'not-a-boolean',
        reminderHoursBefore: -5
      };

      await expect(
        notificationPreferenceService.updateUserPreferences('user123', invalidUpdates)
      ).rejects.toThrow('emailEnabled must be a boolean value');
    });

    it('should validate number ranges', async () => {
      const invalidUpdates = {
        reminderHoursBefore: 200 // Too high
      };

      await expect(
        notificationPreferenceService.updateUserPreferences('user123', invalidUpdates)
      ).rejects.toThrow('reminderHoursBefore must be between 1 and 168 hours');
    });
  });

  describe('shouldReceiveNotification', () => {
    it('should return true when both channel and type are enabled', async () => {
      const mockPreferences = {
        emailEnabled: true,
        appointmentReminder: true
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await notificationPreferenceService.shouldReceiveNotification(
        'user123',
        'appointment_reminder',
        'email'
      );

      expect(result).toBe(true);
    });

    it('should return false when channel is disabled', async () => {
      const mockPreferences = {
        emailEnabled: false,
        appointmentReminder: true
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await notificationPreferenceService.shouldReceiveNotification(
        'user123',
        'appointment_reminder',
        'email'
      );

      expect(result).toBe(false);
    });

    it('should return false when notification type is disabled', async () => {
      const mockPreferences = {
        emailEnabled: true,
        appointmentReminder: false
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await notificationPreferenceService.shouldReceiveNotification(
        'user123',
        'appointment_reminder',
        'email'
      );

      expect(result).toBe(false);
    });

    it('should default to true on error', async () => {
      prisma.notificationPreference.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await notificationPreferenceService.shouldReceiveNotification(
        'user123',
        'appointment_reminder',
        'email'
      );

      expect(result).toBe(true);
    });
  });

  describe('getAdminPreferences', () => {
    it('should return admin users with their preferences', async () => {
      const mockAdmins = [
        {
          id: 'admin1',
          email: 'admin1@example.com',
          role: 'ADMIN',
          notificationPreferences: {
            id: 'pref1',
            newBookingAlert: true
          }
        },
        {
          id: 'admin2',
          email: 'admin2@example.com',
          role: 'ADMIN',
          notificationPreferences: null
        }
      ];

      const mockDefaultPreferences = {
        id: 'pref2',
        userId: 'admin2',
        newBookingAlert: true
      };

      prisma.user.findMany.mockResolvedValue(mockAdmins);
      prisma.notificationPreference.create.mockResolvedValue(mockDefaultPreferences);

      const result = await notificationPreferenceService.getAdminPreferences();

      expect(result).toHaveLength(2);
      expect(result[0].notificationPreferences).toBeDefined();
      expect(result[1].notificationPreferences).toEqual(mockDefaultPreferences);
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin2'
        })
      });
    });
  });

  describe('getAdminNotificationRecipients', () => {
    it('should return admins who should receive the notification type', async () => {
      const mockAdmins = [
        {
          id: 'admin1',
          email: 'admin1@example.com',
          notificationPreferences: {
            newBookingAlert: true
          }
        },
        {
          id: 'admin2',
          email: 'admin2@example.com',
          notificationPreferences: {
            newBookingAlert: false
          }
        }
      ];

      prisma.user.findMany.mockResolvedValue(mockAdmins);

      const result = await notificationPreferenceService.getAdminNotificationRecipients('new_booking_alert');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('admin1');
    });
  });

  describe('getDeliverySettings', () => {
    it('should return delivery settings for a user', async () => {
      const mockPreferences = {
        reminderHoursBefore: 48,
        maxRetryAttempts: 5,
        retryIntervalMinutes: 60,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      };

      prisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await notificationPreferenceService.getDeliverySettings('user123');

      expect(result).toEqual({
        reminderHoursBefore: 48,
        maxRetryAttempts: 5,
        retryIntervalMinutes: 60,
        enabledChannels: {
          email: true,
          sms: false,
          push: true
        }
      });
    });
  });

  describe('bulkUpdatePreferences', () => {
    it('should update preferences for multiple users', async () => {
      const userUpdates = [
        { userId: 'user1', updates: { emailEnabled: false } },
        { userId: 'user2', updates: { smsEnabled: true } }
      ];

      const mockResults = [
        { id: 'pref1', userId: 'user1', emailEnabled: false },
        { id: 'pref2', userId: 'user2', smsEnabled: true }
      ];

      prisma.notificationPreference.upsert
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await notificationPreferenceService.bulkUpdatePreferences(userUpdates);

      expect(result).toEqual(mockResults);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      prisma.notificationPreference.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // email enabled
        .mockResolvedValueOnce(30)  // sms enabled
        .mockResolvedValueOnce(90)  // push enabled
        .mockResolvedValueOnce(85); // appointment reminder enabled

      const result = await notificationPreferenceService.getNotificationStats();

      expect(result).toEqual({
        totalUsers: 100,
        channelStats: {
          email: { enabled: 80, percentage: 80 },
          sms: { enabled: 30, percentage: 30 },
          push: { enabled: 90, percentage: 90 }
        },
        appointmentReminders: {
          enabled: 85,
          percentage: 85
        }
      });
    });

    it('should handle zero users gracefully', async () => {
      prisma.notificationPreference.count.mockResolvedValue(0);

      const result = await notificationPreferenceService.getNotificationStats();

      expect(result.channelStats.email.percentage).toBe(0);
      expect(result.appointmentReminders.percentage).toBe(0);
    });
  });

  describe('Private helper methods', () => {
    describe('_isChannelEnabled', () => {
      it('should correctly identify enabled channels', () => {
        const preferences = {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true
        };

        expect(notificationPreferenceService._isChannelEnabled(preferences, 'email')).toBe(true);
        expect(notificationPreferenceService._isChannelEnabled(preferences, 'sms')).toBe(false);
        expect(notificationPreferenceService._isChannelEnabled(preferences, 'push')).toBe(true);
        expect(notificationPreferenceService._isChannelEnabled(preferences, 'invalid')).toBe(false);
      });
    });

    describe('_isNotificationTypeEnabled', () => {
      it('should correctly identify enabled notification types', () => {
        const preferences = {
          appointmentConfirmation: true,
          appointmentReminder: false,
          newBookingAlert: true
        };

        expect(notificationPreferenceService._isNotificationTypeEnabled(preferences, 'appointment_confirmation')).toBe(true);
        expect(notificationPreferenceService._isNotificationTypeEnabled(preferences, 'appointment_reminder')).toBe(false);
        expect(notificationPreferenceService._isNotificationTypeEnabled(preferences, 'new_booking_alert')).toBe(true);
        expect(notificationPreferenceService._isNotificationTypeEnabled(preferences, 'unknown_type')).toBe(true);
      });
    });
  });
});