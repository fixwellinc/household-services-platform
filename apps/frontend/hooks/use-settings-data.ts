"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './use-api';
import { useToast } from './use-toast';

// Types for settings data
export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  adminEmail: string;
}

export interface SecurityConfig {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  auditLogRetention: number;
  requireHttps: boolean;
  corsOrigins: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expirationDays: number;
}

export interface IntegrationConfig {
  // API Management
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  
  // Service Integrations
  services: ServiceIntegration[];
  
  // Third-party Services
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  
  emailServiceEnabled: boolean;
  emailProvider: 'sendgrid' | 'mailgun' | 'ses';
  emailConfig: Record<string, any>;
  
  smsServiceEnabled: boolean;
  smsProvider: 'twilio' | 'nexmo';
  smsConfig: Record<string, any>;
  
  analyticsEnabled: boolean;
  analyticsProvider: 'google' | 'mixpanel';
  analyticsConfig: Record<string, any>;
  
  // Health Monitoring
  healthCheckEnabled: boolean;
  healthCheckInterval: number;
  alertsEnabled: boolean;
  alertWebhookUrl: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered?: Date;
  successRate: number;
}

export interface ServiceIntegration {
  id: string;
  name: string;
  type: 'payment' | 'email' | 'sms' | 'analytics';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync?: Date;
  healthStatus: 'healthy' | 'warning' | 'error';
}

export interface NotificationConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  defaultSender: string;
  templates: NotificationTemplate[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  template: string;
  variables: string[];
  isActive: boolean;
}

export interface AppearanceConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
}

export interface ApplicationSettings {
  system: SystemConfig;
  security: SecurityConfig;
  integrations: IntegrationConfig;
  notifications: NotificationConfig;
  appearance: AppearanceConfig;
}

interface UseSettingsDataOptions {
  section?: 'system' | 'security' | 'integrations' | 'notifications' | 'appearance' | 'all';
  autoFetch?: boolean;
}

interface SettingsData {
  system?: SystemConfig;
  security?: SecurityConfig;
  integrations?: IntegrationConfig;
  notifications?: NotificationConfig;
  appearance?: AppearanceConfig;
}

