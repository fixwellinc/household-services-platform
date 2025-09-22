import { describe, it, expect, beforeEach } from 'vitest';
import appointmentTemplateService from '../services/appointmentTemplateService.js';

describe('AppointmentTemplateService', () => {
  let mockAppointmentData;

  beforeEach(() => {
    mockAppointmentData = {
      customerName: 'John Doe',
      serviceType: 'Home Inspection',
      appointmentDate: 'Friday, December 15, 2023',
      appointmentTime: '2:00 PM',
      duration: 60,
      propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
      confirmationNumber: 'FW-2023-001',
      notes: 'Please check the kitchen faucet and bathroom tiles'
    };
  });

  describe('renderTemplate', () => {
    it('should render appointment confirmation template with all data', async () => {
      const result = await appointmentTemplateService.renderTemplate('appointment-confirmation', mockAppointmentData);
      
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      
      expect(result.subject).toContain('Appointment Confirmed');
      expect(result.subject).toContain('Home Inspection');
      expect(result.subject).toContain('Friday, December 15, 2023');
      
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Home Inspection');
      expect(result.html).toContain('2:00 PM');
      expect(result.html).toContain('123 Main Street');
      expect(result.html).toContain('FW-2023-001');
      expect(result.html).toContain('Please check the kitchen faucet');
      
      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Home Inspection');
      expect(result.text).toContain('Your appointment has been confirmed');
    });

    it('should render appointment reminder template', async () => {
      const result = await appointmentTemplateService.renderTemplate('appointment-reminder', mockAppointmentData);
      
      expect(result.subject).toContain('Reminder');
      expect(result.subject).toContain('Home Inspection');
      expect(result.subject).toContain('Tomorrow');
      
      expect(result.html).toContain('Friendly Reminder');
      expect(result.html).toContain('Tomorrow');
      expect(result.html).toContain('John Doe');
      
      expect(result.text).toContain('friendly reminder');
      expect(result.text).toContain('TOMORROW');
    });

    it('should render appointment cancellation template', async () => {
      const dataWithReason = {
        ...mockAppointmentData,
        cancellationReason: 'Emergency maintenance required',
        bookingUrl: 'https://fixwell.ca/book'
      };
      
      const result = await appointmentTemplateService.renderTemplate('appointment-cancellation', dataWithReason);
      
      expect(result.subject).toContain('Appointment Cancelled');
      expect(result.subject).toContain('Home Inspection');
      
      expect(result.html).toContain('Appointment Cancelled');
      expect(result.html).toContain('Emergency maintenance required');
      expect(result.html).toContain('https://fixwell.ca/book');
      
      expect(result.text).toContain('cancelled');
      expect(result.text).toContain('Emergency maintenance required');
    });

    it('should render appointment reschedule template', async () => {
      const rescheduleData = {
        ...mockAppointmentData,
        oldAppointmentDate: 'Thursday, December 14, 2023',
        oldAppointmentTime: '10:00 AM',
        rescheduleReason: 'Customer requested different time'
      };
      
      const result = await appointmentTemplateService.renderTemplate('appointment-reschedule', rescheduleData);
      
      expect(result.subject).toContain('Appointment Rescheduled');
      expect(result.subject).toContain('Friday, December 15, 2023');
      
      expect(result.html).toContain('Appointment Rescheduled');
      expect(result.html).toContain('Thursday, December 14, 2023');
      expect(result.html).toContain('10:00 AM');
      expect(result.html).toContain('Customer requested different time');
      
      expect(result.text).toContain('rescheduled');
      expect(result.text).toContain('PREVIOUS APPOINTMENT');
      expect(result.text).toContain('NEW APPOINTMENT');
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        customerName: 'Jane Smith',
        serviceType: 'Plumbing',
        appointmentDate: 'Monday, December 18, 2023',
        appointmentTime: '9:00 AM',
        duration: 30,
        propertyAddress: '456 Oak Avenue',
        confirmationNumber: 'FW-2023-002'
        // notes is missing
      };
      
      const result = await appointmentTemplateService.renderTemplate('appointment-confirmation', minimalData);
      
      expect(result.html).toContain('Jane Smith');
      expect(result.html).toContain('Plumbing');
      expect(result.html).not.toContain('{{notes}}'); // Template variables should be replaced
      expect(result.text).toContain('Jane Smith');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        appointmentTemplateService.renderTemplate('non-existent-template', mockAppointmentData)
      ).rejects.toThrow('Failed to render email template');
    });
  });

  describe('replaceTemplateVariables', () => {
    it('should replace simple template variables', () => {
      const template = 'Hello {{customerName}}, your appointment is on {{appointmentDate}}';
      const data = { customerName: 'John', appointmentDate: 'Friday' };
      
      const result = appointmentTemplateService.replaceTemplateVariables(template, data);
      
      expect(result).toBe('Hello John, your appointment is on Friday');
    });

    it('should handle conditional sections with content', () => {
      const template = 'Hello {{customerName}}{{#notes}}<br>Notes: {{notes}}{{/notes}}';
      const data = { customerName: 'John', notes: 'Special instructions' };
      
      const result = appointmentTemplateService.replaceTemplateVariables(template, data);
      
      expect(result).toBe('Hello John<br>Notes: Special instructions');
    });

    it('should remove conditional sections when data is empty', () => {
      const template = 'Hello {{customerName}}{{#notes}}<br>Notes: {{notes}}{{/notes}}';
      const data = { customerName: 'John', notes: '' };
      
      const result = appointmentTemplateService.replaceTemplateVariables(template, data);
      
      expect(result).toBe('Hello John');
    });

    it('should remove conditional sections when data is missing', () => {
      const template = 'Hello {{customerName}}{{#notes}}<br>Notes: {{notes}}{{/notes}}';
      const data = { customerName: 'John' };
      
      const result = appointmentTemplateService.replaceTemplateVariables(template, data);
      
      expect(result).toBe('Hello John');
    });
  });

  describe('generateSubject', () => {
    it('should generate correct subject for confirmation template', () => {
      const subject = appointmentTemplateService.generateSubject('appointment-confirmation', mockAppointmentData);
      
      expect(subject).toBe('Appointment Confirmed - Home Inspection on Friday, December 15, 2023');
    });

    it('should generate correct subject for reminder template', () => {
      const subject = appointmentTemplateService.generateSubject('appointment-reminder', mockAppointmentData);
      
      expect(subject).toBe('Reminder: Your Home Inspection Appointment Tomorrow');
    });

    it('should generate correct subject for cancellation template', () => {
      const subject = appointmentTemplateService.generateSubject('appointment-cancellation', mockAppointmentData);
      
      expect(subject).toBe('Appointment Cancelled - Home Inspection on Friday, December 15, 2023');
    });

    it('should generate correct subject for reschedule template', () => {
      const subject = appointmentTemplateService.generateSubject('appointment-reschedule', mockAppointmentData);
      
      expect(subject).toBe('Appointment Rescheduled - New Date: Friday, December 15, 2023');
    });

    it('should generate default subject for unknown template', () => {
      const subject = appointmentTemplateService.generateSubject('unknown-template', mockAppointmentData);
      
      expect(subject).toBe('Fixwell Services - Appointment Update');
    });
  });

  describe('validateTemplateData', () => {
    it('should validate required fields for confirmation template', () => {
      const result = appointmentTemplateService.validateTemplateData('appointment-confirmation', mockAppointmentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const incompleteData = {
        customerName: 'John Doe',
        serviceType: 'Home Inspection'
        // Missing other required fields
      };
      
      const result = appointmentTemplateService.validateTemplateData('appointment-confirmation', incompleteData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: appointmentDate');
      expect(result.errors).toContain('Missing required field: appointmentTime');
      expect(result.errors).toContain('Missing required field: propertyAddress');
      expect(result.errors).toContain('Missing required field: confirmationNumber');
      expect(result.errors).toContain('Missing required field: duration');
    });

    it('should validate reschedule template specific fields', () => {
      const rescheduleData = {
        ...mockAppointmentData
        // Missing oldAppointmentDate and oldAppointmentTime
      };
      
      const result = appointmentTemplateService.validateTemplateData('appointment-reschedule', rescheduleData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: oldAppointmentDate');
      expect(result.errors).toContain('Missing required field: oldAppointmentTime');
    });

    it('should handle empty string values as missing', () => {
      const dataWithEmptyStrings = {
        ...mockAppointmentData,
        customerName: '',
        serviceType: '   ' // whitespace only
      };
      
      const result = appointmentTemplateService.validateTemplateData('appointment-confirmation', dataWithEmptyStrings);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: customerName');
      expect(result.errors).toContain('Missing required field: serviceType');
    });
  });

  describe('generateTextVersion', () => {
    it('should generate proper text version for confirmation', () => {
      const text = appointmentTemplateService.generateConfirmationText(mockAppointmentData);
      
      expect(text).toContain('Hi John Doe');
      expect(text).toContain('Your appointment has been confirmed');
      expect(text).toContain('APPOINTMENT DETAILS:');
      expect(text).toContain('Service Type: Home Inspection');
      expect(text).toContain('Date: Friday, December 15, 2023');
      expect(text).toContain('Time: 2:00 PM');
      expect(text).toContain('Duration: 60 minutes');
      expect(text).toContain('Address: 123 Main Street');
      expect(text).toContain('Confirmation #: FW-2023-001');
      expect(text).toContain('Your Notes: Please check the kitchen faucet');
      expect(text).toContain('IMPORTANT INFORMATION:');
      expect(text).toContain('CONTACT US:');
      expect(text).toContain('Phone: (555) 123-4567');
      expect(text).toContain('Making homes better, one fix at a time');
    });

    it('should generate proper text version for reminder', () => {
      const text = appointmentTemplateService.generateReminderText(mockAppointmentData);
      
      expect(text).toContain('Hi John Doe');
      expect(text).toContain('friendly reminder');
      expect(text).toContain('YOUR APPOINTMENT IS TOMORROW!');
      expect(text).toContain('PREPARATION CHECKLIST:');
      expect(text).toContain('✓ Ensure someone will be available');
      expect(text).toContain('✓ Clear access to areas');
      expect(text).toContain('✓ Have your phone available');
      expect(text).toContain('✓ Prepare any questions');
    });

    it('should generate proper text version for cancellation', () => {
      const dataWithReason = {
        ...mockAppointmentData,
        cancellationReason: 'Emergency maintenance',
        bookingUrl: 'https://fixwell.ca/book'
      };
      
      const text = appointmentTemplateService.generateCancellationText(dataWithReason);
      
      expect(text).toContain('appointment has been cancelled');
      expect(text).toContain('CANCELLED APPOINTMENT DETAILS:');
      expect(text).toContain('Cancellation Reason: Emergency maintenance');
      expect(text).toContain('READY TO RESCHEDULE?');
      expect(text).toContain('Book a new appointment: https://fixwell.ca/book');
      expect(text).toContain('We apologize for any inconvenience');
    });

    it('should generate proper text version for reschedule', () => {
      const rescheduleData = {
        ...mockAppointmentData,
        oldAppointmentDate: 'Thursday, December 14, 2023',
        oldAppointmentTime: '10:00 AM',
        rescheduleReason: 'Customer request'
      };
      
      const text = appointmentTemplateService.generateRescheduleText(rescheduleData);
      
      expect(text).toContain('successfully rescheduled');
      expect(text).toContain('PREVIOUS APPOINTMENT (CANCELLED):');
      expect(text).toContain('Date: Thursday, December 14, 2023');
      expect(text).toContain('Time: 10:00 AM');
      expect(text).toContain('NEW APPOINTMENT (CONFIRMED):');
      expect(text).toContain('Reason for Rescheduling: Customer request');
      expect(text).toContain('IMPORTANT REMINDERS:');
    });

    it('should handle missing optional fields in text generation', () => {
      const minimalData = {
        customerName: 'Jane Smith',
        serviceType: 'Plumbing',
        appointmentDate: 'Monday, December 18, 2023',
        appointmentTime: '9:00 AM',
        duration: 30,
        propertyAddress: '456 Oak Avenue',
        confirmationNumber: 'FW-2023-002'
        // notes is missing
      };
      
      const text = appointmentTemplateService.generateConfirmationText(minimalData);
      
      expect(text).toContain('Jane Smith');
      expect(text).toContain('Plumbing');
      expect(text).not.toContain('Your Notes:'); // Should not include notes section
    });
  });
});