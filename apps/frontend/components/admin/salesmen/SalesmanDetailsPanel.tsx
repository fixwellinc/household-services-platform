"use client";

import React from 'react';
import {
    X,
    UserCheck,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    Target,
    Copy,
    ExternalLink,
    Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui/shared';

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

interface SalesmanDetailsPanelProps {
    salesman: Salesman;
    onClose: () => void;
    onEdit: (salesman: Salesman) => void;
}

export function SalesmanDetailsPanel({ salesman, onClose, onEdit }: SalesmanDetailsPanelProps) {
    const copyReferralCode = async () => {
        try {
            await navigator.clipboard.writeText(salesman.referralCode);
            // You could add a toast notification here
        } catch (error) {
            console.error('Failed to copy referral code:', error);
        }
    };

    const generateReferralLink = () => {
        if (typeof window !== 'undefined') {
            const baseUrl = window.location.origin;
            return `${baseUrl}/register?ref=${salesman.referralCode}`;
        }
        return '';
    };

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(generateReferralLink());
            // You could add a toast notification here
        } catch (error) {
            console.error('Failed to copy referral link:', error);
        }
    };

    const statusConfig = {
        ACTIVE: { color: 'green', label: 'Active' },
        INACTIVE: { color: 'gray', label: 'Inactive' },
        SUSPENDED: { color: 'red', label: 'Suspended' }
    };

    const currentStatus = statusConfig[salesman.status] || statusConfig.INACTIVE;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{salesman.displayName}</h2>
                            <p className="text-gray-600">{salesman.user.email}</p>
                        </div>
                        <Badge className={`bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                            {currentStatus.label}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={() => onEdit(salesman)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <UserCheck className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Full Name</p>
                                        <p className="font-medium">{salesman.user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{salesman.user.email}</p>
                                    </div>
                                </div>
                                {salesman.user.phone && (
                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Phone</p>
                                            <p className="font-medium">{salesman.user.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Start Date</p>
                                        <p className="font-medium">{new Date(salesman.startDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Commission & Targets</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Badge variant="outline">{salesman.commissionTier}</Badge>
                                    <span className="text-sm text-gray-600">Commission Tier</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Monthly</p>
                                        <p className="font-bold text-lg">${salesman.monthlyTarget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Quarterly</p>
                                        <p className="font-bold text-lg">${salesman.quarterlyTarget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Yearly</p>
                                        <p className="font-bold text-lg">${salesman.yearlyTarget.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Referral Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Referral Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Referral Code</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="font-mono text-lg bg-gray-100 px-3 py-2 rounded flex-1">
                                        {salesman.referralCode}
                                    </span>
                                    <Button variant="outline" onClick={copyReferralCode}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Referral Link</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input
                                        type="text"
                                        value={generateReferralLink()}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                    />
                                    <Button variant="outline" onClick={copyReferralLink}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => window.open(generateReferralLink(), '_blank')}>
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {salesman.personalMessage && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Personal Message</label>
                                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-md">
                                        {salesman.personalMessage}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Territory Information */}
                    {(salesman.territoryPostalCodes.length > 0 || salesman.territoryRegions.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Territory
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {salesman.territoryPostalCodes.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Postal Codes</label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {salesman.territoryPostalCodes.map((code, index) => (
                                                <Badge key={index} variant="outline">{code}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {salesman.territoryRegions.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Regions</label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {salesman.territoryRegions.map((region, index) => (
                                                <Badge key={index} variant="outline">{region}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Performance Metrics */}
                    {salesman.performance && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Performance Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{salesman.performance?.totalReferrals || 0}</p>
                                        <p className="text-sm text-gray-600">Total Referrals</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <UserCheck className="h-6 w-6 text-green-600" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{salesman.performance?.activeCustomers || 0}</p>
                                        <p className="text-sm text-gray-600">Active Customers</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <DollarSign className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">${(salesman.performance?.monthlyCommission || 0).toLocaleString()}</p>
                                        <p className="text-sm text-gray-600">Monthly Commission</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <Target className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{(salesman.performance?.conversionRate || 0).toFixed(1)}%</p>
                                        <p className="text-sm text-gray-600">Conversion Rate</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}