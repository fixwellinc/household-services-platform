'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
    X,
    Star,
    Crown,
    Sparkles,
    DollarSign,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Info,
    Clock,
    CreditCard
} from 'lucide-react';
import api from '@/lib/api';

interface PlanUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: string;
    targetTier: string;
    billingCycle: 'monthly' | 'yearly';
    onPlanChanged?: () => void;
}

interface PlanChangePreview {
    currentPlan: {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice?: number;
    };
    newPlan: {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice?: number;
    };
    isUpgrade: boolean;
    canChange: boolean;
    restrictions: string[];
    billingPreview: {
        currentPrice: number;
        newPrice: number;
        proratedDifference: number;
        immediateCharge: number;
        creditAmount: number;
        nextAmount: number;
        remainingDays: number;
        totalDays: number;
        billingCycle: string;
    };
    visitCarryover: {
        currentVisitsPerMonth: number;
        newVisitsPerMonth: number;
        unusedVisits: number;
        carryoverVisits: number;
        totalVisitsNextPeriod: number;
    };
    effectiveDate: string;
}

const PLAN_ICONS = {
    STARTER: Star,
    HOMECARE: Crown,
    PRIORITY: Sparkles
};

const PLAN_COLORS = {
    STARTER: 'from-blue-500 to-blue-600',
    HOMECARE: 'from-purple-500 to-purple-600',
    PRIORITY: 'from-amber-500 to-amber-600'
};

export default function PlanUpgradeModal({
    isOpen,
    onClose,
    currentTier,
    targetTier,
    billingCycle,
    onPlanChanged
}: PlanUpgradeModalProps) {
    const [preview, setPreview] = useState<PlanChangePreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && currentTier !== targetTier) {
            fetchPreview();
        }
    }, [isOpen, currentTier, targetTier, billingCycle]);

    const fetchPreview = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.getPlanChangePreview(targetTier, billingCycle);

            if (response.success) {
                setPreview(response.preview);
            } else {
                throw new Error('Failed to fetch plan change preview');
            }
        } catch (err) {
            console.error('Error fetching preview:', err);
            setError(err instanceof Error ? err.message : 'Failed to load preview');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = async () => {
        if (!preview || !preview.canChange) return;

        setProcessing(true);

        try {
            const response = await api.changePlan(targetTier, billingCycle);

            if (response.success) {
                toast.success(response.message);
                onPlanChanged?.();
                onClose();
            } else {
                throw new Error('Failed to change plan');
            }
        } catch (err) {
            console.error('Error changing plan:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to change plan');
        } finally {
            setProcessing(false);
        }
    };

    const getPlanIcon = (tier: string) => {
        const IconComponent = PLAN_ICONS[tier as keyof typeof PLAN_ICONS] || Star;
        return <IconComponent className="h-5 w-5 text-white" />;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {preview?.isUpgrade ? 'Upgrade Plan' : 'Change Plan'}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Loading preview...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">Error</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchPreview}
                                className="mt-3"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {preview && (
                        <>
                            {/* Plan Comparison */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Current Plan */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm text-gray-600">Current Plan</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-r ${PLAN_COLORS[currentTier as keyof typeof PLAN_COLORS]}`}>
                                                {getPlanIcon(currentTier)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{preview.currentPlan.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(preview.billingPreview.currentPrice)}/{billingCycle === 'yearly' ? 'year' : 'month'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* New Plan */}
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm text-blue-600">
                                            {preview.isUpgrade ? 'Upgrading to' : 'Changing to'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-r ${PLAN_COLORS[targetTier as keyof typeof PLAN_COLORS]}`}>
                                                {getPlanIcon(targetTier)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{preview.newPlan.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(preview.billingPreview.newPrice)}/{billingCycle === 'yearly' ? 'year' : 'month'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Restrictions */}
                            {!preview.canChange && preview.restrictions.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-800">Cannot Change Plan</h4>
                                            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                                                {preview.restrictions.map((restriction, index) => (
                                                    <li key={index}>• {restriction}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Billing Preview */}
                            {preview.canChange && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Billing Preview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Immediate Charge */}
                                        {preview.billingPreview.immediateCharge > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                                    <span className="font-medium">Immediate Charge</span>
                                                </div>
                                                <span className="font-semibold text-blue-600">
                                                    {formatCurrency(preview.billingPreview.immediateCharge)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Credit Amount */}
                                        {preview.billingPreview.creditAmount > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-green-600" />
                                                    <span className="font-medium">Credit Applied</span>
                                                </div>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(preview.billingPreview.creditAmount)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Next Billing Amount */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-600" />
                                                <span className="font-medium">Next Billing Amount</span>
                                            </div>
                                            <span className="font-semibold">
                                                {formatCurrency(preview.billingPreview.nextAmount)}
                                            </span>
                                        </div>

                                        {/* Effective Date */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-600" />
                                                <span className="font-medium">Effective Date</span>
                                            </div>
                                            <span className="font-semibold">
                                                {preview.isUpgrade ? 'Immediately' : formatDate(preview.effectiveDate)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Visit Carryover */}
                            {preview.canChange && preview.visitCarryover.carryoverVisits > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Visit Carryover
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Info className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-green-800">Good News!</span>
                                            </div>
                                            <p className="text-sm text-green-700">
                                                You have {preview.visitCarryover.carryoverVisits} unused visit{preview.visitCarryover.carryoverVisits > 1 ? 's' : ''} that will be carried over to your new plan.
                                                You'll have {preview.visitCarryover.totalVisitsNextPeriod} total visits next billing period.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePlanChange}
                                    disabled={!preview.canChange || processing}
                                    className="flex-1"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Confirm ${preview.isUpgrade ? 'Upgrade' : 'Change'}`
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}