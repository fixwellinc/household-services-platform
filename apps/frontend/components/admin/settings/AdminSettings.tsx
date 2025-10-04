"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Mail,
  Shield,
  Bell,
  Globe,
  Users,
  CreditCard,
  FileText,
  Key,
  Server,
  Monitor,
  Zap,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  allowedDomains: string[];
  
  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  
  // Payment Settings
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  defaultCurrency: string;
  taxRate: number;
  
  // Database Settings
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbSsl: boolean;
  
  // Monitoring Settings
  enableMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/settings');
      
      if (response.success) {
        setSettings(response.settings);
      } else {
        throw new Error(response.error || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      const response = await request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      
      if (response.success) {
        showSuccess('Settings saved successfully');
        setHasChanges(false);
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SystemSettings>(
    key: K, 
    value: SystemSettings[K]
  ) => {
    if (!settings) return;
    
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testConnection = async (type: 'email' | 'database') => {
    try {
      const response = await request(`/admin/settings/test-${type}`, {
        method: 'POST'
      });
      
      if (response.success) {
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} connection test successful`);
      } else {
        throw new Error(response.error || `Failed to test ${type} connection`);
      }
    } catch (err) {
      console.error(`Error testing ${type} connection:`, err);
      showError(err instanceof Error ? err.message : `Failed to test ${type} connection`);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      fetchSettings();
      setHasChanges(false);
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading settings..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load settings"
        message={error}
        onRetry={fetchSettings}
      />
    );
  }

  if (!settings) {
    return (
      <AdminErrorState
        title="Settings not available"
        message="Unable to load system settings. Please try again."
        onRetry={fetchSettings}
      />
    );
  }

  return (
    <AdminErrorBoundary context="AdminSettings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
            
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <Button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => updateSetting('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="siteUrl">Site URL</Label>
                    <Input
                      id="siteUrl"
                      value={settings.siteUrl}
                      onChange={(e) => updateSetting('siteUrl', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>
                
                {settings.maintenanceMode && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Maintenance mode is enabled. The site will be inaccessible to regular users.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireTwoFactor"
                      checked={settings.requireTwoFactor}
                      onCheckedChange={(checked) => updateSetting('requireTwoFactor', checked)}
                    />
                    <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="allowedDomains">Allowed Domains (one per line)</Label>
                  <Textarea
                    id="allowedDomains"
                    value={settings.allowedDomains.join('\n')}
                    onChange={(e) => updateSetting('allowedDomains', e.target.value.split('\n').filter(d => d.trim()))}
                    rows={4}
                    placeholder="example.com&#10;subdomain.example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.smtpUser}
                      onChange={(e) => updateSetting('smtpUser', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <div className="relative">
                      <Input
                        id="smtpPassword"
                        type={showPasswords.smtpPassword ? 'text' : 'password'}
                        value={settings.smtpPassword}
                        onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('smtpPassword')}
                      >
                        {showPasswords.smtpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={settings.fromEmail}
                      onChange={(e) => updateSetting('fromEmail', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.fromName}
                      onChange={(e) => updateSetting('fromName', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpSecure"
                    checked={settings.smtpSecure}
                    onCheckedChange={(checked) => updateSetting('smtpSecure', checked)}
                  />
                  <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => testConnection('email')}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Test Email Connection
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                    />
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                    />
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                  <Select value={settings.notificationFrequency} onValueChange={(value: any) => updateSetting('notificationFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                  <div className="relative">
                    <Input
                      id="stripePublicKey"
                      type={showPasswords.stripePublicKey ? 'text' : 'password'}
                      value={settings.stripePublicKey}
                      onChange={(e) => updateSetting('stripePublicKey', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('stripePublicKey')}
                    >
                      {showPasswords.stripePublicKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="stripeSecretKey"
                      type={showPasswords.stripeSecretKey ? 'text' : 'password'}
                      value={settings.stripeSecretKey}
                      onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('stripeSecretKey')}
                    >
                      {showPasswords.stripeSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
                  <div className="relative">
                    <Input
                      id="stripeWebhookSecret"
                      type={showPasswords.stripeWebhookSecret ? 'text' : 'password'}
                      value={settings.stripeWebhookSecret}
                      onChange={(e) => updateSetting('stripeWebhookSecret', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('stripeWebhookSecret')}
                    >
                      {showPasswords.stripeWebhookSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Select value={settings.defaultCurrency} onValueChange={(value) => updateSetting('defaultCurrency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={settings.taxRate}
                      onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input
                      id="dbHost"
                      value={settings.dbHost}
                      onChange={(e) => updateSetting('dbHost', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dbPort">Database Port</Label>
                    <Input
                      id="dbPort"
                      type="number"
                      value={settings.dbPort}
                      onChange={(e) => updateSetting('dbPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbName">Database Name</Label>
                    <Input
                      id="dbName"
                      value={settings.dbName}
                      onChange={(e) => updateSetting('dbName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dbUser">Database User</Label>
                    <Input
                      id="dbUser"
                      value={settings.dbUser}
                      onChange={(e) => updateSetting('dbUser', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="dbPassword">Database Password</Label>
                  <div className="relative">
                    <Input
                      id="dbPassword"
                      type={showPasswords.dbPassword ? 'text' : 'password'}
                      value={settings.dbPassword}
                      onChange={(e) => updateSetting('dbPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('dbPassword')}
                    >
                      {showPasswords.dbPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dbSsl"
                    checked={settings.dbSsl}
                    onCheckedChange={(checked) => updateSetting('dbSsl', checked)}
                  />
                  <Label htmlFor="dbSsl">Use SSL Connection</Label>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => testConnection('database')}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Test Database Connection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Settings */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Monitoring & Logging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMonitoring"
                      checked={settings.enableMonitoring}
                      onCheckedChange={(checked) => updateSetting('enableMonitoring', checked)}
                    />
                    <Label htmlFor="enableMonitoring">Enable System Monitoring</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAnalytics"
                      checked={settings.enableAnalytics}
                      onCheckedChange={(checked) => updateSetting('enableAnalytics', checked)}
                    />
                    <Label htmlFor="enableAnalytics">Enable Analytics Tracking</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableErrorReporting"
                      checked={settings.enableErrorReporting}
                      onCheckedChange={(checked) => updateSetting('enableErrorReporting', checked)}
                    />
                    <Label htmlFor="enableErrorReporting">Enable Error Reporting</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select value={settings.logLevel} onValueChange={(value: any) => updateSetting('logLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  );
}
