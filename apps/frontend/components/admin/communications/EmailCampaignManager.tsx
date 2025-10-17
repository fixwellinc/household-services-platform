"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Save,
  Calendar,
  Users,
  TrendingUp,
  Play,
  Pause,
  Copy,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
  MousePointer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';
import { AdminPageLayout } from '../layout/AdminPageLayout';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  variables: string[];
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId?: string;
  template?: EmailTemplate;
  content: string;
  recipients: RecipientGroup[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  metrics: CampaignMetrics;
  settings: CampaignSettings;
}

interface RecipientGroup {
  id: string;
  name: string;
  criteria: FilterCriteria[];
  estimatedCount: number;
}

interface FilterCriteria {
  field: string;
  operator: string;
  value: string;
}

interface CampaignMetrics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface CampaignSettings {
  sendImmediately: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  timezone: string;
  trackOpens: boolean;
  trackClicks: boolean;
  allowUnsubscribe: boolean;
}

export function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [campaignsResponse, templatesResponse] = await Promise.all([
        request('/admin/email-campaigns'),
        request('/admin/email-templates')
      ]);
      
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.campaigns || []);
      } else {
        throw new Error(campaignsResponse.error || 'Failed to fetch campaigns');
      }
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.templates || []);
      } else {
        throw new Error(templatesResponse.error || 'Failed to fetch templates');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setCampaigns([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (campaignData: Partial<EmailCampaign>) => {
    try {
      const response = await request('/admin/email-campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      });

      if (response.success) {
        showSuccess('Campaign created successfully');
        setCampaigns(prev => [response.campaign, ...prev]);
        setShowCampaignForm(false);
      } else {
        throw new Error(response.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      showError(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  const handleUpdateCampaign = async (id: string, campaignData: Partial<EmailCampaign>) => {
    try {
      const response = await request(`/admin/email-campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(campaignData),
      });

      if (response.success) {
        showSuccess('Campaign updated successfully');
        setCampaigns(prev => prev.map(c => c.id === id ? response.campaign : c));
        setEditingCampaign(null);
      } else {
        throw new Error(response.error || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      showError(error instanceof Error ? error.message : 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await request(`/admin/email-campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showSuccess('Campaign deleted successfully');
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } else {
        throw new Error(response.error || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;

    try {
      const response = await request(`/admin/email-campaigns/${id}/send`, {
        method: 'POST',
      });

      if (response.success) {
        showSuccess('Campaign sent successfully');
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sending' } : c));
      } else {
        throw new Error(response.error || 'Failed to send campaign');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      showError(error instanceof Error ? error.message : 'Failed to send campaign');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      const response = await request(`/admin/email-campaigns/${id}/pause`, {
        method: 'POST',
      });

      if (response.success) {
        showSuccess('Campaign paused successfully');
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'paused' } : c));
      } else {
        throw new Error(response.error || 'Failed to pause campaign');
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      showError(error instanceof Error ? error.message : 'Failed to pause campaign');
    }
  };

  const handleDuplicateCampaign = async (campaign: EmailCampaign) => {
    const { id, ...campaignWithoutId } = campaign;
    const duplicatedCampaign = {
      ...campaignWithoutId,
      name: `${campaign.name} (Copy)`,
      status: 'draft' as const,
      scheduledAt: undefined,
      sentAt: undefined,
    };
    
    await handleCreateCampaign(duplicatedCampaign);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'sending': return <Send className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading email campaigns..." />;
  }

  if (error) {
    return (
      <AdminErrorState 
        title="Failed to load email campaigns"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminPageLayout
        title="Email Campaign Manager"
        description="Create, manage, and track email marketing campaigns"
        actions={
          <Button onClick={() => setShowCampaignForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-[180px]">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="paused">Paused</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          {filteredCampaigns.length === 0 ? (
            <AdminEmptyState
              icon={<Mail className="h-8 w-8 text-gray-400" />}
              title="No campaigns found"
              message="Create your first email campaign to get started"
              action={
                <Button onClick={() => setShowCampaignForm(true)}>
                  Create Campaign
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)} variant="secondary">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(campaign.status)}
                              {campaign.status}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{campaign.subject}</p>
                        
                        {/* Campaign Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-500">Recipients</span>
                            </div>
                            <p className="text-lg font-semibold">{campaign.metrics.totalRecipients.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Send className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-500">Sent</span>
                            </div>
                            <p className="text-lg font-semibold">{campaign.metrics.sent.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Eye className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-500">Opened</span>
                            </div>
                            <p className="text-lg font-semibold">{campaign.metrics.opened.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{campaign.metrics.openRate.toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <MousePointer className="h-4 w-4 text-purple-500" />
                              <span className="text-sm text-gray-500">Clicked</span>
                            </div>
                            <p className="text-lg font-semibold">{campaign.metrics.clicked.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{campaign.metrics.clickRate.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                          {campaign.scheduledAt && (
                            <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                          )}
                          {campaign.sentAt && (
                            <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {campaign.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {campaign.status === 'sending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseCampaign(campaign.id)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Campaign Preview Modal */}
          {selectedCampaign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Campaign Preview
                  </CardTitle>
                  <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                    Close
                  </Button>
                </CardHeader>
                <CardContent>
                  <CampaignPreview campaign={selectedCampaign} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaign Form Modal */}
          {(showCampaignForm || editingCampaign) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                  </CardTitle>
                  <Button variant="outline" onClick={() => {
                    setShowCampaignForm(false);
                    setEditingCampaign(null);
                  }}>
                    Close
                  </Button>
                </CardHeader>
                <CardContent>
                  <EmailCampaignForm
                    campaign={editingCampaign}
                    templates={templates}
                    onSubmit={editingCampaign ? 
                      (data) => handleUpdateCampaign(editingCampaign.id, data) :
                      handleCreateCampaign
                    }
                    onCancel={() => {
                      setShowCampaignForm(false);
                      setEditingCampaign(null);
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

// Email Campaign Form Component
function EmailCampaignForm({ 
  campaign, 
  templates,
  onSubmit, 
  onCancel 
}: { 
  campaign?: EmailCampaign | null;
  templates: EmailTemplate[];
  onSubmit: (data: Partial<EmailCampaign>) => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    templateId: campaign?.templateId || '',
    content: campaign?.content || '',
    recipients: campaign?.recipients || [],
    settings: campaign?.settings || {
      sendImmediately: true,
      scheduledDate: '',
      scheduledTime: '',
      timezone: 'UTC',
      trackOpens: true,
      trackClicks: true,
      allowUnsubscribe: true,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        content: template.content,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div>
            <Label htmlFor="template">Email Template (Optional)</Label>
            <Select value={formData.templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div>
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              placeholder="Enter your email content. Use {{variableName}} for dynamic content."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Use double curly braces for variables: {`{{customerName}}, {{serviceType}}, etc.`}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <div>
            <Label>Recipient Groups</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Configure recipient groups and targeting criteria
              </p>
              <Button type="button" variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient Group
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sendImmediately"
                checked={formData.settings.sendImmediately}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, sendImmediately: checked }
                }))}
              />
              <Label htmlFor="sendImmediately">Send immediately</Label>
            </div>

            {!formData.settings.sendImmediately && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.settings.scheduledDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, scheduledDate: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.settings.scheduledTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, scheduledTime: e.target.value }
                    }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={formData.settings.timezone} 
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, timezone: e.target.value }
                }))}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackOpens"
                  checked={formData.settings.trackOpens}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, trackOpens: checked }
                  }))}
                />
                <Label htmlFor="trackOpens">Track email opens</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="trackClicks"
                  checked={formData.settings.trackClicks}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, trackClicks: checked }
                  }))}
                />
                <Label htmlFor="trackClicks">Track link clicks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allowUnsubscribe"
                  checked={formData.settings.allowUnsubscribe}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowUnsubscribe: checked }
                  }))}
                />
                <Label htmlFor="allowUnsubscribe">Include unsubscribe link</Label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}

