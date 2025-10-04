"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Send, 
  Save,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'booking_confirmation' | 'payment_receipt' | 'appointment_reminder' | 'password_reset' | 'newsletter' | 'promotional' | 'custom';
  category: 'transactional' | 'marketing' | 'system';
  isActive: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  subject: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  createdAt: string;
}

export function EmailTemplateManagement() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch templates and campaigns
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [templatesResponse, campaignsResponse] = await Promise.all([
        request('/admin/email-templates'),
        request('/admin/email-campaigns')
      ]);
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.templates || []);
      }
      
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching email data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await request(`/admin/email-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        showSuccess('Template deleted successfully');
        fetchData();
      } else {
        throw new Error(response.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicateTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined
      };

      const response = await request('/admin/email-templates', {
        method: 'POST',
        body: JSON.stringify(duplicateTemplate)
      });

      if (response.success) {
        showSuccess('Template duplicated successfully');
        fetchData();
      } else {
        throw new Error(response.error || 'Failed to duplicate template');
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      showError(err instanceof Error ? err.message : 'Failed to duplicate template');
    }
  };

  const handleTestEmail = async (template: EmailTemplate) => {
    if (!testEmail) {
      showError('Please enter a test email address');
      return;
    }

    try {
      const response = await request(`/admin/email-templates/${template.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ email: testEmail })
      });

      if (response.success) {
        showSuccess(`Test email sent to ${testEmail}`);
      } else {
        throw new Error(response.error || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      showError(err instanceof Error ? err.message : 'Failed to send test email');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <Users className="h-4 w-4" />;
      case 'booking_confirmation': return <Calendar className="h-4 w-4" />;
      case 'payment_receipt': return <CreditCard className="h-4 w-4" />;
      case 'appointment_reminder': return <Clock className="h-4 w-4" />;
      case 'password_reset': return <AlertTriangle className="h-4 w-4" />;
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'promotional': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transactional': return 'bg-blue-100 text-blue-800';
      case 'marketing': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading email templates..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load email templates"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <AdminErrorBoundary context="EmailTemplateManagement">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-gray-600">Manage email templates and campaigns</p>
            </div>
          </div>
          
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Templates</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter(t => t.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.reduce((sum, c) => sum + c.recipients, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
                      <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                      <SelectItem value="password_reset">Password Reset</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <AdminEmptyState
                title="No templates found"
                message="No email templates match your current filters."
                icon={<Mail className="h-12 w-12 text-gray-400" />}
                action={
                  <Button onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTemplateIcon(template.type)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Subject</p>
                        <p className="text-sm text-gray-900">{template.subject}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Used {template.usageCount} times</span>
                        <div className="flex items-center space-x-1">
                          {template.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{template.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEmptyState
                  title="No campaigns yet"
                  message="Create your first email campaign to start sending bulk emails."
                  icon={<Send className="h-12 w-12 text-gray-400" />}
                  action={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEmptyState
                  title="Analytics coming soon"
                  message="Email analytics and performance metrics will be available soon."
                  icon={<FileText className="h-12 w-12 text-gray-400" />}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Template Preview</h2>
                <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
                  ×
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-lg font-semibold">{selectedTemplate.subject}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleTestEmail(selectedTemplate)}
                    disabled={!testEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Form Modal */}
        {showTemplateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <Button variant="ghost" onClick={() => setShowTemplateForm(false)}>
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <EmailTemplateForm
                  template={editingTemplate}
                  onSave={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                    fetchData();
                  }}
                  onCancel={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
}

// Email Template Form Component
interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

function EmailTemplateForm({ template, onSave, onCancel }: EmailTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    type: template?.type || 'custom',
    category: template?.category || 'transactional',
    isActive: template?.isActive ?? true
  });

  const [saving, setSaving] = useState(false);
  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const url = template ? `/admin/email-templates/${template.id}` : '/admin/email-templates';
      const method = template ? 'PUT' : 'POST';
      
      const response = await request(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (response.success) {
        showSuccess(template ? 'Template updated successfully' : 'Template created successfully');
        onSave();
      } else {
        throw new Error(response.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      showError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="type">Template Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome Email</SelectItem>
              <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
              <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
              <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
              <SelectItem value="password_reset">Password Reset</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>
      
      <div>
        <Label htmlFor="subject">Subject Line</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="content">Email Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={12}
          required
          placeholder="Enter your email content here. You can use HTML formatting."
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  );
}
