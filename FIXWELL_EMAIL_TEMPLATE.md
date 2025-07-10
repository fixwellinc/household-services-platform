# Fixwell Subscription Services Email Marketing Template

## Overview

This document describes the Fixwell subscription services email marketing template that has been integrated into the Household Services platform.

## Features

### Email Template
- **Professional HTML Design**: Responsive email template with modern styling
- **Personalization**: Uses `{{name}}` placeholder for recipient personalization
- **Three Subscription Plans**: Starter ($39), Homecare ($59), and Priority ($150)
- **Social Proof**: Includes customer testimonials
- **Call-to-Action**: Prominent "Choose Your Plan" button
- **Contact Information**: Multiple ways to reach Fixwell

### Backend Integration
- **Email Service**: New `sendSubscriptionMarketingEmail()` method in `EmailService`
- **API Endpoint**: `/api/quotes/subscription-marketing-blast` for sending bulk emails
- **File Upload Support**: Excel file upload with Name/Email columns
- **Manual Email Entry**: Text area for entering email addresses manually
- **Error Handling**: Comprehensive error handling and logging

### Admin Interface
- **Template Loading**: "Load Fixwell Template" button to populate the form
- **Direct Send**: "Send Subscription Blast" button for immediate sending
- **Template Management**: Save, load, and delete email templates
- **Preview**: HTML preview with placeholder substitution
- **Test Email**: Send test emails before bulk sending

## How to Use

### 1. Access the Admin Panel
- Navigate to `/admin` in your application
- Log in with admin credentials

### 2. Load the Fixwell Template
- Click on the "Email Blast" tab
- Click the "Load Fixwell Template" button
- The form will be populated with the Fixwell subscription email

### 3. Add Recipients
You can add recipients in two ways:

#### Option A: Excel File Upload
- Prepare an Excel file with columns: `Name`, `Email`
- Click "Choose File" and select your Excel file
- The system will parse and display a preview of recipients

#### Option B: Manual Email Entry
- Enter email addresses in the "Manual Email Addresses" text area
- One email address per line
- The system will automatically filter out empty lines

### 4. Send the Email Blast
- Click "Send Subscription Blast" to send to all recipients
- Or click "Send Test Email" to send a test email first
- The system will show progress and success/error messages

## Email Content

### Subject Line
"Your Home's Personal Fix-It Team for Just $39/Month"

### Key Sections
1. **Opening Hook**: Addresses common homeowner pain points
2. **Value Proposition**: Introduces Fixwell subscription services
3. **Three Plans**: Detailed breakdown of Starter, Homecare, and Priority plans
4. **Benefits**: Why customers love Fixwell
5. **Testimonials**: Real customer quotes
6. **Call-to-Action**: Limited time offer and "Choose Your Plan" button
7. **Contact Information**: Multiple ways to reach Fixwell
8. **Referral Incentive**: 10% off for referring friends

## Customization

### Modifying the Template
1. Load the template using the "Load Fixwell Template" button
2. Edit the subject, body, or HTML content as needed
3. Save as a new template using "Save Template"

### Updating Contact Information
Replace the placeholder text in the template:
- `[Phone Number]` - Replace with actual phone number
- `[Website URL]` - Replace with actual website URL
- `support@fixwell.com` - Update with actual support email

### Changing Pricing
Update the pricing in both the text and HTML versions:
- Starter Plan: $39/month
- Homecare Plan: $59/month  
- Priority Plan: $150/month
- First Month Offer: $19

## Technical Details

### Backend Files Modified
- `apps/backend/src/services/email.js` - Added `sendSubscriptionMarketingEmail()` method
- `apps/backend/src/routes/quotes.js` - Added subscription marketing blast endpoint

### Frontend Files Modified
- `apps/frontend/app/admin/page.tsx` - Added template loading and sending functionality

### Email Tracking
The system includes email tracking features:
- Open tracking via pixel images
- Click tracking for links
- Analytics dashboard for campaign performance

## Best Practices

### Email List Management
- Always test with a small list first
- Use the test email feature before bulk sending
- Monitor bounce rates and engagement metrics
- Respect unsubscribe requests

### Content Optimization
- Keep subject lines under 50 characters
- Use clear, benefit-focused language
- Include multiple contact methods
- Test on different email clients

### Compliance
- Include unsubscribe links
- Use legitimate sender addresses
- Follow CAN-SPAM guidelines
- Respect recipient preferences

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check SMTP configuration in settings
2. **Template not loading**: Ensure JavaScript is enabled
3. **File upload errors**: Verify Excel file format and column names
4. **High bounce rates**: Clean email list and verify addresses

### Support
For technical support with the email marketing system, contact the development team or check the application logs for detailed error messages. 