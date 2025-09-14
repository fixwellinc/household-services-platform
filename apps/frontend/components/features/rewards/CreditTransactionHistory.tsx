'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';
import {
    History,
    DollarSign,
    Users,
    Gift,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/shared';

interface CreditTransaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    earnedAt: string;
    usedAt?: string;
    expiresAt?: string;
}

interface TransactionHistory {
    transactions: CreditTransaction[];
    categorized: {
        earned: CreditTransaction[];
        used: CreditTransaction[];
        redeemed: CreditTransaction[];
        expired: CreditTransaction[];
    };
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

interface CreditTransactionHistoryProps {
    userId: string;
}

const CreditTransactionHistory: React.FC<CreditTransactionHistoryProps> = ({ userId }) => {
    const [history, setHistory] = useState<TransactionHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [activeTab, setActiveTab] = useState('all');

    const itemsPerPage = 10;

    useEffect(() => {
        fetchTransactionHistory();
    }, [userId, currentPage]);

    const fetchTransactionHistory = async () => {
        try {
            setLoading(true);
            setError(null);

            const offset = currentPage * itemsPerPage;
            const response = await fetch(
                `/api/rewards/credits?limit=${itemsPerPage}&offset=${offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch transaction history');
            }

            const data = await response.json();
            setHistory(data.data);

        } catch (err) {
            console.error('Error fetching transaction history:', err);
            setError('Failed to load transaction history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'REFERRAL':
                return <Users className="h-4 w-4 text-blue-600" />;
            case 'LOYALTY':
                return <Gift className="h-4 w-4 text-purple-600" />;
            case 'BONUS':
                return <DollarSign className="h-4 w-4 text-green-600" />;
            default:
                return <DollarSign className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTransactionBadge = (transaction: CreditTransaction) => {
        if (transaction.usedAt && transaction.description.includes('EXPIRED')) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        if (transaction.usedAt) {
            return <Badge variant="outline">Used</Badge>;
        }
        if (transaction.amount < 0) {
            return <Badge variant="secondary">Redeemed</Badge>;
        }
        if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        return <Badge variant="default">Available</Badge>;
    };

    const renderTransactionList = (transactions: CreditTransaction[]) => {
        if (transactions.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions found</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(transaction.earnedAt)}
                                    {transaction.expiresAt && !transaction.usedAt && (
                                        <span className="ml-2 text-orange-600">
                                            • Expires {formatDate(transaction.expiresAt)}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">{transaction.type}</p>
                            </div>
                            {getTransactionBadge(transaction)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading && !history) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Loading transaction history...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!history) {
        return null;
    }

    const totalPages = Math.ceil(history.pagination.total / itemsPerPage);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-blue-600" />
                            Transaction History
                        </CardTitle>
                        <CardDescription>
                            View all your credit transactions and activity
                        </CardDescription>
                    </div>
                    <Button
                        onClick={fetchTransactionHistory}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Earned</p>
                        <p className="text-lg font-bold text-green-600">
                            {history.categorized.earned.length}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Used</p>
                        <p className="text-lg font-bold text-blue-600">
                            {history.categorized.used.length}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm font-medium text-purple-800">Redeemed</p>
                        <p className="text-lg font-bold text-purple-600">
                            {history.categorized.redeemed.length}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-medium text-orange-800">Expired</p>
                        <p className="text-lg font-bold text-orange-600">
                            {history.categorized.expired.length}
                        </p>
                    </div>
                </div>

                {/* Transaction Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all" currentValue={activeTab} onValueChange={setActiveTab}>All</TabsTrigger>
                        <TabsTrigger value="earned" currentValue={activeTab} onValueChange={setActiveTab}>Earned</TabsTrigger>
                        <TabsTrigger value="used" currentValue={activeTab} onValueChange={setActiveTab}>Used</TabsTrigger>
                        <TabsTrigger value="redeemed" currentValue={activeTab} onValueChange={setActiveTab}>Redeemed</TabsTrigger>
                        <TabsTrigger value="expired" currentValue={activeTab} onValueChange={setActiveTab}>Expired</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" currentValue={activeTab} className="space-y-4">
                        {renderTransactionList(history.transactions)}
                    </TabsContent>

                    <TabsContent value="earned" currentValue={activeTab} className="space-y-4">
                        {renderTransactionList(history.categorized.earned)}
                    </TabsContent>

                    <TabsContent value="used" currentValue={activeTab} className="space-y-4">
                        {renderTransactionList(history.categorized.used)}
                    </TabsContent>

                    <TabsContent value="redeemed" currentValue={activeTab} className="space-y-4">
                        {renderTransactionList(history.categorized.redeemed)}
                    </TabsContent>

                    <TabsContent value="expired" currentValue={activeTab} className="space-y-4">
                        {renderTransactionList(history.categorized.expired)}
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {history.pagination.offset + 1} to{' '}
                            {Math.min(history.pagination.offset + history.pagination.limit, history.pagination.total)} of{' '}
                            {history.pagination.total} transactions
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0 || loading}
                                variant="outline"
                                size="sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1 || loading}
                                variant="outline"
                                size="sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CreditTransactionHistory;