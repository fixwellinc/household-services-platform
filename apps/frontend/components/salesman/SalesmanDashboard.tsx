"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Target,
    Award,
    Link as LinkIcon,
    Copy,
    ExternalLink,
    Calendar,
    Eye,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui/shared';
import Link from 'next/link';

interface DashboardData {
    overview: {
        totalReferrals: number;
        activeCustomers: number;
        monthlyCommission: number;
        conversionRate: number;
    };
    recentCustomers: Array<{
        id: string;
        name: string;
        email: string;
        joinDate: string;
        status: string;
        totalPaid: number;
    }>;
    performance: {
        thisMonth: number;
        lastMonth: number;
        target: number;
        rank: number;
        totalSalesmen: number;
    };
    referralCode: string;
    profile: {
        id: string;
        displayName: string;
        commissionTier: string;
        monthlyTarget: number;
    };
}

export function SalesmanDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/salesman/dashboard');

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const result = await response.json();
            setDashboardData(result.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyReferralCode = async () => {
        if (dashboardData?.referralCode) {
            try {
                await navigator.clipboard.writeText(dashboardData.referralCode);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (error) {
                console.error('Failed to copy referral code:', error);
            }
        }
    };

    const generateReferralLink = () => {
        if (dashboardData?.referralCode) {
            const baseUrl = window.location.origin;
            return `${baseUrl}/register?ref=${dashboardData.referralCode}`;
        }
        return '';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchDashboardData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600">Dashboard data is not available at the moment.</p>
                </div>
            </div>
        );
    }

    const { overview, recentCustomers, performance, referralCode, profile } = dashboardData;
    const progressPercentage = (performance.thisMonth / performance.target) * 100;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.displayName}!</h1>
                    <p className="text-gray-600 mt-1">Here's how your referral business is performing.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {profile.commissionTier} Tier
                    </Badge>
                    <Button onClick={fetchDashboardData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-md">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                                <p className="text-2xl font-bold text-gray-900">{overview.totalReferrals}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-md">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{overview.activeCustomers}</p>
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
                                <p className="text-sm font-medium text-gray-600">Monthly Commission</p>
                                <p className="text-2xl font-bold text-gray-900">${overview.monthlyCommission.toLocaleString()}</p>
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
                                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{overview.conversionRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Performance and Recent Customers */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                Monthly Performance
                            </CardTitle>
                            <CardDescription>
                                Track your progress towards your monthly target
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-medium">${performance.thisMonth.toLocaleString()} / ${performance.target.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{progressPercentage.toFixed(1)}% Complete</span>
                                    <span>Rank #{performance.rank} of {performance.totalSalesmen}</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">This Month</p>
                                    <p className="text-xl font-bold text-gray-900">${performance.thisMonth.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Last Month</p>
                                    <p className="text-xl font-bold text-gray-900">${performance.lastMonth.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Customers */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        Recent Customers
                                    </CardTitle>
                                    <CardDescription>
                                        Your latest referral conversions
                                    </CardDescription>
                                </div>
                                <Link href="/salesman/customers">
                                    <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentCustomers?.length > 0 ? (
                                    recentCustomers.slice(0, 5).map((customer) => (
                                        <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{customer.name}</p>
                                                    <p className="text-sm text-gray-600">{customer.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">${customer.totalPaid.toLocaleString()}</p>
                                                <p className="text-sm text-gray-600">{new Date(customer.joinDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No customers yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">Start sharing your referral link to get your first customers.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Referral Tools and Quick Actions */}
                <div className="space-y-6">
                    {/* Referral Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="h-5 w-5 text-blue-600" />
                                Your Referral Code
                            </CardTitle>
                            <CardDescription>
                                Share this code to earn commissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-lg font-bold text-gray-900">{referralCode}</span>
                                    <Button
                                        onClick={copyReferralCode}
                                        variant="outline"
                                        size="sm"
                                        className={copySuccess ? 'text-green-600 border-green-300' : ''}
                                    >
                                        {copySuccess ? 'Copied!' : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Referral Link</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={generateReferralLink()}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                    />
                                    <Button
                                        onClick={() => navigator.clipboard.writeText(generateReferralLink())}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Link href={generateReferralLink()} target="_blank">
                                <Button className="w-full">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Test Referral Link
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/salesman/referrals">
                                <Button variant="outline" className="w-full justify-start">
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Generate Campaign Links
                                </Button>
                            </Link>
                            <Link href="/salesman/customers">
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="h-4 w-4 mr-2" />
                                    View All Customers
                                </Button>
                            </Link>
                            <Link href="/salesman/commission">
                                <Button variant="outline" className="w-full justify-start">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Commission History
                                </Button>
                            </Link>
                            <Link href="/salesman/performance">
                                <Button variant="outline" className="w-full justify-start">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Detailed Analytics
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Achievement Badge */}
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Great Work!</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                You're in the top {Math.ceil((performance.rank / performance.totalSalesmen) * 100)}% of salesmen this month.
                            </p>
                            <Badge className="bg-yellow-100 text-yellow-800">
                                Rank #{performance.rank}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}