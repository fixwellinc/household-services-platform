/**
 * Personalization Component
 * 
 * Provides personalized dashboard experience based on user preferences and behavior
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  User, 
  Settings, 
  Palette, 
  Layout, 
  Bell, 
  Clock,
  Star,
  Heart,
  Zap,
  Target,
  CheckCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';

interface PersonalizationSettings {
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'comfortable' | 'spacious';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  dashboard: {
    showQuickStats: boolean;
    showRecentActivity: boolean;
    showRecommendations: boolean;
    showNotifications: boolean;
    defaultView: 'overview' | 'services' | 'analytics';
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
}

interface PersonalizationProps {
  userData: {
    id: string;
    preferences?: PersonalizationSettings;
    behavior?: {
      mostUsedFeatures: string[];
      preferredTimes: string[];
      favoriteServices: string[];
    };
  };
  className?: string;
  onSave?: (settings: PersonalizationSettings) => void;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'auto', label: 'Auto', icon: '🔄' },
];

const LAYOUT_OPTIONS = [
  { value: 'compact', label: 'Compact', description: 'More content, less spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
  { value: 'spacious', label: 'Spacious', description: 'More breathing room' },
];

const COLOR_SCHEMES = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
];

export function Personalization({ 
  userData, 
  className = '', 
  onSave 
}: PersonalizationProps) {
  const [settings, setSettings] = useState<PersonalizationSettings>({
    theme: 'auto',
    layout: 'comfortable',
    colorScheme: 'blue',
    notifications: {
      email: true,
      push: true,
      sms: false,
      frequency: 'daily',
    },
    dashboard: {
      showQuickStats: true,
      showRecentActivity: true,
      showRecommendations: true,
      showNotifications: true,
      defaultView: 'overview',
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
    },
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData.preferences) {
      setSettings(userData.preferences);
    }
  }, [userData.preferences]);

  const updateSetting = <K extends keyof PersonalizationSettings>(
    key: K,
    value: PersonalizationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNestedSetting = <K extends keyof PersonalizationSettings>(
    key: K,
    nestedKey: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(settings);
      }
      setHasChanges(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save personalization settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData.preferences) {
      setSettings(userData.preferences);
    }
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personalization
            </CardTitle>
            <CardDescription>
              Customize your dashboard experience
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <div className="space-y-2">
                {THEME_OPTIONS.map((theme) => (
                  <label key={theme.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) => updateSetting('theme', e.target.value as any)}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{theme.icon} {theme.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Layout</label>
              <div className="space-y-2">
                {LAYOUT_OPTIONS.map((layout) => (
                  <label key={layout.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="layout"
                      value={layout.value}
                      checked={settings.layout === layout.value}
                      onChange={(e) => updateSetting('layout', e.target.value as any)}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium">{layout.label}</span>
                      <p className="text-xs text-gray-600">{layout.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Color Scheme</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <label key={scheme.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="colorScheme"
                      value={scheme.value}
                      checked={settings.colorScheme === scheme.value}
                      onChange={(e) => updateSetting('colorScheme', e.target.value as any)}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className={`w-4 h-4 rounded ${scheme.color}`}></div>
                    <span className="text-sm">{scheme.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => updateNestedSetting('notifications', 'email', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => updateNestedSetting('notifications', 'push', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Push notifications</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => updateNestedSetting('notifications', 'sms', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">SMS notifications</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={settings.notifications.frequency}
                onChange={(e) => updateNestedSetting('notifications', 'frequency', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Dashboard
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showQuickStats}
                  onChange={(e) => updateNestedSetting('dashboard', 'showQuickStats', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show quick stats</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showRecentActivity}
                  onChange={(e) => updateNestedSetting('dashboard', 'showRecentActivity', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show recent activity</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showRecommendations}
                  onChange={(e) => updateNestedSetting('dashboard', 'showRecommendations', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show recommendations</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showNotifications}
                  onChange={(e) => updateNestedSetting('dashboard', 'showNotifications', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show notifications</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default View</label>
              <select
                value={settings.dashboard.defaultView}
                onChange={(e) => updateNestedSetting('dashboard', 'defaultView', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Overview</option>
                <option value="services">Services</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Language</label>
              <select
                value={settings.preferences.language}
                onChange={(e) => updateNestedSetting('preferences', 'language', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => updateNestedSetting('preferences', 'timezone', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Format</label>
              <select
                value={settings.preferences.dateFormat}
                onChange={(e) => updateNestedSetting('preferences', 'dateFormat', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Currency</label>
              <select
                value={settings.preferences.currency}
                onChange={(e) => updateNestedSetting('preferences', 'currency', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Behavior Insights */}
        {userData.behavior && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Behavior Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Most Used Features</h4>
                <div className="space-y-1">
                  {userData.behavior.mostUsedFeatures.slice(0, 3).map((feature, index) => (
                    <div key={feature} className="flex items-center gap-2">
                      <span className="text-xs text-blue-700">{index + 1}.</span>
                      <span className="text-xs text-blue-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">Preferred Times</h4>
                <div className="space-y-1">
                  {userData.behavior.preferredTimes.slice(0, 3).map((time, index) => (
                    <div key={time} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-800">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Favorite Services</h4>
                <div className="space-y-1">
                  {userData.behavior.favoriteServices.slice(0, 3).map((service, index) => (
                    <div key={service} className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-purple-600" />
                      <span className="text-xs text-purple-800">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Personalization;