// Campaign Preview Component
function CampaignPreview({ campaign }: { campaign: EmailCampaign }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
        <p className="text-gray-600 mb-4">Subject: {campaign.subject}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-1 text-gray-600" />
            <p className="text-sm text-gray-600">Recipients</p>
            <p className="text-lg font-semibold">{campaign.metrics.totalRecipients.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Send className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-sm text-gray-600">Sent</p>
            <p className="text-lg font-semibold text-blue-600">{campaign.metrics.sent.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Eye className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-sm text-gray-600">Opened</p>
            <p className="text-lg font-semibold text-green-600">{campaign.metrics.openRate.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <MousePointer className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <p className="text-sm text-gray-600">Clicked</p>
            <p className="text-lg font-semibold text-purple-600">{campaign.metrics.clickRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Email Content Preview</h4>
        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="border-b pb-2 mb-4">
              <p className="text-sm text-gray-600">Subject: {campaign.subject}</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Campaign Settings</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Status</p>
            <Badge className={getStatusColor(campaign.status)} variant="secondary">
              {campaign.status}
            </Badge>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
          {campaign.scheduledAt && (
            <div>
              <p className="text-gray-600">Scheduled</p>
              <p className="font-medium">{new Date(campaign.scheduledAt).toLocaleDateString()}</p>
            </div>
          )}
          {campaign.sentAt && (
            <div>
              <p className="text-gray-600">Sent</p>
              <p className="font-medium">{new Date(campaign.sentAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent': return 'bg-green-100 text-green-800';
    case 'sending': return 'bg-blue-100 text-blue-800';
    case 'scheduled': return 'bg-yellow-100 text-yellow-800';
    case 'paused': return 'bg-orange-100 text-orange-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}