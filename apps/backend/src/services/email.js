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
      this.transporter = nodemailer.createTransporter({
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
    const subject = 'Your Home\'s Personal Fix-It Team for Just $39/Month';
    
    const text = `
      Hi ${user.name},

      How many times have you put off that squeaky door, loose cabinet handle, or flickering light because finding a reliable handyman feels like a hassle?

      What if you had a trusted fix-it team on speed dial?

      Introducing Fixwell Subscription Services – your home's personal maintenance team that keeps everything running smoothly, so you don't have to worry about those endless "honey-do" lists.

      Choose Your Perfect Plan:

      🔧 STARTER PLAN - $39/month
      Perfect for light upkeep & peace of mind
      - Quarterly visits (up to 30 minutes each)
      - Minor repairs, lightbulb changes, safety checks
      - FREE annual home inspection
      - Priority scheduling when you need us

      🏠 HOMECARE PLAN - $59/month
      Monthly help for ongoing maintenance
      - Monthly visits (up to 1 hour each)
      - Everything in Starter PLUS gutter cleaning, seasonal maintenance, small drywall repairs
      - 10% off larger projects
      - Emergency visits at standard rates

      ⭐ PRIORITY PLAN - $150/month
      For homeowners who want their home proactively managed
      - 2 visits monthly (up to 2 hours total)
      - Everything above PLUS same-week emergency callouts, smart home setup, TV mounting
      - FREE consumables included (caulk, screws, anchors)
      - 10% off renovations

      Why Fixwell Members Love Us:
      ✓ No More Contractor Hunting - We're already your trusted team
      ✓ Proactive Maintenance - We catch problems before they become expensive
      ✓ Predictable Costs - No surprise bills or inflated "emergency" rates
      ✓ Quality Guaranteed - Professional service you can count on
      ✓ Fully Insured - Your home is protected

      Real Results from Real Customers:
      "I used to dread my growing fix-it list. Now I just text Fixwell and it's handled. Best $59 I spend each month!" - Sarah M.

      "They caught a small leak that could have cost me thousands. The subscription paid for itself in one visit." - Mike T.

      Limited Time: First Month Only $19!

      Ready to never stress about home repairs again?

      Questions? Call us: [Phone Number]
      Learn more: [Website URL]
      Email us: [Email Address]

      P.S. Current subscribers get 10% off when they refer friends. Know someone who needs Fixwell? Send them our way!

      Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.

      Best regards,
      The Fixwell Team
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fixwell Subscription Services</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Fixwell</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your Home's Personal Fix-It Team</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              How many times have you put off that squeaky door, loose cabinet handle, or flickering light because finding a reliable handyman feels like a hassle?
            </p>

            <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">What if you had a trusted fix-it team on speed dial?</h3>
            </div>

            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
              Introducing <strong>Fixwell Subscription Services</strong> – your home's personal maintenance team that keeps everything running smoothly, so you don't have to worry about those endless "honey-do" lists.
            </p>

            <!-- Plans Section -->
            <h3 style="color: #1f2937; margin: 30px 0 20px 0; font-size: 20px;">Choose Your Perfect Plan:</h3>

            <!-- Starter Plan -->
            <div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fafafa;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">🔧</span>
                <h4 style="margin: 0; color: #1f2937; font-size: 18px;">STARTER PLAN - $39/month</h4>
              </div>
              <p style="color: #6b7280; font-style: italic; margin: 0 0 15px 0;">Perfect for light upkeep & peace of mind</p>
              <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Quarterly visits (up to 30 minutes each)</li>
                <li>Minor repairs, lightbulb changes, safety checks</li>
                <li><strong>FREE annual home inspection</strong></li>
                <li>Priority scheduling when you need us</li>
              </ul>
            </div>

            <!-- Homecare Plan -->
            <div style="border: 2px solid #2563eb; border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #f0f9ff; position: relative;">
              <div style="position: absolute; top: -10px; right: 20px; background: #2563eb; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">MOST POPULAR</div>
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">🏠</span>
                <h4 style="margin: 0; color: #1f2937; font-size: 18px;">HOMECARE PLAN - $59/month</h4>
              </div>
              <p style="color: #6b7280; font-style: italic; margin: 0 0 15px 0;">Monthly help for ongoing maintenance</p>
              <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Monthly visits (up to 1 hour each)</li>
                <li>Everything in Starter PLUS gutter cleaning, seasonal maintenance, small drywall repairs</li>
                <li><strong>10% off larger projects</strong></li>
                <li>Emergency visits at standard rates</li>
              </ul>
            </div>

            <!-- Priority Plan -->
            <div style="border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin-bottom: 30px; background: #fffbeb;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">⭐</span>
                <h4 style="margin: 0; color: #1f2937; font-size: 18px;">PRIORITY PLAN - $150/month</h4>
              </div>
              <p style="color: #6b7280; font-style: italic; margin: 0 0 15px 0;">For homeowners who want their home proactively managed</p>
              <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>2 visits monthly (up to 2 hours total)</li>
                <li>Everything above PLUS same-week emergency callouts, smart home setup, TV mounting</li>
                <li><strong>FREE consumables included</strong> (caulk, screws, anchors)</li>
                <li><strong>10% off renovations</strong></li>
              </ul>
            </div>

            <!-- Benefits Section -->
            <h3 style="color: #1f2937; margin: 30px 0 20px 0; font-size: 20px;">Why Fixwell Members Love Us:</h3>
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="color: #4b5563;">No More Contractor Hunting</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="color: #4b5563;">Proactive Maintenance</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="color: #4b5563;">Predictable Costs</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="color: #4b5563;">Quality Guaranteed</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #16a34a; font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="color: #4b5563;">Fully Insured</span>
                </div>
              </div>
            </div>

            <!-- Testimonials -->
            <h3 style="color: #1f2937; margin: 30px 0 20px 0; font-size: 20px;">Real Results from Real Customers:</h3>
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
              <div style="font-style: italic; color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                "I used to dread my growing fix-it list. Now I just text Fixwell and it's handled. Best $59 I spend each month!"
              </div>
              <div style="color: #6b7280; font-weight: bold;">- Sarah M.</div>
            </div>
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
              <div style="font-style: italic; color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                "They caught a small leak that could have cost me thousands. The subscription paid for itself in one visit."
              </div>
              <div style="color: #6b7280; font-weight: bold;">- Mike T.</div>
            </div>

            <!-- CTA Section -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 22px;">Limited Time: First Month Only $19!</h3>
              <p style="color: #fecaca; margin: 0 0 25px 0; font-size: 16px;">Ready to never stress about home repairs again?</p>
              <a href="#" style="background: white; color: #dc2626; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">CHOOSE YOUR PLAN</a>
            </div>

            <!-- Contact Info -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Questions? Contact us:</h4>
              <div style="color: #4b5563; line-height: 1.8;">
                <div><strong>Call us:</strong> [Phone Number]</div>
                <div><strong>Learn more:</strong> <a href="#" style="color: #2563eb;">[Website URL]</a></div>
                <div><strong>Email us:</strong> <a href="mailto:support@fixwell.com" style="color: #2563eb;">support@fixwell.com</a></div>
              </div>
            </div>

            <!-- PS Section -->
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>P.S.</strong> Current subscribers get 10% off when they refer friends. Know someone who needs Fixwell? Send them our way!
              </p>
            </div>

            <!-- Footer Note -->
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="color: #64748b; margin: 0; font-size: 14px; font-style: italic;">
                Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.
              </p>
            </div>

            <p style="color: #4b5563; margin: 30px 0 0 0;">
              Best regards,<br>
              <strong>The Fixwell Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <div style="color: #9ca3af; font-size: 12px; margin-bottom: 15px;">
              <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Unsubscribe</a> |
              <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Update Preferences</a> |
              <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Refer a Friend</a>
            </div>
            <div style="color: #6b7280; font-size: 12px;">
              © 2024 Fixwell Inc. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

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