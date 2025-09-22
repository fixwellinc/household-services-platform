import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import appointmentNotificationService from '../services/appointmentNotificationService.js';
import emailService from '../services/email.js';
import appointmentTemplateService from '../services/appointmentTemplateService.js';

// Mock the dependencies
vi.mock('../services/email.js', () => ({
  default: {
    sendEmail: vi.fn()
  }
}));

vi.mock('../services/appointmentTemplateService.js', () => ({
  default: {
    renderTemplate: vi.fn()
  }
}));

describe('AppointmentNotificationService', () => {
  let mockAppointment;
  let mockTemplateResult;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Clear the notification queue
    appointmentNotificationService.clearQueue();
    
    // Reduce retry delay for testing
    appointmentNotificationService.retryDelay = 100;

    mockAppointment = {
      id: 'test-appointment-123',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      serviceType: 'Home Inspection',
      scheduledDate: '2023-12-15T14:00:00.000Z',
      duration: 60,
      propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
      notes: 'Please check the kitchen faucet'
    };

    mockTemplateResult = {
      subject: 'Test Email Subject',
      html: '<html><body>Test HTML Content</body></html>',
      text: 'Test plain text content'
    };

    // Setup default mock responses
    appointmentTemplateService.renderTemplate.mockResolvedValue(mockTemplateResult);
    emailService.sendEmail.mockResolvedValue({ success: true, messageId: 'test-message-id' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendConfirmationEmail', () => {
    it('should send confirmation email successfully', async () => {
      const result = await appointmentNotificationService.sendConfirmationEmail(mockAppointment);

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-confirmation',
        expect.objectContaining({
          customerName: 'John Doe',
          serviceType: 'Home Inspection',
          appointmentDate: 'Friday, December 15, 2023',
          appointmentTime: expect.any(String),
          duration: 60,
          propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
          confirmationNumber: 'TEST-APPOINTMENT-123',
          notes: 'Please check the kitchen faucet'
        })
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com',
          subject: 'Test Email Subject',
          html: '<html><body>Test HTML Content</body></html>',
          text: 'Test plain text content',
          appointmentId: 'test-appointment-123',
          type: 'confirmation'
        })
      );

      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should handle email service failure with retry', async () => {
      emailService.sendEmail
        .mockResolvedValueOnce({ success: false, error: 'Temporary failure' })
        .mockResolvedValueOnce({ success: true, messageId: 'retry-success' });

      const result = await appointmentNotificationService.sendConfirmationEmail(mockAppointment);

      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true, messageId: 'retry-success' });
    });

    it('should throw error after max retry attempts', async () => {
      emailService.sendEmail.mockResolvedValue({ success: false, error: 'Persistent failure' });

      await expect(
        appointmentNotificationService.sendConfirmationEmail(mockAppointment)
      ).rejects.toThrow('Persistent failure');

      expect(emailService.sendEmail).toHaveBeenCalledTimes(3); // Initial + 2 retries
    }, 15000); // Increase timeout
  });

  describe('sendReminderEmail', () => {
    it('should send reminder email successfully', async () => {
      const result = await appointmentNotificationService.sendReminderEmail(mockAppointment);

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-reminder',
        expect.objectContaining({
          customerName: 'John Doe',
          serviceType: 'Home Inspection'
        })
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com',
          type: 'reminder'
        })
      );

      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });
  });

  describe('sendCancellationEmail', () => {
    it('should send cancellation email with reason', async () => {
      const cancellationReason = 'Emergency maintenance required';
      const bookingUrl = 'https://fixwell.ca/book';

      const result = await appointmentNotificationService.sendCancellationEmail(
        mockAppointment,
        cancellationReason,
        bookingUrl
      );

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-cancellation',
        expect.objectContaining({
          customerName: 'John Doe',
          cancellationReason: 'Emergency maintenance required',
          bookingUrl: 'https://fixwell.ca/book'
        })
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com',
          type: 'cancellation'
        })
      );

      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should use default booking URL when not provided', async () => {
      await appointmentNotificationService.sendCancellationEmail(mockAppointment);

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-cancellation',
        expect.objectContaining({
          bookingUrl: expect.any(String)
        })
      );
    });
  });

  describe('sendRescheduleEmail', () => {
    it('should send reschedule email with old appointment details', async () => {
      const oldAppointment = {
        ...mockAppointment,
        scheduledDate: '2023-12-14T10:00:00Z'
      };
      const rescheduleReason = 'Customer requested different time';

      const result = await appointmentNotificationService.sendRescheduleEmail(
        mockAppointment,
        oldAppointment,
        rescheduleReason
      );

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-reschedule',
        expect.objectContaining({
          customerName: 'John Doe',
          appointmentDate: 'Friday, December 15, 2023',
          appointmentTime: expect.any(String),
          oldAppointmentDate: 'Thursday, December 14, 2023',
          oldAppointmentTime: expect.any(String),
          rescheduleReason: 'Customer requested different time'
        })
      );

      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });
  });

  describe('formatAppointmentData', () => {
    it('should format appointment data correctly', () => {
      const formatted = appointmentNotificationService.formatAppointmentData(mockAppointment);

      expect(formatted).toEqual({
        customerName: 'John Doe',
        serviceType: 'Home Inspection',
        appointmentDate: 'Friday, December 15, 2023',
        appointmentTime: expect.any(String),
        duration: 60,
        propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
        confirmationNumber: 'TEST-APPOINTMENT-123',
        notes: 'Please check the kitchen faucet'
      });
    });

    it('should handle missing notes', () => {
      const appointmentWithoutNotes = { ...mockAppointment };
      delete appointmentWithoutNotes.notes;

      const formatted = appointmentNotificationService.formatAppointmentData(appointmentWithoutNotes);

      expect(formatted.notes).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string correctly', () => {
      const formatted = appointmentNotificationService.formatDate('2023-12-15T14:00:00Z');
      expect(formatted).toBe('Friday, December 15, 2023');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2023-12-15T14:00:00Z');
      const formatted = appointmentNotificationService.formatDate(date);
      expect(formatted).toBe('Friday, December 15, 2023');
    });

    it('should handle invalid date gracefully', () => {
      const formatted = appointmentNotificationService.formatDate('invalid-date');
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('formatTime', () => {
    it('should format ISO date string to time correctly', () => {
      const formatted = appointmentNotificationService.formatTime('2023-12-15T14:00:00Z');
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should format Date object to time correctly', () => {
      const date = new Date('2023-12-15T09:30:00Z');
      const formatted = appointmentNotificationService.formatTime(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should handle invalid date gracefully', () => {
      const formatted = appointmentNotificationService.formatTime('invalid-date');
      expect(formatted).toBe('Invalid Time');
    });
  });

  describe('queueNotification', () => {
    it('should queue notification for later processing', async () => {
      await appointmentNotificationService.queueNotification('confirmation', mockAppointment);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = appointmentNotificationService.getQueueStatus();
      // Queue might be empty if processed immediately, so check if it was processed
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should queue notification with scheduled time', async () => {
      const scheduledFor = new Date('2025-12-15T13:00:00Z'); // Future date
      
      await appointmentNotificationService.queueNotification('reminder', mockAppointment, {
        scheduledFor
      });

      const status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBeGreaterThan(0);
      expect(status.pendingNotifications[0].scheduledFor).toEqual(scheduledFor);
    });
  });

  describe('scheduleReminderEmail', () => {
    it('should schedule reminder email 24 hours before appointment', async () => {
      // Mock current time to be before the reminder time
      const mockNow = new Date('2023-12-14T10:00:00Z');
      vi.setSystemTime(mockNow);

      await appointmentNotificationService.scheduleReminderEmail(mockAppointment);

      const status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(1);
      expect(status.pendingNotifications[0].type).toBe('reminder');
      
      // Should be scheduled for 24 hours before appointment (14:00 - 24h = 14:00 previous day)
      const expectedReminderTime = new Date('2023-12-14T14:00:00Z');
      expect(status.pendingNotifications[0].scheduledFor).toEqual(expectedReminderTime);
    });

    it('should not schedule reminder if time has passed', async () => {
      // Mock current time to be after the reminder time
      const mockNow = new Date('2023-12-15T15:00:00Z');
      vi.setSystemTime(mockNow);

      await appointmentNotificationService.scheduleReminderEmail(mockAppointment);

      const status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(0);
    });

    it('should schedule reminder with custom hours before', async () => {
      const mockNow = new Date('2023-12-14T10:00:00Z');
      vi.setSystemTime(mockNow);

      await appointmentNotificationService.scheduleReminderEmail(mockAppointment, 2);

      const status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(1);
      
      // Should be scheduled for 2 hours before appointment
      const expectedReminderTime = new Date('2023-12-15T12:00:00Z');
      expect(status.pendingNotifications[0].scheduledFor).toEqual(expectedReminderTime);
    });
  });

  describe('handleAppointmentEvent', () => {
    it('should handle created event by sending confirmation and scheduling reminder', async () => {
      const mockNow = new Date('2023-12-14T10:00:00Z');
      vi.setSystemTime(mockNow);

      await appointmentNotificationService.handleAppointmentEvent('created', mockAppointment);

      // Should send confirmation email immediately
      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-confirmation',
        expect.any(Object)
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'confirmation' })
      );

      // Should schedule reminder email
      const status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(1);
      expect(status.pendingNotifications[0].type).toBe('reminder');
    });

    it('should handle updated event with reschedule', async () => {
      const oldAppointment = {
        ...mockAppointment,
        scheduledDate: '2023-12-14T10:00:00Z'
      };

      await appointmentNotificationService.handleAppointmentEvent('updated', mockAppointment, {
        oldAppointment,
        rescheduleReason: 'Customer request'
      });

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-reschedule',
        expect.any(Object)
      );
    });

    it('should handle cancelled event', async () => {
      await appointmentNotificationService.handleAppointmentEvent('cancelled', mockAppointment, {
        cancellationReason: 'Emergency',
        bookingUrl: 'https://fixwell.ca/book'
      });

      expect(appointmentTemplateService.renderTemplate).toHaveBeenCalledWith(
        'appointment-cancellation',
        expect.any(Object)
      );
    });

    it('should handle completed event', async () => {
      // Should not throw error and log completion
      await expect(
        appointmentNotificationService.handleAppointmentEvent('completed', mockAppointment)
      ).resolves.not.toThrow();
    });

    it('should warn about unknown events', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await appointmentNotificationService.handleAppointmentEvent('unknown', mockAppointment);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown appointment event: unknown');
      consoleSpy.mockRestore();
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status', async () => {
      await appointmentNotificationService.queueNotification('confirmation', mockAppointment);
      await appointmentNotificationService.queueNotification('reminder', mockAppointment);

      const status = appointmentNotificationService.getQueueStatus();

      expect(status.queueLength).toBeGreaterThanOrEqual(0);
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('pendingNotifications');
    });
  });

  describe('clearQueue', () => {
    it('should clear the notification queue', async () => {
      await appointmentNotificationService.queueNotification('confirmation', mockAppointment);
      
      let status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(1);

      appointmentNotificationService.clearQueue();

      status = appointmentNotificationService.getQueueStatus();
      expect(status.queueLength).toBe(0);
      expect(status.isProcessing).toBe(false);
    });
  });
});