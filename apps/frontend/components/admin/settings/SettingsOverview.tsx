"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Mail, 
  CreditCard, 
  Database, 
  Monitor,
  Search,
  ChevronRight,
  Zap,
  Users,
  Key
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'system' | 'security' | 'integration';
  status?: 'configured' | 'needs-attention' | 'not-configured';
  quickActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface SettingsOverviewProps {
  onSectionSelect: (sectionId: string) => void;
  currentSection?: string;
}

export function SettingsOverview({ onSectionSelect, currentSection }: SettingsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'system' | 'security' | 'integration'>('all');

  const settingsSections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic site configuration, timezone, and display preferences',
      icon: Globe,
      category: 'system',
      status: 'configured',
      quickActions: [
        { label: 'Edit Site Info', action: () => onSectionSelect('general') }
      ]
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Password policies, two-factor authentication, and access controls',
      icon: Shield,
      category: 'security',
      status: 'needs-attention',
      quickActions: [
        { label: 'Configure 2FA', action: () => onSectionSelect('security') },
        { label: 'Password Policy', action: () => onSectionSelect('security') }
      ]
    },
    {
      id: 'email',
      title: 'Email Configuration',
      description: 'SMTP settings, notification preferences, and email templates',
      icon: Mail,
      category: 'integration',
      status: 'configured',
      quickActions: [
        { label: 'Test Connection', action: () => {} },
        { label: 'Edit Templates', action: () => onSectionSelect('email') }
      ]
    },
    {
      id: 'payments',
      title: 'Payment Settings',
      description: 'Stripe configuration, currency settings, and tax rates',
      icon: CreditCard,
      category: 'integration',
      status: 'not-configured',
      quickActions: [
        { label: 'Setup Stripe', action: () => onSectionSelect('payments') }
      ]
    },
    {
      id: 'database',
      title: 'Database Settings',
      description: 'Database connection, backup settings, and maintenance',
      icon: Database,
      category: 'system',
      status: 'configured',
      quickActions: [
        { label: 'Test Connection', action: () => {} },
        { label: 'Backup Settings', action: () => onSectionSelect('database') }
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Logging',
      description: 'System monitoring, analytics, and error reporting',
      icon: Monitor,
      category: 'system',
      status: 'configured',
      quickActions: [
        { label: 'View Logs', action: () => {} },
        { label: 'Configure Alerts', action: () => onSectionSelect('monitoring') }
      ]
    },
    {
      id: 'api',
      title: 'API & Integrations',
      description: 'API keys, webhooks, and third-party service configurations',
      icon: Key,
      category: 'integration',
      status: 'needs-attention',
      quickActions: [
        { label: 'Manage API Keys', action: () => onSectionSelect('api') },
        { label: 'Configure Webhooks', action: () => onSectionSelect('api') }
      ]
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'User roles, permissions, and account settings',
      icon: Users,
      category: 'security',
      status: 'configured',
      quickActions: [
        { label: 'Manage Roles', action: () => onSectionSelect('users') }
      ]
    }
  ];

  const filteredSections = settingsSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'configured':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs-attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not-configured':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'configured':
        return 'Configured';
      case 'needs-attention':
        return 'Needs Attention';
      case 'not-configured':
        return 'Not Configured';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings Overview</h1>
            <p className="text-gray-600">Configure and manage system settings</p>
          </div>
        </div>
      </div>

      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Quick Setup
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(value: any) => setActiveCategory(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Settings</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => {
              const IconComponent = section.icon;
              const isActive = currentSection === section.id;
              
              return (
                <Card 
                  key={section.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => onSectionSelect(section.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    {section.status && (
                      <Badge 
                        variant="outline" 
                        className={`w-fit ${getStatusColor(section.status)}`}
                      >
                        {getStatusText(section.status)}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4">
                      {section.description}
                    </p>
                    
                    {section.quickActions && section.quickActions.length > 0 && (
                      <div className="space-y-2">
                        {section.quickActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.action();
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
              <p className="text-gray-600">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {settingsSections.filter(s => s.status === 'configured').length} Configured
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {settingsSections.filter(s => s.status === 'needs-attention').length} Need Attention
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {settingsSections.filter(s => s.status === 'not-configured').length} Not Configured
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}