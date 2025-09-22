import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CalendarOAuthService from '../services/calendarOAuthService.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Mock external dependencies
const mockGoogleOAuth2Client = {
  generateAuthUrl: vi.fn(),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn()
};

const mockMsalClient = {
  getAuthCodeUrl: vi.fn(),
  acquireTokenByCode: vi.fn()
};

const mockGraphClient = {
  api: vi.fn().mockReturnThis(),
  get: vi.fn()
};

const mockCalendarApi = {
  calendarList: {
    list: vi.fn()
  }
};

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => mockGoogleOAuth2Client)
    },
    calendar: vi.fn(() => mockCalendarApi)
  }
}));

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: vi.fn(() => mockGraphClient)
  }
}));

vi.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: vi.fn(() => mockMsalClient)
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    calendarSync: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }))
}));

describe('CalendarOAuthService', () => {
  let service;
  let mockPrisma;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
    process.env.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret';
    process.env.MICROSOFT_REDIRECT_URI = 'http://localhost:3000/auth/microsoft/callback';
    process.env.CALENDAR_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

    service = new CalendarOAuthService();
    mockPrisma = service.prisma;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateGoogleAuthUrl', () => {
    it('should generate Google OAuth URL with correct scopes', () => {
      const expectedUrl = 'https://accounts.google.com/oauth/authorize?test=true';
      mockGoogleOAuth2Client.generateAuthUrl.mockReturnValue(expectedUrl);

      const result = service.generateGoogleAuthUrl();

      expect(mockGoogleOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        prompt: 'consent'
      });
      expect(result).toBe(expectedUrl);
    });
  });

  describe('generateOutlookAuthUrl', () => {
    it('should generate Outlook OAuth URL with correct scopes', async () => {
      const expectedUrl = 'https://login.microsoftonline.com/oauth/authorize?test=true';
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(expectedUrl);

      const result = await service.generateOutlookAuthUrl();

      expect(mockMsalClient.getAuthCodeUrl).toHaveBeenCalledWith({
        scopes: ['https://graph.microsoft.com/calendars.readwrite'],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI,
      });
      expect(result).toBe(expectedUrl);
    });
  });

  describe('exchangeGoogleAuthCode', () => {
    it('should successfully exchange Google auth code for tokens', async () => {
      const authCode = 'test-auth-code';
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token'
      };
      const mockCalendarList = {
        data: {
          items: [
            { id: 'primary-calendar-id', primary: true, summary: 'Primary Calendar' }
          ]
        }
      };
      const mockCalendarSync = {
        id: 'sync-id',
        provider: 'google',
        calendarId: 'primary-calendar-id'
      };

      mockGoogleOAuth2Client.getToken.mockResolvedValue({ tokens: mockTokens });
      mockCalendarApi.calendarList.list.mockResolvedValue(mockCalendarList);
      mockPrisma.calendarSync.create.mockResolvedValue(mockCalendarSync);

      const result = await service.exchangeGoogleAuthCode(authCode);

      expect(mockGoogleOAuth2Client.getToken).toHaveBeenCalledWith(authCode);
      expect(mockGoogleOAuth2Client.setCredentials).toHaveBeenCalledWith(mockTokens);
      expect(mockCalendarApi.calendarList.list).toHaveBeenCalled();
      expect(mockPrisma.calendarSync.create).toHaveBeenCalledWith({
        data: {
          provider: 'google',
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          calendarId: 'primary-calendar-id',
          isActive: true,
          lastSyncAt: expect.any(Date)
        }
      });
      expect(result.success).toBe(true);
      expect(result.calendarName).toBe('Primary Calendar');
    });

    it('should throw error when tokens are invalid', async () => {
      const authCode = 'test-auth-code';
      const mockTokens = {
        access_token: null,
        refresh_token: 'test-refresh-token'
      };

      mockGoogleOAuth2Client.getToken.mockResolvedValue({ tokens: mockTokens });

      await expect(service.exchangeGoogleAuthCode(authCode)).rejects.toThrow('Invalid tokens received from Google');
    });

    it('should throw error when primary calendar not found', async () => {
      const authCode = 'test-auth-code';
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token'
      };
      const mockCalendarList = {
        data: {
          items: [
            { id: 'secondary-calendar-id', primary: false, summary: 'Secondary Calendar' }
          ]
        }
      };

      mockGoogleOAuth2Client.getToken.mockResolvedValue({ tokens: mockTokens });
      mockCalendarApi.calendarList.list.mockResolvedValue(mockCalendarList);

      await expect(service.exchangeGoogleAuthCode(authCode)).rejects.toThrow('Primary calendar not found');
    });
  });

  describe('exchangeOutlookAuthCode', () => {
    it('should successfully exchange Outlook auth code for tokens', async () => {
      const authCode = 'test-auth-code';
      const mockTokenResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };
      const mockCalendar = {
        id: 'outlook-calendar-id',
        name: 'Outlook Calendar'
      };
      const mockCalendarSync = {
        id: 'sync-id',
        provider: 'outlook',
        calendarId: 'outlook-calendar-id'
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse);
      mockGraphClient.api.mockReturnValue(mockGraphClient);
      mockGraphClient.get.mockResolvedValue(mockCalendar);
      mockPrisma.calendarSync.create.mockResolvedValue(mockCalendarSync);

      const result = await service.exchangeOutlookAuthCode(authCode);

      expect(mockMsalClient.acquireTokenByCode).toHaveBeenCalledWith({
        code: authCode,
        scopes: ['https://graph.microsoft.com/calendars.readwrite'],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI,
      });
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/calendar');
      expect(mockGraphClient.get).toHaveBeenCalled();
      expect(mockPrisma.calendarSync.create).toHaveBeenCalledWith({
        data: {
          provider: 'outlook',
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          calendarId: 'outlook-calendar-id',
          isActive: true,
          lastSyncAt: expect.any(Date)
        }
      });
      expect(result.success).toBe(true);
      expect(result.calendarName).toBe('Outlook Calendar');
    });

    it('should throw error when access token is invalid', async () => {
      const authCode = 'test-auth-code';
      const mockTokenResponse = {
        accessToken: null
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse);

      await expect(service.exchangeOutlookAuthCode(authCode)).rejects.toThrow('Invalid tokens received from Microsoft');
    });
  });

  describe('refreshGoogleToken', () => {
    it('should successfully refresh Google access token', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        refreshToken: 'encrypted-refresh-token'
      };
      const mockCredentials = {
        access_token: 'new-access-token'
      };

      mockPrisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockGoogleOAuth2Client.refreshAccessToken.mockResolvedValue({ credentials: mockCredentials });
      
      // Mock decryption
      vi.spyOn(service, 'decryptToken').mockReturnValue('decrypted-refresh-token');
      vi.spyOn(service, 'encryptToken').mockReturnValue('encrypted-new-access-token');

      const result = await service.refreshGoogleToken(calendarSyncId);

      expect(mockPrisma.calendarSync.findUnique).toHaveBeenCalledWith({
        where: { id: calendarSyncId }
      });
      expect(mockGoogleOAuth2Client.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'decrypted-refresh-token'
      });
      expect(mockGoogleOAuth2Client.refreshAccessToken).toHaveBeenCalled();
      expect(mockPrisma.calendarSync.update).toHaveBeenCalledWith({
        where: { id: calendarSyncId },
        data: {
          accessToken: 'encrypted-new-access-token',
          syncErrors: null,
          updatedAt: expect.any(Date)
        }
      });
      expect(result).toBe('new-access-token');
    });

    it('should handle refresh token failure and update sync errors', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        refreshToken: 'encrypted-refresh-token'
      };

      mockPrisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      mockGoogleOAuth2Client.refreshAccessToken.mockRejectedValue(new Error('Token expired'));
      vi.spyOn(service, 'decryptToken').mockReturnValue('decrypted-refresh-token');

      await expect(service.refreshGoogleToken(calendarSyncId)).rejects.toThrow('Failed to refresh Google token: Token expired');

      expect(mockPrisma.calendarSync.update).toHaveBeenCalledWith({
        where: { id: calendarSyncId },
        data: {
          syncErrors: 'Token expired',
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('validateCalendarSync', () => {
    it('should validate active Google calendar sync', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        isActive: true,
        accessToken: 'encrypted-access-token'
      };

      mockPrisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);
      vi.spyOn(service, 'decryptToken').mockReturnValue('decrypted-access-token');
      mockCalendarApi.calendarList.list.mockResolvedValue({ data: { items: [] } });

      const result = await service.validateCalendarSync(calendarSyncId);

      expect(result.valid).toBe(true);
      expect(mockGoogleOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'decrypted-access-token'
      });
      expect(mockCalendarApi.calendarList.list).toHaveBeenCalled();
    });

    it('should return invalid for non-existent calendar sync', async () => {
      const calendarSyncId = 'non-existent-id';

      mockPrisma.calendarSync.findUnique.mockResolvedValue(null);

      const result = await service.validateCalendarSync(calendarSyncId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Calendar sync not found');
    });

    it('should return invalid for disabled calendar sync', async () => {
      const calendarSyncId = 'sync-id';
      const mockCalendarSync = {
        id: calendarSyncId,
        provider: 'google',
        isActive: false,
        accessToken: 'encrypted-access-token'
      };

      mockPrisma.calendarSync.findUnique.mockResolvedValue(mockCalendarSync);

      const result = await service.validateCalendarSync(calendarSyncId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Calendar sync is disabled');
    });
  });

  describe('token encryption/decryption', () => {
    it('should encrypt and decrypt tokens correctly', () => {
      const originalToken = 'test-token-123';
      
      const encrypted = service.encryptToken(originalToken);
      const decrypted = service.decryptToken(encrypted);

      expect(encrypted).not.toBe(originalToken);
      expect(encrypted).toContain(':');
      expect(decrypted).toBe(originalToken);
    });
  });

  describe('calendar sync management', () => {
    it('should get active calendar syncs', async () => {
      const mockSyncs = [
        { id: 'sync1', provider: 'google', isActive: true },
        { id: 'sync2', provider: 'outlook', isActive: true }
      ];

      mockPrisma.calendarSync.findMany.mockResolvedValue(mockSyncs);

      const result = await service.getActiveCalendarSyncs();

      expect(mockPrisma.calendarSync.findMany).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual(mockSyncs);
    });

    it('should disable calendar sync', async () => {
      const calendarSyncId = 'sync-id';
      const mockUpdatedSync = { id: calendarSyncId, isActive: false };

      mockPrisma.calendarSync.update.mockResolvedValue(mockUpdatedSync);

      const result = await service.disableCalendarSync(calendarSyncId);

      expect(mockPrisma.calendarSync.update).toHaveBeenCalledWith({
        where: { id: calendarSyncId },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });
      expect(result).toEqual(mockUpdatedSync);
    });

    it('should delete calendar sync', async () => {
      const calendarSyncId = 'sync-id';
      const mockDeletedSync = { id: calendarSyncId };

      mockPrisma.calendarSync.delete.mockResolvedValue(mockDeletedSync);

      const result = await service.deleteCalendarSync(calendarSyncId);

      expect(mockPrisma.calendarSync.delete).toHaveBeenCalledWith({
        where: { id: calendarSyncId }
      });
      expect(result).toEqual(mockDeletedSync);
    });
  });
});