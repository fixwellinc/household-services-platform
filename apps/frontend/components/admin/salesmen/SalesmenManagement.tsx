"use client";

import React, { useState, useEffect } from 'react';
import {
    UserCheck,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    DollarSign,
    TrendingUp,
    Users,
    Activity,
    PlayCircle,
    PauseCircle,
    AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui/shared';
import { EnhancedDataTable } from '../EnhancedDataTable';
import { SimpleSearchAndFilter } from '../search/SimpleSearchAndFilter';
import { BulkOperationsToolbar } from '../BulkOperationsToolbar';
import { SalesmanDetailsPanel } from './SalesmanDetailsPanel';
import { SalesmanForm } from './SalesmanForm';
import { ConfirmationDialog } from '../users/ConfirmationDialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AdminLoadingState, AdminTableLoadingState } from '../AdminLoadingState';

interface Salesman {
    id: string;
    userId: string;
    user: {
        id: string;
        email: string;
        name: string;
        phone?: string;
        createdAt: string;
    };
    referralCode: string;
    displayName: string;
    personalMessage?: string;
    commissionTier: string;
    territoryPostalCodes: string[];
    territoryRegions: string[];
    monthlyTarget: number;
    quarterlyTarget: number;
    yearlyTarget: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    startDate: string;
    createdAt: string;
    performance?: {
        totalReferrals: number;
        activeCustomers: number;
        monthlyCommission: number;
        conversionRate: number;
    };
}

interface SalesmanFilters {
    search?: string;
    status?: string;
    commissionTier?: string;
    territory?: string;
    startDate?: string;
    endDate?: string;
}

export function SalesmenManagement() {
    const [salesmen, setSalesmen] = useState<Salesman[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
    const [showSalesmanForm, setShowSalesmanForm] = useState(false);
    const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
    const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
    const [filters, setFilters] = useState<SalesmanFilters>({});
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showDeleteDialog, setShowDeleteDialog] = useState<Salesman | null>(null);
    const [showStatusDialog, setShowStatusDialog] = useState<{salesman: Salesman, status: string} | null>(null);

    const { request } = useApi();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();

    // Fetch salesmen with filters and pagination
    const fetchSalesmen = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            // Add pagination
            if (pagination.page) params.append('page', pagination.page.toString());
            if (pagination.limit) params.append('limit', pagination.limit.toString());

            // Add sorting
            if (sortBy) params.append('sortBy', sortBy);
            if (sortOrder) params.append('sortOrder', sortOrder);

            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await request(`/api/admin/salesmen?${params.toString()}`);

            if (response.success) {
                setSalesmen(response.data.salesmen || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.totalCount || 0,
                    totalPages: Math.ceil((response.data.totalCount || 0) / prev.limit)
                }));
            } else {
                showError('Failed to fetch salesmen');
            }
        } catch (error) {
            console.error('Error fetching salesmen:', error);
            showError('Failed to fetch salesmen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesmen();
    }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

    // Create new salesman
    const handleCreateSalesman = async (data: any) => {
        try {
            const response = await request('/api/admin/salesmen', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.success) {
                showSuccess('Salesman created successfully');
                setShowSalesmanForm(false);
                fetchSalesmen();
            } else {
                showError(response.error || 'Failed to create salesman');
            }
        } catch (error) {
            console.error('Error creating salesman:', error);
            showError('Failed to create salesman');
        }
    };

    // Update salesman
    const handleUpdateSalesman = async (id: string, data: any) => {
        try {
            const response = await request(`/api/admin/salesmen/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (response.success) {
                showSuccess('Salesman updated successfully');
                setEditingSalesman(null);
                fetchSalesmen();
            } else {
                showError(response.error || 'Failed to update salesman');
            }
        } catch (error) {
            console.error('Error updating salesman:', error);
            showError('Failed to update salesman');
        }
    };

    // Delete salesman
    const handleDeleteSalesman = async (salesman: Salesman) => {
        try {
            const response = await request(`/api/admin/salesmen/${salesman.id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showSuccess('Salesman deleted successfully');
                setShowDeleteDialog(null);
                fetchSalesmen();
            } else {
                showError(response.error || 'Failed to delete salesman');
            }
        } catch (error) {
            console.error('Error deleting salesman:', error);
            showError('Failed to delete salesman');
        }
    };

    // Update salesman status
    const handleUpdateStatus = async (salesman: Salesman, status: string) => {
        try {
            const response = await request(`/api/admin/salesmen/${salesman.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            if (response.success) {
                showSuccess(`Salesman ${status.toLowerCase()} successfully`);
                setShowStatusDialog(null);
                fetchSalesmen();
            } else {
                showError(response.error || 'Failed to update salesman status');
            }
        } catch (error) {
            console.error('Error updating salesman status:', error);
            showError('Failed to update salesman status');
        }
    };

    // Bulk operations
    const handleBulkOperation = async (operation: string, salesmanIds: string[]) => {
        try {
            const response = await request('/api/admin/salesmen/bulk', {
                method: 'POST',
                body: JSON.stringify({
                    operation,
                    salesmanIds
                })
            });

            if (response.success) {
                showSuccess(`Bulk operation ${operation} completed successfully`);
                setSelectedSalesmen([]);
                fetchSalesmen();
            } else {
                showError(response.error || 'Bulk operation failed');
            }
        } catch (error) {
            console.error('Error performing bulk operation:', error);
            showError('Bulk operation failed');
        }
    };

    // Calculate statistics
    const stats = {
        total: salesmen.length,
        active: salesmen.filter(s => s.status === 'ACTIVE').length,
        inactive: salesmen.filter(s => s.status === 'INACTIVE').length,
        suspended: salesmen.filter(s => s.status === 'SUSPENDED').length,
        totalCommission: salesmen.reduce((sum, s) => sum + (s.performance?.monthlyCommission || 0), 0),
        avgConversionRate: salesmen.length > 0
            ? salesmen.reduce((sum, s) => sum + (s.performance?.conversionRate || 0), 0) / salesmen.length
            : 0
    };

    // Table columns configuration
    const columns = [
        {
            key: 'displayName',
            title: 'Salesman',
            sortable: true,
            render: (salesman: Salesman) => (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                            {salesman.displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{salesman.displayName}</p>
                        <p className="text-sm text-gray-600">{salesman.user.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'referralCode',
            title: 'Referral Code',
            sortable: true,
            render: (salesman: Salesman) => (
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {salesman.referralCode}
                </span>
            )
        },
        {
            key: 'status',
            title: 'Status',
            sortable: true,
            render: (salesman: Salesman) => {
                const statusConfig = {
                    ACTIVE: { color: 'green', label: 'Active' },
                    INACTIVE: { color: 'gray', label: 'Inactive' },
                    SUSPENDED: { color: 'red', label: 'Suspended' }
                };
                const config = statusConfig[salesman.status] || statusConfig.INACTIVE;
                return (
                    <Badge className={`bg-${config.color}-100 text-${config.color}-800`}>
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            key: 'commissionTier',
            title: 'Tier',
            sortable: true,
            render: (salesman: Salesman) => (
                <Badge variant="outline">{salesman.commissionTier}</Badge>
            )
        },
        {
            key: 'performance.totalReferrals',
            title: 'Referrals',
            sortable: false,
            render: (salesman: Salesman) => (
                <div className="text-center">
                    <p className="font-medium">{salesman.performance?.totalReferrals || 0}</p>
                    <p className="text-xs text-gray-500">total</p>
                </div>
            )
        },
        {
            key: 'performance.monthlyCommission',
            title: 'Monthly Commission',
            sortable: false,
            render: (salesman: Salesman) => (
                <div className="text-center">
                    <p className="font-medium">${(salesman.performance?.monthlyCommission || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">this month</p>
                </div>
            )
        },
        {
            key: 'performance.conversionRate',
            title: 'Conversion',
            sortable: false,
            render: (salesman: Salesman) => (
                <div className="text-center">
                    <p className="font-medium">{(salesman.performance?.conversionRate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">rate</p>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            sortable: false,
            render: (salesman: Salesman) => (
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSalesman(salesman)}
                        title="View details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSalesman(salesman)}
                        title="Edit salesman"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {salesman.status === 'ACTIVE' ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowStatusDialog({salesman, status: 'SUSPENDED'})}
                            title="Suspend salesman"
                        >
                            <PauseCircle className="h-4 w-4 text-yellow-600" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowStatusDialog({salesman, status: 'ACTIVE'})}
                            title="Activate salesman"
                        >
                            <PlayCircle className="h-4 w-4 text-green-600" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(salesman)}
                        title="Delete salesman"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            )
        }
    ];

    // Filter options
    const filterOptions = [
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' }
            ]
        },
        {
            key: 'commissionTier',
            label: 'Commission Tier',
            type: 'select' as const,
            options: [
                { value: '', label: 'All Tiers' },
                { value: 'BRONZE', label: 'Bronze' },
                { value: 'SILVER', label: 'Silver' },
                { value: 'GOLD', label: 'Gold' },
                { value: 'PLATINUM', label: 'Platinum' }
            ]
        }
    ];

    if (loading && salesmen.length === 0) {
        return <AdminLoadingState message="Loading salesmen..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Salesmen Management</h1>
                    <p className="text-gray-600 mt-1">Manage salesman accounts and track their performance</p>
                </div>
                <Button onClick={() => setShowSalesmanForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Salesman
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-md">
                                <UserCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Salesmen</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-md">
                                <Activity className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-md">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                                <p className="text-2xl font-bold text-gray-900">${stats.totalCommission.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-md">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg. Conversion</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.avgConversionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <SimpleSearchAndFilter
                filters={filters}
                onFiltersChange={setFilters}
                filterOptions={filterOptions}
                searchPlaceholder="Search salesmen by name, email, or referral code..."
            />

            {/* Bulk Operations Toolbar */}
            {selectedSalesmen.length > 0 && (
                <BulkOperationsToolbar
                    selectedCount={selectedSalesmen.length}
                    totalCount={salesmen.length}
                    onSelectAll={() => setSelectedSalesmen(salesmen.map(s => s.id))}
                    onDeselectAll={() => setSelectedSalesmen([])}
                    operations={[
                        {
                            id: 'activate',
                            label: 'Activate',
                            icon: PlayCircle,
                            variant: 'default',
                            onClick: () => handleBulkOperation('activate', selectedSalesmen)
                        },
                        {
                            id: 'suspend',
                            label: 'Suspend',
                            icon: PauseCircle,
                            variant: 'outline',
                            onClick: () => handleBulkOperation('suspend', selectedSalesmen)
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: Trash2,
                            variant: 'destructive',
                            onClick: () => handleBulkOperation('delete', selectedSalesmen)
                        }
                    ]}
                />
            )}

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <AdminTableLoadingState />
                    ) : (
                        <EnhancedDataTable
                            data={salesmen}
                            columns={columns}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={(key, order) => {
                                setSortBy(key);
                                setSortOrder(order);
                            }}
                            selectedItems={selectedSalesmen}
                            onSelectionChange={setSelectedSalesmen}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            emptyState={{
                                title: 'No salesmen found',
                                description: 'Get started by creating your first salesman account.',
                                icon: UserCheck,
                                action: {
                                    label: 'Add Salesman',
                                    onClick: () => setShowSalesmanForm(true)
                                }
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Panels and Dialogs */}
            {selectedSalesman && (
                <SalesmanDetailsPanel
                    salesman={selectedSalesman}
                    onClose={() => setSelectedSalesman(null)}
                    onEdit={(salesman) => {
                        setEditingSalesman(salesman);
                        setSelectedSalesman(null);
                    }}
                />
            )}

            {(showSalesmanForm || editingSalesman) && (
                <SalesmanForm
                    salesman={editingSalesman}
                    onSubmit={editingSalesman
                        ? (data) => handleUpdateSalesman(editingSalesman.id, data)
                        : handleCreateSalesman
                    }
                    onCancel={() => {
                        setShowSalesmanForm(false);
                        setEditingSalesman(null);
                    }}
                />
            )}

            {showDeleteDialog && (
                <ConfirmationDialog
                    title="Delete Salesman"
                    description={`Are you sure you want to delete ${showDeleteDialog.displayName}? This action cannot be undone and will remove all associated data.`}
                    confirmLabel="Delete"
                    onConfirm={() => handleDeleteSalesman(showDeleteDialog)}
                    onCancel={() => setShowDeleteDialog(null)}
                    variant="destructive"
                />
            )}

            {showStatusDialog && (
                <ConfirmationDialog
                    title={`${showStatusDialog.status === 'ACTIVE' ? 'Activate' : 'Suspend'} Salesman`}
                    description={`Are you sure you want to ${showStatusDialog.status.toLowerCase()} ${showStatusDialog.salesman.displayName}?`}
                    confirmLabel={showStatusDialog.status === 'ACTIVE' ? 'Activate' : 'Suspend'}
                    onConfirm={() => handleUpdateStatus(showStatusDialog.salesman, showStatusDialog.status)}
                    onCancel={() => setShowStatusDialog(null)}
                    variant={showStatusDialog.status === 'ACTIVE' ? 'default' : 'destructive'}
                />
            )}
        </div>
    );
}