"use client";

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Search,
    Filter,
    Plus,
    Eye,
    Edit,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Calendar,
    Users,
    BarChart3
} from 'lucide-react';
import { EnhancedDataTable } from '../EnhancedDataTable';
import { SimpleSearchAndFilter } from '../search/SimpleSearchAndFilter';
import { SubscriptionDetailsPanel } from './SubscriptionDetailsPanel';
import { BillingAdjustmentModal } from './BillingAdjustmentModal';
import { BillingAdjustmentTools } from './BillingAdjustmentTools';
import { SubscriptionAnalyticsView } from './SubscriptionAnalyticsView';
import { ChurnPredictionPanel } from './ChurnPredictionPanel';
import { BulkOperationsToolbar } from '../BulkOperationsToolbar';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLoadingState, AdminStatsLoadingState, AdminTableLoadingState } from '../AdminLoadingState';

interface Subscription {
    id: string;
    userId: string;
    tier: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    createdAt: string;
    updatedAt: string;
    paymentFrequency: string;
    nextPaymentAmount?: number;
    isPaused: boolean;
    pauseStartDate?: string;
    pauseEndDate?: string;
    availableCredits: number;
    loyaltyPoints: number;
    churnRiskScore: number;
    lifetimeValue: number;
    user: {
        id: string;
        email: string;
        name?: string;
        phone?: string;
        createdAt: string;
    };
}

interface SubscriptionFilters {
    search?: string;
    tier?: string;
    status?: string;
    paymentFrequency?: string;
    churnRisk?: string;
    startDate?: string;
    endDate?: string;
}

interface SubscriptionStats {
    totalSubscriptions: number;
    activeSubscriptions: number;
    pausedSubscriptions: number;
    cancelledSubscriptions: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageLifetimeValue: number;
    churnRate: number;
    highRiskSubscriptions: number;
}

