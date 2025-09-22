import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import GoogleCalendarService from '../services/googleCalendarService.js';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
const mockCalendarApi = {
  events: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  }
};

const mockOAuth2Client = {
  setCredentials: vi.fn()
};

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => mockOAuth2Client)
    },
    calendar: vi.fn(() => mockCalendarApi)
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
  decryptToken: vi.fn(),
  refreshGoogleToken: vi.fn()
};

vi.mock('../services/calendarOAuthService.js', () => ({
  default: vi.fn(() => mockOAuthService)
}));

describe('GoogleCalendarService', () => {
  let service;
  let mockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/callback';

    service = new GoogleCalendarService();
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
    it('should successfully initialize Google Calendar client', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');

      const result = await service.initializeClient(calendarSyncId);

      expect(service.prisma.calendarSync.findUnique).toHaveBeenCalledWith({
        where: { id: calendarSyncId, provider: 'google', isActive: true }
      });
      expect(mockOAuthService.decryptToken).toHaveBeenCalledWith('encrypted-token');
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'decrypted-token'
      });
      expect(result.success).toBe(true);
      expect(result.calendarId).toBe('primary');
    });

    it('should throw error when calendar sync not found', async () => {
      const calendarSyncId = 'non-existent-id';
      service.prisma.calendarSync.findUnique.mockResolvedValue(null);

      await expect(service.initializeClient(calendarSyncId)).rejects.toThrow(
        'Google calendar sync not found or inactive'
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
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      const mockEventResponse = {
        data: {
          id: 'event-id',
          htmlLink: 'https://calendar.google.com/event/123'
        }
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockCalendarApi.events.insert.mockResolvedValue(mockEventResponse);
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.createAppointmentEvent(calendarSyncId, appointment);

      expect(mockCalendarApi.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        resource: expect.objectContaining({
          summary: 'Appointment: Plumbing',
          description: expect.stringContaining('John Doe'),
          start: expect.objectContaining({
            dateTime: appointment.scheduledDate.toISOString()
          }),
          end: expect.objectContaining({
            dateTime: new Date(appointment.scheduledDate.getTime() + 60 * 60000).toISOString()
          })
        })
      });

      expect(service.prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointment.id },
        data: { calendarEventId: 'event-id' }
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-id');
      expect(result.eventUrl).toBe('https://calendar.google.com/event/123');
    });

    it('should handle token refresh on 401 error', async () => {
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
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      
      // First call fails with 401, second succeeds
      mockCalendarApi.events.insert
        .mockRejectedValueOnce({ code: 401, message: 'Unauthorized' })
        .mockResolvedValueOnce({
          data: { id: 'event-id', htmlLink: 'https://calendar.google.com/event/123' }
        });
      
      mockOAuthService.refreshGoogleToken.mockResolvedValue('new-token');
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.createAppointmentEvent(calendarSyncId, appointment);

      expect(mockOAuthService.refreshGoogleToken).toHaveBeenCalledWith(calendarSyncId);
      expect(mockCalendarApi.events.insert).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
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
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      const mockEventResponse = {
        data: {
          id: 'event-id',
          htmlLink: 'https://calendar.google.com/event/123'
        }
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockCalendarApi.events.update.mockResolvedValue(mockEventResponse);

      const result = await service.updateAppointmentEvent(calendarSyncId, appointment);

      expect(mockCalendarApi.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-id',
        resource: expect.objectContaining({
          summary: 'Appointment: Plumbing',
          start: expect.objectContaining({
            dateTime: appointment.scheduledDate.toISOString()
          })
        })
      });

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
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockCalendarApi.events.delete.mockResolvedValue({});
      service.prisma.appointment.update.mockResolvedValue({});

      const result = await service.deleteAppointmentEvent(calendarSyncId, appointment);

      expect(mockCalendarApi.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-id'
      });

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
      expect(mockCalendarApi.events.delete).not.toHaveBeenCalled();
    });

    it('should handle 404 error gracefully', async () => {
      const calendarSyncId = 'sync-id';
      const appointment = {
        id: 'apt-id',
        calendarEventId: 'event-id'
      };

      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockCalendarApi.events.delete.mockRejectedValue({ code: 404, message: 'Not found' });
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
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-token',
        calendarId: 'primary'
      };

      const mockEventsResponse = {
        data: {
          items: [
            {
              id: 'event-1',
              summary: 'Meeting 1',
              description: 'Test meeting',
              start: { dateTime: '2024-01-15T10:00:00Z' },
              end: { dateTime: '2024-01-15T11:00:00Z' },
              attendees: [],
              htmlLink: 'https://calendar.google.com/event/1'
            },
            {
              id: 'event-2',
              summary: 'All Day Event',
              start: { date: '2024-01-16' },
              end: { date: '2024-01-17' },
              attendees: [],
              htmlLink: 'https://calendar.google.com/event/2'
            }
          ]
        }
      };

      service.prisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockOAuthService.decryptToken.mockReturnValue('decrypted-token');
      mockCalendarApi.events.list.mockResolvedValue(mockEventsResponse);

      const result = await service.getEvents(calendarSyncId, startDate, endDate);

      expect(mockCalendarApi.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].id).toBe('event-1');
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

    it('should not detect conflicts with all-day events', async () => {
      const calendarSyncId = 'sync-id';
      const startDate = new Date('2024-01-15T10:30:00Z');
      const endDate = new Date('2024-01-15T11:30:00Z');

      vi.spyOn(service, 'getEvents').mockResolvedValue({
        success: true,
        events: [
          {
            id: 'event-1',
            summary: 'All Day Event',
            start: new Date('2024-01-15T00:00:00Z'),
            end: new Date('2024-01-16T00:00:00Z'),
            isAllDay: true
          }
        ]
      });

      const result = await service.checkForConflicts(calendarSyncId, startDate, endDate);

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
});