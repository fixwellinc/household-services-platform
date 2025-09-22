import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import CalendarOAuthService from './calendarOAuthService.js';

const prisma = new PrismaClient();

class GoogleCalendarService {
  constructor() {
    this.prisma = prisma;
    this.oauthService = new CalendarOAuthService();
    this.calendar = null;
    this.oauth2Client = null;
  }

  /**
   * Initialize Google Calendar API client with access token
   */
  async initializeClient(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId, provider: 'google', isActive: true }
      });

      if (!calendarSync) {
        throw new Error('Google calendar sync not found or inactive');
      }

      // Decrypt access token
      const accessToken = this.oauthService.decryptToken(calendarSync.accessToken);
      
      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      this.oauth2Client.setCredentials({ access_token: accessToken });

      // Initialize Calendar API
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      return { success: true, calendarId: calendarSync.calendarId };
    } catch (error) {
      console.error('Google Calendar initialization error:', error);
      throw new Error(`Failed to initialize Google Calendar: ${error.message}`);
    }
  }

  /**
   * Create a calendar event for an appointment
   */
  async createAppointmentEvent(calendarSyncId, appointment) {
    try {
      const { calendarId } = await this.initializeClient(calendarSyncId);

      const event = {
        summary: `Appointment: ${appointment.serviceType}`,
        description: `Customer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}\nPhone: ${appointment.customerPhone || 'N/A'}\nAddress: ${appointment.propertyAddress}\nNotes: ${appointment.notes || 'N/A'}`,
        start: {
          dateTime: appointment.scheduledDate.toISOString(),
          timeZone: 'America/New_York', // You might want to make this configurable
        },
        end: {
          dateTime: new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: appointment.customerEmail, displayName: appointment.customerName }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      // Update appointment with calendar event ID
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: response.data.id }
      });

      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink
      };
    } catch (error) {
      console.error('Google Calendar event creation error:', error);
      
      // Check if token needs refresh
      if (error.code === 401) {
        try {
          await this.oauthService.refreshGoogleToken(calendarSyncId);
          // Retry the operation
          return await this.createAppointmentEvent(calendarSyncId, appointment);
        } catch (refreshError) {
          throw new Error(`Failed to create calendar event: ${refreshError.message}`);
        }
      }
      
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Update a calendar event for an appointment
   */
  async updateAppointmentEvent(calendarSyncId, appointment) {
    try {
      if (!appointment.calendarEventId) {
        throw new Error('No calendar event ID found for appointment');
      }

      const { calendarId } = await this.initializeClient(calendarSyncId);

      const event = {
        summary: `Appointment: ${appointment.serviceType}`,
        description: `Customer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}\nPhone: ${appointment.customerPhone || 'N/A'}\nAddress: ${appointment.propertyAddress}\nNotes: ${appointment.notes || 'N/A'}`,
        start: {
          dateTime: appointment.scheduledDate.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: appointment.customerEmail, displayName: appointment.customerName }
        ],
      };

      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: appointment.calendarEventId,
        resource: event,
      });

      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink
      };
    } catch (error) {
      console.error('Google Calendar event update error:', error);
      
      // Check if token needs refresh
      if (error.code === 401) {
        try {
          await this.oauthService.refreshGoogleToken(calendarSyncId);
          // Retry the operation
          return await this.updateAppointmentEvent(calendarSyncId, appointment);
        } catch (refreshError) {
          throw new Error(`Failed to update calendar event: ${refreshError.message}`);
        }
      }
      
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  /**
   * Delete a calendar event for an appointment
   */
  async deleteAppointmentEvent(calendarSyncId, appointment) {
    try {
      if (!appointment.calendarEventId) {
        console.warn('No calendar event ID found for appointment, skipping deletion');
        return { success: true, message: 'No event to delete' };
      }

      const { calendarId } = await this.initializeClient(calendarSyncId);

      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: appointment.calendarEventId,
      });

      // Clear calendar event ID from appointment
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: null }
      });

      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.error('Google Calendar event deletion error:', error);
      
      // Check if token needs refresh
      if (error.code === 401) {
        try {
          await this.oauthService.refreshGoogleToken(calendarSyncId);
          // Retry the operation
          return await this.deleteAppointmentEvent(calendarSyncId, appointment);
        } catch (refreshError) {
          throw new Error(`Failed to delete calendar event: ${refreshError.message}`);
        }
      }
      
      // If event not found, consider it successfully deleted
      if (error.code === 404) {
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { calendarEventId: null }
        });
        return { success: true, message: 'Event already deleted' };
      }
      
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  /**
   * Get events from Google Calendar for a date range
   */
  async getEvents(calendarSyncId, startDate, endDate) {
    try {
      const { calendarId } = await this.initializeClient(calendarSyncId);

      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        isAllDay: !event.start.dateTime,
        attendees: event.attendees || [],
        htmlLink: event.htmlLink
      }));

      return { success: true, events };
    } catch (error) {
      console.error('Google Calendar events fetch error:', error);
      
      // Check if token needs refresh
      if (error.code === 401) {
        try {
          await this.oauthService.refreshGoogleToken(calendarSyncId);
          // Retry the operation
          return await this.getEvents(calendarSyncId, startDate, endDate);
        } catch (refreshError) {
          throw new Error(`Failed to fetch calendar events: ${refreshError.message}`);
        }
      }
      
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  /**
   * Check for conflicts with existing calendar events
   */
  async checkForConflicts(calendarSyncId, startDate, endDate, excludeEventId = null) {
    try {
      const { events } = await this.getEvents(calendarSyncId, startDate, endDate);
      
      const conflicts = events.filter(event => {
        // Skip all-day events and the event being updated
        if (event.isAllDay || event.id === excludeEventId) {
          return false;
        }
        
        // Check for time overlap
        return (
          (startDate >= event.start && startDate < event.end) ||
          (endDate > event.start && endDate <= event.end) ||
          (startDate <= event.start && endDate >= event.end)
        );
      });

      return {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts
      };
    } catch (error) {
      console.error('Google Calendar conflict check error:', error);
      throw new Error(`Failed to check for conflicts: ${error.message}`);
    }
  }

  /**
   * Sync appointment changes to Google Calendar
   */
  async syncAppointment(calendarSyncId, appointment, action = 'create') {
    try {
      switch (action) {
        case 'create':
          return await this.createAppointmentEvent(calendarSyncId, appointment);
        case 'update':
          return await this.updateAppointmentEvent(calendarSyncId, appointment);
        case 'delete':
          return await this.deleteAppointmentEvent(calendarSyncId, appointment);
        default:
          throw new Error(`Unknown sync action: ${action}`);
      }
    } catch (error) {
      console.error(`Google Calendar sync error (${action}):`, error);
      
      // Update sync errors in database
      await this.prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: {
          syncErrors: error.message,
          updatedAt: new Date()
        }
      });
      
      throw error;
    }
  }

  /**
   * Get busy time slots from Google Calendar
   */
  async getBusyTimeSlots(calendarSyncId, startDate, endDate) {
    try {
      const { events } = await this.getEvents(calendarSyncId, startDate, endDate);
      
      const busySlots = events
        .filter(event => !event.isAllDay)
        .map(event => ({
          start: event.start,
          end: event.end,
          summary: event.summary
        }));

      return { success: true, busySlots };
    } catch (error) {
      console.error('Google Calendar busy slots fetch error:', error);
      throw new Error(`Failed to fetch busy time slots: ${error.message}`);
    }
  }
}

export default GoogleCalendarService;