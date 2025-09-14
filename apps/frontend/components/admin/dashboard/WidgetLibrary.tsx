"use client";

import React, { useState } from 'react';
import { WidgetTemplate, DashboardWidget } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Table, 
  AlertTriangle,
  Activity,
  Users,
  DollarSign,
  Calendar,
  Search,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetAdd: (template: WidgetTemplate) => void;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // Analytics Widgets
  {
    id: 'user-count-metric',
    name: 'User Count',
    description: 'Display total number of users with trend indicator',
    category: 'analytics',
    type: 'metric',
    defaultConfig: {
      dataSource: 'users',
      parameters: { metric: 'count' },
      visualization: { colors: ['#3B82F6'] }
    },
    defaultSize: { width: 250, height: 150 },
    tags: ['users', 'count', 'metric']
  },
  {
    id: 'revenue-metric',
    name: 'Total Revenue',
    description: 'Show total revenue with growth percentage',
    category: 'business',
    type: 'metric',
    defaultConfig: {
      dataSource: 'revenue',
      parameters: { metric: 'total', unit: 'currency' },
      visualization: { colors: ['#10B981'] }
    },
    defaultSize: { width: 250, height: 150 },
    tags: ['revenue', 'money', 'business']
  },
  {
    id: 'bookings-metric',
    name: 'Active Bookings',
    description: 'Current number of active bookings',
    category: 'business',
    type: 'metric',
    defaultConfig: {
      dataSource: 'bookings',
      parameters: { metric: 'active_count' },
      visualization: { colors: ['#F59E0B'] }
    },
    defaultSize: { width: 250, height: 150 },
    tags: ['bookings', 'active', 'count']
  },
  {
    id: 'user-growth-chart',
    name: 'User Growth',
    description: 'Line chart showing user registration over time',
    category: 'analytics',
    type: 'chart',
    defaultConfig: {
      dataSource: 'users',
      parameters: { metric: 'growth', period: '30d' },
      visualization: { 
        chartType: 'line',
        colors: ['#3B82F6'],
        showGrid: true,
        showLegend: false,
        animation: true
      }
    },
    defaultSize: { width: 400, height: 250 },
    tags: ['users', 'growth', 'trend', 'chart']
  },
  {
    id: 'revenue-chart',
    name: 'Revenue Trend',
    description: 'Area chart displaying revenue over time',
    category: 'business',
    type: 'chart',
    defaultConfig: {
      dataSource: 'revenue',
      parameters: { metric: 'daily', period: '30d' },
      visualization: { 
        chartType: 'area',
        colors: ['#10B981'],
        showGrid: true,
        showLegend: false,
        animation: true
      }
    },
    defaultSize: { width: 400, height: 250 },
    tags: ['revenue', 'trend', 'daily', 'chart']
  },
  {
    id: 'subscription-breakdown',
    name: 'Subscription Breakdown',
    description: 'Pie chart showing subscription plan distribution',
    category: 'business',
    type: 'chart',
    defaultConfig: {
      dataSource: 'subscriptions',
      parameters: { metric: 'plan_distribution' },
      visualization: { 
        chartType: 'pie',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        showLegend: true,
        animation: true
      }
    },
    defaultSize: { width: 350, height: 300 },
    tags: ['subscriptions', 'plans', 'distribution', 'pie']
  },
  {
    id: 'recent-users-table',
    name: 'Recent Users',
    description: 'Table showing recently registered users',
    category: 'analytics',
    type: 'table',
    defaultConfig: {
      dataSource: 'users',
      parameters: { 
        limit: 10, 
        sort: 'created_at',
        order: 'desc',
        fields: ['name', 'email', 'created_at', 'status']
      },
      visualization: {}
    },
    defaultSize: { width: 500, height: 300 },
    tags: ['users', 'recent', 'table', 'list']
  },
  {
    id: 'active-bookings-table',
    name: 'Active Bookings',
    description: 'Table of current active service bookings',
    category: 'business',
    type: 'table',
    defaultConfig: {
      dataSource: 'bookings',
      parameters: { 
        status: 'active',
        limit: 15,
        fields: ['customer', 'service', 'date', 'technician', 'status']
      },
      visualization: {}
    },
    defaultSize: { width: 600, height: 350 },
    tags: ['bookings', 'active', 'services', 'table']
  },
  {
    id: 'system-alerts',
    name: 'System Alerts',
    description: 'Display system alerts and notifications',
    category: 'monitoring',
    type: 'alert',
    defaultConfig: {
      dataSource: 'system_alerts',
      parameters: { severity: 'all', limit: 20 },
      visualization: {},
      alerts: []
    },
    defaultSize: { width: 350, height: 400 },
    tags: ['alerts', 'system', 'monitoring', 'notifications']
  },
  {
    id: 'performance-alerts',
    name: 'Performance Alerts',
    description: 'Monitor performance-related alerts and warnings',
    category: 'monitoring',
    type: 'alert',
    defaultConfig: {
      dataSource: 'performance_alerts',
      parameters: { category: 'performance' },
      visualization: {},
      alerts: [
        {
          id: 'cpu-threshold',
          name: 'High CPU Usage',
          condition: { field: 'cpu_usage', operator: 'gt', value: 80 },
          severity: 'high',
          enabled: true,
          notifications: []
        }
      ]
    },
    defaultSize: { width: 350, height: 300 },
    tags: ['performance', 'alerts', 'monitoring', 'cpu']
  }
];

const CATEGORY_ICONS = {
  analytics: BarChart3,
  business: DollarSign,
  monitoring: Activity,
  system: Users
};

export function WidgetLibrary({ isOpen, onClose, onWidgetAdd }: WidgetLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const categories = Array.from(new Set(WIDGET_TEMPLATES.map(t => t.category)));
  const types = Array.from(new Set(WIDGET_TEMPLATES.map(t => t.type)));

  const filteredTemplates = WIDGET_TEMPLATES.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesType = selectedType === 'all' || template.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleAddWidget = (template: WidgetTemplate) => {
    onWidgetAdd(template);
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'metric':
        return TrendingUp;
      case 'chart':
        return BarChart3;
      case 'table':
        return Table;
      case 'alert':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'metric':
        return 'text-blue-600 bg-blue-50';
      case 'chart':
        return 'text-green-600 bg-green-50';
      case 'table':
        return 'text-purple-600 bg-purple-50';
      case 'alert':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Widget Library</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a widget to add to your dashboard</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category and Type Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const TypeIcon = getTypeIcon(template.type);
                const CategoryIcon = CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS] || Activity;

                return (
                  <Card key={template.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={cn("p-2 rounded", getTypeColor(template.type))}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {template.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Size: {template.defaultSize.width} × {template.defaultSize.height}
                    </div>

                    <Button
                      onClick={() => handleAddWidget(template)}
                      className="w-full"
                      size="sm"
                    >
                      Add Widget
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}