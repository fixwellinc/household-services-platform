import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CalendarOAuthService {
  constructor() {
    // Prisma client
    this.prisma = prisma;

    // Google OAuth configuration
    this.googleOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Microsoft OAuth configuration
    this.msalConfig = {
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common'
      }
    };
    this.msalClient = new ConfidentialClientApplication(this.msalConfig);

    // Encryption key for token storage (32 bytes for AES-256)
    this.encryptionKey = process.env.CALENDAR_ENCRYPTION_KEY 
      ? Buffer.from(process.env.CALENDAR_ENCRYPTION_KEY, 'hex')
      : crypto.randomBytes(32);
  }

  /**
   * Generate Google Calendar OAuth URL
   */
  generateGoogleAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    return authUrl;
  }

  /**
   * Generate Microsoft Outlook OAuth URL
   */
  generateOutlookAuthUrl() {
    const authCodeUrlParameters = {
      scopes: ['https://graph.microsoft.com/calendars.readwrite'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI,
    };

    return this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange Google authorization code for tokens
   */
  async exchangeGoogleAuthCode(authCode) {
    try {
      const { tokens } = await this.googleOAuth2Client.getToken(authCode);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid tokens received from Google');
      }

      // Get calendar list to find primary calendar
      this.googleOAuth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
      const calendarList = await calendar.calendarList.list();
      
      const primaryCalendar = calendarList.data.items.find(cal => cal.primary);
      if (!primaryCalendar) {
        throw new Error('Primary calendar not found');
      }

      // Encrypt tokens before storage
      const encryptedAccessToken = this.encryptToken(tokens.access_token);
      const encryptedRefreshToken = this.encryptToken(tokens.refresh_token);

      // Store calendar sync configuration
      const calendarSync = await this.prisma.calendarSync.create({
        data: {
          provider: 'google',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          calendarId: primaryCalendar.id,
          isActive: true,
          lastSyncAt: new Date()
        }
      });

      return {
        success: true,
        calendarSync,
        calendarName: primaryCalendar.summary
      };
    } catch (error) {
      console.error('Google OAuth exchange error:', error);
      throw new Error(`Failed to exchange Google auth code: ${error.message}`);
    }
  }

  /**
   * Exchange Microsoft authorization code for tokens
   */
  async exchangeOutlookAuthCode(authCode) {
    try {
      const tokenRequest = {
        code: authCode,
        scopes: ['https://graph.microsoft.com/calendars.readwrite'],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI,
      };

      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      
      if (!response.accessToken) {
        throw new Error('Invalid tokens received from Microsoft');
      }

      // Initialize Graph client to get calendar info
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        }
      });

      // Get primary calendar
      const calendar = await graphClient.api('/me/calendar').get();

      // Encrypt tokens before storage
      const encryptedAccessToken = this.encryptToken(response.accessToken);
      const encryptedRefreshToken = response.refreshToken ? this.encryptToken(response.refreshToken) : null;

      // Store calendar sync configuration
      const calendarSync = await this.prisma.calendarSync.create({
        data: {
          provider: 'outlook',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken || '',
          calendarId: calendar.id,
          isActive: true,
          lastSyncAt: new Date()
        }
      });

      return {
        success: true,
        calendarSync,
        calendarName: calendar.name
      };
    } catch (error) {
      console.error('Outlook OAuth exchange error:', error);
      throw new Error(`Failed to exchange Outlook auth code: ${error.message}`);
    }
  }

  /**
   * Refresh Google access token
   */
  async refreshGoogleToken(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId }
      });

      if (!calendarSync || calendarSync.provider !== 'google') {
        throw new Error('Google calendar sync not found');
      }

      // Decrypt refresh token
      const refreshToken = this.decryptToken(calendarSync.refreshToken);
      
      this.googleOAuth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.googleOAuth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh Google access token');
      }

      // Encrypt new access token
      const encryptedAccessToken = this.encryptToken(credentials.access_token);
      
      // Update stored tokens
      await this.prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: {
          accessToken: encryptedAccessToken,
          syncErrors: null,
          updatedAt: new Date()
        }
      });

      return credentials.access_token;
    } catch (error) {
      console.error('Google token refresh error:', error);
      
      // Update sync errors
      await this.prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: {
          syncErrors: error.message,
          isActive: false,
          updatedAt: new Date()
        }
      });

      throw new Error(`Failed to refresh Google token: ${error.message}`);
    }
  }

  /**
   * Refresh Microsoft access token
   */
  async refreshOutlookToken(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId }
      });

      if (!calendarSync || calendarSync.provider !== 'outlook') {
        throw new Error('Outlook calendar sync not found');
      }

      // For Microsoft Graph, we need to re-authenticate as refresh tokens are not always provided
      // In production, you might want to implement a different strategy
      throw new Error('Outlook token refresh requires re-authentication');
    } catch (error) {
      console.error('Outlook token refresh error:', error);
      
      // Update sync errors
      await this.prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: {
          syncErrors: error.message,
          isActive: false,
          updatedAt: new Date()
        }
      });

      throw new Error(`Failed to refresh Outlook token: ${error.message}`);
    }
  }

  /**
   * Get active calendar sync configurations
   */
  async getActiveCalendarSyncs() {
    return await this.prisma.calendarSync.findMany({
      where: { isActive: true }
    });
  }

  /**
   * Disable calendar sync
   */
  async disableCalendarSync(calendarSyncId) {
    return await this.prisma.calendarSync.update({
      where: { id: calendarSyncId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete calendar sync configuration
   */
  async deleteCalendarSync(calendarSyncId) {
    return await this.prisma.calendarSync.delete({
      where: { id: calendarSyncId }
    });
  }

  /**
   * Encrypt token for secure storage
   */
  encryptToken(token) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt token from storage
   */
  decryptToken(encryptedToken) {
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Validate calendar sync configuration
   */
  async validateCalendarSync(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId }
      });

      if (!calendarSync) {
        return { valid: false, error: 'Calendar sync not found' };
      }

      if (!calendarSync.isActive) {
        return { valid: false, error: 'Calendar sync is disabled' };
      }

      // Try to decrypt tokens to ensure they're valid
      const accessToken = this.decryptToken(calendarSync.accessToken);
      
      if (calendarSync.provider === 'google') {
        // Test Google Calendar API access
        this.googleOAuth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
        await calendar.calendarList.list();
      } else if (calendarSync.provider === 'outlook') {
        // Test Microsoft Graph API access
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });
        await graphClient.api('/me/calendar').get();
      }

      return { valid: true };
    } catch (error) {
      console.error('Calendar sync validation error:', error);
      
      // Update sync errors
      await this.prisma.calendarSync.update({
        where: { id: calendarSyncId },
        data: {
          syncErrors: error.message,
          updatedAt: new Date()
        }
      });

      return { valid: false, error: error.message };
    }
  }
}

export default CalendarOAuthService;