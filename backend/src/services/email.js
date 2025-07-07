import nodemailer from 'nodemailer';
import { config } from '../config/environment.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  async init() {
    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransporter({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
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
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      console.warn('Email service not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: config.smtp.user,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
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
    const subject = 'Welcome to Household Services!';
    const text = `
      Hi ${user.name},
      
      Welcome to Household Services! We're excited to have you on board.
      
      You can now:
      - Browse our services
      - Book appointments
      - Manage your profile
      
      If you have any questions, feel free to contact our support team.
      
      Best regards,
      The Household Services Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Household Services!</h2>
        <p>Hi ${user.name},</p>
        <p>Welcome to Household Services! We're excited to have you on board.</p>
        <h3>You can now:</h3>
        <ul>
          <li>Browse our services</li>
          <li>Book appointments</li>
          <li>Manage your profile</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Household Services Team</p>
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
    const subject = 'Booking Confirmation - Household Services';
    const text = `
      Hi ${user.name},
      
      Your booking has been confirmed!
      
      Service: ${service.name}
      Date: ${new Date(booking.scheduledDate).toLocaleDateString()}
      Time: ${new Date(booking.scheduledDate).toLocaleTimeString()}
      Amount: $${booking.finalAmount}
      
      We'll send you a reminder before your appointment.
      
      Best regards,
      The Household Services Team
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
        <p>Best regards,<br>The Household Services Team</p>
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
      The Household Services Team
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
        <p>Best regards,<br>The Household Services Team</p>
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
      The Household Services Team
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
        <p>Best regards,<br>The Household Services Team</p>
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
      The Household Services Team
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
        <p>Best regards,<br>The Household Services Team</p>
      </div>
    `;

    return this.sendEmail({
      to: quote.email,
      subject,
      text,
      html
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService; 