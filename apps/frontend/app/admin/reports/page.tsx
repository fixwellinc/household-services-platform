"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Mail,
  Clock
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'customer' | 'marketing';
  lastGenerated: Date;
  schedule?: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'csv' | 'excel';
  status: 'ready' | 'generating' | 'scheduled';
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Revenue Report',
      description: 'Comprehensive revenue analysis with trends and forecasts',
      type: 'financial',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      schedule: 'monthly',
      format: 'pdf',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Customer Satisfaction Analysis',
      description: 'Customer feedback analysis and satisfaction metrics',
      type: 'customer',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      schedule: 'weekly',
      format: 'excel',
      status: 'ready'
    },
    {
      id: '3',
      name: 'Service Operations Dashboard',
      description: 'Operational metrics including service requests and completion rates',
      type: 'operational',
      lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      schedule: 'daily',
      format: 'csv',
      status: 'generating'
    },
    {
      id: '4',
      name: 'Marketing Campaign Performance',
      description: 'Email campaign metrics and conversion analysis',
      type: 'marketing',
      lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      format: 'pdf',
      status: 'scheduled'
    }
  ];

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'operational':
        return <BarChart3 className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'marketing':
        return <Mail className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    if (selectedType === 'all') return true;
    return report.type === selectedType;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Generate and download business reports and analytics
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Custom Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total Reports</p>
                <p className="text-lg font-semibold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Scheduled</p>
                <p className="text-lg font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Downloads This Month</p>
                <p className="text-lg font-semibold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Report Usage</p>
                <p className="text-lg font-semibold">+23%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(report.type)}
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(report.status)}>
                  {report.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {report.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Format</p>
                    <p className="font-medium mt-1 uppercase">{report.format}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Schedule</p>
                    <p className="font-medium mt-1">
                      {report.schedule ? report.schedule : 'Manual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Last Generated</p>
                    <p className="font-medium mt-1">
                      {report.lastGenerated.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {report.status === 'ready' && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Financial Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Revenue & Profit Analysis</p>
              <p>• Subscription Metrics</p>
              <p>• Payment Processing</p>
              <p>• Financial Forecasting</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Operational Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Service Performance</p>
              <p>• Resource Utilization</p>
              <p>• Quality Metrics</p>
              <p>• Efficiency Analysis</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Customer Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Customer Satisfaction</p>
              <p>• Retention Analysis</p>
              <p>• Churn Prediction</p>
              <p>• Feedback Trends</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-orange-600" />
              <span>Marketing Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Campaign Performance</p>
              <p>• Conversion Rates</p>
              <p>• Email Metrics</p>
              <p>• ROI Analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}