import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// In-memory storage for demo (in production, use database)
const chatSessions = new Map();
const messages = new Map();

/**
 * Start a new chat session
 */
router.post('/start', async (req, res) => {
  try {
    const { customerName, customerEmail, initialMessage } = req.body;
    
    const chatId = uuidv4();
    const session = {
      id: chatId,
      customerName: customerName || 'Anonymous',
      customerEmail: customerEmail || '',
      status: 'ACTIVE',
      priority: 'NORMAL',
      createdAt: new Date(),
      lastMessageAt: new Date()
    };

    chatSessions.set(chatId, session);
    messages.set(chatId, []);

    // Send notification to owner/managers
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      await notificationService.notifyNewChat({
        customerName: session.customerName,
        message: initialMessage || 'Customer started a chat',
        chatId,
        priority: 'NORMAL'
      });
    }

    res.json({ 
      success: true, 
      chatId,
      message: 'Chat session started successfully'
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start chat session' 
    });
  }
});

/**
 * Send a message in a chat
 */
router.post('/message', async (req, res) => {
  try {
    const { chatId, message, customerName } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat ID and message are required' 
      });
    }

    const session = chatSessions.get(chatId);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat session not found' 
      });
    }

    const newMessage = {
      id: uuidv4(),
      content: message,
      sender: 'customer',
      timestamp: new Date()
    };

    // Store message
    const chatMessages = messages.get(chatId) || [];
    chatMessages.push(newMessage);
    messages.set(chatId, chatMessages);

    // Update session
    session.lastMessageAt = new Date();
    chatSessions.set(chatId, session);

    // Send notification for new message
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      await notificationService.notifyNewChat({
        customerName: customerName || session.customerName,
        message,
        chatId,
        priority: 'NORMAL'
      });
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: newMessage.id
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
 * Get chat messages
 */
router.get('/:chatId/messages', (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMessages = messages.get(chatId) || [];
    
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
 * Get all active chat sessions (admin only)
 */
router.get('/sessions', (req, res) => {
  try {
    const sessions = Array.from(chatSessions.values());
    res.json({ 
      success: true, 
      sessions 
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