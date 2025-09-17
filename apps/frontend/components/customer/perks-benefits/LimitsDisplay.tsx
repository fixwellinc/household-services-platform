'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Infinity,
    TrendingUp,
    ArrowUp,
    Shield,
    Zap,
    Target,
    Calendar,
    Bell,
    Settings,
    X,
    Info
} from 'lucide-react';

interface UsageLimit {
    id: string;
    name: string;
    description: string;
    currentUsage: number;
    limit: number;
    unit: string;
    isUnlimited: boolean;
    category: 'SERVICES' | 'BOOKINGS' | 'SUPPORT' | 'DISCOUNTS';
    resetPeriod: 'MONTHLY' | 'YEARLY' | 'NEVER';
    resetDate?: string;
    warningThreshold: number; // Percentage at which to show warning
    criticalThreshold: number; // Percentage at which to show critical alert
    upgradeOptions?: {
        tier: 'HOMECARE' | 'PRIORITY';
        newLimit: number | 'unlimited';
        price: number;
    }[];
}

interface LimitsDisplayProps {
    limits: UsageLimit[];
    userTier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
    onUpgradeClick?: (tier: string) => void;
    onSetAlert?: (limitId: string, threshold: number) => void;
    onDismissWarning?: (limitId: string) => void;
}

const CATEGORY_ICONS = {
    SERVICES: Zap,
    BOOKINGS: Calendar,
    SUPPORT: Shield,
    DISCOUNTS: Target
};

const TIER_COLORS = {
    HOMECARE: 'from-purple-500 to-purple-600',
    PRIORITY: 'from-amber-500 to-amber-600'
};

const TIER_NAMES = {
    HOMECARE: 'HomeCare',
    PRIORITY: 'Priority'
};

