# Zoho Email Setup Guide

This guide will help you configure your Fixwell Services application to use Zoho email for sending notifications and transactional emails.

## Prerequisites

1. A Zoho email account (e.g., `yourname@zoho.com`)
2. Access to your Zoho account settings
3. Your application's environment configuration

## Zoho SMTP Configuration

### SMTP Settings
- **SMTP Host:** `smtp.zoho.com`
- **SMTP Port:** `587` (TLS) or `465` (SSL)
- **Security:** TLS (recommended) or SSL
- **Username:** Your full Zoho email address
- **Password:** Your Zoho email password

### Alternative Ports
- **Port 587:** TLS (Transport Layer Security) - Recommended
- **Port 465:** SSL (Secure Sockets Layer)
- **Port 25:** Standard SMTP (not recommended for security)

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file in the backend directory with these settings:

```env
# Email Configuration
SMTP_HOST="smtp.zoho.com"
SMTP_PORT=587
SMTP_USER="your-email@zoho.com"
SMTP_PASS="your-zoho-password"
SMTP_SECURE="false"
```

### 2. Zoho Account Configuration

#### Enable SMTP Access
1. Log in to your Zoho account
2. Go to **Settings** → **Mail Accounts**
3. Select your email account
4. Go to **Security** tab
5. Enable **SMTP** access
6. Save your changes

#### Generate App-Specific Password (Recommended)
1. Go to **Settings** → **Security**
2. Enable **Two-Factor Authentication** (if not already enabled)
3. Go to **App Passwords**
4. Generate a new app password for "SMTP"
5. Use this app password instead of your main password

### 3. Test Your Configuration

#### Using the Admin Panel
1. Start your application
2. Go to the admin panel (`/admin`)
3. Navigate to **Settings** → **Email Configuration**
4. Enter your Zoho SMTP settings:
   - **SMTP Host:** `smtp.zoho.com`
   - **SMTP Port:** `587`
   - **SMTP Username:** `your-email@zoho.com`
   - **SMTP Password:** `your-zoho-password`
   - **From Email:** `your-email@zoho.com`
   - **Reply-To Email:** `your-email@zoho.com`
   - **Use SSL/TLS:** Unchecked (for port 587)
5. Click **Test Email Configuration**
6. Check your email for the test message

#### Using API Endpoint
You can also test via the API:

```bash
curl -X POST http://localhost:5000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "emailSettings": {
      "emailHost": "smtp.zoho.com",
      "emailPort": "587",
      "emailUser": "your-email@zoho.com",
      "emailPassword": "your-zoho-password",
      "emailFrom": "your-email@zoho.com",
      "emailSecure": false
    }
  }'
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failed
- **Cause:** Incorrect username or password
- **Solution:** 
  - Verify your Zoho email and password
  - Use an app-specific password if 2FA is enabled
  - Check that SMTP access is enabled in Zoho settings

#### 2. Connection Timeout
- **Cause:** Firewall or network issues
- **Solution:**
  - Check your firewall settings
  - Try port 465 with SSL enabled
  - Verify your internet connection

#### 3. SSL/TLS Errors
- **Cause:** Incorrect security settings
- **Solution:**
  - For port 587: Set `SMTP_SECURE="false"`
  - For port 465: Set `SMTP_SECURE="true"`
  - Try different ports if issues persist

#### 4. Rate Limiting
- **Cause:** Zoho's sending limits
- **Solution:**
  - Check your Zoho sending limits
  - Implement email queuing for high-volume sending
  - Consider upgrading your Zoho plan

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `EAUTH` | Authentication failed | Check username/password |
| `ECONNECTION` | Connection failed | Check host/port settings |
| `ETIMEDOUT` | Connection timeout | Check network/firewall |
| `EAUTH` | SSL/TLS error | Check security settings |

## Security Best Practices

1. **Use App-Specific Passwords:** Generate dedicated passwords for SMTP access
2. **Enable 2FA:** Protect your Zoho account with two-factor authentication
3. **Regular Password Updates:** Change app passwords periodically
4. **Monitor Usage:** Check Zoho logs for unusual activity
5. **Environment Variables:** Never hardcode credentials in your code

## Production Considerations

### Email Limits
- **Free Plan:** 200 emails/day
- **Paid Plans:** Higher limits based on plan
- **Enterprise:** Custom limits

### Monitoring
- Set up email delivery monitoring
- Implement bounce handling
- Monitor spam complaints
- Track email open rates

### Backup Configuration
Consider having a backup email provider (like SendGrid or Mailgun) for redundancy.

## Support

If you encounter issues:
1. Check Zoho's SMTP documentation
2. Verify your account settings
3. Test with a simple SMTP client
4. Contact Zoho support if needed

## Additional Resources

- [Zoho SMTP Documentation](https://www.zoho.com/mail/help/zoho-mail-smtp-settings.html)
- [Zoho Security Settings](https://www.zoho.com/mail/help/security-settings.html)
- [Nodemailer Documentation](https://nodemailer.com/smtp/) 