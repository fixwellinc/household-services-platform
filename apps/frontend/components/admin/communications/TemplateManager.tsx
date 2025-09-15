"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  FileText,
  Eye,
  Save,
  X,
  Code,
  Type,
  MessageSquare,
  Mail,
  Users
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  category: string;
  type: 'email' | 'sms' | 'chat';
  variables: Variable[];
  createdAt: Date;
  updatedAt: Date;
  usage: number;
  isActive: boolean;
  tags: string[];
}

interface Variable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usage: number;
  shortcut?: string;
}

export function TemplateManager() {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // Mock data
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Welcome Email',
      description: 'Welcome message for new customers',
      subject: 'Welcome to {{companyName}}!',
      content: `Dear {{customerName}},

Welcome to {{companyName}}! We're thrilled to have you as our newest customer.

Your account has been set up and you can start using our services immediately. Here's what you need to know:

• Your customer ID: {{customerId}}
• Service start date: {{serviceStartDate}}
• Primary contact: {{primaryContact}}

If you have any questions, don't hesitate to reach out to our support team.

Best regards,
The {{companyName}} Team`,
      category: 'onboarding',
      type: 'email',
      variables: [
        { name: 'companyName', description: 'Company name', type: 'text', required: true, defaultValue: 'Our Company' },
        { name: 'customerName', description: 'Customer full name', type: 'text', required: true },
        { name: 'customerId', description: 'Unique customer identifier', type: 'text', required: true },
        { name: 'serviceStartDate', description: 'Service start date', type: 'date', required: true },
        { name: 'primaryContact', description: 'Primary contact person', type: 'text', required: true }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      usage: 45,
      isActive: true,
      tags: ['welcome', 'onboarding', 'new-customer']
    },
    {
      id: '2',
      name: 'Service Confirmation',
      description: 'Confirmation message for scheduled services',
      subject: 'Service Confirmation - {{serviceDate}}',
      content: `Hi {{customerName}},

This confirms your {{serviceType}} service scheduled for:

📅 Date: {{serviceDate}}
🕐 Time: {{serviceTime}}
📍 Address: {{serviceAddress}}
👨‍🔧 Technician: {{technicianName}}

Our team will arrive within the scheduled time window. Please ensure someone is available to provide access.

For any changes or questions, call us at {{supportPhone}}.

Thank you for choosing {{companyName}}!`,
      category: 'confirmation',
      type: 'email',
      variables: [
        { name: 'customerName', description: 'Customer name', type: 'text', required: true },
        { name: 'serviceType', description: 'Type of service', type: 'text', required: true },
        { name: 'serviceDate', description: 'Service date', type: 'date', required: true },
        { name: 'serviceTime', description: 'Service time', type: 'text', required: true },
        { name: 'serviceAddress', description: 'Service address', type: 'text', required: true },
        { name: 'technicianName', description: 'Assigned technician', type: 'text', required: true },
        { name: 'supportPhone', description: 'Support phone number', type: 'text', required: true, defaultValue: '(555) 123-4567' },
        { name: 'companyName', description: 'Company name', type: 'text', required: true, defaultValue: 'Our Company' }
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25'),
      usage: 123,
      isActive: true,
      tags: ['confirmation', 'scheduling', 'service']
    },
    {
      id: '3',
      name: 'Appointment Reminder SMS',
      description: 'SMS reminder for upcoming appointments',
      subject: '',
      content: `Hi {{customerName}}! Reminder: Your {{serviceType}} is scheduled for {{serviceDate}} at {{serviceTime}}. Reply STOP to opt out.`,
      category: 'reminder',
      type: 'sms',
      variables: [
        { name: 'customerName', description: 'Customer name', type: 'text', required: true },
        { name: 'serviceType', description: 'Type of service', type: 'text', required: true },
        { name: 'serviceDate', description: 'Service date', type: 'date', required: true },
        { name: 'serviceTime', description: 'Service time', type: 'text', required: true }
      ],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-22'),
      usage: 89,
      isActive: true,
      tags: ['reminder', 'sms', 'appointment']
    }
  ]);

  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([
    {
      id: '1',
      title: 'Thank you for contacting us',
      content: 'Thank you for reaching out! We have received your message and will respond within 24 hours.',
      category: 'general',
      tags: ['thank-you', 'acknowledgment'],
      usage: 67,
      shortcut: '/thank'
    },
    {
      id: '2',
      title: 'Billing inquiry response',
      content: 'I understand you have a question about your billing. Let me look into this for you right away. Can you please provide your account number?',
      category: 'billing',
      tags: ['billing', 'inquiry'],
      usage: 43,
      shortcut: '/billing'
    },
    {
      id: '3',
      title: 'Service quality follow-up',
      content: 'Thank you for your feedback about our service. We take all feedback seriously and will use this to improve. Would you like to schedule a follow-up service?',
      category: 'feedback',
      tags: ['feedback', 'quality', 'follow-up'],
      usage: 28,
      shortcut: '/followup'
    }
  ]);

  const categories = ['all', 'onboarding', 'confirmation', 'reminder', 'support', 'billing', 'feedback', 'marketing'];
  const types = ['all', 'email', 'sms', 'chat'];

  const filteredTemplates = templates.filter(template => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;
    if (filterType !== 'all' && template.type !== filterType) return false;
    return true;
  });

  const filteredCannedResponses = cannedResponses.filter(response => {
    if (searchQuery && !response.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !response.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory !== 'all' && response.category !== filterCategory) return false;
    return true;
  });

  const handlePreviewTemplate = (template: Template, data: Record<string, string>) => {
    let previewContent = template.content;
    let previewSubject = template.subject;

    // Replace variables with preview data
    template.variables.forEach(variable => {
      const value = data[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      previewContent = previewContent.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
    });

    return { subject: previewSubject, content: previewContent };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
          <p className="text-gray-600 mt-1">
            Create and manage message templates and canned responses
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Message Templates</span>
          </TabsTrigger>
          <TabsTrigger value="canned" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Canned Responses</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(template.type)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="outline">{template.type.toUpperCase()}</Badge>
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Variables:</strong> {template.variables.length}</p>
                    <p><strong>Usage:</strong> {template.usage} times</p>
                    <p><strong>Updated:</strong> {template.updatedAt.toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center space-x-2">
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
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Copy template logic
                        const newTemplate = {
                          ...template,
                          id: Date.now().toString(),
                          name: `${template.name} (Copy)`,
                          usage: 0,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        setTemplates([...templates, newTemplate]);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Canned Responses Tab */}
        <TabsContent value="canned" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCannedResponses.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{response.title}</CardTitle>
                    {response.shortcut && (
                      <Badge variant="outline">
                        <Code className="h-3 w-3 mr-1" />
                        {response.shortcut}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {response.content}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{response.category}</Badge>
                    {response.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Usage:</strong> {response.usage} times</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      {selectedTemplate && !isEditing && (
        <Dialog open={true} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getTypeIcon(selectedTemplate.type)}
                <span>Preview: {selectedTemplate.name}</span>
              </DialogTitle>
              <DialogDescription>
                Fill in the variables to see how the template will look
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Variable Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <Label htmlFor={variable.name}>
                      {variable.name} {variable.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={variable.name}
                      placeholder={variable.description}
                      value={previewData[variable.name] || variable.defaultValue || ''}
                      onChange={(e) => setPreviewData({
                        ...previewData,
                        [variable.name]: e.target.value
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Preview:</h4>
                {selectedTemplate.type === 'email' && selectedTemplate.subject && (
                  <div className="mb-3">
                    <strong>Subject:</strong> {handlePreviewTemplate(selectedTemplate, previewData).subject}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">
                  {handlePreviewTemplate(selectedTemplate, previewData).content}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}