export default function LimitsDisplay({
    limits,
    userTier,
    onUpgradeClick,
    onSetAlert,
    onDismissWarning
}: LimitsDisplayProps) {
    const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

    const getUsagePercentage = (limit: UsageLimit) => {
        if (limit.isUnlimited) return 0;
        return Math.min((limit.currentUsage / limit.limit) * 100, 100);
    };

    const getUsageStatus = (limit: UsageLimit) => {
        if (limit.isUnlimited) return 'unlimited';
        const percentage = getUsagePercentage(limit);
        if (percentage >= 100) return 'exceeded';
        if (percentage >= limit.criticalThreshold) return 'critical';
        if (percentage >= limit.warningThreshold) return 'warning';
        return 'normal';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'exceeded': return 'border-red-500 bg-red-50';
            case 'critical': return 'border-red-400 bg-red-50';
            case 'warning': return 'border-yellow-400 bg-yellow-50';
            case 'unlimited': return 'border-green-400 bg-green-50';
            default: return 'border-blue-400 bg-blue-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'exceeded': return AlertTriangle;
            case 'critical': return AlertTriangle;
            case 'warning': return Clock;
            case 'unlimited': return Infinity;
            default: return CheckCircle;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'exceeded': return 'Limit Exceeded';
            case 'critical': return 'Critical Usage';
            case 'warning': return 'Approaching Limit';
            case 'unlimited': return 'Unlimited';
            default: return 'Within Limits';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDismissWarning = (limitId: string) => {
        setDismissedWarnings(prev => new Set(Array.from(prev).concat(limitId)));
        onDismissWarning?.(limitId);
    };

    const shouldShowAlert = (limit: UsageLimit) => {
        const status = getUsageStatus(limit);
        return (status === 'warning' || status === 'critical' || status === 'exceeded') &&
            !dismissedWarnings.has(limit.id);
    };

    const criticalLimits = limits.filter(limit =>
        getUsageStatus(limit) === 'critical' || getUsageStatus(limit) === 'exceeded'
    );

    const warningLimits = limits.filter(limit =>
        getUsageStatus(limit) === 'warning'
    );

    const renderLimitCard = (limit: UsageLimit) => {
        const percentage = getUsagePercentage(limit);
        const status = getUsageStatus(limit);
        const StatusIcon = getStatusIcon(status);
        const CategoryIcon = CATEGORY_ICONS[limit.category];
        const remaining = limit.isUnlimited ? 'Unlimited' : Math.max(0, limit.limit - limit.currentUsage);

        return (
            <Card key={limit.id} className={`transition-all duration-200 ${getStatusColor(status)} border-2`}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-gray-700" />
                            <h4 className="font-medium text-sm text-gray-900">{limit.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status === 'exceeded' || status === 'critical' ? 'text-red-600' :
                                    status === 'warning' ? 'text-yellow-600' :
                                        status === 'unlimited' ? 'text-green-600' : 'text-blue-600'
                                }`} />
                            <Badge className={`text-xs px-2 py-0.5 ${status === 'exceeded' || status === 'critical' ? 'bg-red-100 text-red-800' :
                                    status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                        status === 'unlimited' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {getStatusText(status)}
                            </Badge>
                        </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3">{limit.description}</p>

                    {/* Usage Display */}
                    <div className="space-y-2 mb-4">
                        {limit.isUnlimited ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-700">
                                    {limit.currentUsage} {limit.unit} used
                                </span>
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <Infinity className="h-3 w-3" />
                                    Unlimited
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                        {limit.currentUsage} of {limit.limit} {limit.unit}
                                    </span>
                                    <span className={`font-medium ${status === 'exceeded' ? 'text-red-600' :
                                            status === 'critical' ? 'text-red-600' :
                                                status === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                                        }`}>
                                        {remaining} remaining
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${status === 'exceeded' || status === 'critical' ? 'bg-red-500' :
                                                status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>

                                <div className="text-xs text-gray-500 text-center">
                                    {Math.round(percentage)}% used
                                </div>
                            </>
                        )}
                    </div>

                    {/* Reset Information */}
                    {limit.resetDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                            <Clock className="h-3 w-3" />
                            <span>Resets on {formatDate(limit.resetDate)}</span>
                        </div>
                    )}

                    {/* Upgrade Options */}
                    {limit.upgradeOptions && limit.upgradeOptions.length > 0 && (status === 'warning' || status === 'critical' || status === 'exceeded') && (
                        <div className="space-y-2">
                            <h5 className="text-xs font-medium text-gray-700">Upgrade Options:</h5>
                            {limit.upgradeOptions.map((option, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                                    <div>
                                        <div className="text-xs font-medium text-gray-900">
                                            {TIER_NAMES[option.tier]} Plan
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {option.newLimit === 'unlimited' ? 'Unlimited' : `${option.newLimit} ${limit.unit}`}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-gray-900">
                                            ${option.price}/mo
                                        </div>
                                        {onUpgradeClick && (
                                            <button
                                                onClick={() => onUpgradeClick(option.tier)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-1"
                                            >
                                                <ArrowUp className="h-3 w-3" />
                                                Upgrade
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Alert Settings */}
                    {onSetAlert && !limit.isUnlimited && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                                onClick={() => onSetAlert(limit.id, limit.warningThreshold)}
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700"
                            >
                                <Bell className="h-3 w-3" />
                                Set Usage Alert
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Usage Limits</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Monitor your usage against plan limits
                    </p>
                </div>
            </div>

            {/* Critical Alerts */}
            {criticalLimits.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-red-800 text-sm">Critical Usage Alerts</h4>
                        <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                            {criticalLimits.length} alert{criticalLimits.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {criticalLimits.map(limit => (
                            <div key={limit.id} className="relative">
                                {renderLimitCard(limit)}
                                {shouldShowAlert(limit) && (
                                    <button
                                        onClick={() => handleDismissWarning(limit.id)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Alerts */}
            {warningLimits.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800 text-sm">Usage Warnings</h4>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
                            {warningLimits.length} warning{warningLimits.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {warningLimits.map(limit => (
                            <div key={limit.id} className="relative">
                                {renderLimitCard(limit)}
                                {shouldShowAlert(limit) && (
                                    <button
                                        onClick={() => handleDismissWarning(limit.id)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Limits */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-gray-800 text-sm">All Usage Limits</h4>
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
                        {limits.length} limit{limits.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {limits.map(renderLimitCard)}
                </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900">Limits Summary</CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                        Overview of your current usage status
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{criticalLimits.length}</div>
                            <div className="text-xs text-gray-600">Critical</div>
                        </div>

                        <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600">{warningLimits.length}</div>
                            <div className="text-xs text-gray-600">Warning</div>
                        </div>

                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                                {limits.filter(l => l.isUnlimited).length}
                            </div>
                            <div className="text-xs text-gray-600">Unlimited</div>
                        </div>

                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                                {limits.filter(l => getUsageStatus(l) === 'normal').length}
                            </div>
                            <div className="text-xs text-gray-600">Normal</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}