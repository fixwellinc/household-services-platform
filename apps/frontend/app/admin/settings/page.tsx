"use client";

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui/shared';
import { Label } from '@/components/ui/shared';
import { toast } from 'sonner';

interface EmailSettings {
  emailHost: string;
  emailPort: string;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  emailSecure: boolean;
  emailReplyTo: string;
}

export default function AdminSettingsPage() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    emailHost: '',
    emailPort: '587',
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    emailSecure: false,
    emailReplyTo: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || {};
        
        setEmailSettings({
          emailHost: settings.emailHost || '',
          emailPort: settings.emailPort || '587',
          emailUser: settings.emailUser || '',
          emailPassword: settings.emailPassword || '',
          emailFrom: settings.emailFrom || '',
          emailSecure: settings.emailSecure === 'true',
          emailReplyTo: settings.emailReplyTo || ''
        });
      } else {
        toast.error('Failed to load settings');
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSettingChange = (key: keyof EmailSettings, value: string | boolean) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveEmailSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          settings: Object.entries(emailSettings).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        })
      });

      if (res.ok) {
        toast.success('Email settings saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailSettings })
      });

      if (res.ok) {
        toast.success('Email test successful! Check your inbox.');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Email test failed');
      }
    } catch (error) {
      toast.error('Error testing email connection');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>

      {/* Email Configuration */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Email Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="emailHost">SMTP Host</Label>
            <Input
              id="emailHost"
              value={emailSettings.emailHost}
              onChange={(e) => handleEmailSettingChange('emailHost', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          
          <div>
            <Label htmlFor="emailPort">SMTP Port</Label>
            <Input
              id="emailPort"
              value={emailSettings.emailPort}
              onChange={(e) => handleEmailSettingChange('emailPort', e.target.value)}
              placeholder="587"
              type="number"
            />
          </div>
          
          <div>
            <Label htmlFor="emailUser">SMTP Username</Label>
            <Input
              id="emailUser"
              value={emailSettings.emailUser}
              onChange={(e) => handleEmailSettingChange('emailUser', e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>
          
          <div>
            <Label htmlFor="emailPassword">SMTP Password</Label>
            <Input
              id="emailPassword"
              value={emailSettings.emailPassword}
              onChange={(e) => handleEmailSettingChange('emailPassword', e.target.value)}
              type="password"
              placeholder="Your email password or app password"
            />
          </div>
          
          <div>
            <Label htmlFor="emailFrom">From Email</Label>
            <Input
              id="emailFrom"
              value={emailSettings.emailFrom}
              onChange={(e) => handleEmailSettingChange('emailFrom', e.target.value)}
              placeholder="noreply@fixwell.com"
            />
          </div>
          
          <div>
            <Label htmlFor="emailReplyTo">Reply-To Email</Label>
            <Input
              id="emailReplyTo"
              value={emailSettings.emailReplyTo}
              onChange={(e) => handleEmailSettingChange('emailReplyTo', e.target.value)}
              placeholder="support@fixwell.com"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="emailSecure"
                checked={emailSettings.emailSecure}
                onChange={(e) => handleEmailSettingChange('emailSecure', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="emailSecure">Use SSL/TLS (usually for port 465)</Label>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <Button onClick={saveEmailSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Email Settings'}
          </Button>
          <Button onClick={testEmailConnection} disabled={isTesting} variant="outline">
            {isTesting ? 'Testing...' : 'Test Email Connection'}
          </Button>
        </div>
      </section>

      {/* Email Templates */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Email Templates</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="welcomeTemplate">Welcome Email Template</Label>
            <textarea
              id="welcomeTemplate"
              className="w-full h-32 p-3 border border-gray-300 rounded-md"
              placeholder="Welcome to Fixwell Services! We're excited to have you on board..."
            />
          </div>
          <div>
            <Label htmlFor="quoteReplyTemplate">Quote Reply Template</Label>
            <textarea
              id="quoteReplyTemplate"
              className="w-full h-32 p-3 border border-gray-300 rounded-md"
              placeholder="Thank you for your quote request. Here's our response..."
            />
          </div>
          <Button>Save Templates</Button>
        </div>
      </section>

      {/* System Information */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Environment:</span> {process.env.NODE_ENV || 'development'}
          </div>
          <div>
            <span className="font-medium">Database:</span> Connected
          </div>
          <div>
            <span className="font-medium">Email Service:</span> {emailSettings.emailHost ? 'Configured' : 'Not Configured'}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date().toLocaleString()}
          </div>
        </div>
      </section>
    </div>
  );
} 