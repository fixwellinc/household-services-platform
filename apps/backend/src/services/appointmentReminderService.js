import prisma from '../config/database.js';
import notificationDeliveryService from './notificationDeliveryService.js';
import appointmentSocketService from './appointmentSocketService.js';
import winston from 'winston';

// Configure reminder service logger
const reminderLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'appointment-reminders' },
  transports: [
    new winston.transports.File({ filename: 'logs/reminders.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  reminderLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class AppointmentReminderService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the reminder service
   * @param {number} intervalMinutes - How often to check for reminders (default: 60 minutes)
   */
  start(intervalMinutes = 60) {
    if (this.isRunning) {
      reminderLogger.warn('Reminder service is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    // Run immediately on start
    this.processReminders();

    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, intervalMs);

    reminderLogger.info('Appointment reminder service started', {
      intervalMinutes
    });
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (!this.isRunning) {
      reminderLogger.warn('Reminder service is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    reminderLogger.info('Appointment reminder service stopped');
  }

  /**
   * Process appointment reminders
   */
  async processReminders() {
    if (!this.isRunning) {
      return;
    }

    try {
      reminderLogger.info('Processing appointment reminders');

      // Get appointments that need reminders
      const appointmentsNeedingReminders = await this.getAppointmentsNeedingReminders();
      
      if (appointmentsNeedingReminders.length === 0) {
        reminderLogger.info('No appointments need reminders at this time');
        return;
      }

      reminderLogger.info('Found appointments needing reminders', {
        count: appointmentsNeedingReminders.length
      });

      // Send reminders
      const results = await Promise.allSettled(
        appointmentsNeedingReminders.map(appointment => 
          this.sendAppointmentReminder(appointment)
        )
      );

      // Count successes and failures
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      reminderLogger.info('Reminder processing completed', {
        total: appointmentsNeedingReminders.length,
        successful,
        failed
      });

      // Send real-time notifications about upcoming appointments
      if (appointmentsNeedingReminders.length > 0) {
        try {
          appointmentSocketService.notifyUpcomingAppointments(appointmentsNeedingReminders);
        } catch (socketError) {
          reminderLogger.warn('Failed to send socket notifications for upcoming appointments', {
            error: socketError.message
          });
        }
      }

    } catch (error) {
      reminderLogger.error('Error processing reminders', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get appointments that need reminders
   * @returns {Promise<Array>} Appointments needing reminders
   */
  async getAppointmentsNeedingReminders() {
    try {
      // Get all confirmed appointments in the next 48 hours
      const now = new Date();
      const maxReminderTime = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours from now

      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledDate: {
            gte: now,
            lte: maxReminderTime
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              notificationPreferences: true
            }
          },
          notifications: {
            where: {
              channel: 'appointment_reminder',
              status: 'SENT'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      });

      // Filter appointments that actually need reminders
      const appointmentsNeedingReminders = [];

      for (const appointment of upcomingAppointments) {
        const customer = appointment.customer;
        if (!customer || !customer.notificationPreferences) {
          continue;
        }

        const preferences = customer.notificationPreferences;
        
        // Skip if reminders are disabled
        if (!preferences.appointmentReminder) {
          continue;
        }

        // Calculate when reminder should be sent
        const reminderTime = new Date(
          appointment.scheduledDate.getTime() - (preferences.reminderHoursBefore * 60 * 60 * 1000)
        );

        // Skip if it's not time for reminder yet
        if (now < reminderTime) {
          continue;
        }

        // Check if reminder was already sent recently
        const lastReminder = appointment.notifications[0];
        if (lastReminder) {
          const timeSinceLastReminder = now.getTime() - lastReminder.createdAt.getTime();
          const minTimeBetweenReminders = 12 * 60 * 60 * 1000; // 12 hours
          
          if (timeSinceLastReminder < minTimeBetweenReminders) {
            continue; // Skip if reminder was sent recently
          }
        }

        appointmentsNeedingReminders.push(appointment);
      }

      return appointmentsNeedingReminders;
    } catch (error) {
      reminderLogger.error('Error getting appointments needing reminders', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send reminder for a specific appointment
   * @param {Object} appointment - Appointment data with customer info
   */
  async sendAppointmentReminder(appointment) {
    try {
      const customer = appointment.customer;
      
      // Calculate hours until appointment
      const now = new Date();
      const hoursUntil = Math.round((appointment.scheduledDate.getTime() - now.getTime()) / (60 * 60 * 1000));

      const templateData = {
        hoursUntil,
        isUrgent: hoursUntil <= 2,
        formattedDate: appointment.scheduledDate.toLocaleDateString(),
        formattedTime: appointment.scheduledDate.toLocaleTimeString()
      };

      // Send reminder notification
      const deliveries = await notificationDeliveryService.sendAppointmentNotification(
        appointment,
        'appointment_reminder',
        templateData
      );

      reminderLogger.info('Appointment reminder sent', {
        appointmentId: appointment.id,
        customerId: customer.id,
        customerEmail: customer.email,
        hoursUntil,
        deliveryCount: deliveries.length
      });

      return deliveries;
    } catch (error) {
      reminderLogger.error('Error sending appointment reminder', {
        appointmentId: appointment.id,
        customerId: appointment.customer?.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send daily appointment summary to admins
   */
  async sendDailyAppointmentSummary() {
    try {
      reminderLogger.info('Sending daily appointment summary');

      // Get appointments for today and tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const [todayAppointments, tomorrowAppointments] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            scheduledDate: {
              gte: today,
              lt: tomorrow
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        }),
        prisma.appointment.findMany({
          where: {
            scheduledDate: {
              gte: tomorrow,
              lt: dayAfterTomorrow
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        })
      ]);

      const summaryData = {
        date: today.toDateString(),
        todayAppointments,
        tomorrowAppointments,
        todayCount: todayAppointments.length,
        tomorrowCount: tomorrowAppointments.length,
        totalUpcoming: todayAppointments.length + tomorrowAppointments.length
      };

      // Send summary to admins
      const deliveries = await notificationDeliveryService.sendAdminNotification(
        'daily_appointment_summary',
        summaryData
      );

      reminderLogger.info('Daily appointment summary sent', {
        todayCount: todayAppointments.length,
        tomorrowCount: tomorrowAppointments.length,
        adminCount: deliveries.length
      });

      return deliveries;
    } catch (error) {
      reminderLogger.error('Error sending daily appointment summary', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send urgent appointment alerts for appointments within 2 hours
   */
  async sendUrgentAppointmentAlerts() {
    try {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));

      const urgentAppointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledDate: {
            gte: now,
            lte: twoHoursFromNow
          }
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      });

      if (urgentAppointments.length === 0) {
        return [];
      }

      const alertData = {
        urgentAppointments,
        count: urgentAppointments.length,
        timeframe: '2 hours'
      };

      // Send urgent alerts to admins
      const deliveries = await notificationDeliveryService.sendAdminNotification(
        'urgent_appointment_alert',
        alertData
      );

      reminderLogger.info('Urgent appointment alerts sent', {
        appointmentCount: urgentAppointments.length,
        adminCount: deliveries.length
      });

      return deliveries;
    } catch (error) {
      reminderLogger.error('Error sending urgent appointment alerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get reminder service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.intervalId,
      startTime: this.startTime || null
    };
  }

  /**
   * Process reminders manually (for testing or admin trigger)
   * @returns {Promise<Object>} Processing results
   */
  async processRemindersManually() {
    try {
      const startTime = new Date();
      
      await this.processReminders();
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        success: true,
        startTime,
        endTime,
        duration,
        message: 'Reminders processed successfully'
      };
    } catch (error) {
      reminderLogger.error('Manual reminder processing failed', {
        error: error.message
      });
      throw error;
    }
  }
}

export default new AppointmentReminderService();