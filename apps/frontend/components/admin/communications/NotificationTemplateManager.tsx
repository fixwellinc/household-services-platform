"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save,
  Copy,
  Send,
  Search,
  Filter,
  Code,
  Play,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';
import { AdminPageLayout } from '../layout/AdminPageLayout';

interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push';
  category: 'transactional' | 'marketing' | 'system' | 'alert';
  subject?: string; // For email templates
  title?: string; // For push notifications
  content: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  settings: TemplateSettings;
}

interface TemplateSettings {
  // Email specific
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  
  // SMS specific
  senderId?: string;
  
  // Push specific
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
  
  // Common
  priority: 'low' | 'normal' | 'high';
  expiresAfter?: number; // hours
  retryAttempts: number;
}

export function NotificationTemplateManager() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [testData, setTestData] = useState<Record<string, string>>({});

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/notification-templates');
      
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
      
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<NotificationTemplate>) => {
    try {
      const response = await request('/admin/notification-templates', {
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

  const handleUpdateTemplate = async (id: string, templateData: Partial<NotificationTemplate>) => {
    try {
      const response = await request(`/admin/notification-templates/${id}`, {
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
      const response = await request(`/admin/notification-templates/${id}`, {
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

  const handleDuplicateTemplate = async (template: NotificationTemplate) => {
    const { id, ...templateWithoutId } = template;
    const duplicatedTemplate = {
      ...templateWithoutId,
      name: `${template.name} (Copy)`,
      isDefault: false,
    };
    
    await handleCreateTemplate(duplicatedTemplate);
  };

  const handleTestTemplate = async (template: NotificationTemplate) => {
    try {
      const response = await request(`/admin/notification-templates/${template.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ testData }),
      });

      if (response.success) {
        showSuccess(`Test ${template.type} sent successfully`);
      } else {
        throw new Error(response.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      showError(error instanceof Error ? error.message : 'Failed to send test notification');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesTab = activeTab === 'all' || template.type === activeTab;
    
    return matchesSearch && matchesType && matchesCategory && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'push': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transactional': return 'bg-blue-100 text-blue-800';
      case 'marketing': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-orange-100 text-orange-800';
      case 'alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading notification templates..." />;
  }

  if (error) {
    return (
      <AdminErrorState 
        title="Failed to load notification templates"
        message={error}
        onRetry={fetchTemplates}
      />
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminPageLayout
        title="Notification Template Manager"
        description="Manage email, SMS, and push notification templates"
        actions={
          <Button onClick={() => setShowTemplateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Template Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                All ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email ({templates.filter(t => t.type === 'email').length})
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS ({templates.filter(t => t.type === 'sms').length})
              </TabsTrigger>
              <TabsTrigger value="push" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push ({templates.filter(t => t.type === 'push').length})
              </TabsTrigger>
            </TabsList>

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
                  <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-[150px]">
                    <option value="all">All Types</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </Select>
                  <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-[150px]">
                    <option value="all">All Categories</option>
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                    <option value="alert">Alert</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Templates List */}
              {filteredTemplates.length === 0 ? (
                <AdminEmptyState
                  icon={<FileText className="h-8 w-8 text-gray-400" />}
                  title="No templates found"
                  message="Create your first notification template to get started"
                  action={
                    <Button onClick={() => setShowTemplateForm(true)}>
                      Create Template
                    </Button>
                  }
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
                              <Badge className={getTypeColor(template.type)} variant="secondary">
                                {template.type.toUpperCase()}
                              </Badge>
                              <Badge className={getCategoryColor(template.category)} variant="outline">
                                {template.category}
                              </Badge>
                              {template.isDefault && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Default
                                </Badge>
                              )}
                              {!template.isActive && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            
                            {template.description && (
                              <p className="text-gray-600 mb-2">{template.description}</p>
                            )}
                            
                            {template.subject && (
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                            )}
                            
                            {template.title && (
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Title:</strong> {template.title}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.content.substring(0, 150)}...
                            </p>
                            
                            {template.variables.length > 0 && (
                              <div className="mb-3">
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
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                              <span>Used: {template.usageCount} times</span>
                              {template.lastUsed && (
                                <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>
                              )}
                            </div>
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
                              onClick={() => handleTestTemplate(template)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Send className="h-4 w-4" />
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
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              <Copy className="h-4 w-4" />
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
                <CardContent>
                  <TemplatePreview 
                    template={selectedTemplate} 
                    onTest={() => handleTestTemplate(selectedTemplate)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Template Form Modal */}
          {(showTemplateForm || editingTemplate) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <NotificationTemplateForm
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
      </AdminPageLayout>
    </AdminErrorBoundary>
  );
}

// Notification Template Form Component
function NotificationTemplateForm({ 
  template, 
  onSubmit, 
  onCancel 
}: { 
  template?: NotificationTemplate | null;
  onSubmit: (data: Partial<NotificationTemplate>) => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'email',
    category: template?.category || 'transactional',
    subject: template?.subject || '',
    title: template?.title || '',
    content: template?.content || '',
    isActive: template?.isActive ?? true,
    isDefault: template?.isDefault ?? false,
    settings: template?.settings || {
      priority: 'normal' as const,
      retryAttempts: 3,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(formData.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    onSubmit({
      ...formData,
      variables,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the template"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
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
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === 'email' && (
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
                required
              />
            </div>
          )}

          {formData.type === 'push' && (
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Push notification title"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
              />
              <Label htmlFor="isDefault">Default Template</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div>
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={formData.type === 'sms' ? 6 : 15}
              placeholder={
                formData.type === 'email' 
                  ? "Enter your email template content. Use {{variableName}} for dynamic content."
                  : formData.type === 'sms'
                  ? "Enter your SMS message. Keep it concise. Use {{variableName}} for dynamic content."
                  : "Enter your push notification message. Use {{variableName}} for dynamic content."
              }
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                Use double curly braces for variables: {{customerName}}, {{serviceType}}, etc.
              </p>
              {formData.type === 'sms' && (
                <p className="text-sm text-gray-500">
                  Characters: {formData.content.length}/160
                </p>
              )}
            </div>
          </div>

          {/* Variable Preview */}
          {formData.content && (
            <div>
              <Label>Detected Variables</Label>
              <div className="border rounded-lg p-3 bg-gray-50">
                {(() => {
                  const variableRegex = /\{\{(\w+)\}\}/g;
                  const variables: string[] = [];
                  let match;
                  while ((match = variableRegex.exec(formData.content)) !== null) {
                    if (!variables.includes(match[1])) {
                      variables.push(match[1]);
                    }
                  }
                  
                  return variables.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No variables detected</p>
                  );
                })()}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.settings.priority} 
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, priority: value as any }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="retryAttempts">Retry Attempts</Label>
            <Select 
              value={formData.settings.retryAttempts.toString()} 
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, retryAttempts: parseInt(value) }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (No retry)</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'email' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={formData.settings.fromName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, fromName: e.target.value }
                  }))}
                  placeholder="Sender name"
                />
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.settings.fromEmail || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, fromEmail: e.target.value }
                  }))}
                  placeholder="sender@example.com"
                />
              </div>
              <div>
                <Label htmlFor="replyTo">Reply To</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={formData.settings.replyTo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, replyTo: e.target.value }
                  }))}
                  placeholder="reply@example.com"
                />
              </div>
            </div>
          )}

          {formData.type === 'sms' && (
            <div>
              <Label htmlFor="senderId">Sender ID</Label>
              <Input
                id="senderId"
                value={formData.settings.senderId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, senderId: e.target.value }
                }))}
                placeholder="SMS sender ID"
              />
            </div>
          )}

          {formData.type === 'push' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="icon">Icon URL</Label>
                <Input
                  id="icon"
                  value={formData.settings.icon || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, icon: e.target.value }
                  }))}
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div>
                <Label htmlFor="sound">Sound</Label>
                <Select 
                  value={formData.settings.sound || 'default'} 
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, sound: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="clickAction">Click Action URL</Label>
                <Input
                  id="clickAction"
                  value={formData.settings.clickAction || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, clickAction: e.target.value }
                  }))}
                  placeholder="https://example.com/action"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="expiresAfter">Expires After (hours)</Label>
            <Input
              id="expiresAfter"
              type="number"
              value={formData.settings.expiresAfter || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, expiresAfter: parseInt(e.target.value) || undefined }
              }))}
              placeholder="24"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
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

// Template Preview Component
function TemplatePreview({ 
  template, 
  onTest 
}: { 
  template: NotificationTemplate;
  onTest: () => void;
}) {
  const [testData, setTestData] = useState<Record<string, string>>({});

  // Initialize test data with template variables
  useEffect(() => {
    const initialTestData: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialTestData[variable] = `[${variable}]`;
    });
    setTestData(initialTestData);
  }, [template.variables]);

  const renderPreviewContent = () => {
    let content = template.content;
    
    // Replace variables with test data
    template.variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      content = content.replace(regex, testData[variable] || `[${variable}]`);
    });

    return content;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          {getTypeIcon(template.type)}
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <Badge className={getTypeColor(template.type)} variant="secondary">
            {template.type.toUpperCase()}
          </Badge>
          <Badge className={getCategoryColor(template.category)} variant="outline">
            {template.category}
          </Badge>
        </div>
        
        {template.description && (
          <p className="text-gray-600 mb-4">{template.description}</p>
        )}
      </div>

      {/* Template Variables */}
      {template.variables.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-3">Test Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.variables.map((variable) => (
              <div key={variable}>
                <Label htmlFor={variable}>{variable}</Label>
                <Input
                  id={variable}
                  value={testData[variable] || ''}
                  onChange={(e) => setTestData(prev => ({
                    ...prev,
                    [variable]: e.target.value
                  }))}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-semibold">Preview</h4>
          <Button onClick={onTest} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Test
          </Button>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          {template.type === 'email' && (
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="border-b pb-2 mb-4">
                <p className="text-sm text-gray-600">
                  Subject: {template.subject?.replace(/\{\{(\w+)\}\}/g, (match, variable) => 
                    testData[variable] || `[${variable}]`
                  )}
                </p>
              </div>
              <div className="whitespace-pre-wrap">{renderPreviewContent()}</div>
            </div>
          )}
          
          {template.type === 'sms' && (
            <div className="bg-white p-4 rounded shadow-sm max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">SMS Message</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{renderPreviewContent()}</div>
              <div className="text-xs text-gray-500 mt-2">
                Characters: {renderPreviewContent().length}
              </div>
            </div>
          )}
          
          {template.type === 'push' && (
            <div className="bg-white p-4 rounded shadow-sm max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Push Notification</span>
              </div>
              <div className="font-semibold text-sm mb-1">
                {template.title?.replace(/\{\{(\w+)\}\}/g, (match, variable) => 
                  testData[variable] || `[${variable}]`
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {renderPreviewContent()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Settings */}
      <div>
        <h4 className="text-md font-semibold mb-3">Template Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Priority</p>
            <p className="font-medium capitalize">{template.settings.priority}</p>
          </div>
          <div>
            <p className="text-gray-600">Retry Attempts</p>
            <p className="font-medium">{template.settings.retryAttempts}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <p className="text-gray-600">Usage Count</p>
            <p className="font-medium">{template.usageCount}</p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">{new Date(template.createdAt).toLocaleDateString()}</p>
          </div>
          {template.lastUsed && (
            <div>
              <p className="text-gray-600">Last Used</p>
              <p className="font-medium">{new Date(template.lastUsed).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions (moved outside component to avoid redefinition)
function getTypeIcon(type: string) {
  switch (type) {
    case 'email': return <Mail className="h-4 w-4" />;
    case 'sms': return <MessageSquare className="h-4 w-4" />;
    case 'push': return <Bell className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'email': return 'bg-blue-100 text-blue-800';
    case 'sms': return 'bg-green-100 text-green-800';
    case 'push': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'transactional': return 'bg-blue-100 text-blue-800';
    case 'marketing': return 'bg-green-100 text-green-800';
    case 'system': return 'bg-orange-100 text-orange-800';
    case 'alert': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}