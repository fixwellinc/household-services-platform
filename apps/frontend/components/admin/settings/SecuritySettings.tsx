"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Lock,
  Key,
  Users,
  Clock,
  Globe,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Info
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

import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expirationDays: number;
}

interface SecurityConfig {
  // Authentication Settings
  passwordPolicy: PasswordPolicy;
  twoFactorRequired: boolean;
  twoFactorGracePeriod: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Access Control
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  
  // Security Features
  auditLogEnabled: boolean;
  auditLogRetention: number;
  encryptionEnabled: boolean;
  sslRequired: boolean;
  corsEnabled: boolean;
  corsOrigins: string[];
  
  // Account Security
  accountLockoutEnabled: boolean;
  suspiciousActivityDetection: boolean;
  emailVerificationRequired: boolean;
  passwordResetExpiration: number;
}

interface SecuritySettingsProps {
  onBack?: () => void;
}

export function SecuritySettings({ onBack }: SecuritySettingsProps) {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newCorsOrigin, setNewCorsOrigin] = useState('');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchSecurityConfig();
  }, []);

  const fetchSecurityConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/settings/security');
      
      if (response.success) {
        setConfig(response.config);
      } else {
        throw new Error(response.error || 'Failed to fetch security configuration');
      }
    } catch (err) {
      console.error('Error fetching security config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch security configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveSecurityConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      
      const response = await request('/admin/settings/security', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      
      if (response.success) {
        showSuccess('Security configuration saved successfully');
        setHasChanges(false);
      } else {
        throw new Error(response.error || 'Failed to save security configuration');
      }
    } catch (err) {
      console.error('Error saving security config:', err);
      showError(err instanceof Error ? err.message : 'Failed to save security configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof SecurityConfig>(
    key: K, 
    value: SecurityConfig[K]
  ) => {
    if (!config) return;
    
    setConfig(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const updatePasswordPolicy = <K extends keyof PasswordPolicy>(
    key: K, 
    value: PasswordPolicy[K]
  ) => {
    if (!config) return;
    
    setConfig(prev => prev ? { 
      ...prev, 
      passwordPolicy: { ...prev.passwordPolicy, [key]: value }
    } : null);
    setHasChanges(true);
  };

  const addIpAddress = () => {
    if (!config || !newIpAddress.trim()) return;
    
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
    
    if (!ipRegex.test(newIpAddress.trim())) {
      showError('Please enter a valid IP address or CIDR notation');
      return;
    }
    
    if (config.ipWhitelist.includes(newIpAddress.trim())) {
      showError('IP address already exists in whitelist');
      return;
    }
    
    updateConfig('ipWhitelist', [...config.ipWhitelist, newIpAddress.trim()]);
    setNewIpAddress('');
  };

  const removeIpAddress = (ip: string) => {
    if (!config) return;
    updateConfig('ipWhitelist', config.ipWhitelist.filter(item => item !== ip));
  };

  const addCorsOrigin = () => {
    if (!config || !newCorsOrigin.trim()) return;
    
    try {
      new URL(newCorsOrigin.trim());
    } catch {
      showError('Please enter a valid URL');
      return;
    }
    
    if (config.corsOrigins.includes(newCorsOrigin.trim())) {
      showError('Origin already exists in CORS list');
      return;
    }
    
    updateConfig('corsOrigins', [...config.corsOrigins, newCorsOrigin.trim()]);
    setNewCorsOrigin('');
  };

  const removeCorsOrigin = (origin: string) => {
    if (!config) return;
    updateConfig('corsOrigins', config.corsOrigins.filter(item => item !== origin));
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset security settings to defaults? This action cannot be undone.')) {
      fetchSecurityConfig();
      setHasChanges(false);
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading security configuration..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load security configuration"
        message={error}
        onRetry={fetchSecurityConfig}
      />
    );
  }

  if (!config) {
    return (
      <AdminErrorState
        title="Security configuration not available"
        message="Unable to load security configuration. Please try again."
        onRetry={fetchSecurityConfig}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-600">Password policies, authentication, and access controls</p>
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
            variant="outline"
            onClick={resetToDefaults}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button
            onClick={saveSecurityConfig}
            disabled={saving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                id="minLength"
                type="number"
                value={config.passwordPolicy.minLength}
                onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
                min="6"
                max="128"
              />
            </div>
            
            <div>
              <Label htmlFor="expirationDays">Password Expiration (days)</Label>
              <Input
                id="expirationDays"
                type="number"
                value={config.passwordPolicy.expirationDays}
                onChange={(e) => updatePasswordPolicy('expirationDays', parseInt(e.target.value))}
                min="0"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">0 = never expires</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="preventReuse">Prevent Password Reuse</Label>
            <Input
              id="preventReuse"
              type="number"
              value={config.passwordPolicy.preventReuse}
              onChange={(e) => updatePasswordPolicy('preventReuse', parseInt(e.target.value))}
              min="0"
              max="24"
            />
            <p className="text-xs text-gray-500 mt-1">Number of previous passwords to remember</p>
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Password Requirements</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireUppercase"
                  checked={config.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireUppercase', checked)}
                />
                <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireLowercase"
                  checked={config.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireLowercase', checked)}
                />
                <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireNumbers"
                  checked={config.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireNumbers', checked)}
                />
                <Label htmlFor="requireNumbers">Require Numbers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireSpecialChars"
                  checked={config.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireSpecialChars', checked)}
                />
                <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="twoFactorRequired"
              checked={config.twoFactorRequired}
              onCheckedChange={(checked) => updateConfig('twoFactorRequired', checked)}
            />
            <Label htmlFor="twoFactorRequired">Require Two-Factor Authentication</Label>
          </div>
          
          {config.twoFactorRequired && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is required for all users. Existing users will be prompted to set it up.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="twoFactorGracePeriod">Grace Period (days)</Label>
                <Input
                  id="twoFactorGracePeriod"
                  type="number"
                  value={config.twoFactorGracePeriod}
                  onChange={(e) => updateConfig('twoFactorGracePeriod', parseInt(e.target.value))}
                  min="0"
                  max="30"
                />
                <p className="text-xs text-gray-500 mt-1">Days users have to set up 2FA before being locked out</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session & Login Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session & Login Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => updateConfig('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="1440"
              />
            </div>
            
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => updateConfig('maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={config.lockoutDuration}
                onChange={(e) => updateConfig('lockoutDuration', parseInt(e.target.value))}
                min="5"
                max="1440"
              />
            </div>
            
            <div>
              <Label htmlFor="passwordResetExpiration">Password Reset Expiration (hours)</Label>
              <Input
                id="passwordResetExpiration"
                type="number"
                value={config.passwordResetExpiration}
                onChange={(e) => updateConfig('passwordResetExpiration', parseInt(e.target.value))}
                min="1"
                max="72"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="accountLockoutEnabled"
                checked={config.accountLockoutEnabled}
                onCheckedChange={(checked) => updateConfig('accountLockoutEnabled', checked)}
              />
              <Label htmlFor="accountLockoutEnabled">Enable Account Lockout</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="suspiciousActivityDetection"
                checked={config.suspiciousActivityDetection}
                onCheckedChange={(checked) => updateConfig('suspiciousActivityDetection', checked)}
              />
              <Label htmlFor="suspiciousActivityDetection">Suspicious Activity Detection</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="emailVerificationRequired"
                checked={config.emailVerificationRequired}
                onCheckedChange={(checked) => updateConfig('emailVerificationRequired', checked)}
              />
              <Label htmlFor="emailVerificationRequired">Require Email Verification</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            IP Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="ipWhitelistEnabled"
              checked={config.ipWhitelistEnabled}
              onCheckedChange={(checked) => updateConfig('ipWhitelistEnabled', checked)}
            />
            <Label htmlFor="ipWhitelistEnabled">Enable IP Whitelist</Label>
          </div>
          
          {config.ipWhitelistEnabled && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only IP addresses in the whitelist will be able to access the admin panel.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter IP address or CIDR (e.g., 192.168.1.1 or 192.168.1.0/24)"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                />
                <Button onClick={addIpAddress} disabled={!newIpAddress.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {config.ipWhitelist.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{ip}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIpAddress(ip)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {config.ipWhitelist.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No IP addresses in whitelist. Add at least one to enable protection.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rate Limiting
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
                  max="1000"
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

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="auditLogEnabled"
                checked={config.auditLogEnabled}
                onCheckedChange={(checked) => updateConfig('auditLogEnabled', checked)}
              />
              <Label htmlFor="auditLogEnabled">Enable Audit Logging</Label>
            </div>
            
            {config.auditLogEnabled && (
              <div>
                <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
                <Input
                  id="auditLogRetention"
                  type="number"
                  value={config.auditLogRetention}
                  onChange={(e) => updateConfig('auditLogRetention', parseInt(e.target.value))}
                  min="30"
                  max="2555"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="encryptionEnabled"
                checked={config.encryptionEnabled}
                onCheckedChange={(checked) => updateConfig('encryptionEnabled', checked)}
              />
              <Label htmlFor="encryptionEnabled">Enable Data Encryption</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sslRequired"
                checked={config.sslRequired}
                onCheckedChange={(checked) => updateConfig('sslRequired', checked)}
              />
              <Label htmlFor="sslRequired">Require SSL/HTTPS</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="corsEnabled"
                checked={config.corsEnabled}
                onCheckedChange={(checked) => updateConfig('corsEnabled', checked)}
              />
              <Label htmlFor="corsEnabled">Enable CORS</Label>
            </div>
            
            {config.corsEnabled && (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter allowed origin (e.g., https://example.com)"
                    value={newCorsOrigin}
                    onChange={(e) => setNewCorsOrigin(e.target.value)}
                  />
                  <Button onClick={addCorsOrigin} disabled={!newCorsOrigin.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {config.corsOrigins.map((origin, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{origin}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCorsOrigin(origin)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {config.corsOrigins.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No CORS origins configured. Add origins to allow cross-origin requests.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySettings;