import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OutlookCalendarService from '../services/outlookCalendarService.js';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
const mockGraphClient = {
  api: vi.fn().mockReturnThis(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
  filter: vi.fn().mockReturnThis(),
  orderby: vi.fn().mockReturnThis()
};

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: vi.fn(() => mockGraphClient)
  }
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    calendarSync: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    appointment: {
      update: vi.fn()
    }
  }))
}));

const mockOAuthService = {
  decryptToken: vi.fn()
};

vi.mock('../services/calendarOAuthService.js', () => ({
  default: vi.fn(() => mockOAuthService)
}));

describe('OutlookCalendarService', () => {
  let service;
  let mockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OutlookCalendarService();
    // Access the mocked prisma instance
    mockPrisma = {
      calendarSync: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      appointment: {
        update: vi.fn()
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeClient', () => {
    it('should successfully initialize Outlook Calendar client', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');

      const result = await service.initializeClient(calendarSyncId);

      expect(service.prisma.calendarSync.findUnique).toHaveBeenCalledWith({
        where: { id: calendarSyncId, provider: 'outlook', isActive: true }
      });
      expect(mockOAuthService.decryptToken).toHaveBeenCalledWith('encrypted-token');
      expect(result.success).toBe(true);
      expect(result.calendarId).toBe('calendar-id');
    });

    it('should throw error when calendar sync not found', async () => {
      const calendarSyncId = 'non-existent-id';
      service.prisma.calendarSync.findUnique.mockResolvedValue(null);

      await expect(service.initializeClient(calendarSyncId)).rejects.toThrow(
        'Outlook calendar sync not found or inactive'
      );
    });
  });

  describe('createAppointmentEvent', () => {
    it('should successfully create calendar event', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        serviceType: 'Plumbing',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '123-456-7890',
        propertyAddress: '123 Main St',
        notes: 'Fix kitchen sink',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      const mockEventResponse = {
        id: 'event-id',
        webLink: 'https://outlook.com/event/123'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.post.mockResolvedValue(mockEventResponse);
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.createAppointmentEvent(calendarSyncId, appointment);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events');
      expect(mockGraphClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Appointment: Plumbing',
          body: expect.objectContaining({
            contentType: 'text',
            content: expect.stringContaining('John Doe')
          }),
          start: expect.objectContaining({
            dateTime: appointment.scheduledDate.toISOString()
          }),
          end: expect.objectContaining({
            dateTime: new Date(appointment.scheduledDate.getTime() + 60 * 60000).toISOString()
          })
        })
      );

      expect(service.prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointment.id },
        data: { calendarEventId: 'event-id' }
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-id');
      expect(result.eventUrl).toBe('https://outlook.com/event/123');
    });

    it('should handle authentication errors', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        serviceType: 'Plumbing',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.post.mockRejectedValue({ 
        code: 'InvalidAuthenticationToken', 
        message: 'Token expired' 
      });

      await expect(service.createAppointmentEvent(calendarSyncId, appointment))
        .rejects.toThrow('Outlook authentication expired. Please re-authenticate.');
    });
  });

  describe('updateAppointmentEvent', () => {
    it('should successfully update calendar event', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: 'event-id',
        serviceType: 'Plumbing',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        scheduledDate: new Date('2024-01-15T11:00:00Z'),
        duration: 90
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      const mockEventResponse = {
        id: 'event-id',
        webLink: 'https://outlook.com/event/123'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.patch.mockResolvedValue(mockEventResponse);

      const result = await service.updateAppointmentEvent(calendarSyncId, appointment);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events/event-id');
      expect(mockGraphClient.patch).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Appointment: Plumbing',
          start: expect.objectContaining({
            dateTime: appointment.scheduledDate.toISOString()
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-id');
    });

    it('should throw error when no calendar event ID', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: null,
        serviceType: 'Plumbing'
      };

      await expect(service.updateAppointmentEvent(calendarSyncId, appointment))
        .rejects.toThrow('No calendar event ID found for appointment');
    });
  });

  describe('deleteAppointmentEvent', () => {
    it('should successfully delete calendar event', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: 'event-id'
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.delete.mockResolvedValue({});
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.deleteAppointmentEvent(calendarSyncId, appointment);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events/event-id');
      expect(mockGraphClient.delete).toHaveBeenCalled();

      expect(service.prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointment.id },
        data: { calendarEventId: null }
      });

      expect(result.success).toBe(true);
    });

    it('should handle missing calendar event ID gracefully', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: null
      };

      const result = await service.deleteAppointmentEvent(calendarSyncId, appointment);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No event to delete');
      expect(mockGraphClient.delete).not.toHaveBeenCalled();
    });

    it('should handle ErrorItemNotFound gracefully', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: 'event-id'
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.delete.mockRejectedValue({ 
        code: 'ErrorItemNotFound', 
        message: 'Item not found' 
      });
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.deleteAppointmentEvent(calendarSyncId, appointment);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Event already deleted');
    });
  });

  describe('getEvents', () => {
    it('should successfully fetch calendar events', async () => {
      const calendarSyncId = 'sync-id';
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      const mockEventsResponse = {
        value: [
          {
            id: 'event-1',
            subject: 'Meeting 1',
            body: { content: 'Test meeting' },
            start: { dateTime: '2024-01-15T10:00:00Z' },
            end: { dateTime: '2024-01-15T11:00:00Z' },
            isAllDay: false,
            attendees: [],
            webLink: 'https://outlook.com/event/1'
          },
          {
            id: 'event-2',
            subject: 'All Day Event',
            start: { dateTime: '2024-01-16T00:00:00Z' },
            end: { dateTime: '2024-01-17T00:00:00Z' },
            isAllDay: true,
            attendees: [],
            webLink: 'https://outlook.com/event/2'
          }
        ]
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.filter.mockReturnValue(mockGraphClient);
      mockGraphClient.orderby.mockReturnValue(mockGraphClient);
      mockGraphClient.get.mockResolvedValue(mockEventsResponse);

      const result = await service.getEvents(calendarSyncId, startDate, endDate);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events');
      expect(mockGraphClient.filter).toHaveBeenCalledWith(
        `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
      );
      expect(mockGraphClient.orderby).toHaveBeenCalledWith('start/dateTime');

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].id).toBe('event-1');
      expect(result.events[0].summary).toBe('Meeting 1');
      expect(result.events[0].isAllDay).toBe(false);
      expect(result.events[1].isAllDay).toBe(true);
    });
  });

  describe('checkForConflicts', () => {
    it('should detect conflicts correctly', async () => {
      const calendarSyncId = 'sync-id';
      const startDate = new Date('2024-01-15T10:30:00Z');
      const endDate = new Date('2024-01-15T11:30:00Z');

      // Mock getEvents to return overlapping event
      vi.spyOn(service, 'getEvents').mockResolvedValue({
        success: true,
        events: [
          {
            id: 'event-1',
            summary: 'Existing Meeting',
            start: new Date('2024-01-15T10:00:00Z'),
            end: new Date('2024-01-15T11:00:00Z'),
            isAllDay: false
          }
        ]
      });

      const result = await service.checkForConflicts(calendarSyncId, startDate, endDate);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].summary).toBe('Existing Meeting');
    });

    it('should exclude specified event ID from conflicts', async () => {
      const calendarSyncId = 'sync-id';
      const startDate = new Date('2024-01-15T10:30:00Z');
      const endDate = new Date('2024-01-15T11:30:00Z');
      const excludeEventId = 'event-1';

      vi.spyOn(service, 'getEvents').mockResolvedValue({
        success: true,
        events: [
          {
            id: 'event-1',
            summary: 'Existing Meeting',
            start: new Date('2024-01-15T10:00:00Z'),
            end: new Date('2024-01-15T11:00:00Z'),
            isAllDay: false
          }
        ]
      });

      const result = await service.checkForConflicts(calendarSyncId, startDate, endDate, excludeEventId);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('getBusyTimeSlots', () => {
    it('should return busy time slots correctly', async () => {
      const calendarSyncId = 'sync-id';
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      vi.spyOn(service, 'getEvents').mockResolvedValue({
        success: true,
        events: [
          {
            id: 'event-1',
            summary: 'Meeting 1',
            start: new Date('2024-01-15T10:00:00Z'),
            end: new Date('2024-01-15T11:00:00Z'),
            isAllDay: false
          },
          {
            id: 'event-2',
            summary: 'All Day Event',
            start: new Date('2024-01-15T00:00:00Z'),
            end: new Date('2024-01-16T00:00:00Z'),
            isAllDay: true
          }
        ]
      });

      const result = await service.getBusyTimeSlots(calendarSyncId, startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.busySlots).toHaveLength(1); // Only non-all-day events
      expect(result.busySlots[0].summary).toBe('Meeting 1');
    });
  });

  describe('createMeetingInvitation', () => {
    it('should successfully create meeting invitation', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        serviceType: 'Plumbing',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '123-456-7890',
        propertyAddress: '123 Main St',
        notes: 'Fix kitchen sink',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'outlook',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'calendar-id'
      };

      const mockEventResponse = {
        id: 'event-id',
        webLink: 'https://outlook.com/event/123'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.post.mockResolvedValue(mockEventResponse);

      const result = await service.createMeetingInvitation(calendarSyncId, appointment);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events');
      expect(mockGraphClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Appointment: Plumbing',
          body: expect.objectContaining({
            contentType: 'html',
            content: expect.stringContaining('John Doe')
          }),
          responseRequested: true
        })
      );

      // Should also send the invitation
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/events/event-id/send');

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-id');
    });
  });
});