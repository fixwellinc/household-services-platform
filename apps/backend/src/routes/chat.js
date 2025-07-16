import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import notificationService from '../services/notificationService.js';
import { PrismaClient } from '@prisma/client';
import smsService from '../services/sms.js';
import multer from 'multer';
import path from 'path';

const prisma = new PrismaClient();

const router = express.Router();

// File upload config
const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB default
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter
});

/**
 * Start a new chat session (persistent)
 */
router.post('/start', async (req, res) => {
  try {
    console.log('Chat start request received:', req.body);
    
    // Check if Prisma client and models are available
    if (!prisma) {
      throw new Error('Database connection not available');
    }
    
    if (!prisma.chatSession) {
      throw new Error('ChatSession model not available in Prisma client');
    }
    
    const { customerName, customerEmail, initialMessage } = req.body;
    
    console.log('Creating chat session with data:', {
      customerName: customerName || 'Anonymous',
      customerEmail: customerEmail || '',
      status: 'ACTIVE'
    });
    
    const session = await prisma.chatSession.create({
      data: {
        customerName: customerName || 'Anonymous',
        customerEmail: customerEmail || '',
        status: 'ACTIVE',
        messages: initialMessage ? {
          create: [{
            sender: 'customer',
            senderType: 'customer',
            message: initialMessage,
            viaSMS: false
          }]
        } : undefined
      },
    });
    
    console.log('Chat session created successfully:', session.id);
    
    // Send notification to owner/managers
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      try {
        await notificationService.notifyNewChat({
          customerName: session.customerName,
          message: initialMessage || 'Customer started a chat',
          chatId: session.id,
          priority: 'NORMAL'
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't fail the chat creation if notification fails
      }
    }
    
    res.json({
      success: true,
      chatId: session.id,
      message: 'Chat session started successfully'
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      prismaAvailable: !!prisma,
      chatSessionAvailable: !!(prisma && prisma.chatSession)
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Send a message in a chat (persistent)
 */
router.post('/message', async (req, res) => {
  try {
    const { chatId, message, sender = 'customer', senderType = 'customer', viaSMS = false, fileName, fileType, fileUrl } = req.body;
    if (!chatId || (!message && !fileUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID and message or file are required'
      });
    }
    // Ensure session exists
    const session = await prisma.chatSession.findUnique({ where: { id: chatId } });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }
    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: chatId,
        sender,
        senderType,
        message: message || '',
        viaSMS,
        fileName: fileName || null,
        fileType: fileType || null,
        fileUrl: fileUrl || null
      }
    });
    // Emit Socket.IO event to the chat room
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', {
        id: newMessage.id,
        chatSessionId: chatId,
        sender,
        senderType,
        message: newMessage.message,
        viaSMS,
        sentAt: newMessage.sentAt,
        fileName: newMessage.fileName,
        fileType: newMessage.fileType,
        fileUrl: newMessage.fileUrl
      });
    }
    // Optionally notify admin/manager
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && senderType === 'customer') {
      await notificationService.notifyNewChat({
        customerName: session.customerName,
        message: message || '[File Attachment]',
        chatId,
        priority: 'NORMAL'
      });
    }
    // If admin wants to send as SMS and customer phone is available
    let smsResult = null;
    if (viaSMS && senderType === 'admin' && session.customerEmail) {
      // Try to find customer phone by email (if you store phone elsewhere, adjust this lookup)
      const customer = await prisma.user.findUnique({ where: { email: session.customerEmail } });
      if (customer && customer.phone) {
        smsResult = await smsService.sendChatNotification(
          customer.phone,
          session.customerName,
          message || '[File Attachment]',
          chatId
        );
      } else {
        smsResult = { success: false, error: 'Customer phone not found' };
      }
    }
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id,
      sms: smsResult
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * Upload a file for chat (local storage)
 */
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  // Return file info for chat message creation
  res.json({
    success: true,
    file: {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/chat/${req.file.filename}`
    }
  });
});

/**
 * Get chat messages (persistent)
 */
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: chatId },
      orderBy: { sentAt: 'asc' }
    });
    res.json({
      success: true,
      messages: chatMessages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});

/**
 * Mark chat as read by admin
 */
router.post('/:chatId/admin-read', async (req, res) => {
  try {
    const { chatId } = req.params;
    // Update lastAdminReadAt
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { lastAdminReadAt: new Date() }
    });
    // Mark all unread customer messages as read by admin
    await prisma.chatMessage.updateMany({
      where: {
        chatSessionId: chatId,
        senderType: 'customer',
        NOT: { readBy: { has: 'admin' } }
      },
      data: {
        readBy: { push: 'admin' }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking chat as read by admin:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

/**
 * Mark chat as read by customer
 */
router.post('/:chatId/customer-read', async (req, res) => {
  try {
    const { chatId } = req.params;
    // Update lastCustomerReadAt
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { lastCustomerReadAt: new Date() }
    });
    // Mark all unread admin messages as read by customer
    await prisma.chatMessage.updateMany({
      where: {
        chatSessionId: chatId,
        senderType: 'admin',
        NOT: { readBy: { has: 'customer' } }
      },
      data: {
        readBy: { push: 'customer' }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking chat as read by customer:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

/**
 * Update chat session status (archive, resolve, activate)
 */
router.post('/:chatId/status', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'RESOLVED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating chat session status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * Get all chat sessions, filter by status (default: ACTIVE)
 */
router.get('/sessions', async (req, res) => {
  try {
    const { status = 'ACTIVE', search = '' } = req.query;
    // Find sessions by status
    let sessions = await prisma.chatSession.findMany({
      where: { status: status.toString().toUpperCase() },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1 // last message only
        }
      }
    });
    // If search is provided, filter sessions in-memory (for small/medium datasets)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      sessions = sessions.filter(session => {
        const lastMsg = session.messages && session.messages.length > 0 ? session.messages[0].message : '';
        return (
          (session.customerName && session.customerName.toLowerCase().includes(q)) ||
          (session.customerEmail && session.customerEmail.toLowerCase().includes(q)) ||
          (lastMsg && lastMsg.toLowerCase().includes(q))
        );
      });
    }
    // For each session, count unread messages for admin
    const sessionsWithUnread = await Promise.all(sessions.map(async (session) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          chatSessionId: session.id,
          sentAt: {
            gt: session.lastAdminReadAt || new Date(0)
          },
          senderType: 'customer'
        }
      });
      return { ...session, unreadCount };
    }));
    res.json({
      success: true,
      sessions: sessionsWithUnread
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat sessions'
    });
  }
});

export default router; 