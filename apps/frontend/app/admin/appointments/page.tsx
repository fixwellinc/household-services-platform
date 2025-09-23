'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, List, Grid } from 'lucide-react';
import { AvailabilityManager, AppointmentsList, WeeklyScheduleGrid, AppointmentAnalytics } from '@/components/admin/appointments';

interface AvailabilityRule {
  id?: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  serviceType?: string | null;
  bufferMinutes: number;
  maxBookingsPerDay: number;
}

export default function AppointmentsPage() {
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRulesUpdate = (rules: AvailabilityRule[]) => {
    setAvailabilityRules(rules);
    setRefreshKey(prev => prev + 1);
  };

  const handleRuleUpdate = (dayOfWeek: number, updates: Partial<AvailabilityRule>) => {
    setAvailabilityRules(prev => 
      prev.map(rule => 
        rule.dayOfWeek === dayOfWeek 
          ? { ...rule, ...updates }
          : rule
      )
    );
  };

  const handleAppointmentUpdate = () => {
    // Refresh appointments list when an appointment is updated
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointment Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your appointment availability and bookings
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          Admin Dashboard
        </Badge>
      </div>

      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Schedule Grid
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6">
          <AppointmentsList 
            key={`appointments-${refreshKey}`}
            onAppointmentUpdate={handleAppointmentUpdate}
          />
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <AvailabilityManager 
            onRulesUpdate={handleRulesUpdate}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <WeeklyScheduleGrid 
            rules={availabilityRules}
            onRuleUpdate={handleRuleUpdate}
            showBookings={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AppointmentAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}