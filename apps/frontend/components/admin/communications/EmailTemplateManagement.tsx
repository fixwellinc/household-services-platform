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
        request('/admin/email-templates/campaigns')
      ]);
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.templates || []);
      } else {
        throw new Error(templatesResponse.error || 'Failed to fetch templates');
      }
      
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.campaigns || []);
      } else {
        throw new Error(campaignsResponse.error || 'Failed to fetch campaigns');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setTemplates([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      const response = await request('/admin/email-templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });

      if (response.success) {
        showSuccess('Template created successfully');
        setTemplates(prev => [response.template, ...prev]);
        setShowTemplateForm(false);
      } else {
        throw new Error(response.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      showError(error instanceof Error ? error.message : 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async (id: string, templateData: Partial<EmailTemplate>) => {
    try {
      const response = await request(`/admin/email-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });

      if (response.success) {
        showSuccess('Template updated successfully');
        setTemplates(prev => prev.map(t => t.id === id ? response.template : t));
        setEditingTemplate(null);
      } else {
        throw new Error(response.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      showError(error instanceof Error ? error.message : 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await request(`/admin/email-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showSuccess('Template deleted successfully');
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error(response.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handleTestEmail = async (templateId: string, email: string) => {
    try {
      const response = await request(`/admin/email-templates/${templateId}/test`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        showSuccess('Test email sent successfully');
        setTestEmail('');
      } else {
        throw new Error(response.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      showError(error instanceof Error ? error.message : 'Failed to send test email');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <Users className="h-4 w-4" />;
      case 'booking_confirmation': return <Calendar className="h-4 w-4" />;
      case 'payment_receipt': return <CreditCard className="h-4 w-4" />;
      case 'appointment_reminder': return <Clock className="h-4 w-4" />;
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'promotional': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading email templates..." />;
  }

  if (error) {
    return (
      <AdminErrorState 
        message="Failed to load email templates"
        error={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Communications</h1>
            <p className="text-gray-600">Manage email templates and campaigns</p>
          </div>
          <Button onClick={() => setShowTemplateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Campaigns ({campaigns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
                      <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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

            {/* Templates List */}
            {filteredTemplates.length === 0 ? (
              <AdminEmptyState
                icon={FileText}
                title="No templates found"
                description="Create your first email template to get started"
                actionLabel="Create Template"
                onAction={() => setShowTemplateForm(true)}
              />
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(template.type)}
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{template.subject}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                            <span>Used: {template.usageCount} times</span>
                            {template.lastUsed && (
                              <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>
                            )}
                          </div>
                          {template.variables.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 mb-1">Variables:</p>
                              <div className="flex flex-wrap gap-1">
                                {template.variables.map((variable) => (
                                  <Badge key={variable} variant="outline" className="text-xs">
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.length === 0 ? (
              <AdminEmptyState
                icon={Mail}
                title="No campaigns found"
                description="Email campaigns will appear here when created"
              />
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{campaign.subject}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Recipients</p>
                              <p className="font-semibold">{campaign.recipients.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Sent</p>
                              <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Opened</p>
                              <p className="font-semibold">{campaign.opened.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Clicked</p>
                              <p className="font-semibold">{campaign.clicked.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-gray-500">
                            <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                            {campaign.scheduledAt && (
                              <span className="ml-4">
                                Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Template Preview
                </CardTitle>
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedTemplate.name}</h3>
                  <p className="text-gray-600 mb-4">{selectedTemplate.subject}</p>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter email address for test"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleTestEmail(selectedTemplate.id, testEmail)}
                    disabled={!testEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Template Form Modal */}
        {(showTemplateForm || editingTemplate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </CardTitle>
                <Button variant="outline" onClick={() => {
                  setShowTemplateForm(false);
                  setEditingTemplate(null);
                }}>
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <TemplateForm
                  template={editingTemplate}
                  onSubmit={editingTemplate ? 
                    (data) => handleUpdateTemplate(editingTemplate.id, data) :
                    handleCreateTemplate
                  }
                  onCancel={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
}

// Template Form Component
function TemplateForm({ 
  template, 
  onSubmit, 
  onCancel 
}: { 
  template?: EmailTemplate | null;
  onSubmit: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    type: template?.type || 'custom',
    category: template?.category || 'transactional',
    isActive: template?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="subject">Subject Line</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Welcome</SelectItem>
            <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
            <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
            <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="promotional">Promotional</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
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

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={10}
          placeholder="Enter your email template content. Use {{variableName}} for dynamic content."
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Use double curly braces for variables: {{customerName}}, {{serviceType}}, etc.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}