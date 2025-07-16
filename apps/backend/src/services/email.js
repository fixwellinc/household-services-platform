import nodemailer from 'nodemailer';
import { config } from '../config/environment.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.settings = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.configureTransporter();
  }

  async loadSettings() {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: ['emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom', 'emailSecure', 'emailReplyTo']
          }
        }
      });
      
      this.settings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('Failed to load email settings:', error);
      this.settings = {};
    }
  }

  async configureTransporter() {
    const host = this.settings.emailHost || config.smtp.host;
    const port = parseInt(this.settings.emailPort) || config.smtp.port;
    const user = this.settings.emailUser || config.smtp.user;
    const pass = this.settings.emailPassword || config.smtp.pass;
    const secure = this.settings.emailSecure === 'true' || config.smtp.secure;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      // Verify connection
      try {
        await this.transporter.verify();
        this.isConfigured = true;
        console.log('Email service configured successfully');
      } catch (error) {
        console.error('Email service configuration failed:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('Email service not configured - SMTP settings missing');
      this.isConfigured = false;
    }
  }

  async reconfigure() {
    await this.loadSettings();
    await this.configureTransporter();
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      console.warn('Email service not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: this.settings.emailFrom || config.smtp.user,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: this.settings.emailReplyTo || config.smtp.user,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Fixwell Services!';
    const text = `
      Hi ${user.name},
      
      Welcome to Fixwell Services! We're excited to have you on board.
      
      You can now:
      - Browse our services
      - Book appointments
      - Manage your profile
      
      If you have any questions, feel free to contact our support team.
      
      Best regards,
      The Fixwell Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Fixwell Services!</h2>
        <p>Hi ${user.name},</p>
        <p>Welcome to Fixwell Services! We're excited to have you on board.</p>
        <h3>You can now:</h3>
        <ul>
          <li>Browse our services</li>
          <li>Book appointments</li>
          <li>Manage your profile</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Fixwell Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Booking confirmation email
  async sendBookingConfirmation(booking, user, service) {
    const subject = 'Booking Confirmation - Fixwell Services';
    const text = `
      Hi ${user.name},
      
      Your booking has been confirmed!
      
      Service: ${service.name}
      Date: ${new Date(booking.scheduledDate).toLocaleDateString()}
      Time: ${new Date(booking.scheduledDate).toLocaleTimeString()}
      Amount: $${booking.finalAmount}
      
      We'll send you a reminder before your appointment.
      
      Best regards,
      The Fixwell Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmation</h2>
        <p>Hi ${user.name},</p>
        <p>Your booking has been confirmed!</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(booking.scheduledDate).toLocaleTimeString()}</p>
          <p><strong>Amount:</strong> $${booking.finalAmount}</p>
        </div>
        <p>We'll send you a reminder before your appointment.</p>
        <p>Best regards,<br>The Fixwell Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Booking reminder email
  async sendBookingReminder(booking, user, service) {
    const subject = 'Reminder: Your Household Service Tomorrow';
    const text = `
      Hi ${user.name},
      
      This is a friendly reminder about your upcoming service appointment.
      
      Service: ${service.name}
      Date: ${new Date(booking.scheduledDate).toLocaleDateString()}
      Time: ${new Date(booking.scheduledDate).toLocaleTimeString()}
      
      Please ensure someone is available at the scheduled time.
      
      Best regards,
      The Fixwell Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Service Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>This is a friendly reminder about your upcoming service appointment.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(booking.scheduledDate).toLocaleTimeString()}</p>
        </div>
        <p>Please ensure someone is available at the scheduled time.</p>
        <p>Best regards,<br>The Fixwell Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Password reset email
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request - Household Services';
    
    const text = `
      Hi ${user.name},
      
      You requested a password reset for your Household Services account.
      
      Click the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
      
      Best regards,
      The Fixwell Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your Household Services account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The Fixwell Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Quote response email
  async sendQuoteResponse(quote, reply, price) {
    const subject = 'Response to Your Quote Request - Household Services';
    
    const text = `
      Hi,
      
      Thank you for your quote request. Here's our response:
      
      ${reply}
      
      ${price ? `Estimated Price: $${price}` : ''}
      
      Please contact us if you have any questions or would like to proceed with the service.
      
      Best regards,
      The Fixwell Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Quote Response</h2>
        <p>Hi,</p>
        <p>Thank you for your quote request. Here's our response:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>${reply}</p>
          ${price ? `<p><strong>Estimated Price:</strong> $${price}</p>` : ''}
        </div>
        <p>Please contact us if you have any questions or would like to proceed with the service.</p>
        <p>Best regards,<br>The Fixwell Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: quote.email,
      subject,
      text,
      html
    });
  }

  // Fixwell Subscription Services Marketing Email
  async sendSubscriptionMarketingEmail(user, planType = 'all') {
    const fs = await import('fs/promises');
    const path = await import('path');
    const subject = "Stop Stressing About Home Repairs - Professional Maintenance for Just $39/Month";
    const text = `
      Hi ${user.name},

      Are you tired of that growing list of home repairs that never seems to get done? That dripping faucet, squeaky door, or flickering light has been on your "to-do" list for months, and finding a reliable handyman feels like a part-time job.

      What if you had a professional fix-it team on speed dial? Introducing Fixwell Subscription Services - your home's personal maintenance team that keeps everything running smoothly, so you can focus on what matters most.

      CHOOSE YOUR PERFECT PLAN:

      🔧 STARTER PLAN - $39/month
      • Quarterly visits (30 min each)
      • Minor repairs & maintenance
      • Lightbulb changes & safety checks
      • FREE annual home inspection
      • Priority scheduling
      • 24/7 emergency support

      🏠 HOMECARE PLAN - $59/month ⭐ MOST POPULAR
      • Monthly visits (1 hour each)
      • Everything in Starter PLUS
      • Gutter cleaning & seasonal maintenance
      • Small drywall repairs & caulking
      • 10% off larger projects
      • FREE annual deep cleaning

      ⭐ PRIORITY PLAN - $150/month
      • 2 visits monthly (2 hours total)
      • Everything above PLUS
      • Same-week emergency callouts
      • Smart home setup & TV mounting
      • FREE consumables included
      • Dedicated account manager

      💎 WHY FIXWELL MEMBERS LOVE US:
      ✅ No More Contractor Hunting
      ✅ Proactive Maintenance
      ✅ Predictable Costs
      ✅ Quality Guaranteed
      ✅ Fully Insured & Bonded
      ✅ Same-Day Response

      🔥 LIMITED TIME OFFER: FIRST MONTH ONLY $19! 🔥

      Ready to never stress about home repairs again?

      📞 Questions? Call us: (555) 123-4567
      🌐 Learn more: https://fixwell-services-platform-production.up.railway.app
      📧 Email us: jm@fixwell.ca

      💡 P.S. Current subscribers get 10% off when they refer friends! Know someone who needs Fixwell? Send them our way!

      Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.

      Best regards,
      The Fixwell Team
      "Making homes better, one fix at a time"
    `;
    
    // Load the new HTML template and replace {{name}}
    const templatePath = path.join(process.cwd(), 'apps', 'backend', 'src', 'templates', 'fixwell_email_blast.html');
    let html = await fs.readFile(templatePath, 'utf8');
    html = html.replace(/\{\{name\}\}/g, user.name || 'there');
    
    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService; 