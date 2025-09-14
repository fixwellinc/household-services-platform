import jwt from 'jsonwebtoken';
import winston from 'winston';

// Configure socket logger
const socketLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'socket' },
  transports: [
    new winston.transports.File({ filename: 'logs/socket.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  socketLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class SocketService {
  constructor() {
    this.io = null;
    this.adminSockets = new Map(); // Map of admin user IDs to socket IDs
    this.userSockets = new Map(); // Map of user IDs to socket IDs
    this.chatRooms = new Map(); // Map of chat room IDs to participants
  }

  initialize(io) {
    this.io = io;
    this.setupSocketHandlers();
    socketLogger.info('Socket service initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      socketLogger.info('New client connected', { socketId: socket.id });

      // Authenticate socket connection
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.userId;
          socket.userRole = decoded.role;
          
          // Store socket mapping
          if (decoded.role === 'ADMIN') {
            this.adminSockets.set(decoded.userId, socket.id);
            socket.join('admin-room');
            socketLogger.info('Admin authenticated', { 
              userId: decoded.userId, 
              socketId: socket.id 
            });
          } else {
            this.userSockets.set(decoded.userId, socket.id);
          }

          socket.emit('authenticated', { success: true });
        } catch (error) {
          socketLogger.error('Socket authentication failed', { 
            error: error.message,
            socketId: socket.id 
          });
          socket.emit('authentication-error', { error: 'Invalid token' });
        }
      });

      // Admin-specific handlers
      socket.on('admin:join', () => {
        if (socket.userRole === 'ADMIN') {
          socket.join('admin-room');
          socketLogger.info('Admin joined admin room', { 
            userId: socket.userId,
            socketId: socket.id 
          });
        }
      });

      socket.on('admin:leave', () => {
        if (socket.userRole === 'ADMIN') {
          socket.leave('admin-room');
          socketLogger.info('Admin left admin room', { 
            userId: socket.userId,
            socketId: socket.id 
          });
        }
      });

      // Chat handlers (existing functionality)
      socket.on('join-session', (chatId) => {
        socket.join(chatId);
        
        // Track chat room participants
        if (!this.chatRooms.has(chatId)) {
          this.chatRooms.set(chatId, new Set());
        }
        this.chatRooms.get(chatId).add(socket.id);
        
        socketLogger.info('Socket joined chat session', { 
          socketId: socket.id,
          chatId,
          userId: socket.userId 
        });

        // Notify admins of new chat activity
        if (socket.userRole !== 'ADMIN') {
          this.notifyAdmins('admin:chat-activity', {
            type: 'user-joined',
            chatId,
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('new-message', (data) => {
        if (data && data.chatId) {
          this.io.to(data.chatId).emit('new-message', data);
          
          // Notify admins of new messages
          this.notifyAdmins('admin:new-message', {
            chatId: data.chatId,
            message: data,
            timestamp: new Date().toISOString()
          });
          
          socketLogger.info('Message relayed', { 
            chatId: data.chatId,
            senderId: socket.userId 
          });
        }
      });

      socket.on('typing', (data) => {
        if (data && data.chatId) {
          socket.to(data.chatId).emit('typing', { 
            chatId: data.chatId, 
            sender: data.sender 
          });
        }
      });

      socket.on('stop-typing', (data) => {
        if (data && data.chatId) {
          socket.to(data.chatId).emit('stop-typing', { 
            chatId: data.chatId, 
            sender: data.sender 
          });
        }
      });

      // Dashboard real-time updates
      socket.on('admin:subscribe-dashboard', () => {
        if (socket.userRole === 'ADMIN') {
          socket.join('dashboard-updates');
          socketLogger.info('Admin subscribed to dashboard updates', { 
            userId: socket.userId 
          });
        }
      });

      socket.on('admin:unsubscribe-dashboard', () => {
        if (socket.userRole === 'ADMIN') {
          socket.leave('dashboard-updates');
          socketLogger.info('Admin unsubscribed from dashboard updates', { 
            userId: socket.userId 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        socketLogger.info('Client disconnected', { 
          socketId: socket.id,
          userId: socket.userId 
        });

        // Clean up socket mappings
        if (socket.userId) {
          if (socket.userRole === 'ADMIN') {
            this.adminSockets.delete(socket.userId);
          } else {
            this.userSockets.delete(socket.userId);
          }
        }

        // Clean up chat room tracking
        for (const [chatId, participants] of this.chatRooms.entries()) {
          if (participants.has(socket.id)) {
            participants.delete(socket.id);
            if (participants.size === 0) {
              this.chatRooms.delete(chatId);
            }
          }
        }
      });
    });
  }

  // Admin notification methods
  notifyAdmins(event, data) {
    this.io.to('admin-room').emit(event, data);
    socketLogger.info('Admin notification sent', { event, data });
  }

  notifySpecificAdmin(adminId, event, data) {
    const socketId = this.adminSockets.get(adminId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      socketLogger.info('Specific admin notification sent', { 
        adminId, 
        event, 
        data 
      });
    }
  }

  // User notification methods
  notifyUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      socketLogger.info('User notification sent', { userId, event, data });
    }
  }

  notifyAllUsers(event, data) {
    // Emit to all connected users (excluding admin room)
    this.io.emit(event, data);
    socketLogger.info('Broadcast notification sent', { event, data });
  }

  // Dashboard update methods
  broadcastDashboardUpdate(metrics) {
    this.io.to('dashboard-updates').emit('admin:dashboard-update', { metrics });
    socketLogger.info('Dashboard update broadcasted', { metrics });
  }

  // System alert methods
  broadcastSystemAlert(alert) {
    this.notifyAdmins('admin:system-alert', alert);
    socketLogger.info('System alert broadcasted', { alert });
  }

  // Chat-specific methods
  notifyNewChatMessage(chatId, message) {
    this.io.to(chatId).emit('new-message', message);
    this.notifyAdmins('admin:new-message', {
      chatId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Audit log notifications
  notifyAuditLog(auditData) {
    this.notifyAdmins('admin:audit-log', auditData);
  }

  // Subscription update notifications
  notifySubscriptionUpdate(subscriptionData) {
    this.notifyAdmins('admin:subscription-update', subscriptionData);
    
    // Also notify the specific user if they're connected
    if (subscriptionData.userId) {
      this.notifyUser(subscriptionData.userId, 'subscription-update', subscriptionData);
    }
  }

  // User activity notifications
  notifyUserActivity(activityData) {
    this.notifyAdmins('admin:user-activity', activityData);
  }

  // Bulk operation progress updates
  notifyBulkOperationProgress(operationId, progress) {
    this.notifyAdmins('admin:bulk-operation-progress', {
      operationId,
      progress,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      adminConnections: this.adminSockets.size,
      userConnections: this.userSockets.size,
      activeChatRooms: this.chatRooms.size,
      adminSocketIds: Array.from(this.adminSockets.values()),
      userSocketIds: Array.from(this.userSockets.values())
    };
  }

  // Get active chat rooms
  getActiveChatRooms() {
    const rooms = {};
    for (const [chatId, participants] of this.chatRooms.entries()) {
      rooms[chatId] = {
        participantCount: participants.size,
        participants: Array.from(participants)
      };
    }
    return rooms;
  }

  // Health check method
  isHealthy() {
    return this.io && this.io.engine && this.io.engine.clientsCount >= 0;
  }
}

export default new SocketService();