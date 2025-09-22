import emailService from './email.js';
import appointmentTemplateService from './appointmentTemplateService.js';
import { format, parseISO, addHours, subHours, isAfter, isBefore } from 'date-fns';

class AppointmentNotificationService {
  constructor() {
    this.emailQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.isProcessing = false;
  }

  /**
   * Send appointment confirmation email
   * @param {Object} appointment - Appointment data
   * @returns {Promise<Object>} - Send result
   */
  async sendConfirmationEmail(appointment) {
    try {
      const templateData = this.formatAppointmentData(appointment);
      const { subject, html, text } = await appointmentTemplateService.renderTemplate(
        'appointment-confirmation',
        templateData
      );

      const result = await this.sendEmailWithRetry({
        to: appointment.customerEmail,
        subject,
        html,
        text,
        appointmentId: appointment.id,
        type: 'confirmation'
      });

      console.log(`Confirmation email sent for appointment ${appointment.id}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to send confirmation email for appointment ${appointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Send appointment reminder email
   * @param {Object} appointment - Appointment data
   * @returns {Promise<Object>} - Send result
   */
  async sendReminderEmail(appointment) {
    try {
      const templateData = this.formatAppointmentData(appointment);
      const { subject, html, text } = await appointmentTemplateService.renderTemplate(
        'appointment-reminder',
        templateData
      );

      const result = await this.sendEmailWithRetry({
        to: appointment.customerEmail,
        subject,
        html,
        text,
        appointmentId: appointment.id,
        type: 'reminder'
      });

      console.log(`Reminder email sent for appointment ${appointment.id}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to send reminder email for appointment ${appointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Send appointment cancellation email
   * @param {Object} appointment - Appointment data
   * @param {string} cancellationReason - Reason for cancellation
   * @param {string} bookingUrl - URL for rebooking
   * @returns {Promise<Object>} - Send result
   */
  async sendCancellationEmail(appointment, cancellationReason = '', bookingUrl = '') {
    try {
      const templateData = {
        ...this.formatAppointmentData(appointment),
        cancellationReason,
        bookingUrl: bookingUrl || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://fixwell-services.com'
      };

      const { subject, html, text } = await appointmentTemplateService.renderTemplate(
        'appointment-cancellation',
        templateData
      );

      const result = await this.sendEmailWithRetry({
        to: appointment.customerEmail,
        subject,
        html,
        text,
        appointmentId: appointment.id,
        type: 'cancellation'
      });

      console.log(`Cancellation email sent for appointment ${appointment.id}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to send cancellation email for appointment ${appointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Send appointment rescheduling email
   * @param {Object} newAppointment - New appointment data
   * @param {Object} oldAppointment - Old appointment data
   * @param {string} rescheduleReason - Reason for rescheduling
   * @returns {Promise<Object>} - Send result
   */
  async sendRescheduleEmail(newAppointment, oldAppointment, rescheduleReason = '') {
    try {
      const templateData = {
        ...this.formatAppointmentData(newAppointment),
        oldAppointmentDate: this.formatDate(oldAppointment.scheduledDate),
        oldAppointmentTime: this.formatTime(oldAppointment.scheduledDate),
        rescheduleReason
      };

      const { subject, html, text } = await appointmentTemplateService.renderTemplate(
        'appointment-reschedule',
        templateData
      );

      const result = await this.sendEmailWithRetry({
        to: newAppointment.customerEmail,
        subject,
        html,
        text,
        appointmentId: newAppointment.id,
        type: 'reschedule'
      });

      console.log(`Reschedule email sent for appointment ${newAppointment.id}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to send reschedule email for appointment ${newAppointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Queue appointment notification for later processing
   * @param {string} type - Type of notification (confirmation, reminder, cancellation, reschedule)
   * @param {Object} appointment - Appointment data
   * @param {Object} options - Additional options
   */
  async queueNotification(type, appointment, options = {}) {
    const notification = {
      id: `${appointment.id}-${type}-${Date.now()}`,
      type,
      appointment,
      options,
      attempts: 0,
      createdAt: new Date(),
      scheduledFor: options.scheduledFor || new Date()
    };

    this.emailQueue.push(notification);
    console.log(`Queued ${type} notification for appointment ${appointment.id}`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the email queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Starting email queue processing...');

    while (this.emailQueue.length > 0) {
      const notification = this.emailQueue.shift();
      
      // Check if it's time to send this notification
      if (isAfter(new Date(), notification.scheduledFor)) {
        try {
          await this.processNotification(notification);
        } catch (error) {
          console.error(`Failed to process notification ${notification.id}:`, error);
          
          // Retry logic
          if (notification.attempts < this.retryAttempts) {
            notification.attempts++;
            notification.scheduledFor = new Date(Date.now() + this.retryDelay * notification.attempts);
            this.emailQueue.push(notification);
            console.log(`Requeued notification ${notification.id} for retry ${notification.attempts}`);
          } else {
            console.error(`Max retry attempts reached for notification ${notification.id}`);
          }
        }
      } else {
        // Put it back in the queue for later
        this.emailQueue.push(notification);
      }

      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    console.log('Email queue processing completed');
  }

  /**
   * Process individual notification
   * @param {Object} notification - Notification to process
   */
  async processNotification(notification) {
    const { type, appointment, options } = notification;

    switch (type) {
      case 'confirmation':
        return await this.sendConfirmationEmail(appointment);
      
      case 'reminder':
        return await this.sendReminderEmail(appointment);
      
      case 'cancellation':
        return await this.sendCancellationEmail(
          appointment,
          options.cancellationReason,
          options.bookingUrl
        );
      
      case 'reschedule':
        return await this.sendRescheduleEmail(
          appointment,
          options.oldAppointment,
          options.rescheduleReason
        );
      
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Send email with retry logic
   * @param {Object} emailOptions - Email options
   * @returns {Promise<Object>} - Send result
   */
  async sendEmailWithRetry(emailOptions) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await emailService.sendEmail(emailOptions);
        
        if (result.success) {
          return result;
        } else {
          lastError = new Error(result.error || 'Email send failed');
        }
      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, error.message);
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError;
  }

  /**
   * Format appointment data for email templates
   * @param {Object} appointment - Raw appointment data
   * @returns {Object} - Formatted template data
   */
  formatAppointmentData(appointment) {
    return {
      customerName: appointment.customerName,
      serviceType: appointment.serviceType,
      appointmentDate: this.formatDate(appointment.scheduledDate),
      appointmentTime: this.formatTime(appointment.scheduledDate),
      duration: appointment.duration,
      propertyAddress: appointment.propertyAddress,
      confirmationNumber: appointment.id.toUpperCase(),
      notes: appointment.notes || ''
    };
  }

  /**
   * Format date for display
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted date
   */
  formatDate(date) {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Format time for display
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted time
   */
  formatTime(date) {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  }

  /**
   * Schedule reminder emails for appointments
   * @param {Object} appointment - Appointment data
   * @param {number} hoursBeforeReminder - Hours before appointment to send reminder (default: 24)
   */
  async scheduleReminderEmail(appointment, hoursBeforeReminder = 24) {
    try {
      const appointmentDate = typeof appointment.scheduledDate === 'string' 
        ? parseISO(appointment.scheduledDate) 
        : appointment.scheduledDate;
      
      const reminderTime = subHours(appointmentDate, hoursBeforeReminder);
      
      // Only schedule if reminder time is in the future
      if (isAfter(reminderTime, new Date())) {
        await this.queueNotification('reminder', appointment, {
          scheduledFor: reminderTime
        });
        
        console.log(`Scheduled reminder email for appointment ${appointment.id} at ${reminderTime}`);
      } else {
        console.log(`Reminder time has passed for appointment ${appointment.id}, not scheduling`);
      }
    } catch (error) {
      console.error(`Failed to schedule reminder for appointment ${appointment.id}:`, error);
    }
  }

  /**
   * Handle appointment lifecycle events
   * @param {string} event - Event type (created, updated, cancelled, completed)
   * @param {Object} appointment - Appointment data
   * @param {Object} options - Additional options
   */
  async handleAppointmentEvent(event, appointment, options = {}) {
    try {
      switch (event) {
        case 'created':
          // Send confirmation email immediately
          await this.sendConfirmationEmail(appointment);
          // Schedule reminder email
          await this.scheduleReminderEmail(appointment);
          break;

        case 'updated':
          if (options.oldAppointment && 
              (options.oldAppointment.scheduledDate !== appointment.scheduledDate)) {
            // Send reschedule email
            await this.sendRescheduleEmail(
              appointment,
              options.oldAppointment,
              options.rescheduleReason
            );
            // Schedule new reminder
            await this.scheduleReminderEmail(appointment);
          }
          break;

        case 'cancelled':
          // Send cancellation email
          await this.sendCancellationEmail(
            appointment,
            options.cancellationReason,
            options.bookingUrl
          );
          break;

        case 'completed':
          // Could send completion/feedback email in the future
          console.log(`Appointment ${appointment.id} completed`);
          break;

        default:
          console.warn(`Unknown appointment event: ${event}`);
      }
    } catch (error) {
      console.error(`Failed to handle appointment event ${event} for ${appointment.id}:`, error);
      throw error;
    }
  }

  /**
   * Get queue status
   * @returns {Object} - Queue status information
   */
  getQueueStatus() {
    return {
      queueLength: this.emailQueue.length,
      isProcessing: this.isProcessing,
      pendingNotifications: this.emailQueue.map(n => ({
        id: n.id,
        type: n.type,
        appointmentId: n.appointment.id,
        attempts: n.attempts,
        scheduledFor: n.scheduledFor
      }))
    };
  }

  /**
   * Clear the email queue (for testing purposes)
   */
  clearQueue() {
    this.emailQueue = [];
    this.isProcessing = false;
  }
}

// Create singleton instance
const appointmentNotificationService = new AppointmentNotificationService();

export default appointmentNotificationService;