export function SubscriptionManagement() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [showBillingModal, setShowBillingModal] = useState<Subscription | null>(null);
    const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
    const [filters, setFilters] = useState<SubscriptionFilters>({});
    const [stats, setStats] = useState<SubscriptionStats | null>(null);
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { request } = useApi();
    const { showSuccess, showError } = useToast();

    // Fetch subscriptions with filters and pagination
    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            // Only add non-empty parameters
            if (pagination.page) params.append('page', pagination.page.toString());
            if (pagination.limit) params.append('limit', pagination.limit.toString());
            if (sortBy) params.append('sortBy', sortBy);
            if (sortOrder) params.append('sortOrder', sortOrder);
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim()) {
                    params.append(key, value.toString());
                }
            });

            console.log('Fetching subscriptions with params:', params.toString());
            const response = await request(`/admin/subscriptions?${params.toString()}`);

            console.log('Subscriptions response:', response);

            if (response.success) {
                // Ensure all subscriptions have required properties
                const safeSubscriptions = (response.subscriptions || []).map((sub: any) => ({
                    ...sub,
                    user: sub.user || { 
                        id: sub.userId || 'unknown', 
                        email: 'Unknown User', 
                        name: null,
                        phone: null,
                        createdAt: sub.createdAt || new Date().toISOString()
                    },
                    tier: sub.tier || 'UNKNOWN',
                    status: sub.status || 'UNKNOWN',
                    paymentFrequency: sub.paymentFrequency || 'MONTHLY',
                    lifetimeValue: sub.lifetimeValue || 0,
                    churnRiskScore: sub.churnRiskScore || 0,
                    availableCredits: sub.availableCredits || 0,
                    loyaltyPoints: sub.loyaltyPoints || 0,
                    isPaused: sub.isPaused || false,
                    pauseStartDate: sub.pauseStartDate || null,
                    pauseEndDate: sub.pauseEndDate || null,
                    createdAt: sub.createdAt || new Date().toISOString(),
                    updatedAt: sub.updatedAt || new Date().toISOString()
                }));
                
                console.log('Processed subscriptions:', safeSubscriptions.length);
                setSubscriptions(safeSubscriptions);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination
                }));
            } else {
                console.error('API returned error:', response.error);
                throw new Error(response.error || 'Failed to fetch subscriptions');
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch subscriptions";
            showError(errorMessage);
            // Set empty state on error but don't clear existing data immediately
            if (subscriptions.length === 0) {
                setSubscriptions([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch subscription statistics
    const fetchStats = async () => {
        try {
            const response = await request('/admin/subscriptions/analytics');
            if (response.success) {
                setStats(response.stats);
            } else {
                console.warn('Failed to fetch subscription stats:', response.error);
                // Set default stats on error
                setStats({
                    totalSubscriptions: 0,
                    activeSubscriptions: 0,
                    pausedSubscriptions: 0,
                    cancelledSubscriptions: 0,
                    totalRevenue: 0,
                    monthlyRecurringRevenue: 0,
                    averageLifetimeValue: 0,
                    churnRate: 0,
                    highRiskSubscriptions: 0
                });
            }
        } catch (error) {
            console.error('Error fetching subscription stats:', error);
            // Set default stats on error
            setStats({
                totalSubscriptions: 0,
                activeSubscriptions: 0,
                pausedSubscriptions: 0,
                cancelledSubscriptions: 0,
                totalRevenue: 0,
                monthlyRecurringRevenue: 0,
                averageLifetimeValue: 0,
                churnRate: 0,
                highRiskSubscriptions: 0
            });
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [filters, pagination.page, pagination.limit, sortBy, sortOrder]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Handle subscription actions
    const handleViewSubscription = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
    };

    const handleBillingAdjustment = (subscription: Subscription) => {
        setShowBillingModal(subscription);
    };

    const handlePauseSubscription = async (subscriptionId: string, reason: string, endDate: Date) => {
        try {
            const response = await request(`/admin/subscriptions/${subscriptionId}/pause`, {
                method: 'POST',
                body: JSON.stringify({ reason, endDate: endDate.toISOString() })
            });

            if (response.success) {
                showSuccess("Subscription paused successfully");
                fetchSubscriptions();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error pausing subscription:', error);
            showError(error.message || "Failed to pause subscription");
        }
    };

    const handleResumeSubscription = async (subscriptionId: string) => {
        try {
            const response = await request(`/admin/subscriptions/${subscriptionId}/resume`, {
                method: 'POST'
            });

            if (response.success) {
                showSuccess("Subscription resumed successfully");
                fetchSubscriptions();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error resuming subscription:', error);
            showError(error.message || "Failed to resume subscription");
        }
    };

    const handleCancelSubscription = async (subscriptionId: string, reason: string) => {
        try {
            const response = await request(`/admin/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });

            if (response.success) {
                showSuccess("Subscription cancelled successfully");
                fetchSubscriptions();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            showError(error.message || "Failed to cancel subscription");
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: 'user',
            label: 'Customer',
            sortable: true,
            render: (value: any, subscription: Subscription) => {
                if (!subscription || !subscription.user) {
                    return <span className="text-gray-400">No customer data</span>;
                }
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{subscription.user.email}</span>
                        {subscription.user.name && <span className="text-sm text-gray-500">{subscription.user.name}</span>}
                    </div>
                );
            }
        },
        {
            key: 'tier',
            label: 'Plan',
            sortable: true,
            render: (tier: string) => (
                <Badge variant={
                    tier === 'PRIORITY' ? 'default' :
                        tier === 'HOMECARE' ? 'secondary' :
                            'outline'
                }>
                    {tier}
                </Badge>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string, subscription: Subscription) => {
                if (!subscription) {
                    return <Badge variant="outline">Unknown</Badge>;
                }

                // Enhanced status determination
                const getStatusInfo = (sub: Subscription) => {
                    const baseStatus = sub.status || 'UNKNOWN';
                    const isPaused = sub.isPaused;
                    const currentDate = new Date();
                    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
                    const isExpired = periodEnd && currentDate > periodEnd;
                    const isNearExpiry = periodEnd && (periodEnd.getTime() - currentDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days

                    if (isPaused) {
                        return {
                            status: 'PAUSED',
                            variant: 'secondary' as const,
                            description: sub.pauseEndDate ? `Paused until ${new Date(sub.pauseEndDate).toLocaleDateString()}` : 'Paused indefinitely'
                        };
                    }

                    if (baseStatus === 'CANCELLED') {
                        return {
                            status: 'CANCELLED',
                            variant: 'destructive' as const,
                            description: 'Subscription cancelled'
                        };
                    }

                    if (baseStatus === 'PAST_DUE') {
                        return {
                            status: 'PAST_DUE',
                            variant: 'destructive' as const,
                            description: 'Payment overdue'
                        };
                    }

                    if (baseStatus === 'INCOMPLETE') {
                        return {
                            status: 'INCOMPLETE',
                            variant: 'secondary' as const,
                            description: 'Payment incomplete'
                        };
                    }

                    if (isExpired) {
                        return {
                            status: 'EXPIRED',
                            variant: 'destructive' as const,
                            description: 'Subscription expired'
                        };
                    }

                    if (isNearExpiry && baseStatus === 'ACTIVE') {
                        return {
                            status: 'ACTIVE',
                            variant: 'default' as const,
                            description: `Renews ${periodEnd?.toLocaleDateString()}`
                        };
                    }

                    if (baseStatus === 'ACTIVE') {
                        return {
                            status: 'ACTIVE',
                            variant: 'default' as const,
                            description: periodEnd ? `Renews ${periodEnd.toLocaleDateString()}` : 'Active subscription'
                        };
                    }

                    return {
                        status: baseStatus,
                        variant: 'outline' as const,
                        description: 'Unknown status'
                    };
                };

                const statusInfo = getStatusInfo(subscription);

                return (
                    <div className="flex flex-col">
                        <Badge variant={statusInfo.variant}>
                            {statusInfo.status}
                        </Badge>
                        <span className="text-xs text-gray-500 mt-1">
                            {statusInfo.description}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'paymentFrequency',
            label: 'Billing',
            render: (frequency: string, subscription: Subscription) => {
                if (!subscription) {
                    return <span className="text-gray-400">-</span>;
                }
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">{frequency || 'Unknown'}</span>
                        {subscription.nextPaymentAmount && (
                            <span className="text-xs text-gray-500">
                                ${subscription.nextPaymentAmount.toFixed(2)}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'lifetimeValue',
            label: 'LTV',
            sortable: true,
            render: (ltv: number) => (
                <span className="font-medium">${(ltv || 0).toFixed(2)}</span>
            )
        },
        {
            key: 'churnRiskScore',
            label: 'Churn Risk',
            sortable: true,
            render: (score: number) => {
                const safeScore = score || 0;
                return (
                    <div className="flex items-center space-x-2">
                        <Badge variant={
                            safeScore >= 0.7 ? 'destructive' :
                                safeScore >= 0.4 ? 'secondary' :
                                    'default'
                        }>
                            {(safeScore * 100).toFixed(0)}%
                        </Badge>
                        {safeScore >= 0.7 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                );
            }
        },
        {
            key: 'availableCredits',
            label: 'Credits',
            render: (credits: number) => {
                const safeCredits = credits || 0;
                return (
                    <span className={safeCredits > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        ${safeCredits.toFixed(2)}
                    </span>
                );
            }
        },
        {
            key: 'createdAt',
            label: 'Created',
            sortable: true,
            render: (date: string) => {
                if (!date) return '-';
                try {
                    return new Date(date).toLocaleDateString();
                } catch {
                    return 'Invalid date';
                }
            }
        },
        {
            key: 'currentPeriodEnd',
            label: 'Next Billing',
            sortable: true,
            render: (date: string, subscription: Subscription) => {
                if (!date) return '-';
                try {
                    const billingDate = new Date(date);
                    const now = new Date();
                    const daysUntil = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <div className="flex flex-col">
                            <span className="text-sm">{billingDate.toLocaleDateString()}</span>
                            <span className={`text-xs ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                                {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : 
                                 daysUntil === 0 ? 'Due today' :
                                 daysUntil === 1 ? 'Due tomorrow' :
                                 `${daysUntil} days`}
                            </span>
                        </div>
                    );
                } catch {
                    return 'Invalid date';
                }
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, subscription: Subscription) => {
                if (!subscription) {
                    return <span className="text-gray-400">-</span>;
                }
                return (
                    <div className="flex items-center space-x-2">
                        <PermissionGuard permission="subscriptions.view">
                            <button
                                onClick={() => handleViewSubscription(subscription)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </PermissionGuard>

                        <PermissionGuard permission="subscriptions.billing">
                            <button
                                onClick={() => handleBillingAdjustment(subscription)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Billing Adjustment"
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                        </PermissionGuard>

                        <PermissionGuard permission="subscriptions.update">
                            <button
                                onClick={() => handleViewSubscription(subscription)}
                                className="p-1 text-purple-600 hover:text-purple-800"
                                title="Modify Subscription"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </PermissionGuard>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
                        <p className="text-gray-600">Manage customer subscriptions, billing, and analytics</p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeSubscriptions} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.monthlyRecurringRevenue.toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">
                                ${stats.totalRevenue.toFixed(0)} total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. LTV</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.averageLifetimeValue.toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">
                                Per customer
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(stats.churnRate * 100).toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.highRiskSubscriptions} high risk
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <AdminStatsLoadingState />
            )}

            {/* Tabs */}
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    <TabsTrigger value="billing-tools">Billing Tools</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="churn-prediction">Churn Prediction</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="space-y-4">
                    {/* Search and Filters */}
                    <SimpleSearchAndFilter
                        entity="subscriptions"
                        onFiltersChange={setFilters}
                    />

                    {/* Bulk Operations */}
                    {selectedSubscriptions.length > 0 && (
                        <PermissionGuard permission="subscriptions.update">
                            <BulkOperationsToolbar
                                selectedItems={selectedSubscriptions}
                                entityType="subscriptions"
                                onSelectionChange={setSelectedSubscriptions}
                                onOperationComplete={() => {
                                    setSelectedSubscriptions([]);
                                    fetchSubscriptions();
                                    fetchStats();
                                }}
                            />
                        </PermissionGuard>
                    )}

                    {/* Subscriptions Table */}
                    {loading && subscriptions.length === 0 ? (
                        <AdminTableLoadingState rows={10} />
                    ) : subscriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="text-center">
                                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {Object.keys(filters).length > 0 
                                        ? "Try adjusting your filters to see more results."
                                        : "No subscriptions have been created yet."
                                    }
                                </p>
                                <div className="mt-6">
                                    <Button
                                        onClick={fetchSubscriptions}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EnhancedDataTable
                            title={`Subscriptions (${subscriptions.length})`}
                            data={subscriptions}
                            columns={columns}
                            entityType="subscriptions"
                            loading={loading}
                            onRefresh={fetchSubscriptions}
                            pageSize={pagination.limit}
                            enableBulkOperations={true}
                        />
                    )}
                </TabsContent>

                <TabsContent value="billing-tools">
                    <BillingAdjustmentTools />
                </TabsContent>

                <TabsContent value="analytics">
                    <SubscriptionAnalyticsView />
                </TabsContent>

                <TabsContent value="churn-prediction">
                    <ChurnPredictionPanel />
                </TabsContent>
            </Tabs>

            {/* Subscription Details Panel */}
            {selectedSubscription && (
                <SubscriptionDetailsPanel
                    subscription={selectedSubscription}
                    onClose={() => setSelectedSubscription(null)}
                    onRefresh={() => {
                        fetchSubscriptions();
                        fetchStats();
                    }}
                    onPause={handlePauseSubscription}
                    onResume={handleResumeSubscription}
                    onCancel={handleCancelSubscription}
                />
            )}

            {/* Billing Adjustment Modal */}
            {showBillingModal && (
                <BillingAdjustmentModal
                    subscription={showBillingModal}
                    onClose={() => setShowBillingModal(null)}
                    onSuccess={() => {
                        setShowBillingModal(null);
                        fetchSubscriptions();
                        fetchStats();
                    }}
                />
            )}
        </div>
    );
}