"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemHealthDashboard from '@/components/admin/monitoring/SystemHealthDashboard';
import PerformanceCharts from '@/components/admin/monitoring/PerformanceCharts';
import MaintenanceTools from '@/components/admin/monitoring/MaintenanceTools';
import AlertManagement from '@/components/admin/monitoring/AlertManagement';

export default function MonitoringPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive system health monitoring and performance analytics
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Health Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance Charts</TabsTrigger>
          <TabsTrigger value="alerts">Alert Management</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertManagement />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceTools />
        </TabsContent>
      </Tabs>
    </div>
  );
}