import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import appointmentSocketService from '../services/appointmentSocketService.js';

describe('AppointmentSocketService', () => {
  let httpServer;
  let io;
  let clientSocket;
  let adminSocket;
  let serverSocket;
  let adminServerSocket;

  beforeEach(async () => {
    // Create HTTP server and Socket.IO instance
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Initialize appointment socket service
    appointmentSocketService.initialize(io);

    // Start server
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });

    const port = httpServer.address().port;

    // Create client sockets
    clientSocket = Client(`http://localhost:${port}`);
    adminSocket = Client(`http://localhost:${port}`);

    // Wait for connections and capture server sockets
    await Promise.all([
      new Promise((resolve) => {
        io.on('connection', (socket) => {
          if (!serverSocket) {
            serverSocket = socket;
            // Mock user authentication
            socket.userId = 'user123';
            socket.userRole = 'USER';
            resolve();
          } else {
            adminServerSocket = socket;
            // Mock admin authentication
            socket.userId = 'admin123';
            socket.userRole = 'ADMIN';
            resolve();
          }
        });
      }),
      new Promise((resolve) => {
        clientSocket.on('connect', resolve);
      }),
      new Promise((resolve) => {
        adminSocket.on('connect', resolve);
      })
    ]);

    // Set up authenticated sockets
    serverSocket.userId = 'user123';
    serverSocket.userRole = 'USER';
    adminServerSocket.userId = 'admin123';
    adminServerSocket.userRole = 'ADMIN';
  });

  afterEach(async () => {
    // Clean up
    if (clientSocket) clientSocket.disconnect();
    if (adminSocket) adminSocket.disconnect();
    if (io) io.close();
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
    }
  });

  describe('Appointment Room Management', () => {
    it('should allow clients to join appointment rooms', (done) => {
      const appointmentId = 'apt123';
      
      clientSocket.on('appointment:joined', (data) => {
        expect(data.appointmentId).toBe(appointmentId);
        
        // Check that the appointment room was tracked
        const stats = appointmentSocketService.getAppointmentRoomStats();
        expect(stats.totalAppointmentRooms).toBe(1);
        expect(stats.appointmentRooms[appointmentId]).toBeDefined();
        expect(stats.appointmentRooms[appointmentId].participantCount).toBe(1);
        
        done();
      });

      clientSocket.emit('appointment:join', appointmentId);
    });

    it('should allow clients to leave appointment rooms', (done) => {
      const appointmentId = 'apt123';
      
      // First join the room
      clientSocket.emit('appointment:join', appointmentId);
      
      clientSocket.on('appointment:left', (data) => {
        expect(data.appointmentId).toBe(appointmentId);
        
        // Check that the appointment room was cleaned up
        const stats = appointmentSocketService.getAppointmentRoomStats();
        expect(stats.totalAppointmentRooms).toBe(0);
        
        done();
      });

      // Wait a bit then leave
      setTimeout(() => {
        clientSocket.emit('appointment:leave', appointmentId);
      }, 50);
    });

    it('should handle invalid appointment room operations', (done) => {
      clientSocket.on('appointment:error', (data) => {
        expect(data.error).toBe('Appointment ID required');
        done();
      });

      clientSocket.emit('appointment:join', null);
    });
  });

  describe('Admin Appointment Subscriptions', () => {
    it('should allow admins to subscribe to appointment updates', (done) => {
      adminSocket.on('admin:appointments-subscribed', () => {
        done();
      });

      // Mock admin authentication on server socket
      adminServerSocket.userRole = 'ADMIN';
      adminSocket.emit('admin:subscribe-appointments');
    });

    it('should reject non-admin subscription attempts', (done) => {
      clientSocket.on('appointment:error', (data) => {
        expect(data.error).toBe('Admin access required');
        done();
      });

      clientSocket.emit('admin:subscribe-appointments');
    });

    it('should allow admins to unsubscribe from appointment updates', (done) => {
      // First subscribe
      adminSocket.emit('admin:subscribe-appointments');
      
      adminSocket.on('admin:appointments-unsubscribed', () => {
        done();
      });

      // Wait a bit then unsubscribe
      setTimeout(() => {
        adminSocket.emit('admin:unsubscribe-appointments');
      }, 50);
    });
  });

  describe('Customer Appointment Subscriptions', () => {
    it('should allow customers to subscribe to their own appointments', (done) => {
      const customerId = 'user123';
      
      clientSocket.on('customer:appointments-subscribed', (data) => {
        expect(data.customerId).toBe(customerId);
        done();
      });

      clientSocket.emit('customer:subscribe-appointments', customerId);
    });

    it('should reject unauthorized customer subscription attempts', (done) => {
      const otherCustomerId = 'other456';
      
      clientSocket.on('appointment:error', (data) => {
        expect(data.error).toBe('Unauthorized access');
        done();
      });

      clientSocket.emit('customer:subscribe-appointments', otherCustomerId);
    });

    it('should allow admins to subscribe to any customer appointments', (done) => {
      const customerId = 'user123';
      
      adminSocket.on('customer:appointments-subscribed', (data) => {
        expect(data.customerId).toBe(customerId);
        done();
      });

      adminSocket.emit('customer:subscribe-appointments', customerId);
    });
  });

  describe('Availability Subscriptions', () => {
    it('should allow clients to subscribe to general availability updates', (done) => {
      clientSocket.on('availability:subscribed', (data) => {
        expect(data.serviceType).toBeUndefined();
        done();
      });

      clientSocket.emit('availability:subscribe');
    });

    it('should allow clients to subscribe to service-specific availability updates', (done) => {
      const serviceType = 'plumbing';
      
      clientSocket.on('availability:subscribed', (data) => {
        expect(data.serviceType).toBe(serviceType);
        done();
      });

      clientSocket.emit('availability:subscribe', serviceType);
    });

    it('should allow clients to unsubscribe from availability updates', (done) => {
      const serviceType = 'plumbing';
      
      // First subscribe
      clientSocket.emit('availability:subscribe', serviceType);
      
      clientSocket.on('availability:unsubscribed', (data) => {
        expect(data.serviceType).toBe(serviceType);
        done();
      });

      // Wait a bit then unsubscribe
      setTimeout(() => {
        clientSocket.emit('availability:unsubscribe', serviceType);
      }, 50);
    });
  });

  describe('Real-time Notifications', () => {
    it('should notify admins of new bookings', (done) => {
      const mockAppointment = {
        id: 'apt123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'plumbing',
        scheduledDate: new Date(),
        status: 'PENDING',
        propertyAddress: '123 Main St'
      };

      // Subscribe admin to appointment updates
      adminSocket.emit('admin:subscribe-appointments');

      adminSocket.on('admin:new-booking', (data) => {
        expect(data.type).toBe('new_booking');
        expect(data.appointment.id).toBe(mockAppointment.id);
        expect(data.appointment.customerName).toBe(mockAppointment.customerName);
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyNewBooking(mockAppointment);
      }, 50);
    });

    it('should notify about status changes', (done) => {
      const mockAppointment = {
        id: 'apt123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'plumbing',
        scheduledDate: new Date(),
        status: 'CONFIRMED',
        customerId: 'user123'
      };

      // Subscribe admin to appointment updates
      adminSocket.emit('admin:subscribe-appointments');

      adminSocket.on('admin:appointment-status-changed', (data) => {
        expect(data.type).toBe('status_change');
        expect(data.appointment.id).toBe(mockAppointment.id);
        expect(data.appointment.status).toBe('CONFIRMED');
        expect(data.appointment.previousStatus).toBe('PENDING');
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyStatusChange(mockAppointment, 'PENDING');
      }, 50);
    });

    it('should notify about cancellations', (done) => {
      const mockAppointment = {
        id: 'apt123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'plumbing',
        scheduledDate: new Date(),
        status: 'CANCELLED',
        customerId: 'user123'
      };

      // Subscribe admin to appointment updates
      adminSocket.emit('admin:subscribe-appointments');

      adminSocket.on('admin:appointment-cancelled', (data) => {
        expect(data.type).toBe('cancellation');
        expect(data.appointment.id).toBe(mockAppointment.id);
        expect(data.reason).toBe('Customer request');
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyCancellation(mockAppointment, 'Customer request');
      }, 50);
    });

    it('should notify about reschedules', (done) => {
      const mockAppointment = {
        id: 'apt123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'plumbing',
        scheduledDate: new Date('2024-12-25T10:00:00Z'),
        status: 'CONFIRMED',
        customerId: 'user123'
      };
      const previousDate = new Date('2024-12-24T10:00:00Z');

      // Subscribe admin to appointment updates
      adminSocket.emit('admin:subscribe-appointments');

      adminSocket.on('admin:appointment-rescheduled', (data) => {
        expect(data.type).toBe('reschedule');
        expect(data.appointment.id).toBe(mockAppointment.id);
        expect(data.appointment.previousDate).toEqual(previousDate);
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyReschedule(mockAppointment, previousDate);
      }, 50);
    });

    it('should notify about availability updates', (done) => {
      const date = new Date();
      const serviceType = 'plumbing';

      // Subscribe to availability updates
      clientSocket.emit('availability:subscribe', serviceType);

      clientSocket.on('availability:updated', (data) => {
        expect(data.type).toBe('slot_booked');
        expect(data.serviceType).toBe(serviceType);
        expect(data.date).toEqual(date);
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyAvailabilityUpdate(date, serviceType, 'slot_booked');
      }, 50);
    });

    it('should notify customers about their appointment updates', (done) => {
      const mockAppointment = {
        id: 'apt123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'plumbing',
        scheduledDate: new Date(),
        status: 'CONFIRMED',
        customerId: 'user123'
      };

      // Subscribe customer to their appointments
      clientSocket.emit('customer:subscribe-appointments', 'user123');

      clientSocket.on('customer:appointment-confirmed', (data) => {
        expect(data.type).toBe('confirmation');
        expect(data.appointment.id).toBe(mockAppointment.id);
        done();
      });

      // Wait a bit then trigger notification
      setTimeout(() => {
        appointmentSocketService.notifyConfirmation(mockAppointment);
      }, 50);
    });
  });

  describe('Appointment Room Statistics', () => {
    it('should track appointment room statistics', (done) => {
      // Initially no rooms
      let stats = appointmentSocketService.getAppointmentRoomStats();
      expect(stats.totalAppointmentRooms).toBe(0);

      // Listen for join confirmation
      clientSocket.on('appointment:joined', () => {
        // Check stats after join
        stats = appointmentSocketService.getAppointmentRoomStats();
        expect(stats.totalAppointmentRooms).toBe(1);
        expect(stats.appointmentRooms['apt123']).toBeDefined();
        expect(stats.appointmentRooms['apt123'].participantCount).toBe(1);
        done();
      });

      // Join a room
      clientSocket.emit('appointment:join', 'apt123');
    });
  });

  describe('Health Check', () => {
    it('should report healthy status when properly initialized', () => {
      expect(appointmentSocketService.isHealthy()).toBe(true);
    });

    it('should report unhealthy status when not initialized', () => {
      // Create a new instance with null io
      const newService = Object.create(appointmentSocketService);
      newService.io = null;
      expect(newService.isHealthy()).toBeFalsy();
    });
  });

  describe('Reminder Notifications', () => {
    it('should notify about upcoming appointments', (done) => {
      const mockAppointments = [
        {
          id: 'apt123',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          serviceType: 'plumbing',
          scheduledDate: new Date(),
          status: 'CONFIRMED',
          customerId: 'user123'
        },
        {
          id: 'apt456',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          serviceType: 'electrical',
          scheduledDate: new Date(),
          status: 'CONFIRMED',
          customerId: 'user456'
        }
      ];

      // Subscribe admin to appointment updates
      adminSocket.emit('admin:subscribe-appointments');

      let reminderCount = 0;
      adminSocket.on('admin:appointment-reminder', (data) => {
        expect(data.type).toBe('reminder');
        expect(['apt123', 'apt456']).toContain(data.appointment.id);
        reminderCount++;
        
        if (reminderCount === 2) {
          done();
        }
      });

      // Wait a bit then trigger notifications
      setTimeout(() => {
        appointmentSocketService.notifyUpcomingAppointments(mockAppointments);
      }, 50);
    });
  });
});