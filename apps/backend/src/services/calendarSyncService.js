import { PrismaClient } from '@prisma/client';
import GoogleCalendarService from './googleCalendarService.js';
import OutlookCalendarService from './outlookCalendarService.js';
import CalendarOAuthService from './calendarOAuthService.js';

const prisma = new PrismaClient();

class CalendarSyncService {
  constructor() {
    this.googleService = new GoogleCalendarService();
    this.outlookService = new OutlookCalendarService();
    this.oauthService = new CalendarOAuthService();
  }

  /**
   * Get the appropriate calendar service based on provider
   */
  getCalendarService(provider) {
    switch (provider) {
      case 'google':
        return this.googleService;
      case 'outlook':
        return this.outlookService;
      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }
  }

  /**
   * Sync an appointment to all active calendar providers
   */
  async syncAppointmentToAllCalendars(appointment, action = 'create') {
    try {
      const activeCalendarSyncs = await this.oauthService.getActiveCalendarSyncs();
      const results = [];

      for (const calendarSync of activeCalendarSyncs) {
        try {
          const service = this.getCalendarService(calendarSync.provider);
          const result = await service.syncAppointment(calendarSync.id, appointment, action);
          
          results.push({
            provider: calendarSync.provider,
            calendarSyncId: calendarSync.id,
            success: true,
            result: result
          });

          // Update last sync time
          await prisma.calendarSync.update({
            where: { id: calendarSync.id },
            data: { 
              lastSyncAt: new Date(),
              syncErrors: null
            }
          });
        } catch (error) {
          console.error(`Failed to sync to ${calendarSync.provider}:`, error);
          
          results.push({
            provider: calendarSync.provider,
            calendarSyncId: calendarSync.id,
            success: false,
            error: error.message
          });

          // Update sync errors
          await prisma.calendarSync.update({
            where: { id: calendarSync.id },
            data: { 
              syncErrors: error.message,
              updatedAt: new Date()
            }
          });
        }
      }

      return {
        success: results.some(r => r.success),
        results: results,
        totalSyncs: activeCalendarSyncs.length,
        successfulSyncs: results.filter(r => r.success).length
      };
    } catch (error) {
      console.error('Calendar sync error:', error);
      throw new Error(`Failed to sync appointment: ${error.message}`);
    }
  }

  /**
   * Create appointment in all calendars
   */
  async createAppointmentInCalendars(appointment) {
    return await this.syncAppointmentToAllCalendars(appointment, 'create');
  }

  /**
   * Update appointment in all calendars
   */
  async updateAppointmentInCalendars(appointment) {
    return await this.syncAppointmentToAllCalendars(appointment, 'update');
  }

  /**
   * Delete appointment from all calendars
   */
  async deleteAppointmentFromCalendars(appointment) {
    return await this.syncAppointmentToAllCalendars(appointment, 'delete');
  }

  /**
   * Check for conflicts across all calendar providers
   */
  async checkForConflictsAcrossCalendars(startDate, endDate, excludeEventId = null) {
    try {
      const activeCalendarSyncs = await this.oauthService.getActiveCalendarSyncs();
      const allConflicts = [];

      for (const calendarSync of activeCalendarSyncs) {
        try {
          const service = this.getCalendarService(calendarSync.provider);
          const { hasConflicts, conflicts } = await service.checkForConflicts(
            calendarSync.id, 
            startDate, 
            endDate, 
            excludeEventId
          );

          if (hasConflicts) {
            allConflicts.push({
              provider: calendarSync.provider,
              conflicts: conflicts
            });
          }
        } catch (error) {
          console.error(`Failed to check conflicts for ${calendarSync.provider}:`, error);
          // Continue checking other providers
        }
      }

      return {
        hasConflicts: allConflicts.length > 0,
        conflictsByProvider: allConflicts,
        totalConflicts: allConflicts.reduce((sum, provider) => sum + provider.conflicts.length, 0)
      };
    } catch (error) {
      console.error('Conflict check error:', error);
      throw new Error(`Failed to check for conflicts: ${error.message}`);
    }
  }

  /**
   * Get busy time slots from all calendar providers
   */
  async getBusyTimeSlotsFromAllCalendars(startDate, endDate) {
    try {
      const activeCalendarSyncs = await this.oauthService.getActiveCalendarSyncs();
      const allBusySlots = [];

      for (const calendarSync of activeCalendarSyncs) {
        try {
          const service = this.getCalendarService(calendarSync.provider);
          const { busySlots } = await service.getBusyTimeSlots(calendarSync.id, startDate, endDate);
          
          allBusySlots.push({
            provider: calendarSync.provider,
            busySlots: busySlots
          });
        } catch (error) {
          console.error(`Failed to get busy slots from ${calendarSync.provider}:`, error);
          // Continue with other providers
        }
      }

      // Merge and deduplicate busy slots
      const mergedBusySlots = this.mergeBusySlots(allBusySlots);

      return {
        success: true,
        busySlots: mergedBusySlots,
        providerData: allBusySlots
      };
    } catch (error) {
      console.error('Busy slots fetch error:', error);
      throw new Error(`Failed to fetch busy time slots: ${error.message}`);
    }
  }

