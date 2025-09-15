"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Play,
  Pause,
  Edit,
  Trash2,
  Target,
  Send
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  audience: {
    total: number;
    segments: string[];
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency?: string;
  };
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
  createdAt: Date;
}

export function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Welcome Series for New Customers',
      description: 'Automated welcome email series for new customer onboarding',
      type: 'email',
      status: 'running',
      audience: {
        total: 1247,
        segments: ['new_customers', 'residential']
      },
      schedule: {
        startDate: new Date('2024-01-01'),
        frequency: 'triggered'
      },
      performance: {
        sent: 1247,
        delivered: 1235,
        opened: 687,
        clicked: 156,
        unsubscribed: 12
      },
      createdAt: new Date('2023-12-15')
    },
    {
      id: '2',
      name: 'Monthly Service Reminders',
      description: 'Monthly reminder campaign for subscription customers',
      type: 'email',
      status: 'scheduled',
      audience: {
        total: 2143,
        segments: ['active_subscribers', 'monthly_service']
      },
      schedule: {
        startDate: new Date('2024-02-01'),
        frequency: 'monthly'
      },
      performance: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0
      },
      createdAt: new Date('2024-01-20')
    }
  ]);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Send className="h-4 w-4" />;
      case 'push': return <Send className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Builder</h2>
          <p className="text-gray-600 mt-1">
            Create and manage marketing campaigns and automated communications
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Active Campaigns</p>
                <p className="text-lg font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Scheduled</p>
                <p className="text-lg font-semibold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Total Audience</p>
                <p className="text-lg font-semibold">5.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Avg Open Rate</p>
                <p className="text-lg font-semibold">24.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(campaign.type)}
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Audience</p>
                  <p className="font-semibold">{campaign.audience.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Sent</p>
                  <p className="font-semibold">{campaign.performance.sent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Delivered</p>
                  <p className="font-semibold">{campaign.performance.delivered.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Open Rate</p>
                  <p className="font-semibold">
                    {campaign.performance.sent > 0
                      ? ((campaign.performance.opened / campaign.performance.sent) * 100).toFixed(1)
                      : '0'
                    }%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Click Rate</p>
                  <p className="font-semibold">
                    {campaign.performance.sent > 0
                      ? ((campaign.performance.clicked / campaign.performance.sent) * 100).toFixed(1)
                      : '0'
                    }%
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {campaign.audience.segments.map((segment) => (
                  <Badge key={segment} variant="secondary" className="text-xs">
                    {segment.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}