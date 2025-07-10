import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import EmailService from '../services/email.js';

const router = express.Router();
const prisma = new PrismaClient();

// Email transport (simple SMTP, configure via .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const emailAnalytics = { opens: {}, clicks: {}, bounces: {} };

// Helper to fetch SMTP settings from DB
async function getSmtpSettings() {
  const keys = [
    'emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom', 'emailSecure', 'emailReplyTo'
  ];
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return {
    host: map.emailHost,
    port: map.emailPort ? parseInt(map.emailPort, 10) : 587,
    auth: {
      user: map.emailUser,
      pass: map.emailPassword
    },
    secure: map.emailSecure === 'true',
    from: map.emailFrom,
    replyTo: map.emailReplyTo || undefined
  };
}

// Public: Submit a quote request
router.post('/submit', async (req, res) => {
  try {
    const { email, userId, serviceId, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }
    const quote = await prisma.quote.create({
      data: {
        email,
        userId,
        serviceId,
        message,
      },
    });
    res.json({ success: true, quote });
  } catch (error) {
    console.error('Quote submit error:', error);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

// Admin: List all quotes
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' } });
    const quotesWithDetails = await Promise.all(quotes.map(async quote => {
      const user = quote.userId ? await prisma.user.findUnique({ where: { id: quote.userId } }) : null;
      const service = quote.serviceId ? await prisma.service.findUnique({ where: { id: quote.serviceId } }) : null;
      return { ...quote, user, service };
    }));
    res.json({ quotes: quotesWithDetails });
  } catch (error) {
    console.error('List quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Admin: Reply to a quote (send email)
router.post('/:id/reply', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, price } = req.body;
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    // Send email
    const smtp = await getSmtpSettings();
    const dynamicTransporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: smtp.auth,
      secure: smtp.secure
    });
    await dynamicTransporter.sendMail({
      from: smtp.from,
      to: quote.email,
      subject: 'Your Quote Request',
      text: `${reply}\n\nPrice: ${price ? `$${price}` : 'See details'}`,
      replyTo: smtp.replyTo
    });
    // Update quote
    await prisma.quote.update({
      where: { id },
      data: {
        adminReply: reply,
        adminReplyPrice: price,
        adminReplySentAt: new Date(),
        status: 'REPLIED',
      },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Reply to quote error:', error);
    res.status(500).json({ error: 'Failed to reply to quote' });
  }
});

// Admin: Email blast for marketing
router.post('/email-blast', authMiddleware, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    let emails = [];
    let names = [];
    let subject = req.body.subject;
    let message = req.body.message;
    let html = req.body.html || message;
    // If file is uploaded, parse Excel
    if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      emails = data.map(row => row.Email || row.email).filter(Boolean);
      names = data.map(row => row.Name || row.name || '');
    } else if (req.body.emails) {
      emails = Array.isArray(req.body.emails) ? req.body.emails : [];
      names = emails.map(() => '');
    }
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails required' });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const name = names[i] || '';
      const trackingId = uuidv4();
      // Tracking pixel
      let htmlWithTracking = html.replace(/\{\{name\}\}/g, name);
      htmlWithTracking += `<img src=\"/api/email-track/open/${trackingId}\" width=\"1\" height=\"1\" style=\"display:none\" alt=\"\" />`;
      // Rewrite links for click tracking
      htmlWithTracking = htmlWithTracking.replace(/href=\"(.*?)\"/g, (match, url) => {
        return `href=\"/api/email-track/click/${trackingId}?redirect=${encodeURIComponent(url)}\"`;
      });
      // Log for analytics
      emailAnalytics.opens[trackingId] = { email, opened: false };
      emailAnalytics.clicks[trackingId] = { email, clicks: 0 };
      // Send email
      const smtp = await getSmtpSettings();
      const dynamicTransporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        auth: smtp.auth,
        secure: smtp.secure
      });
      await dynamicTransporter.sendMail({
        from: smtp.from,
        to: email,
        subject,
        text: message.replace(/\{\{name\}\}/g, name),
        html: htmlWithTracking,
      });
    }
    res.json({ success: true, sent: emails.length });
  } catch (error) {
    console.error('Email blast error:', error);
    res.status(500).json({ error: 'Failed to send email blast' });
  }
});

// Admin: Subscription marketing email blast
router.post('/subscription-marketing-blast', authMiddleware, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    let emails = [];
    let names = [];
    let planType = req.body.planType || 'all';
    
    // If file is uploaded, parse Excel
    if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      emails = data.map(row => row.Email || row.email).filter(Boolean);
      names = data.map(row => row.Name || row.name || '');
    } else if (req.body.emails) {
      emails = Array.isArray(req.body.emails) ? req.body.emails : [];
      names = emails.map(() => '');
    }
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails required' });
    }

    const emailService = new EmailService();
    let sentCount = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const name = names[i] || 'there';
      
      // Create a mock user object for the email service
      const user = {
        email: email,
        name: name
      };

      try {
        const result = await emailService.sendSubscriptionMarketingEmail(user, planType);
        if (result.success) {
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send subscription email to ${email}:`, error);
      }
    }

    res.json({ success: true, sent: sentCount, total: emails.length });
  } catch (error) {
    console.error('Subscription marketing blast error:', error);
    res.status(500).json({ error: 'Failed to send subscription marketing blast' });
  }
});

// Open tracking endpoint
router.get('/email-track/open/:id', (req, res) => {
  const { id } = req.params;
  if (emailAnalytics.opens[id]) {
    emailAnalytics.opens[id].opened = true;
  }
  res.set('Content-Type', 'image/png');
  // 1x1 transparent PNG
  const img = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAn8B9p6Q2wAAAABJRU5ErkJggg==', 'base64');
  res.send(img);
});

// Click tracking endpoint
router.get('/email-track/click/:id', (req, res) => {
  const { id } = req.params;
  const { redirect } = req.query;
  if (emailAnalytics.clicks[id]) {
    emailAnalytics.clicks[id].clicks += 1;
  }
  if (redirect) {
    res.redirect(redirect);
  } else {
    res.send('No redirect URL');
  }
});

// Admin: Send a test email for email blast
router.post('/email-blast-test', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { subject, message, html, to } = req.body;
    if (!to || !subject || !(message || html)) {
      return res.status(400).json({ error: 'To, subject, and message or html required' });
    }
    // Send email
    const smtp = await getSmtpSettings();
    const dynamicTransporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: smtp.auth,
      secure: smtp.secure
    });
    await dynamicTransporter.sendMail({
      from: smtp.from,
      to,
      subject,
      text: message,
      html: html || message,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Test email blast error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Bounce webhook endpoint
router.post('/email-track/bounce', (req, res) => {
  // Example: Accepts { email, reason } in body (adjust for your provider's format)
  const { email, reason } = req.body;
  if (email) {
    emailAnalytics.bounces[email] = reason || 'Unknown';
  }
  res.json({ success: true });
});

// Analytics summary endpoint
router.get('/email-track/analytics', (req, res) => {
  const analytics = Object.keys(emailAnalytics.opens).map(id => {
    const email = emailAnalytics.opens[id].email;
    return {
      email,
      opened: !!emailAnalytics.opens[id].opened,
      clicks: emailAnalytics.clicks[id]?.clicks || 0,
      bounced: !!emailAnalytics.bounces[email],
      bounceReason: emailAnalytics.bounces[email] || null
    };
  });
  res.json({ analytics });
});

export default router; 