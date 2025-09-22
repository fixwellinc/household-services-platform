import socketService from './socketService.js';
import winston from 'winston';

// Configure appointment socket logger
const appointmentSocketLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'appointment-socket' },
  transports: [
    new winston.transports.File({ filename: 'logs/socket.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  appointmentSocketLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class AppointmentSocketService {
  constructor() {
    this.appointmentRooms = new Map(); // Map of appointment IDs to participants
  }

  /**
   * Initialize appointment-specific socket handlers
   * @param {SocketIO.Server} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
    this.setupAppointmentHandlers();
    appointmentSocketLogger.info('Appointment socket service initialized');
  }

  /**
   * Set up appointment-specific socket event handlers
   */
  setupAppointmentHandlers() {
    if (!this.io) {
      appointmentSocketLogger.error('Socket.IO instance not available');
      return;
    }

    // Extend existing socket handlers for appointment events
    this.io.on('connection', (socket) => {
      // Appointment room management
      socket.on('appointment:join', (appointmentId) => {
        if (!appointmentId) {
          socket.emit('appointment:error', { error: 'Appointment ID required' });
          return;
        }

        socket.join(`appointment-${appointmentId}`);
        
        // Track appointment room participants
        if (!this.appointmentRooms.has(appointmentId)) {
          this.appointmentRooms.set(appointmentId, new Set());
        }
        this.appointmentRooms.get(appointmentId).add(socket.id);
        
        appointmentSocketLogger.info('Socket joined appointment room', {
          socketId: socket.id,
          appointmentId,
          userId: socket.userId,
          userRole: socket.userRole
        });

        socket.emit('appointment:joined', { appointmentId });
      });

      socket.on('appointment:leave', (appointmentId) => {
        if (!appointmentId) return;

        socket.leave(`appointment-${appointmentId}`);
        
        // Remove from appointment room tracking
        if (this.appointmentRooms.has(appointmentId)) {
          this.appointmentRooms.get(appointmentId).delete(socket.id);
          if (this.appointmentRooms.get(appointmentId).size === 0) {
            this.appointmentRooms.delete(appointmentId);
          }
        }
        
        appointmentSocketLogger.info('Socket left appointment room', {
          socketId: socket.id,
          appointmentId,
          userId: socket.userId
        });

        socket.emit('appointment:left', { appointmentId });
      });

      // Admin appointment dashboard subscription
      socket.on('admin:subscribe-appointments', () => {
        if (socket.userRole === 'ADMIN') {
          socket.join('admin-appointments');
          appointmentSocketLogger.info('Admin subscribed to appointment updates', {
            userId: socket.userId,
            socketId: socket.id
          });
          socket.emit('admin:appointments-subscribed');
        } else {
          socket.emit('appointment:error', { error: 'Admin access required' });
        }
      });

      socket.on('admin:unsubscribe-appointments', () => {
        if (socket.userRole === 'ADMIN') {
          socket.leave('admin-appointments');
          appointmentSocketLogger.info('Admin unsubscribed from appointment updates', {
            userId: socket.userId,
            socketId: socket.id
          });
          socket.emit('admin:appointments-unsubscribed');
        }
      });

      // Customer appointment subscription
      socket.on('customer:subscribe-appointments', (customerId) => {
        if (socket.userId === customerId || socket.userRole === 'ADMIN') {
          const roomName = `customer-appointments-${customerId}`;
          socket.join(roomName);
          appointmentSocketLogger.info('Customer subscribed to appointment updates', {
            userId: socket.userId,
            customerId,
            room: roomName
          });
          socket.emit('customer:appointments-subscribed', { customerId });
        } else {
          socket.emit('appointment:error', { error: 'Unauthorized access' });
        }
      });

      socket.on('customer:unsubscribe-appointments', (customerId) => {
        if (socket.userId === customerId || socket.userRole === 'ADMIN') {
          const roomName = `customer-appointments-${customerId}`;
          socket.leave(roomName);
          appointmentSocketLogger.info('Customer unsubscribed from appointment updates', {
            userId: socket.userId,
            customerId,
            room: roomName
          });
          socket.emit('customer:appointments-unsubscribed', { customerId });
        }
      });

      // Availability subscription for real-time calendar updates
      socket.on('availability:subscribe', (serviceType) => {
        const roomName = serviceType ? `availability-${serviceType}` : 'availability-general';
        socket.join(roomName);
        appointmentSocketLogger.info('Client subscribed to availability updates', {
          userId: socket.userId,
          serviceType,
          room: roomName
        });
        socket.emit('availability:subscribed', { serviceType });
      });

      socket.on('availability:unsubscribe', (serviceType) => {
        const roomName = serviceType ? `availability-${serviceType}` : 'availability-general';
        socket.leave(roomName);
        appointmentSocketLogger.info('Client unsubscribed from availability updates', {
          userId: socket.userId,
          serviceType,
          room: roomName
        });
        socket.emit('availability:unsubscribed', { serviceType });
      });

      // Clean up appointment rooms on disconnect
      socket.on('disconnect', () => {
        // Clean up appointment room tracking
        for (const [appointmentId, participants] of this.appointmentRooms.entries()) {
          if (participants.has(socket.id)) {
            participants.delete(socket.id);
            if (participants.size === 0) {
              this.appointmentRooms.delete(appointmentId);
            }
          }
        }
      });
    });
  }

  /**
   * Notify admin dashboard of new appointment booking
   * @param {Object} appointment - The appointment data
   */
  notifyNewBooking(appointment) {
    const notificationData = {
      type: 'new_booking',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        status: appointment.status,
        propertyAddress: appointment.propertyAddress
      },
      timestamp: new Date().toISOString()
    };

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:new-booking', notificationData);
    
    // Also notify general admin room (with error handling)
    try {
      if (socketService && socketService.io) {
        socketService.notifyAdmins('admin:appointment-update', notificationData);
      }
    } catch (error) {
      appointmentSocketLogger.warn('Failed to notify general admin room', { error: error.message });
    }

    appointmentSocketLogger.info('New booking notification sent', {
      appointmentId: appointment.id,
      customerEmail: appointment.customerEmail
    });
  }

  /**
   * Notify about appointment status changes
   * @param {Object} appointment - The updated appointment data
   * @param {string} previousStatus - The previous status
   */
  notifyStatusChange(appointment, previousStatus) {
    const notificationData = {
      type: 'status_change',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        status: appointment.status,
        previousStatus
      },
      timestamp: new Date().toISOString()
    };

    // Notify specific appointment room
    this.io.to(`appointment-${appointment.id}`).emit('appointment:status-changed', notificationData);

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:appointment-status-changed', notificationData);

    // Notify customer if they have an active subscription
    if (appointment.customerId) {
      this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-status-changed', notificationData);
    }

    appointmentSocketLogger.info('Status change notification sent', {
      appointmentId: appointment.id,
      previousStatus,
      newStatus: appointment.status
    });
  }

  /**
   * Notify about appointment cancellation
   * @param {Object} appointment - The cancelled appointment data
   * @param {string} reason - Cancellation reason
   */
  notifyCancellation(appointment, reason) {
    const notificationData = {
      type: 'cancellation',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        status: appointment.status
      },
      reason,
      timestamp: new Date().toISOString()
    };

    // Notify specific appointment room
    this.io.to(`appointment-${appointment.id}`).emit('appointment:cancelled', notificationData);

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:appointment-cancelled', notificationData);

    // Notify customer
    if (appointment.customerId) {
      this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-cancelled', notificationData);
    }

    // Update availability for the freed time slot
    this.notifyAvailabilityUpdate(appointment.scheduledDate, appointment.serviceType, 'slot_freed');

    appointmentSocketLogger.info('Cancellation notification sent', {
      appointmentId: appointment.id,
      reason
    });
  }

  /**
   * Notify about appointment reschedule
   * @param {Object} appointment - The rescheduled appointment data
   * @param {Date} previousDate - The previous scheduled date
   */
  notifyReschedule(appointment, previousDate) {
    const notificationData = {
      type: 'reschedule',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        previousDate,
        status: appointment.status
      },
      timestamp: new Date().toISOString()
    };

    // Notify specific appointment room
    this.io.to(`appointment-${appointment.id}`).emit('appointment:rescheduled', notificationData);

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:appointment-rescheduled', notificationData);

    // Notify customer
    if (appointment.customerId) {
      this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-rescheduled', notificationData);
    }

    // Update availability for both old and new time slots
    this.notifyAvailabilityUpdate(previousDate, appointment.serviceType, 'slot_freed');
    this.notifyAvailabilityUpdate(appointment.scheduledDate, appointment.serviceType, 'slot_booked');

    appointmentSocketLogger.info('Reschedule notification sent', {
      appointmentId: appointment.id,
      previousDate,
      newDate: appointment.scheduledDate
    });
  }

  /**
   * Notify about availability changes
   * @param {Date} date - The date affected
   * @param {string} serviceType - The service type affected
   * @param {string} changeType - Type of change (slot_booked, slot_freed, availability_updated)
   */
  notifyAvailabilityUpdate(date, serviceType, changeType) {
    const notificationData = {
      type: changeType,
      date: date,
      serviceType,
      timestamp: new Date().toISOString()
    };

    // Notify general availability subscribers
    this.io.to('availability-general').emit('availability:updated', notificationData);

    // Notify service-specific availability subscribers
    if (serviceType) {
      this.io.to(`availability-${serviceType}`).emit('availability:updated', notificationData);
    }

    appointmentSocketLogger.info('Availability update notification sent', {
      date,
      serviceType,
      changeType
    });
  }

  /**
   * Notify about appointment confirmation
   * @param {Object} appointment - The confirmed appointment data
   */
  notifyConfirmation(appointment) {
    const notificationData = {
      type: 'confirmation',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        status: appointment.status
      },
      timestamp: new Date().toISOString()
    };

    // Notify specific appointment room
    this.io.to(`appointment-${appointment.id}`).emit('appointment:confirmed', notificationData);

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:appointment-confirmed', notificationData);

    // Notify customer
    if (appointment.customerId) {
      this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-confirmed', notificationData);
    }

    appointmentSocketLogger.info('Confirmation notification sent', {
      appointmentId: appointment.id
    });
  }

  /**
   * Notify about appointment completion
   * @param {Object} appointment - The completed appointment data
   */
  notifyCompletion(appointment) {
    const notificationData = {
      type: 'completion',
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        scheduledDate: appointment.scheduledDate,
        status: appointment.status
      },
      timestamp: new Date().toISOString()
    };

    // Notify specific appointment room
    this.io.to(`appointment-${appointment.id}`).emit('appointment:completed', notificationData);

    // Notify admin dashboard
    this.io.to('admin-appointments').emit('admin:appointment-completed', notificationData);

    // Notify customer
    if (appointment.customerId) {
      this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-completed', notificationData);
    }

    appointmentSocketLogger.info('Completion notification sent', {
      appointmentId: appointment.id
    });
  }

  /**
   * Broadcast appointment reminder notifications
   * @param {Array} appointments - Array of appointments with upcoming reminders
   */
  notifyUpcomingAppointments(appointments) {
    appointments.forEach(appointment => {
      const notificationData = {
        type: 'reminder',
        appointment: {
          id: appointment.id,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          serviceType: appointment.serviceType,
          scheduledDate: appointment.scheduledDate,
          status: appointment.status
        },
        timestamp: new Date().toISOString()
      };

      // Notify admin dashboard
      this.io.to('admin-appointments').emit('admin:appointment-reminder', notificationData);

      // Notify customer
      if (appointment.customerId) {
        this.io.to(`customer-appointments-${appointment.customerId}`).emit('customer:appointment-reminder', notificationData);
      }
    });

    appointmentSocketLogger.info('Reminder notifications sent', {
      count: appointments.length
    });
  }

  /**
   * Get appointment room statistics
   * @returns {Object} Statistics about active appointment rooms
   */
  getAppointmentRoomStats() {
    const stats = {
      totalAppointmentRooms: this.appointmentRooms.size,
      appointmentRooms: {}
    };

    for (const [appointmentId, participants] of this.appointmentRooms.entries()) {
      stats.appointmentRooms[appointmentId] = {
        participantCount: participants.size,
        participants: Array.from(participants)
      };
    }

    return stats;
  }

  /**
   * Check if appointment socket service is healthy
   * @returns {boolean} Health status
   */
  isHealthy() {
    return this.io && typeof this.io.emit === 'function';
  }
}

export default new AppointmentSocketService();