export function useSettingsData(options: UseSettingsDataOptions = {}) {
  const { section = 'all', autoFetch = true } = options;
  
  const [data, setData] = useState<SettingsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const fetchSettings = useCallback(async (targetSection?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const sectionToFetch = targetSection || section;
      
      if (sectionToFetch === 'all') {
        // Fetch all settings sections
        const [systemRes, securityRes, integrationsRes, notificationsRes, appearanceRes] = await Promise.all([
          request('/admin/settings/system'),
          request('/admin/settings/security'),
          request('/admin/settings/integrations'),
          request('/admin/settings/notifications'),
          request('/admin/settings/appearance')
        ]);
        
        setData({
          system: systemRes.success ? systemRes.config : null,
          security: securityRes.success ? securityRes.config : null,
          integrations: integrationsRes.success ? integrationsRes.config : null,
          notifications: notificationsRes.success ? notificationsRes.config : null,
          appearance: appearanceRes.success ? appearanceRes.config : null
        });
      } else {
        // Fetch specific section
        const response = await request(`/admin/settings/${sectionToFetch}`);
        
        if (response.success) {
          setData(prev => ({
            ...prev,
            [sectionToFetch]: response.config || response.settings
          }));
        } else {
          throw new Error(response.error || `Failed to fetch ${sectionToFetch} settings`);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [request, section]);

  const saveSettings = async (sectionData: any, targetSection: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/settings/${targetSection}`, {
        method: 'PUT',
        body: JSON.stringify(sectionData)
      });
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          [targetSection]: sectionData
        }));
        setHasChanges(false);
        showSuccess(`${targetSection.charAt(0).toUpperCase() + targetSection.slice(1)} settings saved successfully`);
        return true;
      } else {
        throw new Error(response.error || `Failed to save ${targetSection} settings`);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showError(err instanceof Error ? err.message : `Failed to save ${targetSection} settings`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSectionData = (sectionName: string, newData: any) => {
    setData(prev => ({
      ...prev,
      [sectionName]: newData
    }));
    setHasChanges(true);
  };

  const resetSection = async (targetSection: string) => {
    try {
      const response = await request(`/admin/settings/${targetSection}/reset`, {
        method: 'POST'
      });
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          [targetSection]: response.config
        }));
        setHasChanges(false);
        showSuccess(`${targetSection.charAt(0).toUpperCase() + targetSection.slice(1)} settings reset to defaults`);
        return true;
      } else {
        throw new Error(response.error || `Failed to reset ${targetSection} settings`);
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      showError(err instanceof Error ? err.message : `Failed to reset ${targetSection} settings`);
      return false;
    }
  };

  const testConnection = useCallback(async (connectionType: 'email' | 'database' | 'service', serviceId?: string) => {
    try {
      const endpoint = serviceId 
        ? `/admin/settings/test-${connectionType}/${serviceId}`
        : `/admin/settings/test-${connectionType}`;
        
      const response = await request(endpoint, {
        method: 'POST'
      });
      
      if (response.success) {
        showSuccess(`${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)} connection test successful`);
        return true;
      } else {
        throw new Error(response.error || `${connectionType} connection test failed`);
      }
    } catch (err) {
      console.error(`Error testing ${connectionType} connection:`, err);
      showError(err instanceof Error ? err.message : `${connectionType} connection test failed`);
      return false;
    }
  }, [request, showSuccess, showError]);

  // Create API key
  const createApiKey = useCallback(async (name: string, permissions: string[] = ['read']) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name, permissions })
      });
      
      if (response.success) {
        // Update integrations data with new API key
        setData(prev => ({
          ...prev,
          integrations: prev.integrations ? {
            ...prev.integrations,
            apiKeys: [...(prev.integrations.apiKeys || []), response.apiKey]
          } : prev.integrations
        }));
        showSuccess('API key created successfully');
        return response.apiKey;
      } else {
        throw new Error(response.error || 'Failed to create API key');
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      showError(err instanceof Error ? err.message : 'Failed to create API key');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Revoke API key
  const revokeApiKey = useCallback(async (keyId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/api-keys/${keyId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update integrations data by removing the API key
        setData(prev => ({
          ...prev,
          integrations: prev.integrations ? {
            ...prev.integrations,
            apiKeys: (prev.integrations.apiKeys || []).filter(key => key.id !== keyId)
          } : prev.integrations
        }));
        showSuccess('API key revoked successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to revoke API key');
      }
    } catch (err) {
      console.error('Error revoking API key:', err);
      showError(err instanceof Error ? err.message : 'Failed to revoke API key');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Create webhook
  const createWebhook = useCallback(async (name: string, url: string, events: string[] = ['*']) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/webhooks', {
        method: 'POST',
        body: JSON.stringify({ name, url, events })
      });
      
      if (response.success) {
        // Update integrations data with new webhook
        setData(prev => ({
          ...prev,
          integrations: prev.integrations ? {
            ...prev.integrations,
            webhooks: [...(prev.integrations.webhooks || []), response.webhook]
          } : prev.integrations
        }));
        showSuccess('Webhook created successfully');
        return response.webhook;
      } else {
        throw new Error(response.error || 'Failed to create webhook');
      }
    } catch (err) {
      console.error('Error creating webhook:', err);
      showError(err instanceof Error ? err.message : 'Failed to create webhook');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Remove webhook
  const removeWebhook = useCallback(async (webhookId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/webhooks/${webhookId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update integrations data by removing the webhook
        setData(prev => ({
          ...prev,
          integrations: prev.integrations ? {
            ...prev.integrations,
            webhooks: (prev.integrations.webhooks || []).filter(webhook => webhook.id !== webhookId)
          } : prev.integrations
        }));
        showSuccess('Webhook removed successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to remove webhook');
      }
    } catch (err) {
      console.error('Error removing webhook:', err);
      showError(err instanceof Error ? err.message : 'Failed to remove webhook');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Test service integration
  const testServiceIntegration = useCallback(async (serviceId: string) => {
    try {
      const response = await request(`/admin/integrations/${serviceId}/test`, {
        method: 'POST'
      });
      
      if (response.success) {
        showSuccess('Service connection test successful');
        return true;
      } else {
        throw new Error(response.error || 'Service connection test failed');
      }
    } catch (err) {
      console.error('Error testing service integration:', err);
      showError(err instanceof Error ? err.message : 'Service connection test failed');
      return false;
    }
  }, [request, showSuccess, showError]);

  // Export settings backup
  const exportBackup = useCallback(async () => {
    try {
      const response = await request('/admin/settings/backup');
      
      if (response.success || response.settings) {
        // Create and download backup file
        const backup = response.settings ? response : response;
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('Settings backup exported successfully');
        return true;
      } else {
        throw new Error('Failed to export settings backup');
      }
    } catch (err) {
      console.error('Error exporting backup:', err);
      showError(err instanceof Error ? err.message : 'Failed to export settings backup');
      return false;
    }
  }, [request, showSuccess, showError]);

  // Import settings backup
  const importBackup = useCallback(async (backupData: any) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/settings/restore', {
        method: 'POST',
        body: JSON.stringify(backupData)
      });
      
      if (response.success) {
        // Refresh all settings after restore
        await fetchSettings();
        showSuccess('Settings restored successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to restore settings');
      }
    } catch (err) {
      console.error('Error importing backup:', err);
      showError(err instanceof Error ? err.message : 'Failed to restore settings');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError, fetchSettings]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchSettings();
    }
  }, [section, autoFetch, fetchSettings]);

  return {
    // Data
    data,
    loading,
    error,
    hasChanges,
    
    // Core actions
    fetchSettings,
    saveSettings,
    updateSectionData,
    resetSection,
    testConnection,
    
    // API key management
    createApiKey,
    revokeApiKey,
    
    // Webhook management
    createWebhook,
    removeWebhook,
    
    // Service integration
    testServiceIntegration,
    
    // Backup/restore
    exportBackup,
    importBackup,
    
    // Utilities
    refetch: () => fetchSettings()
  };
}