import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaClient } from '@prisma/client';
import CalendarOAuthService from './calendarOAuthService.js';

const prisma = new PrismaClient();

class OutlookCalendarService {
  constructor() {
    this.prisma = prisma;
    this.oauthService = new CalendarOAuthService();
    this.graphClient = null;
  }

  /**
   * Initialize Microsoft Graph client with access token
   */
  async initializeClient(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId, provider: 'outlook', isActive: true }
      });

      if (!calendarSync) {
        throw new Error('Outlook calendar sync not found or inactive');
      }

      // Decrypt access token
      const accessToken = this.oauthService.decryptToken(calendarSync.accessToken);
      
      // Initialize Graph client
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      return { success: true, calendarId: calendarSync.calendarId };
    } catch (error) {
      console.error('Outlook Calendar initialization error:', error);
      throw new Error(`Failed to initialize Outlook Calendar: ${error.message}`);
    }
  }

  /**
   * Create a calendar event for an appointment
   */
  async createAppointmentEvent(calendarSyncId, appointment) {
    try {
      await this.initializeClient(calendarSyncId);

      const event = {
        subject: `Appointment: ${appointment.serviceType}`,
        body: {
          contentType: 'text',
          content: `Customer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}\nPhone: ${appointment.customerPhone || 'N/A'}\nAddress: ${appointment.propertyAddress}\nNotes: ${appointment.notes || 'N/A'}`
        },
        start: {
          dateTime: appointment.scheduledDate.toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000).toISOString(),
          timeZone: 'America/New_York'
        },
        attendees: [
          {
            emailAddress: {
              address: appointment.customerEmail,
              name: appointment.customerName
            },
            type: 'required'
          }
        ],
        reminderMinutesBeforeStart: 30,
        isReminderOn: true
      };

      const response = await this.graphClient
        .api('/me/events')
        .post(event);

      // Update appointment with calendar event ID
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: response.id }
      });

      return {
        success: true,
        eventId: response.id,
        eventUrl: response.webLink
      };
    } catch (error) {
      console.error('Outlook Calendar event creation error:', error);
      
      // Check if token needs refresh (Outlook typically requires re-authentication)
      if (error.code === 'InvalidAuthenticationToken' || error.code === 'Unauthorized') {
        throw new Error('Outlook authentication expired. Please re-authenticate.');
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

      await this.initializeClient(calendarSyncId);

      const event = {
        subject: `Appointment: ${appointment.serviceType}`,
        body: {
          contentType: 'text',
          content: `Customer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}\nPhone: ${appointment.customerPhone || 'N/A'}\nAddress: ${appointment.propertyAddress}\nNotes: ${appointment.notes || 'N/A'}`
        },
        start: {
          dateTime: appointment.scheduledDate.toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000).toISOString(),
          timeZone: 'America/New_York'
        },
        attendees: [
          {
            emailAddress: {
              address: appointment.customerEmail,
              name: appointment.customerName
            },
            type: 'required'
          }
        ]
      };

      const response = await this.graphClient
        .api(`/me/events/${appointment.calendarEventId}`)
        .patch(event);

      return {
        success: true,
        eventId: response.id,
        eventUrl: response.webLink
      };
    } catch (error) {
      console.error('Outlook Calendar event update error:', error);
      
      // Check if token needs refresh
      if (error.code === 'InvalidAuthenticationToken' || error.code === 'Unauthorized') {
        throw new Error('Outlook authentication expired. Please re-authenticate.');
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

      await this.initializeClient(calendarSyncId);

      await this.graphClient
        .api(`/me/events/${appointment.calendarEventId}`)
        .delete();

      // Clear calendar event ID from appointment
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: null }
      });

      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.error('Outlook Calendar event deletion error:', error);
      
      // Check if token needs refresh
      if (error.code === 'InvalidAuthenticationToken' || error.code === 'Unauthorized') {
        throw new Error('Outlook authentication expired. Please re-authenticate.');
      }
      
      // If event not found, consider it successfully deleted
      if (error.code === 'ErrorItemNotFound') {
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
   * Get events from Outlook Calendar for a date range
   */
  async getEvents(calendarSyncId, startDate, endDate) {
    try {
      await this.initializeClient(calendarSyncId);

      const response = await this.graphClient
        .api('/me/events')
        .filter(`start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`)
        .orderby('start/dateTime')
        .get();

      const events = response.value.map(event => ({
        id: event.id,
        summary: event.subject,
        description: event.body?.content || '',
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        isAllDay: event.isAllDay,
        attendees: event.attendees || [],
        htmlLink: event.webLink
      }));

      return { success: true, events };
    } catch (error) {
      console.error('Outlook Calendar events fetch error:', error);
      
      // Check if token needs refresh
      if (error.code === 'InvalidAuthenticationToken' || error.code === 'Unauthorized') {
        throw new Error('Outlook authentication expired. Please re-authenticate.');
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
      console.error('Outlook Calendar conflict check error:', error);
      throw new Error(`Failed to check for conflicts: ${error.message}`);
    }
  }

  /**
   * Get free/busy information from Outlook Calendar
   */
  async getFreeBusyInfo(calendarSyncId, startDate, endDate) {
    try {
      await this.initializeClient(calendarSyncId);

      const requestBody = {
        schedules: ['me'],
        startTime: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/New_York'
        },
        endTime: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/New_York'
        },
        availabilityViewInterval: 30 // 30-minute intervals
      };

      const response = await this.graphClient
        .api('/me/calendar/getSchedule')
        .post(requestBody);

      const busySlots = [];
      if (response.value && response.value.length > 0) {
        const schedule = response.value[0];
        if (schedule.busyViewEntries) {
          schedule.busyViewEntries.forEach(entry => {
            if (entry.status === 'busy' || entry.status === 'tentative') {
              busySlots.push({
                start: new Date(entry.start.dateTime),
                end: new Date(entry.end.dateTime),
                status: entry.status
              });
            }
          });
        }
      }

      return { success: true, busySlots };
    } catch (error) {
      console.error('Outlook Calendar free/busy fetch error:', error);
      throw new Error(`Failed to fetch free/busy information: ${error.message}`);
    }
  }

  /**
   * Sync appointment changes to Outlook Calendar
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
      console.error(`Outlook Calendar sync error (${action}):`, error);
      
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
   * Get busy time slots from Outlook Calendar
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
      console.error('Outlook Calendar busy slots fetch error:', error);
      throw new Error(`Failed to fetch busy time slots: ${error.message}`);
    }
  }

  /**
   * Create a meeting invitation
   */
  async createMeetingInvitation(calendarSyncId, appointment) {
    try {
      await this.initializeClient(calendarSyncId);

      const event = {
        subject: `Appointment: ${appointment.serviceType}`,
        body: {
          contentType: 'html',
          content: `
            <h3>Appointment Details</h3>
            <p><strong>Service:</strong> ${appointment.serviceType}</p>
            <p><strong>Customer:</strong> ${appointment.customerName}</p>
            <p><strong>Email:</strong> ${appointment.customerEmail}</p>
            <p><strong>Phone:</strong> ${appointment.customerPhone || 'N/A'}</p>
            <p><strong>Address:</strong> ${appointment.propertyAddress}</p>
            <p><strong>Notes:</strong> ${appointment.notes || 'N/A'}</p>
          `
        },
        start: {
          dateTime: appointment.scheduledDate.toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000).toISOString(),
          timeZone: 'America/New_York'
        },
        attendees: [
          {
            emailAddress: {
              address: appointment.customerEmail,
              name: appointment.customerName
            },
            type: 'required'
          }
        ],
        isOnlineMeeting: false,
        reminderMinutesBeforeStart: 30,
        isReminderOn: true,
        responseRequested: true
      };

      const response = await this.graphClient
        .api('/me/events')
        .post(event);

      // Send the invitation
      await this.graphClient
        .api(`/me/events/${response.id}/send`)
        .post({});

      return {
        success: true,
        eventId: response.id,
        eventUrl: response.webLink
      };
    } catch (error) {
      console.error('Outlook meeting invitation error:', error);
      throw new Error(`Failed to create meeting invitation: ${error.message}`);
    }
  }
}

export default OutlookCalendarService;