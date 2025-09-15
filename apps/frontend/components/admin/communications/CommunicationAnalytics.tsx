"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Users,
  Clock,
  Target,
  Eye
} from 'lucide-react';

export function CommunicationAnalytics() {
  const metrics = {
    totalMessages: 12567,
    totalMessagesChange: '+12.5%',
    responseRate: 68.2,
    responseRateChange: '+5.2%',
    avgResponseTime: '2.4h',
    avgResponseTimeChange: '-0.5h',
    customerSatisfaction: 4.3,
    customerSatisfactionChange: '+0.2'
  };

  const channelStats = [
    { channel: 'Email', sent: 8245, delivered: 8156, opened: 3289, clicked: 456, rate: 40.3 },
    { channel: 'SMS', sent: 3456, delivered: 3445, opened: 2890, clicked: 234, rate: 83.9 },
    { channel: 'Chat', sent: 867, delivered: 867, opened: 753, clicked: 189, rate: 86.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Communication Analytics</h2>
        <p className="text-gray-600 mt-1">
          Monitor communication performance and engagement metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{metrics.totalMessages.toLocaleString()}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">{metrics.totalMessagesChange}</span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold">{metrics.responseRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">{metrics.responseRateChange}</span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">{metrics.avgResponseTimeChange}</span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{metrics.customerSatisfaction}/5</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">{metrics.customerSatisfactionChange}</span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>
            Communication performance by channel over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelStats.map((channel) => (
              <div key={channel.channel} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {channel.channel === 'Email' && <Mail className="h-5 w-5 text-blue-600" />}
                    {channel.channel === 'SMS' && <MessageSquare className="h-5 w-5 text-green-600" />}
                    {channel.channel === 'Chat' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                    <h4 className="font-semibold">{channel.channel}</h4>
                  </div>
                  <Badge variant="secondary">{channel.rate}% engagement</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Sent</p>
                    <p className="font-semibold">{channel.sent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Delivered</p>
                    <p className="font-semibold">{channel.delivered.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((channel.delivered / channel.sent) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Opened</p>
                    <p className="font-semibold">{channel.opened.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((channel.opened / channel.delivered) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Clicked</p>
                    <p className="font-semibold">{channel.clicked.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((channel.clicked / channel.opened) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        channel.channel === 'Email' ? 'bg-blue-600' :
                        channel.channel === 'SMS' ? 'bg-green-600' : 'bg-purple-600'
                      }`}
                      style={{ width: `${channel.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Templates</CardTitle>
            <CardDescription>Most effective message templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Service Confirmation', opens: 2456, rate: 89.2 },
                { name: 'Welcome Message', opens: 1834, rate: 76.5 },
                { name: 'Appointment Reminder', opens: 1623, rate: 72.1 },
                { name: 'Billing Notification', opens: 1245, rate: 68.9 }
              ].map((template) => (
                <div key={template.name} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-gray-600">{template.opens} opens</p>
                  </div>
                  <Badge variant="outline">{template.rate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Breakdown</CardTitle>
            <CardDescription>Average response times by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { category: 'General Inquiries', time: '1.2h', trend: 'down' },
                { category: 'Technical Support', time: '3.5h', trend: 'up' },
                { category: 'Billing Questions', time: '2.1h', trend: 'down' },
                { category: 'Service Requests', time: '4.2h', trend: 'same' }
              ].map((item) => (
                <div key={item.category} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-gray-600">Average response time</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.time}</p>
                    <div className="flex items-center">
                      {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-600" />}
                      {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-600" />}
                      {item.trend === 'same' && <div className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}