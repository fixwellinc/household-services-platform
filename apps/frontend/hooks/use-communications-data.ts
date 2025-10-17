"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './use-api';
import { useToast } from './use-toast';

// Types for communications data
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: RecipientGroup[];
  metrics: CampaignMetrics;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipientGroup {
  id: string;
  name: string;
  criteria: FilterCriteria[];
  estimatedCount: number;
}

export interface FilterCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  templates: {
    email: number;
    sms: number;
    push: number;
  };
}

interface UseCommunicationsDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useCommunicationsData(options: UseCommunicationsDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/communications/campaigns');
      
      if (response.success) {
        setCampaigns(response.campaigns || []);
      } else {
        throw new Error(response.error || 'Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [request]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await request('/admin/communications/templates');
      
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    }
  }, [request]);

  // Fetch communication stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await request('/admin/communications/stats');
      
      if (response.success) {
        setStats(response.stats);
      } else {
        throw new Error(response.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  }, [request]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCampaigns(),
        fetchTemplates(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCampaigns, fetchTemplates, fetchStats]);

  // Create campaign
  const createCampaign = useCallback(async (campaignData: Partial<EmailCampaign>) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/communications/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      });
      
      if (response.success) {
        setCampaigns(prev => [...prev, response.campaign]);
        showSuccess('Campaign created successfully');
        return response.campaign;
      } else {
        throw new Error(response.error || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      showError(err instanceof Error ? err.message : 'Failed to create campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Update campaign
  const updateCampaign = useCallback(async (campaignId: string, updates: Partial<EmailCampaign>) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      if (response.success) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, ...updates, updatedAt: new Date() }
              : campaign
          )
        );
        showSuccess('Campaign updated successfully');
        return response.campaign;
      } else {
        throw new Error(response.error || 'Failed to update campaign');
      }
    } catch (err) {
      console.error('Error updating campaign:', err);
      showError(err instanceof Error ? err.message : 'Failed to update campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        showSuccess('Campaign deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete campaign');
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Send campaign
  const sendCampaign = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/campaigns/${campaignId}/send`, {
        method: 'POST'
      });
      
      if (response.success) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: 'sent' as const, sentAt: new Date() }
              : campaign
          )
        );
        showSuccess('Campaign sent successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to send campaign');
      }
    } catch (err) {
      console.error('Error sending campaign:', err);
      showError(err instanceof Error ? err.message : 'Failed to send campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Create template
  const createTemplate = useCallback(async (templateData: Partial<NotificationTemplate>) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/communications/templates', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      
      if (response.success) {
        setTemplates(prev => [...prev, response.template]);
        showSuccess('Template created successfully');
        return response.template;
      } else {
        throw new Error(response.error || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      showError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Update template
  const updateTemplate = useCallback(async (templateId: string, updates: Partial<NotificationTemplate>) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      if (response.success) {
        setTemplates(prev => 
          prev.map(template => 
            template.id === templateId 
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          )
        );
        showSuccess('Template updated successfully');
        return response.template;
      } else {
        throw new Error(response.error || 'Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      showError(err instanceof Error ? err.message : 'Failed to update template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setTemplates(prev => prev.filter(template => template.id !== templateId));
        showSuccess('Template deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete template');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Test template
  const testTemplate = useCallback(async (templateId: string, testData: Record<string, string>) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/communications/templates/${templateId}/test`, {
        method: 'POST',
        body: JSON.stringify({ testData })
      });
      
      if (response.success) {
        showSuccess('Template test sent successfully');
        return response.result;
      } else {
        throw new Error(response.error || 'Failed to test template');
      }
    } catch (err) {
      console.error('Error testing template:', err);
      showError(err instanceof Error ? err.message : 'Failed to test template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAllData();
    }
  }, [autoFetch, fetchAllData]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAllData]);

  return {
    // Data
    campaigns,
    templates,
    stats,
    loading,
    error,
    
    // Actions
    fetchAllData,
    fetchCampaigns,
    fetchTemplates,
    fetchStats,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    testTemplate,
    
    // Utilities
    refetch: fetchAllData
  };
}