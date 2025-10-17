"use client";

import React, { useState, useEffect } from 'react';
import {
    Globe,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    Monitor,
    Wrench,
    Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';

interface SystemConfig {
    // Site Information
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;

    // Localization
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;

    // Display Preferences
    theme: 'light' | 'dark' | 'auto';
    itemsPerPage: number;
    enableAnimations: boolean;
    compactMode: boolean;

    // System Maintenance
    maintenanceMode: boolean;
    maintenanceMessage: string;
    debugMode: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';

    // Performance
    cacheEnabled: boolean;
    cacheTtl: number;
    enableCompression: boolean;
    maxUploadSize: number;
}

interface SystemSettingsProps {
    onBack?: () => void;
}

export function SystemSettings({ onBack }: SystemSettingsProps) {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const { request } = useApi();
    const { showSuccess, showError } = useToast();

    // Timezone options
    const timezones = [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'Europe/London', label: 'London (GMT)' },
        { value: 'Europe/Paris', label: 'Paris (CET)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
    ];

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'pt', label: 'Portuguese' }
    ];

    const currencies = [
        { value: 'USD', label: 'US Dollar (USD)' },
        { value: 'EUR', label: 'Euro (EUR)' },
        { value: 'GBP', label: 'British Pound (GBP)' },
        { value: 'CAD', label: 'Canadian Dollar (CAD)' },
        { value: 'AUD', label: 'Australian Dollar (AUD)' },
        { value: 'JPY', label: 'Japanese Yen (JPY)' }
    ];

    useEffect(() => {
        fetchSystemConfig();
    }, []);

    const fetchSystemConfig = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await request('/admin/settings/system');

            if (response.success) {
                setConfig(response.config);
            } else {
                throw new Error(response.error || 'Failed to fetch system configuration');
            }
        } catch (err) {
            console.error('Error fetching system config:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch system configuration');
        } finally {
            setLoading(false);
        }
    };

    const saveSystemConfig = async () => {
        if (!config) return;

        try {
            setSaving(true);

            const response = await request('/admin/settings/system', {
                method: 'PUT',
                body: JSON.stringify(config)
            });

            if (response.success) {
                showSuccess('System configuration saved successfully');
                setHasChanges(false);
            } else {
                throw new Error(response.error || 'Failed to save system configuration');
            }
        } catch (err) {
            console.error('Error saving system config:', err);
            showError(err instanceof Error ? err.message : 'Failed to save system configuration');
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = <K extends keyof SystemConfig>(
        key: K,
        value: SystemConfig[K]
    ) => {
        if (!config) return;

        setConfig(prev => prev ? { ...prev, [key]: value } : null);
        setHasChanges(true);
    };

    const resetToDefaults = () => {
        if (window.confirm('Are you sure you want to reset system settings to defaults? This action cannot be undone.')) {
            fetchSystemConfig();
            setHasChanges(false);
        }
    };

    if (loading) {
        return <AdminLoadingState message="Loading system configuration..." />;
    }

    if (error) {
        return (
            <AdminErrorState
                title="Failed to load system configuration"
                message={error}
                onRetry={fetchSystemConfig}
            />
        );
    }

    if (!config) {
        return (
            <AdminErrorState
                title="System configuration not available"
                message="Unable to load system configuration. Please try again."
                onRetry={fetchSystemConfig}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                        <p className="text-gray-600">Basic application configuration and display preferences</p>
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
                        onClick={saveSystemConfig}
                        disabled={saving || !hasChanges}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Site Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Site Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input
                                id="siteName"
                                value={config.siteName}
                                onChange={(e) => updateConfig('siteName', e.target.value)}
                                placeholder="My Application"
                            />
                        </div>

                        <div>
                            <Label htmlFor="siteUrl">Site URL</Label>
                            <Input
                                id="siteUrl"
                                value={config.siteUrl}
                                onChange={(e) => updateConfig('siteUrl', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="siteDescription">Site Description</Label>
                        <Textarea
                            id="siteDescription"
                            value={config.siteDescription}
                            onChange={(e) => updateConfig('siteDescription', e.target.value)}
                            rows={3}
                            placeholder="A brief description of your application"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="adminEmail">Admin Email</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                value={config.adminEmail}
                                onChange={(e) => updateConfig('adminEmail', e.target.value)}
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input
                                id="supportEmail"
                                type="email"
                                value={config.supportEmail}
                                onChange={(e) => updateConfig('supportEmail', e.target.value)}
                                placeholder="support@example.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Localization Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Localization & Formatting
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="timezone">Timezone</Label>
                            <select
                                id="timezone"
                                value={config.timezone}
                                onChange={(e) => updateConfig('timezone', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {timezones.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="language">Default Language</Label>
                            <select
                                id="language"
                                value={config.language}
                                onChange={(e) => updateConfig('language', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="dateFormat">Date Format</Label>
                            <select
                                id="dateFormat"
                                value={config.dateFormat}
                                onChange={(e) => updateConfig('dateFormat', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                <option value="DD MMM YYYY">DD MMM YYYY</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="timeFormat">Time Format</Label>
                            <select
                                id="timeFormat"
                                value={config.timeFormat}
                                onChange={(e) => updateConfig('timeFormat', e.target.value as '12h' | '24h')}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="12h">12 Hour (AM/PM)</option>
                                <option value="24h">24 Hour</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="currency">Default Currency</Label>
                            <select
                                id="currency"
                                value={config.currency}
                                onChange={(e) => updateConfig('currency', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {currencies.map((curr) => (
                                    <option key={curr.value} value={curr.value}>
                                        {curr.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Display Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="theme">Theme</Label>
                            <select
                                id="theme"
                                value={config.theme}
                                onChange={(e) => updateConfig('theme', e.target.value as 'light' | 'dark' | 'auto')}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto (System)</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="itemsPerPage">Items Per Page</Label>
                            <select
                                id="itemsPerPage"
                                value={config.itemsPerPage.toString()}
                                onChange={(e) => updateConfig('itemsPerPage', parseInt(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enableAnimations"
                                checked={config.enableAnimations}
                                onCheckedChange={(checked) => updateConfig('enableAnimations', checked)}
                            />
                            <Label htmlFor="enableAnimations">Enable Animations</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="compactMode"
                                checked={config.compactMode}
                                onCheckedChange={(checked) => updateConfig('compactMode', checked)}
                            />
                            <Label htmlFor="compactMode">Compact Mode</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Maintenance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        System Maintenance & Debug
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="maintenanceMode"
                                checked={config.maintenanceMode}
                                onCheckedChange={(checked) => updateConfig('maintenanceMode', checked)}
                            />
                            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                        </div>

                        {config.maintenanceMode && (
                            <>
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Maintenance mode is enabled. The site will be inaccessible to regular users.
                                    </AlertDescription>
                                </Alert>

                                <div>
                                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                                    <Textarea
                                        id="maintenanceMessage"
                                        value={config.maintenanceMessage}
                                        onChange={(e) => updateConfig('maintenanceMessage', e.target.value)}
                                        rows={3}
                                        placeholder="We're currently performing maintenance. Please check back soon."
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="debugMode"
                                checked={config.debugMode}
                                onCheckedChange={(checked) => updateConfig('debugMode', checked)}
                            />
                            <Label htmlFor="debugMode">Debug Mode</Label>
                        </div>

                        {config.debugMode && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Debug mode is enabled. This may expose sensitive information and should only be used in development.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enableLogging"
                                checked={config.enableLogging}
                                onCheckedChange={(checked) => updateConfig('enableLogging', checked)}
                            />
                            <Label htmlFor="enableLogging">Enable System Logging</Label>
                        </div>

                        {config.enableLogging && (
                            <div>
                                <Label htmlFor="logLevel">Log Level</Label>
                                <select
                                    id="logLevel"
                                    value={config.logLevel}
                                    onChange={(e) => updateConfig('logLevel', e.target.value as 'debug' | 'info' | 'warn' | 'error')}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="debug">Debug (Most Verbose)</option>
                                    <option value="info">Info</option>
                                    <option value="warn">Warning</option>
                                    <option value="error">Error (Least Verbose)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Performance & Optimization
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="cacheEnabled"
                                checked={config.cacheEnabled}
                                onCheckedChange={(checked) => updateConfig('cacheEnabled', checked)}
                            />
                            <Label htmlFor="cacheEnabled">Enable Caching</Label>
                        </div>

                        {config.cacheEnabled && (
                            <div>
                                <Label htmlFor="cacheTtl">Cache TTL (seconds)</Label>
                                <Input
                                    id="cacheTtl"
                                    type="number"
                                    value={config.cacheTtl}
                                    onChange={(e) => updateConfig('cacheTtl', parseInt(e.target.value))}
                                    min="60"
                                    max="86400"
                                />
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enableCompression"
                                checked={config.enableCompression}
                                onCheckedChange={(checked) => updateConfig('enableCompression', checked)}
                            />
                            <Label htmlFor="enableCompression">Enable Response Compression</Label>
                        </div>

                        <div>
                            <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                            <Input
                                id="maxUploadSize"
                                type="number"
                                value={config.maxUploadSize}
                                onChange={(e) => updateConfig('maxUploadSize', parseInt(e.target.value))}
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}