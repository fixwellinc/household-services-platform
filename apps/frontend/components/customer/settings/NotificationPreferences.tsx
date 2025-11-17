'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Bell, Mail, MessageSquare, Smartphone, Loader2 } from 'lucide-react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/use-customer-notifications';

export function NotificationPreferences() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [formData, setFormData] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    appointmentConfirmation: true,
    appointmentReminder: true,
    appointmentCancellation: true,
    appointmentReschedule: true,
    appointmentStatusChange: true,
  });

  useEffect(() => {
    if (preferences?.data) {
      setFormData({
        emailEnabled: preferences.data.emailEnabled ?? true,
        smsEnabled: preferences.data.smsEnabled ?? false,
        pushEnabled: preferences.data.pushEnabled ?? true,
        appointmentConfirmation: preferences.data.appointmentConfirmation ?? true,
        appointmentReminder: preferences.data.appointmentReminder ?? true,
        appointmentCancellation: preferences.data.appointmentCancellation ?? true,
        appointmentReschedule: preferences.data.appointmentReschedule ?? true,
        appointmentStatusChange: preferences.data.appointmentStatusChange ?? true,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      alert(error.message || 'Failed to update preferences. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Methods */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailEnabled}
                    onChange={() => handleToggle('emailEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive notifications via text message</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.smsEnabled}
                    onChange={() => handleToggle('smsEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pushEnabled}
                    onChange={() => handleToggle('pushEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Appointment Notifications */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Appointment Confirmations</p>
                  <p className="text-sm text-gray-600">Notify when appointments are confirmed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.appointmentConfirmation}
                    onChange={() => handleToggle('appointmentConfirmation')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Appointment Reminders</p>
                  <p className="text-sm text-gray-600">Remind me before appointments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.appointmentReminder}
                    onChange={() => handleToggle('appointmentReminder')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Cancellation Notifications</p>
                  <p className="text-sm text-gray-600">Notify when appointments are cancelled</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.appointmentCancellation}
                    onChange={() => handleToggle('appointmentCancellation')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Reschedule Notifications</p>
                  <p className="text-sm text-gray-600">Notify when appointments are rescheduled</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.appointmentReschedule}
                    onChange={() => handleToggle('appointmentReschedule')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Status Change Notifications</p>
                  <p className="text-sm text-gray-600">Notify when appointment status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.appointmentStatusChange}
                    onChange={() => handleToggle('appointmentStatusChange')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