  /**
   * Merge busy slots from multiple providers and remove overlaps
   */
  mergeBusySlots(providerData) {
    const allSlots = [];
    
    // Collect all busy slots
    providerData.forEach(provider => {
      provider.busySlots.forEach(slot => {
        allSlots.push({
          start: slot.start,
          end: slot.end,
          summary: slot.summary,
          provider: provider.provider
        });
      });
    });

    // Sort by start time
    allSlots.sort((a, b) => a.start - b.start);

    // Merge overlapping slots
    const mergedSlots = [];
    for (const slot of allSlots) {
      if (mergedSlots.length === 0) {
        mergedSlots.push(slot);
        continue;
      }

      const lastSlot = mergedSlots[mergedSlots.length - 1];
      
      // Check if slots overlap
      if (slot.start <= lastSlot.end) {
        // Merge slots
        lastSlot.end = new Date(Math.max(lastSlot.end.getTime(), slot.end.getTime()));
        lastSlot.summary = `${lastSlot.summary} / ${slot.summary}`;
        lastSlot.provider = `${lastSlot.provider}, ${slot.provider}`;
      } else {
        mergedSlots.push(slot);
      }
    }

    return mergedSlots;
  }

  /**
   * Sync external calendar changes to local appointments
   */
  async syncExternalChangesToLocal(calendarSyncId, startDate, endDate) {
    try {
      const calendarSync = await prisma.calendarSync.findUnique({
        where: { id: calendarSyncId }
      });

      if (!calendarSync || !calendarSync.isActive) {
        throw new Error('Calendar sync not found or inactive');
      }

      const service = this.getCalendarService(calendarSync.provider);
      const { events } = await service.getEvents(calendarSyncId, startDate, endDate);

      // Find appointments that might have been changed externally
      const localAppointments = await prisma.appointment.findMany({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate
          },
          calendarEventId: {
            not: null
          }
        }
      });

      const syncResults = {
        updated: 0,
        deleted: 0,
        conflicts: []
      };

      // Check for deleted events
      for (const appointment of localAppointments) {
        const externalEvent = events.find(event => event.id === appointment.calendarEventId);
        
        if (!externalEvent) {
          // Event was deleted externally
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { 
              status: 'CANCELLED',
              calendarEventId: null
            }
          });
          syncResults.deleted++;
        }
      }

      // Check for updated events
      for (const event of events) {
        const appointment = localAppointments.find(apt => apt.calendarEventId === event.id);
        
        if (appointment) {
          const eventStart = new Date(event.start);
          const appointmentStart = new Date(appointment.scheduledDate);
          
          // Check if times differ (allowing for small differences due to timezone/formatting)
          if (Math.abs(eventStart.getTime() - appointmentStart.getTime()) > 60000) { // 1 minute tolerance
            syncResults.conflicts.push({
              appointmentId: appointment.id,
              localTime: appointmentStart,
              externalTime: eventStart,
              eventSummary: event.summary
            });
          }
        }
      }

      // Update last sync time
      await prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: { 
          lastSyncAt: new Date(),
          syncErrors: null
        }
      });

      return {
        success: true,
        syncResults: syncResults
      };
    } catch (error) {
      console.error('External sync error:', error);
      
      // Update sync errors
      await prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: { 
          syncErrors: error.message,
          updatedAt: new Date()
        }
      });
      
      throw new Error(`Failed to sync external changes: ${error.message}`);
    }
  }

  /**
   * Perform full two-way sync for all active calendars
   */
  async performFullSync() {
    try {
      const activeCalendarSyncs = await this.oauthService.getActiveCalendarSyncs();
      const syncResults = [];

      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      for (const calendarSync of activeCalendarSyncs) {
        try {
          const result = await this.syncExternalChangesToLocal(
            calendarSync.id, 
            startDate, 
            endDate
          );
          
          syncResults.push({
            provider: calendarSync.provider,
            calendarSyncId: calendarSync.id,
            success: true,
            result: result.syncResults
          });
        } catch (error) {
          console.error(`Full sync failed for ${calendarSync.provider}:`, error);
          
          syncResults.push({
            provider: calendarSync.provider,
            calendarSyncId: calendarSync.id,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: syncResults.some(r => r.success),
        results: syncResults,
        totalSyncs: activeCalendarSyncs.length,
        successfulSyncs: syncResults.filter(r => r.success).length
      };
    } catch (error) {
      console.error('Full sync error:', error);
      throw new Error(`Failed to perform full sync: ${error.message}`);
    }
  }

  /**
   * Get sync status for all calendar providers
   */
  async getSyncStatus() {
    try {
      const allCalendarSyncs = await prisma.calendarSync.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const status = allCalendarSyncs.map(sync => ({
        id: sync.id,
        provider: sync.provider,
        isActive: sync.isActive,
        lastSyncAt: sync.lastSyncAt,
        syncErrors: sync.syncErrors,
        createdAt: sync.createdAt,
        updatedAt: sync.updatedAt
      }));

      return {
        success: true,
        totalSyncs: allCalendarSyncs.length,
        activeSyncs: allCalendarSyncs.filter(s => s.isActive).length,
        syncsWithErrors: allCalendarSyncs.filter(s => s.syncErrors).length,
        status: status
      };
    } catch (error) {
      console.error('Sync status error:', error);
      throw new Error(`Failed to get sync status: ${error.message}`);
    }
  }
}

export default CalendarSyncService;