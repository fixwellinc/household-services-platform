"use client";

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Globe,
  Zap,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
  Settings,
  Webhook,
  Mail,
  CreditCard,
  MessageSquare,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered?: Date;
  successRate: number;
}

interface ServiceIntegration {
  id: string;
  name: string;
  type: 'email' | 'payment' | 'sms' | 'analytics' | 'storage' | 'other';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync?: Date;
  healthStatus: 'healthy' | 'warning' | 'error';
}

interface IntegrationConfig {
  // API Management
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
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
  emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  emailConfig: Record<string, any>;
  
  smsServiceEnabled: boolean;
  smsProvider: 'twilio' | 'nexmo' | 'aws-sns';
  smsConfig: Record<string, any>;
  
  analyticsEnabled: boolean;
  analyticsProvider: 'google' | 'mixpanel' | 'amplitude';
  analyticsConfig: Record<string, any>;
  
  // Health Monitoring
  healthCheckEnabled: boolean;
  healthCheckInterval: number;
  alertsEnabled: boolean;
  alertWebhookUrl: string;
}

interface IntegrationSettingsProps {
  onBack?: () => void;
}

export function IntegrationSettings({ onBack }: IntegrationSettingsProps) {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchIntegrationConfig();
  }, []);

  const fetchIntegrationConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/settings/integrations');
      
      if (response.success) {
        setConfig(response.config);
      } else {
        throw new Error(response.error || 'Failed to fetch integration configuration');
      }
    } catch (err) {
      console.error('Error fetching integration config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch integration configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrationConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      
      const response = await request('/admin/settings/integrations', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      
      if (response.success) {
        showSuccess('Integration configuration saved successfully');
        setHasChanges(false);
      } else {
        throw new Error(response.error || 'Failed to save integration configuration');
      }
    } catch (err) {
      console.error('Error saving integration config:', err);
      showError(err instanceof Error ? err.message : 'Failed to save integration configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof IntegrationConfig>(
    key: K, 
    value: IntegrationConfig[K]
  ) => {
    if (!config) return;
    
    setConfig(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      showError('Please enter a name for the API key');
      return;
    }

    try {
      const response = await request('/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newApiKeyName.trim() })
      });
      
      if (response.success) {
        const newKey: ApiKey = response.apiKey;
        updateConfig('apiKeys', [...(config?.apiKeys || []), newKey]);
        setNewApiKeyName('');
        showSuccess('API key generated successfully');
      } else {
        throw new Error(response.error || 'Failed to generate API key');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate API key');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await request(`/admin/api-keys/${keyId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        updateConfig('apiKeys', config?.apiKeys.filter(key => key.id !== keyId) || []);
        showSuccess('API key revoked successfully');
      } else {
        throw new Error(response.error || 'Failed to revoke API key');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const addWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      showError('Please enter both name and URL for the webhook');
      return;
    }

    try {
      new URL(newWebhookUrl.trim());
    } catch {
      showError('Please enter a valid URL');
      return;
    }

    try {
      const response = await request('/admin/webhooks', {
        method: 'POST',
        body: JSON.stringify({ 
          name: newWebhookName.trim(),
          url: newWebhookUrl.trim()
        })
      });
      
      if (response.success) {
        const newWebhook: WebhookEndpoint = response.webhook;
        updateConfig('webhooks', [...(config?.webhooks || []), newWebhook]);
        setNewWebhookName('');
        setNewWebhookUrl('');
        showSuccess('Webhook endpoint added successfully');
      } else {
        throw new Error(response.error || 'Failed to add webhook');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add webhook');
    }
  };

  const removeWebhook = async (webhookId: string) => {
    if (!window.confirm('Are you sure you want to remove this webhook endpoint?')) {
      return;
    }

    try {
      const response = await request(`/admin/webhooks/${webhookId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        updateConfig('webhooks', config?.webhooks.filter(webhook => webhook.id !== webhookId) || []);
        showSuccess('Webhook endpoint removed successfully');
      } else {
        throw new Error(response.error || 'Failed to remove webhook');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove webhook');
    }
  };

  const testServiceConnection = async (serviceId: string) => {
    try {
      const response = await request(`/admin/integrations/${serviceId}/test`, {
        method: 'POST'
      });
      
      if (response.success) {
        showSuccess('Service connection test successful');
      } else {
        throw new Error(response.error || 'Service connection test failed');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Service connection test failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'payment': return CreditCard;
      case 'sms': return MessageSquare;
      case 'analytics': return Activity;
      case 'storage': return Database;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading integration configuration..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load integration configuration"
        message={error}
        onRetry={fetchIntegrationConfig}
      />
    );
  }

  if (!config) {
    return (
      <AdminErrorState
        title="Integration configuration not available"
        message="Unable to load integration configuration. Please try again."
        onRetry={fetchIntegrationConfig}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Key className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integration & API Settings</h1>
            <p className="text-gray-600">API keys, webhooks, and third-party service configurations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Overview
            </Button>
          )}
          
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          
          <Button
            onClick={saveIntegrationConfig}
            disabled={saving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter API key name"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                />
                <Button onClick={generateApiKey} disabled={!newApiKeyName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </div>
              
              <div className="space-y-3">
                {config.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={apiKey.isActive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
                        >
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeApiKey(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={showSecrets[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(apiKey.id)}
                      >
                        {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      {apiKey.lastUsed && <p>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</p>}
                      {apiKey.expiresAt && <p>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
                
                {config.apiKeys.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                    <p className="text-gray-600">Generate your first API key to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Webhook name"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/webhook"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                  <Button onClick={addWebhook} disabled={!newWebhookName.trim() || !newWebhookUrl.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {config.webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={webhook.isActive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
                        >
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {webhook.successRate}% success
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={webhook.url}
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(webhook.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p>Events: {webhook.events.join(', ')}</p>
                      {webhook.lastTriggered && <p>Last triggered: {new Date(webhook.lastTriggered).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
                
                {config.webhooks.length === 0 && (
                  <div className="text-center py-8">
                    <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks</h3>
                    <p className="text-gray-600">Add webhook endpoints to receive real-time notifications.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.services.map((service) => {
              const IconComponent = getServiceIcon(service.type);
              
              return (
                <Card key={service.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(service.status)}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Health Status</span>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(service.healthStatus)}
                      >
                        {service.healthStatus}
                      </Badge>
                    </div>
                    
                    {service.lastSync && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Sync</span>
                        <span className="text-sm">{new Date(service.lastSync).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => testServiceConnection(service.id)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {config.services.length === 0 && (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Configured</h3>
              <p className="text-gray-600">Connect third-party services to extend functionality.</p>
            </div>
          )}
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Service Health Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="healthCheckEnabled"
                  checked={config.healthCheckEnabled}
                  onCheckedChange={(checked) => updateConfig('healthCheckEnabled', checked)}
                />
                <Label htmlFor="healthCheckEnabled">Enable Health Checks</Label>
              </div>
              
              {config.healthCheckEnabled && (
                <>
                  <div>
                    <Label htmlFor="healthCheckInterval">Check Interval (minutes)</Label>
                    <Input
                      id="healthCheckInterval"
                      type="number"
                      value={config.healthCheckInterval}
                      onChange={(e) => updateConfig('healthCheckInterval', parseInt(e.target.value))}
                      min="1"
                      max="60"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alertsEnabled"
                      checked={config.alertsEnabled}
                      onCheckedChange={(checked) => updateConfig('alertsEnabled', checked)}
                    />
                    <Label htmlFor="alertsEnabled">Enable Alerts</Label>
                  </div>
                  
                  {config.alertsEnabled && (
                    <div>
                      <Label htmlFor="alertWebhookUrl">Alert Webhook URL</Label>
                      <Input
                        id="alertWebhookUrl"
                        value={config.alertWebhookUrl}
                        onChange={(e) => updateConfig('alertWebhookUrl', e.target.value)}
                        placeholder="https://example.com/alerts"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="rateLimitEnabled"
                  checked={config.rateLimitEnabled}
                  onCheckedChange={(checked) => updateConfig('rateLimitEnabled', checked)}
                />
                <Label htmlFor="rateLimitEnabled">Enable Rate Limiting</Label>
              </div>
              
              {config.rateLimitEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rateLimitRequests">Max Requests</Label>
                    <Input
                      id="rateLimitRequests"
                      type="number"
                      value={config.rateLimitRequests}
                      onChange={(e) => updateConfig('rateLimitRequests', parseInt(e.target.value))}
                      min="10"
                      max="10000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rateLimitWindow">Time Window (minutes)</Label>
                    <Input
                      id="rateLimitWindow"
                      type="number"
                      value={config.rateLimitWindow}
                      onChange={(e) => updateConfig('rateLimitWindow', parseInt(e.target.value))}
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}