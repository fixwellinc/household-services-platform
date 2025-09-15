"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  Mail,
  MessageSquare,
  Bell,
  Shield,
  Globe,
  Clock,
  Users,
  Settings
} from 'lucide-react';

export function CommunicationSettings() {
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'notifications@company.com',
    smtpPassword: '••••••••',
    fromName: 'Company Support',
    fromEmail: 'support@company.com',
    replyToEmail: 'support@company.com',
    enableTLS: true,
    enableSSL: false
  });

  const [smsSettings, setSmsSettings] = useState({
    provider: 'twilio',
    accountSid: 'AC••••••••••••••••••••••••••••••••',
    authToken: '••••••••••••••••••••••••••••••••',
    fromNumber: '+1234567890',
    enableDeliveryReports: true,
    enableOptOut: true
  });

  const [generalSettings, setGeneralSettings] = useState({
    defaultLanguage: 'en',
    timezone: 'America/New_York',
    businessHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York'
    },
    autoResponse: {
      enabled: true,
      message: 'Thank you for your message. We will get back to you within 24 hours.',
      delay: 5
    },
    escalation: {
      enabled: true,
      timeout: 4,
      assignTo: 'supervisor'
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newMessage: true,
    urgentMessage: true,
    unreadMessages: true,
    campaignUpdates: false,
    systemAlerts: true,
    emailDigest: true,
    digestFrequency: 'daily'
  });

  const handleSaveSettings = (section: string) => {
    // Here you would save the settings via API
    console.log(`Saving ${section} settings`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Communication Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure communication channels, automation, and preferences
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure SMTP settings and email preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUsername">Username</Label>
                    <Input
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="replyToEmail">Reply-To Email</Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      value={emailSettings.replyToEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, replyToEmail: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableTLS">Enable TLS</Label>
                      <Switch
                        id="enableTLS"
                        checked={emailSettings.enableTLS}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableTLS: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableSSL">Enable SSL</Label>
                      <Switch
                        id="enableSSL"
                        checked={emailSettings.enableSSL}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableSSL: checked})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('email')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>SMS Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure SMS provider settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smsProvider">SMS Provider</Label>
                    <Select
                      value={smsSettings.provider}
                      onValueChange={(value) => setSmsSettings({...smsSettings, provider: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                        <SelectItem value="nexmo">Nexmo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      value={smsSettings.accountSid}
                      onChange={(e) => setSmsSettings({...smsSettings, accountSid: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      value={smsSettings.authToken}
                      onChange={(e) => setSmsSettings({...smsSettings, authToken: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromNumber">From Number</Label>
                    <Input
                      id="fromNumber"
                      value={smsSettings.fromNumber}
                      onChange={(e) => setSmsSettings({...smsSettings, fromNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableDeliveryReports">Delivery Reports</Label>
                      <Switch
                        id="enableDeliveryReports"
                        checked={smsSettings.enableDeliveryReports}
                        onCheckedChange={(checked) => setSmsSettings({...smsSettings, enableDeliveryReports: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableOptOut">Enable Opt-Out</Label>
                      <Switch
                        id="enableOptOut"
                        checked={smsSettings.enableOptOut}
                        onCheckedChange={(checked) => setSmsSettings({...smsSettings, enableOptOut: checked})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('sms')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save SMS Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Regional Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={generalSettings.defaultLanguage}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, defaultLanguage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Business Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessHoursEnabled">Enable Business Hours</Label>
                  <Switch
                    id="businessHoursEnabled"
                    checked={generalSettings.businessHours.enabled}
                    onCheckedChange={(checked) => setGeneralSettings({
                      ...generalSettings,
                      businessHours: {...generalSettings.businessHours, enabled: checked}
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessStart">Start Time</Label>
                    <Input
                      id="businessStart"
                      type="time"
                      value={generalSettings.businessHours.start}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        businessHours: {...generalSettings.businessHours, start: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessEnd">End Time</Label>
                    <Input
                      id="businessEnd"
                      type="time"
                      value={generalSettings.businessHours.end}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        businessHours: {...generalSettings.businessHours, end: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto-Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoResponseEnabled">Enable Auto-Response</Label>
                  <Switch
                    id="autoResponseEnabled"
                    checked={generalSettings.autoResponse.enabled}
                    onCheckedChange={(checked) => setGeneralSettings({
                      ...generalSettings,
                      autoResponse: {...generalSettings.autoResponse, enabled: checked}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="autoResponseMessage">Auto-Response Message</Label>
                  <Textarea
                    id="autoResponseMessage"
                    value={generalSettings.autoResponse.message}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      autoResponse: {...generalSettings.autoResponse, message: e.target.value}
                    })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="autoResponseDelay">Delay (minutes)</Label>
                  <Input
                    id="autoResponseDelay"
                    type="number"
                    value={generalSettings.autoResponse.delay}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      autoResponse: {...generalSettings.autoResponse, delay: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escalation Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="escalationEnabled">Enable Escalation</Label>
                  <Switch
                    id="escalationEnabled"
                    checked={generalSettings.escalation.enabled}
                    onCheckedChange={(checked) => setGeneralSettings({
                      ...generalSettings,
                      escalation: {...generalSettings.escalation, enabled: checked}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="escalationTimeout">Escalation Timeout (hours)</Label>
                  <Input
                    id="escalationTimeout"
                    type="number"
                    value={generalSettings.escalation.timeout}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      escalation: {...generalSettings.escalation, timeout: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSaveSettings('general')}>
              <Save className="h-4 w-4 mr-2" />
              Save General Settings
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Message Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="newMessage">New Messages</Label>
                      <Switch
                        id="newMessage"
                        checked={notificationSettings.newMessage}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newMessage: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="urgentMessage">Urgent Messages</Label>
                      <Switch
                        id="urgentMessage"
                        checked={notificationSettings.urgentMessage}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, urgentMessage: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unreadMessages">Unread Message Reminders</Label>
                      <Switch
                        id="unreadMessages"
                        checked={notificationSettings.unreadMessages}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, unreadMessages: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">System Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="campaignUpdates">Campaign Updates</Label>
                      <Switch
                        id="campaignUpdates"
                        checked={notificationSettings.campaignUpdates}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, campaignUpdates: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemAlerts">System Alerts</Label>
                      <Switch
                        id="systemAlerts"
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailDigest">Email Digest</Label>
                      <Switch
                        id="emailDigest"
                        checked={notificationSettings.emailDigest}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailDigest: checked})}
                      />
                    </div>
                    {notificationSettings.emailDigest && (
                      <div>
                        <Label htmlFor="digestFrequency">Digest Frequency</Label>
                        <Select
                          value={notificationSettings.digestFrequency}
                          onValueChange={(value) => setNotificationSettings({...notificationSettings, digestFrequency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notifications')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}