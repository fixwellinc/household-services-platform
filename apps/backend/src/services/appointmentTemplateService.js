import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AppointmentTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  /**
   * Load and render an appointment email template
   * @param {string} templateName - Name of the template file (without .html extension)
   * @param {Object} data - Data to replace in the template
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      let html = await fs.readFile(templatePath, 'utf8');
      
      // Replace template variables
      html = this.replaceTemplateVariables(html, data);
      
      // Generate subject based on template type
      const subject = this.generateSubject(templateName, data);
      
      // Generate plain text version
      const text = this.generateTextVersion(templateName, data);
      
      return {
        subject,
        html,
        text
      };
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw new Error(`Failed to render email template: ${templateName}`);
    }
  }

  /**
   * Replace template variables in HTML content
   * @param {string} html - HTML template content
   * @param {Object} data - Data to replace variables with
   * @returns {string} - HTML with variables replaced
   */
  replaceTemplateVariables(html, data) {
    let result = html;
    
    // First handle conditional sections {{#variable}}...{{/variable}}
    // We need to handle all possible conditional sections, not just those in data
    const conditionalRegex = /{{#(\w+)}}[\s\S]*?{{\/\1}}/g;
    result = result.replace(conditionalRegex, (match, key) => {
      const value = data[key];
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Keep the content, remove the conditional tags
        return match.replace(new RegExp(`{{#${key}}}`, 'g'), '')
                   .replace(new RegExp(`{{/${key}}}`, 'g'), '');
      } else {
        // Remove the entire conditional section
        return '';
      }
    });
    
    // Then replace simple variables {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key] || '');
    });
    
    // Clean up any remaining template variables that weren't in the data
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  /**
   * Generate email subject based on template type
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data
   * @returns {string} - Email subject
   */
  generateSubject(templateName, data) {
    const subjects = {
      'appointment-confirmation': `Appointment Confirmed - ${data.serviceType} on ${data.appointmentDate}`,
      'appointment-reminder': `Reminder: Your ${data.serviceType} Appointment Tomorrow`,
      'appointment-cancellation': `Appointment Cancelled - ${data.serviceType} on ${data.appointmentDate}`,
      'appointment-reschedule': `Appointment Rescheduled - New Date: ${data.appointmentDate}`
    };
    
    return subjects[templateName] || 'Fixwell Services - Appointment Update';
  }

  /**
   * Generate plain text version of the email
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data
   * @returns {string} - Plain text email content
   */
  generateTextVersion(templateName, data) {
    const textTemplates = {
      'appointment-confirmation': this.generateConfirmationText(data),
      'appointment-reminder': this.generateReminderText(data),
      'appointment-cancellation': this.generateCancellationText(data),
      'appointment-reschedule': this.generateRescheduleText(data)
    };
    
    return textTemplates[templateName] || this.generateGenericText(data);
  }

  /**
   * Generate confirmation email text version
   */
  generateConfirmationText(data) {
    return `
Hi ${data.customerName},

Your appointment has been confirmed!

APPOINTMENT DETAILS:
Service Type: ${data.serviceType}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Duration: ${data.duration} minutes
Address: ${data.propertyAddress}
Confirmation #: ${data.confirmationNumber}

IMPORTANT INFORMATION:
- Please ensure someone is available at the scheduled time
- We'll send you a reminder 24 hours before your appointment
- If you need to reschedule, please contact us at least 24 hours in advance
- Our technician will call you 30 minutes before arrival

${data.notes ? `Your Notes: ${data.notes}` : ''}

CONTACT US:
Phone: (555) 123-4567
Email: support@fixwell.ca
Website: fixwell-services.com

Thank you for choosing Fixwell Services. We're committed to providing you with exceptional home maintenance solutions.

Best regards,
The Fixwell Services Team
Making homes better, one fix at a time
    `.trim();
  }

  /**
   * Generate reminder email text version
   */
  generateReminderText(data) {
    return `
Hi ${data.customerName},

This is a friendly reminder about your upcoming house visit appointment with Fixwell Services.

YOUR APPOINTMENT IS TOMORROW!

APPOINTMENT DETAILS:
Service Type: ${data.serviceType}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Duration: ${data.duration} minutes
Address: ${data.propertyAddress}
Confirmation #: ${data.confirmationNumber}

PREPARATION CHECKLIST:
✓ Ensure someone will be available at the scheduled time
✓ Clear access to areas that need attention
✓ Have your phone available - we'll call 30 minutes before arrival
✓ Prepare any questions or additional concerns you'd like to discuss

${data.notes ? `Your Original Notes: ${data.notes}` : ''}

NEED TO RESCHEDULE OR HAVE QUESTIONS?
Phone: (555) 123-4567
Email: support@fixwell.ca
Website: fixwell-services.com

We're looking forward to serving you tomorrow. Thank you for choosing Fixwell Services!

Best regards,
The Fixwell Services Team
Making homes better, one fix at a time
    `.trim();
  }

  /**
   * Generate cancellation email text version
   */
  generateCancellationText(data) {
    return `
Hi ${data.customerName},

We're writing to inform you that your scheduled appointment has been cancelled.

CANCELLED APPOINTMENT DETAILS:
Service Type: ${data.serviceType}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Address: ${data.propertyAddress}
Confirmation #: ${data.confirmationNumber}

${data.cancellationReason ? `Cancellation Reason: ${data.cancellationReason}` : ''}

READY TO RESCHEDULE?
We understand that schedules can change. We'd love to help you find a new time that works better for you.

Book a new appointment: ${data.bookingUrl || 'fixwell-services.com'}
Or call us directly: (555) 123-4567

${data.notes ? `Your Original Notes: ${data.notes}` : ''}

QUESTIONS OR NEED ASSISTANCE?
Phone: (555) 123-4567
Email: support@fixwell.ca
Website: fixwell-services.com

We apologize for any inconvenience this cancellation may have caused. We value your business and look forward to serving you in the future.

Best regards,
The Fixwell Services Team
Making homes better, one fix at a time
    `.trim();
  }

  /**
   * Generate reschedule email text version
   */
  generateRescheduleText(data) {
    return `
Hi ${data.customerName},

Your appointment has been successfully rescheduled. Please see the updated details below.

PREVIOUS APPOINTMENT (CANCELLED):
Date: ${data.oldAppointmentDate}
Time: ${data.oldAppointmentTime}

NEW APPOINTMENT (CONFIRMED):
Service Type: ${data.serviceType}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Duration: ${data.duration} minutes
Address: ${data.propertyAddress}
Confirmation #: ${data.confirmationNumber}

${data.rescheduleReason ? `Reason for Rescheduling: ${data.rescheduleReason}` : ''}

IMPORTANT REMINDERS:
- Please ensure someone is available at the new scheduled time
- We'll send you a reminder 24 hours before your new appointment
- Our technician will call you 30 minutes before arrival
- If you need to make further changes, please contact us at least 24 hours in advance

${data.notes ? `Your Notes: ${data.notes}` : ''}

QUESTIONS ABOUT YOUR RESCHEDULED APPOINTMENT?
Phone: (555) 123-4567
Email: support@fixwell.ca
Website: fixwell-services.com

Thank you for your flexibility. We appreciate your understanding and look forward to serving you at your new appointment time.

Best regards,
The Fixwell Services Team
Making homes better, one fix at a time
    `.trim();
  }

  /**
   * Generate generic text version
   */
  generateGenericText(data) {
    return `
Hi ${data.customerName},

Thank you for choosing Fixwell Services.

CONTACT US:
Phone: (555) 123-4567
Email: support@fixwell.ca
Website: fixwell-services.com

Best regards,
The Fixwell Services Team
Making homes better, one fix at a time
    `.trim();
  }

  /**
   * Get available template names
   * @returns {Promise<string[]>} - Array of available template names
   */
  async getAvailableTemplates() {
    try {
      const files = await fs.readdir(this.templatesPath);
      return files
        .filter(file => file.startsWith('appointment-') && file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      console.error('Error reading templates directory:', error);
      return [];
    }
  }

  /**
   * Validate template data
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  validateTemplateData(templateName, data) {
    const errors = [];
    
    // Common required fields for all appointment templates
    const commonRequired = ['customerName', 'serviceType', 'appointmentDate', 'appointmentTime', 'propertyAddress'];
    
    commonRequired.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Template-specific validations
    switch (templateName) {
      case 'appointment-confirmation':
        if (!data.confirmationNumber) {
          errors.push('Missing required field: confirmationNumber');
        }
        if (!data.duration) {
          errors.push('Missing required field: duration');
        }
        break;
        
      case 'appointment-reminder':
        if (!data.confirmationNumber) {
          errors.push('Missing required field: confirmationNumber');
        }
        if (!data.duration) {
          errors.push('Missing required field: duration');
        }
        break;
        
      case 'appointment-cancellation':
        if (!data.confirmationNumber) {
          errors.push('Missing required field: confirmationNumber');
        }
        break;
        
      case 'appointment-reschedule':
        if (!data.confirmationNumber) {
          errors.push('Missing required field: confirmationNumber');
        }
        if (!data.duration) {
          errors.push('Missing required field: duration');
        }
        if (!data.oldAppointmentDate) {
          errors.push('Missing required field: oldAppointmentDate');
        }
        if (!data.oldAppointmentTime) {
          errors.push('Missing required field: oldAppointmentTime');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const appointmentTemplateService = new AppointmentTemplateService();

export default appointmentTemplateService;