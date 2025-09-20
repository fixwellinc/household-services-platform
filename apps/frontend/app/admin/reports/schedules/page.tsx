"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ReportSchedule {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  schedule: string;
  parameters: Record<string, any>;
  deliveryMethod: 'download' | 'email';
  deliveryConfig: any;
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  format: string;
}

export default function ReportSchedulesPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    templateId: '',
    name: '',
    description: '',
    schedule: '',
    parameters: {} as Record<string, any>,
    deliveryMethod: 'download' as 'download' | 'email',
    deliveryConfig: {
      recipients: [] as string[],
      subject: '',
      message: '',
      format: 'excel'
    },
    isActive: true
  });

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/admin/reports/schedules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load report schedules",
        variant: "destructive"
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/reports/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateSchedule = () => {
    setFormData({
      templateId: '',
      name: '',
      description: '',
      schedule: '',
      parameters: {},
      deliveryMethod: 'download',
      deliveryConfig: {
        recipients: [],
        subject: '',
        message: '',
        format: 'excel'
      },
      isActive: true
    });
    setEditingSchedule(null);
    setIsCreateModalOpen(true);
  };

  const handleEditSchedule = (schedule: ReportSchedule) => {
    setFormData({
      templateId: schedule.templateId,
      name: schedule.name,
      description: schedule.description || '',
      schedule: schedule.schedule,
      parameters: schedule.parameters,
      deliveryMethod: schedule.deliveryMethod,
      deliveryConfig: schedule.deliveryConfig,
      isActive: schedule.isActive
    });
    setEditingSchedule(schedule);
    setIsCreateModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!formData.templateId || !formData.name || !formData.schedule) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = editingSchedule 
        ? `/api/admin/reports/schedules/${editingSchedule.id}`
        : '/api/admin/reports/schedule';
      
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report schedule ${editingSchedule ? 'updated' : 'created'} successfully`
        });
        setIsCreateModalOpen(false);
        loadSchedules();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Save schedule error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report schedule deleted successfully"
        });
        loadSchedules();
      } else {
        throw new Error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Delete schedule error:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    try {
      const response = await fetch(`/api/admin/reports/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !schedule.isActive
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report schedule ${!schedule.isActive ? 'activated' : 'deactivated'}`
        });
        loadSchedules();
      } else {
        throw new Error('Failed to toggle schedule');
      }
    } catch (error) {
      console.error('Toggle schedule error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle schedule",
        variant: "destructive"
      });
    }
  };

  const getScheduleDescription = (cronExpression: string) => {
    // Simple cron expression descriptions
    const descriptions: Record<string, string> = {
      '0 0 * * *': 'Daily at midnight',
      '0 9 * * *': 'Daily at 9:00 AM',
      '0 0 * * 0': 'Weekly on Sunday at midnight',
      '0 9 * * 1': 'Weekly on Monday at 9:00 AM',
      '0 0 1 * *': 'Monthly on the 1st at midnight',
      '0 9 1 * *': 'Monthly on the 1st at 9:00 AM'
    };

    return descriptions[cronExpression] || cronExpression;
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Reports</h1>
          <p className="text-gray-600 mt-1">
            Automate report generation and delivery with scheduled jobs
          </p>
        </div>
        <Button onClick={handleCreateSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total Schedules</p>
                <p className="text-lg font-semibold">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-lg font-semibold">
                  {schedules.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Inactive</p>
                <p className="text-lg font-semibold">
                  {schedules.filter(s => !s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => {
          const template = templates.find(t => t.id === schedule.templateId);
          return (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {schedule.description || template?.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule)}
                    >
                      {schedule.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Template</p>
                    <p className="font-medium">{template?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Schedule</p>
                    <p className="font-medium">{getScheduleDescription(schedule.schedule)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Delivery</p>
                    <div className="flex items-center space-x-1">
                      {schedule.deliveryMethod === 'email' ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="font-medium capitalize">{schedule.deliveryMethod}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Next Run</p>
                    <p className="font-medium">
                      {schedule.nextRun 
                        ? new Date(schedule.nextRun).toLocaleDateString()
                        : 'Not scheduled'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {schedules.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No scheduled reports yet</p>
                <Button variant="link" onClick={handleCreateSchedule}>
                  Create your first schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSchedule ? 'Edit' : 'Create'} Scheduled Report
            </h2>

            <div className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Report Template *</Label>
                <Select 
                  value={formData.templateId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter schedule name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cron Schedule *</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 9 * * *">Daily at 9:00 AM</SelectItem>
                      <SelectItem value="0 9 * * 1">Weekly on Monday at 9:00 AM</SelectItem>
                      <SelectItem value="0 9 1 * *">Monthly on 1st at 9:00 AM</SelectItem>
                      <SelectItem value="0 0 1 1,4,7,10 *">Quarterly at midnight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select
                  value={formData.deliveryMethod}
                  onValueChange={(value: 'download' | 'email') => 
                    setFormData(prev => ({ ...prev, deliveryMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="download">Download Only</SelectItem>
                    <SelectItem value="email">Email Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Configuration */}
              {formData.deliveryMethod === 'email' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Email Configuration</h4>
                  <div className="space-y-2">
                    <Label>Recipients (comma-separated emails)</Label>
                    <Input
                      value={formData.deliveryConfig.recipients.join(', ')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deliveryConfig: {
                          ...prev.deliveryConfig,
                          recipients: e.target.value.split(',').map(email => email.trim())
                        }
                      }))}
                      placeholder="admin@example.com, manager@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={formData.deliveryConfig.subject}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deliveryConfig: {
                          ...prev.deliveryConfig,
                          subject: e.target.value
                        }
                      }))}
                      placeholder="Scheduled Report: {reportName}"
                    />
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active (start scheduling immediately)</Label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingSchedule ? 'Update' : 'Create'} Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}