"use client";

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Plus,
    Filter,
    Download,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';
import { EnhancedDataTable } from '../EnhancedDataTable';
import { SearchAndFilter } from '../search/SearchAndFilter';
import { BillingAdjustmentModal } from './BillingAdjustmentModal';
import { BillingAdjustmentApproval } from './BillingAdjustmentApproval';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';

interface BillingAdjustment {
    id: string;
    subscriptionId: string;
    type: 'credit' | 'debit' | 'refund' | 'discount';
    amount: number;
    reason: string;
    description: string;
    effectiveDate: string;
    status: string;
    requiresApproval: boolean;
    createdAt: string;
    processedAt?: string;
    subscription: {
        id: string;
        tier: string;
        user: {
            id: string;
            email: string;
            name?: string;
        };
    };
    createdByUser: {
        id: string;
        email: string;
        name?: string;
    };
    approvedByUser?: {
        id: string;
        email: string;
        name?: string;
    };
}

interface BillingStats {
    totalAdjustments: number;
    pendingApprovals: number;
    approvedAdjustments: number;
    rejectedAdjustments: number;
    processedAdjustments: number;
    totalCreditAmount: number;
    totalDebitAmount: number;
    totalRefundAmount: number;
    approvalRate: number;
}

export function BillingAdjustmentTools() {
    const [adjustments, setAdjustments] = useState<BillingAdjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
    const [filters, setFilters] = useState<any>({});
    const [stats, setStats] = useState<BillingStats | null>(null);
    const [activeTab, setActiveTab] = useState('adjustments');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0
    });

    const { request } = useApi();
    const { showSuccess, showError } = useToast();

    // Fetch billing adjustments
    const fetchAdjustments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });

            const response = await request(`/api/admin/billing-adjustments?${params}`);

            if (response.success) {
                setAdjustments(response.adjustments);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination
                }));
            }
        } catch (error) {
            console.error('Error fetching billing adjustments:', error);
            showError("Failed to fetch billing adjustments");
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const response = await request('/api/admin/billing-adjustments/stats');
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching billing stats:', error);
        }
    };

    // Handle creating new adjustment
    const handleCreateAdjustment = (subscription: any) => {
        setSelectedSubscription(subscription);
        setShowCreateModal(true);
    };

    // Handle exporting adjustments
    const handleExport = async () => {
        try {
            const params = new URLSearchParams(filters);
            const response = await request(`/api/admin/billing-adjustments/export?${params}`);

            if (response.success) {
                // Create and download file
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `billing-adjustments-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                showSuccess('Export completed successfully');
            }
        } catch (error) {
            console.error('Error exporting adjustments:', error);
            showError('Failed to export adjustments');
        }
    };

    useEffect(() => {
        fetchAdjustments();
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Table columns configuration
    const columns = [
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (type: string, adjustment: BillingAdjustment) => (
                <div className="flex items-center space-x-2">
                    <DollarSign className={`w-4 h-4 ${type === 'credit' ? 'text-green-600' :
                        type === 'debit' ? 'text-blue-600' :
                            type === 'refund' ? 'text-purple-600' :
                                'text-orange-600'
                        }`} />
                    <Badge variant="outline" className="capitalize">
                        {type}
                    </Badge>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (amount: number) => (
                <span className="font-medium">${amount.toFixed(2)}</span>
            )
        },
        {
            key: 'subscription',
            label: 'Customer',
            render: (subscription: any) => (
                <div className="flex flex-col">
                    <span className="font-medium">{subscription.user.email}</span>
                    {subscription.user.name && (
                        <span className="text-sm text-gray-500">{subscription.user.name}</span>
                    )}
                    <Badge variant="outline" className="text-xs mt-1 w-fit">
                        {subscription.tier}
                    </Badge>
                </div>
            )
        },
        {
            key: 'reason',
            label: 'Reason',
            render: (reason: string, adjustment: BillingAdjustment) => (
                <div className="max-w-xs">
                    <p className="font-medium text-sm">{reason}</p>
                    <p className="text-xs text-gray-500 truncate" title={adjustment.description}>
                        {adjustment.description}
                    </p>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => {
                const statusConfig = {
                    'PENDING_APPROVAL': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
                    'APPROVED': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
                    'REJECTED': { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
                    'PROCESSED': { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
                    'FAILED': { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' }
                };

                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING_APPROVAL'];
                const IconComponent = config.icon;

                return (
                    <Badge variant={config.variant}>
                        <IconComponent className={`w-3 h-3 mr-1 ${config.color}`} />
                        {status.replace('_', ' ')}
                    </Badge>
                );
            }
        },
        {
            key: 'effectiveDate',
            label: 'Effective Date',
            sortable: true,
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            key: 'createdByUser',
            label: 'Created By',
            render: (user: any, adjustment: BillingAdjustment) => (
                <div className="flex flex-col">
                    <span className="text-sm">{user.name || user.email}</span>
                    <span className="text-xs text-gray-500">
                        {new Date(adjustment.createdAt).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            key: 'processedAt',
            label: 'Processed',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Billing Adjustment Tools</h1>
                        <p className="text-gray-600">Manage billing adjustments, refunds, and credits</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <PermissionGuard permission="billing.export">
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalAdjustments}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.pendingApprovals} pending approval
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credits Issued</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ${stats.totalCreditAmount.toFixed(0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total credit amount
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Refunds Processed</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                ${stats.totalRefundAmount.toFixed(0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total refund amount
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.processedAdjustments} processed
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="adjustments" currentValue={activeTab} onValueChange={setActiveTab}>
                        All Adjustments
                    </TabsTrigger>
                    <TabsTrigger value="approvals" currentValue={activeTab} onValueChange={setActiveTab}>
                        Pending Approvals ({stats?.pendingApprovals || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="adjustments" currentValue={activeTab} className="space-y-4">
                    {/* Search and Filters */}
                    <div className="space-y-4">
                        <SearchAndFilter
                            entity="billing-adjustments"
                            onFiltersChange={setFilters}
                        />

                        {/* Custom Quick Filters */}
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>

                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">Type:</label>
                                <select
                                    value={filters.type || ''}
                                    onChange={(e) => setFilters((prev: any) => ({ ...prev, type: e.target.value || undefined }))}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="credit">Credit</option>
                                    <option value="debit">Debit</option>
                                    <option value="refund">Refund</option>
                                    <option value="discount">Discount</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">Status:</label>
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => setFilters((prev: any) => ({ ...prev, status: e.target.value || undefined }))}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING_APPROVAL">Pending Approval</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="PROCESSED">Processed</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>

                            {(filters.type || filters.status) && (
                                <button
                                    onClick={() => setFilters((prev: any) => {
                                        const newFilters = { ...prev };
                                        delete newFilters.type;
                                        delete newFilters.status;
                                        return newFilters;
                                    })}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Adjustments Table */}
                    <EnhancedDataTable
                        title="Billing Adjustments"
                        data={adjustments}
                        columns={columns}
                        entityType="billing-adjustments"
                        loading={loading}
                        onRefresh={fetchAdjustments}
                        pageSize={pagination.limit}
                        enableBulkOperations={false}
                    />
                </TabsContent>

                <TabsContent value="approvals" currentValue={activeTab}>
                    <BillingAdjustmentApproval
                        onRefresh={() => {
                            fetchAdjustments();
                            fetchStats();
                        }}
                    />
                </TabsContent>
            </Tabs>

            {/* Create Adjustment Modal */}
            {showCreateModal && selectedSubscription && (
                <BillingAdjustmentModal
                    subscription={selectedSubscription}
                    onClose={() => {
                        setShowCreateModal(false);
                        setSelectedSubscription(null);
                    }}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setSelectedSubscription(null);
                        fetchAdjustments();
                        fetchStats();
                    }}
                />
            )}
        </div>
    );
}