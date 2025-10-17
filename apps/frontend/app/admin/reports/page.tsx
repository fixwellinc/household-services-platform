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
  Clock,
  Database,
  Settings,
  Shield,
  Plus,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import ReportsOverview from '@/components/admin/reports/ReportsOverview';
import ReportBuilder from '@/components/admin/reports/ReportBuilder';
import ReportViewer from '@/components/admin/reports/ReportViewer';
import ExportManager from '@/components/admin/reports/ExportManager';

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

import { AdminPageErrorBoundary } from '@/components/admin/error-boundaries/AdminPageErrorBoundary';
import { createErrorBoundaryProps } from '@/lib/admin-error-reporting';

function ReportsPageContent() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [currentView, setCurrentView] = useState<'overview' | 'builder' | 'viewer' | 'export'>('overview');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

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

  // Mock report data for viewer
  const mockReportData = {
    columns: [
      { id: 'name', name: 'Customer Name', type: 'string' as const },
      { id: 'email', name: 'Email', type: 'string' as const },
      { id: 'revenue', name: 'Revenue', type: 'number' as const },
      { id: 'signup_date', name: 'Signup Date', type: 'date' as const }
    ],
    rows: [
      ['John Doe', 'john@example.com', 1250.50, new Date('2024-01-15')],
      ['Jane Smith', 'jane@example.com', 2100.75, new Date('2024-01-20')],
      ['Bob Johnson', 'bob@example.com', 850.25, new Date('2024-01-25')]
    ],
    totalRows: 3,
    generatedAt: new Date(),
    metadata: {
      reportId: '1',
      reportName: 'Customer Revenue Report',
      description: 'Monthly customer revenue analysis',
      dataSource: 'customers',
      filters: [],
      executionTime: 245
    }
  };

  const handleCreateReport = () => {
    setCurrentView('builder');
  };

  const handleEditReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentView('builder');
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentView('viewer');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedReportId(null);
  };

  const handleSaveReport = (config: any) => {
    console.log('Saving report config:', config);
    // In real implementation, this would save to API
    setCurrentView('overview');
  };

  const handlePreviewReport = (config: any) => {
    console.log('Previewing report config:', config);
    // In real implementation, this would generate preview data
    setCurrentView('viewer');
  };

  const handleExportReport = (options: any) => {
    console.log('Exporting report with options:', options);
    // In real implementation, this would trigger export
  };

  // Render different views based on current state
  if (currentView === 'builder') {
    return (
      <div className="space-y-6 p-6">
        <ReportBuilder
          onSave={handleSaveReport}
          onPreview={handlePreviewReport}
          onCancel={handleBackToOverview}
        />
      </div>
    );
  }

  if (currentView === 'viewer') {
    return (
      <div className="space-y-6 p-6">
        <ReportViewer
          reportData={mockReportData}
          onExport={handleExportReport}
          onBack={handleBackToOverview}
        />
      </div>
    );
  }

  if (currentView === 'export') {
    return (
      <div className="space-y-6 p-6">
        <ExportManager
          reportId={selectedReportId || undefined}
          reportName="Sample Report"
          onExport={handleExportReport}
        />
      </div>
    );
  }

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
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setCurrentView('export')}>
            <Database className="h-4 w-4 mr-2" />
            Export Manager
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('builder')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
          <Button onClick={() => setCurrentView('viewer')}>
            <Eye className="h-4 w-4 mr-2" />
            View Sample
          </Button>
        </div>
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
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="pl-10 w-48"
          >
            <option value="all">All Types</option>
            <option value="financial">Financial</option>
            <option value="operational">Operational</option>
            <option value="customer">Customer</option>
            <option value="marketing">Marketing</option>
          </Select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="pl-10 w-48"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
      </div>

      {/* Reports Overview Component */}
      <ReportsOverview
        onCreateReport={handleCreateReport}
        onEditReport={handleEditReport}
        onViewReport={handleViewReport}
      />

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

export default function ReportsPage() {
  return (
    <AdminPageErrorBoundary 
      {...createErrorBoundaryProps('AdminReportsPage')}
      pageTitle="Reports & Analytics"
    >
      <ReportsPageContent />
    </AdminPageErrorBoundary>
  );
}