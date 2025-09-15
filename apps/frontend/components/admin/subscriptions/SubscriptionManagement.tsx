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
import { SearchAndFilter } from '../search/SearchAndFilter';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';

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
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sortBy,
                sortOrder,
                ...filters
            });

            const response = await request(`/api/admin/subscriptions?${params}`);

            if (response.success) {
                setSubscriptions(response.subscriptions);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination
                }));
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            showError("Failed to fetch subscriptions");
        } finally {
            setLoading(false);
        }
    };

    // Fetch subscription statistics
    const fetchStats = async () => {
        try {
            const response = await request('/api/admin/subscriptions/analytics');
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching subscription stats:', error);
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
            const response = await request(`/api/admin/subscriptions/${subscriptionId}/pause`, {
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
            const response = await request(`/api/admin/subscriptions/${subscriptionId}/resume`, {
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
            const response = await request(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
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
            render: (user: any, subscription: Subscription) => (
                <div className="flex flex-col">
                    <span className="font-medium">{user.email}</span>
                    {user.name && <span className="text-sm text-gray-500">{user.name}</span>}
                </div>
            )
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
            render: (status: string, subscription: Subscription) => (
                <div className="flex flex-col">
                    <Badge variant={
                        status === 'ACTIVE' ? 'default' :
                            status === 'PAUSED' ? 'secondary' :
                                status === 'CANCELLED' ? 'destructive' :
                                    'outline'
                    }>
                        {status}
                    </Badge>
                    {subscription.isPaused && (
                        <span className="text-xs text-orange-600 mt-1">
                            Paused until {subscription.pauseEndDate ? new Date(subscription.pauseEndDate).toLocaleDateString() : 'indefinite'}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'paymentFrequency',
            label: 'Billing',
            render: (frequency: string, subscription: Subscription) => (
                <div className="flex flex-col">
                    <span className="text-sm">{frequency}</span>
                    {subscription.nextPaymentAmount && (
                        <span className="text-xs text-gray-500">
                            ${subscription.nextPaymentAmount.toFixed(2)}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'lifetimeValue',
            label: 'LTV',
            sortable: true,
            render: (ltv: number) => (
                <span className="font-medium">${ltv.toFixed(2)}</span>
            )
        },
        {
            key: 'churnRiskScore',
            label: 'Churn Risk',
            sortable: true,
            render: (score: number) => (
                <div className="flex items-center space-x-2">
                    <Badge variant={
                        score >= 0.7 ? 'destructive' :
                            score >= 0.4 ? 'secondary' :
                                'default'
                    }>
                        {(score * 100).toFixed(0)}%
                    </Badge>
                    {score >= 0.7 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
            )
        },
        {
            key: 'availableCredits',
            label: 'Credits',
            render: (credits: number) => (
                <span className={credits > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    ${credits.toFixed(2)}
                </span>
            )
        },
        {
            key: 'createdAt',
            label: 'Created',
            sortable: true,
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, subscription: Subscription) => (
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
            )
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
            {stats && (
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
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="subscriptions" currentValue={activeTab} onValueChange={setActiveTab}>Subscriptions</TabsTrigger>
                    <TabsTrigger value="billing-tools" currentValue={activeTab} onValueChange={setActiveTab}>Billing Tools</TabsTrigger>
                    <TabsTrigger value="analytics" currentValue={activeTab} onValueChange={setActiveTab}>Analytics</TabsTrigger>
                    <TabsTrigger value="churn-prediction" currentValue={activeTab} onValueChange={setActiveTab}>Churn Prediction</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" currentValue={activeTab} className="space-y-4">
                    {/* Search and Filters */}
                    <SearchAndFilter
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
                    <EnhancedDataTable
                        title="Subscriptions"
                        data={subscriptions}
                        columns={columns}
                        entityType="subscriptions"
                        loading={loading}
                        onRefresh={fetchSubscriptions}
                        pageSize={pagination.limit}
                        enableBulkOperations={true}
                    />
                </TabsContent>

                <TabsContent value="billing-tools" currentValue={activeTab}>
                    <BillingAdjustmentTools />
                </TabsContent>

                <TabsContent value="analytics" currentValue={activeTab}>
                    <SubscriptionAnalyticsView />
                </TabsContent>

                <TabsContent value="churn-prediction" currentValue={activeTab}>
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