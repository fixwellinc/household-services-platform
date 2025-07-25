import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import smsService from '../services/sms.js';
import prisma from '../config/database.js';

const router = express.Router();

/**
 * Get notification settings (persistent)
 */
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    // Try to load from DB first
    const keys = [
      'smsEnabled',
      'ownerPhone',
      'managerPhones',
      'notificationTypes'
    ];
    const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));

    // Fallbacks (env/defaults)
    const result = {
      smsEnabled: map.smsEnabled === undefined ? (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') : map.smsEnabled === 'true',
      ownerPhone: map.ownerPhone || process.env.OWNER_PHONE_NUMBER || '',
      managerPhones: map.managerPhones || process.env.MANAGER_PHONE_NUMBERS || '',
      notificationTypes: map.notificationTypes ? map.notificationTypes.split(',') : (process.env.SMS_NOTIFICATION_TYPES ? process.env.SMS_NOTIFICATION_TYPES.split(',') : ['new_chat', 'urgent_chat'])
    };
    res.json({ success: true, settings: result });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

/**
 * Update notification settings (persistent)
 */
router.post('/settings', requireAdmin, async (req, res) => {
  try {
    const { smsEnabled, ownerPhone, managerPhones, notificationTypes } = req.body;
    // Validate phone numbers
    if (smsEnabled) {
      if (ownerPhone && !smsService.validatePhoneNumber(ownerPhone)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid owner phone number format. Use E.164 format (e.g., +1234567890)' 
        });
      }
      if (managerPhones) {
        const phones = managerPhones.split(',').map(p => p.trim());
        for (const phone of phones) {
          if (phone && !smsService.validatePhoneNumber(phone)) {
            return res.status(400).json({ 
              success: false, 
              error: `Invalid manager phone number: ${phone}. Use E.164 format (e.g., +1234567890)` 
            });
          }
        }
      }
    }
    // Save settings to DB
    const upserts = [
      { key: 'smsEnabled', value: String(!!smsEnabled) },
      { key: 'ownerPhone', value: ownerPhone || '' },
      { key: 'managerPhones', value: managerPhones || '' },
      { key: 'notificationTypes', value: Array.isArray(notificationTypes) ? notificationTypes.join(',') : (notificationTypes || '') }
    ];
    for (const setting of upserts) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

/**
 * Test SMS notification
 */
router.post('/test', requireAdmin, async (req, res) => {
  console.log('Test notification request received:', {
    user: req.user,
    body: req.body,
    headers: req.headers,
    authHeader: req.headers.authorization
  });
  try {
    const { phoneNumber, type = 'new_chat' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' 
      });
    }

    const testData = {
      customerName: 'Test Customer',
      message: 'This is a test message to verify the SMS notification system is working correctly.',
      chatId: 'test-123',
      priority: 'NORMAL'
    };

    const result = await smsService.sendChatNotification(
      phoneNumber,
      testData.customerName,
      testData.message,
      testData.chatId
    );

    if (result.success) {
      res.json({ success: true, message: 'Test SMS sent successfully', sid: result.sid });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send test SMS' });
  }
});

/**
 * Test urgent notification
 */
router.post('/test-urgent', requireAdmin, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' 
      });
    }

    const result = await smsService.sendUrgentNotification(
      phoneNumber,
      'Test Customer',
      'URGENT'
    );

    if (result.success) {
      res.json({ success: true, message: 'Urgent test SMS sent successfully', sid: result.sid });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending urgent test SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send urgent test SMS' });
  }
});

/**
 * Get notification log
 */
router.get('/log', requireAdmin, async (req, res) => {
  try {
    // In production, you'd fetch this from a database
    const log = [
      {
        id: '1',
        type: 'sms',
        recipient: '+1234567890',
        message: 'New chat from John Doe',
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({ success: true, log });
  } catch (error) {
    console.error('Error getting notification log:', error);
    res.status(500).json({ success: false, error: 'Failed to get notification log' });
  }
});

export default router; 