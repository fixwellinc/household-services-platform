"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Settings, 
  Shield, 
  Database, 
  Globe, 
  CreditCard, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Upload
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

interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  users: number;
  maxUsers: number;
  storage: number;
  maxStorage: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    branding: {
      logo: string;
      primaryColor: string;
      secondaryColor: string;
    };
    features: {
      analytics: boolean;
      apiAccess: boolean;
      customDomain: boolean;
      whiteLabel: boolean;
    };
    limits: {
      apiCalls: number;
      storage: number;
      users: number;
    };
  };
  billing: {
    customerId: string;
    subscriptionId: string;
    status: 'active' | 'past_due' | 'canceled';
    nextBillingDate: string;
    amount: number;
    currency: string;
  };
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  suspendedTenants: number;
  totalRevenue: number;
  averageRevenue: number;
  growthRate: number;
}

export function MultiTenantAdmin() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch tenants and stats
  useEffect(() => {
    fetchTenantsData();
  }, []);

  const fetchTenantsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tenantsResponse, statsResponse] = await Promise.all([
        request('/admin/tenants'),
        request('/admin/tenants/stats')
      ]);
      
      if (tenantsResponse.success) {
        setTenants(tenantsResponse.tenants || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (err) {
      console.error('Error fetching tenants data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = () => {
    setEditingTenant(null);
    setShowTenantForm(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowTenantForm(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone and will affect all users in this tenant.')) {
      return;
    }

    try {
      const response = await request(`/admin/tenants/${tenantId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        showSuccess('Tenant deleted successfully');
        fetchTenantsData();
      } else {
        throw new Error(response.error || 'Failed to delete tenant');
      }
    } catch (err) {
      console.error('Error deleting tenant:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete tenant');
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    try {
      const response = await request(`/admin/tenants/${tenantId}/suspend`, {
        method: 'POST'
      });

      if (response.success) {
        showSuccess('Tenant suspended successfully');
        fetchTenantsData();
      } else {
        throw new Error(response.error || 'Failed to suspend tenant');
      }
    } catch (err) {
      console.error('Error suspending tenant:', err);
      showError(err instanceof Error ? err.message : 'Failed to suspend tenant');
    }
  };

  const handleActivateTenant = async (tenantId: string) => {
    try {
      const response = await request(`/admin/tenants/${tenantId}/activate`, {
        method: 'POST'
      });

      if (response.success) {
        showSuccess('Tenant activated successfully');
        fetchTenantsData();
      } else {
        throw new Error(response.error || 'Failed to activate tenant');
      }
    } catch (err) {
      console.error('Error activating tenant:', err);
      showError(err instanceof Error ? err.message : 'Failed to activate tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-orange-600 bg-orange-100';
      case 'custom': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading tenants..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load tenants"
        message={error}
        onRetry={fetchTenantsData}
      />
    );
  }

  return (
    <AdminErrorBoundary context="MultiTenantAdmin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Multi-Tenant Management</h1>
              <p className="text-gray-600">Manage all tenants and their configurations</p>
            </div>
          </div>
          
          <Button onClick={handleCreateTenant}>
            <Plus className="h-4 w-4 mr-2" />
            New Tenant
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.growthRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span className="text-sm">New tenant "Acme Corp" created</span>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Tenant "TechStart" plan upgraded</span>
                      </div>
                      <span className="text-xs text-gray-500">4 hours ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Tenant "OldCorp" payment failed</span>
                      </div>
                      <span className="text-xs text-gray-500">6 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Tenant Data
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Tenants
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Global Settings
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tenants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tenants Grid */}
            {filteredTenants.length === 0 ? (
              <AdminEmptyState
                title="No tenants found"
                message="No tenants match your current filters."
                icon={<Building2 className="h-12 w-12 text-gray-400" />}
                action={
                  <Button onClick={handleCreateTenant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tenant
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((tenant) => (
                  <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{tenant.name}</CardTitle>
                          <p className="text-sm text-gray-600">{tenant.domain}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                          <Badge className={getPlanColor(tenant.plan)}>
                            {tenant.plan}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Users</p>
                          <p className="font-semibold">{tenant.users}/{tenant.maxUsers}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Storage</p>
                          <p className="font-semibold">{tenant.storage}GB/{tenant.maxStorage}GB</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTenant(tenant)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        {tenant.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendTenant(tenant.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateTenant(tenant.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Activate
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
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

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEmptyState
                  title="Billing management coming soon"
                  message="Advanced billing management features will be available soon."
                  icon={<CreditCard className="h-12 w-12 text-gray-400" />}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEmptyState
                  title="Global settings coming soon"
                  message="Global tenant settings and configurations will be available soon."
                  icon={<Settings className="h-12 w-12 text-gray-400" />}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tenant Details Modal */}
        {selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Tenant Details</h2>
                <Button variant="ghost" onClick={() => setSelectedTenant(null)}>
                  ×
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedTenant.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domain:</span>
                        <span>{selectedTenant.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subdomain:</span>
                        <span>{selectedTenant.subdomain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(selectedTenant.status)}>
                          {selectedTenant.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <Badge className={getPlanColor(selectedTenant.plan)}>
                          {selectedTenant.plan}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Users:</span>
                        <span>{selectedTenant.users}/{selectedTenant.maxUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage:</span>
                        <span>{selectedTenant.storage}GB/{selectedTenant.maxStorage}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span>{new Date(selectedTenant.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Billing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedTenant.billing.status)}>
                        {selectedTenant.billing.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span>${selectedTenant.billing.amount}/{selectedTenant.billing.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Billing:</span>
                      <span>{new Date(selectedTenant.billing.nextBillingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer ID:</span>
                      <span className="font-mono text-xs">{selectedTenant.billing.customerId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Form Modal */}
        {showTenantForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
                </h2>
                <Button variant="ghost" onClick={() => setShowTenantForm(false)}>
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <TenantForm
                  tenant={editingTenant}
                  onSave={() => {
                    setShowTenantForm(false);
                    setEditingTenant(null);
                    fetchTenantsData();
                  }}
                  onCancel={() => {
                    setShowTenantForm(false);
                    setEditingTenant(null);
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

// Tenant Form Component
interface TenantFormProps {
  tenant?: Tenant | null;
  onSave: () => void;
  onCancel: () => void;
}

function TenantForm({ tenant, onSave, onCancel }: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    domain: tenant?.domain || '',
    subdomain: tenant?.subdomain || '',
    plan: tenant?.plan || 'basic',
    maxUsers: tenant?.maxUsers || 10,
    maxStorage: tenant?.maxStorage || 100,
    status: tenant?.status || 'active'
  });

  const [saving, setSaving] = useState(false);
  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const url = tenant ? `/admin/tenants/${tenant.id}` : '/admin/tenants';
      const method = tenant ? 'PUT' : 'POST';
      
      const response = await request(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (response.success) {
        showSuccess(tenant ? 'Tenant updated successfully' : 'Tenant created successfully');
        onSave();
      } else {
        throw new Error(response.error || 'Failed to save tenant');
      }
    } catch (err) {
      console.error('Error saving tenant:', err);
      showError(err instanceof Error ? err.message : 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tenant Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subdomain">Subdomain</Label>
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Select value={formData.plan} onValueChange={(value: any) => setFormData(prev => ({ ...prev, plan: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxUsers">Max Users</Label>
          <Input
            id="maxUsers"
            type="number"
            value={formData.maxUsers}
            onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="maxStorage">Max Storage (GB)</Label>
          <Input
            id="maxStorage"
            type="number"
            value={formData.maxStorage}
            onChange={(e) => setFormData(prev => ({ ...prev, maxStorage: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : tenant ? 'Update Tenant' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}
