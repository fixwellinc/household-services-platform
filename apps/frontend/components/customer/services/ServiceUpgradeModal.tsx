'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import {
    X,
    Crown,
    Star,
    Sparkles,
    CheckCircle,
    ArrowRight,
    Zap,
    Shield,
    Clock,
    Gift,
    Percent,
    Phone,
    Calendar,
    CreditCard,
    Loader2,
    Info,
    TrendingUp
} from 'lucide-react';

interface SubscriptionPlan {
    tier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    perks: string[];
    serviceDiscounts: number;
    prioritySupport: boolean;
    emergencyServices: boolean;
}

interface ServiceUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
    requiredTier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
    serviceName: string;
    onUpgrade: (tier: string, billingCycle: 'monthly' | 'yearly') => Promise<void>;
    availablePlans: SubscriptionPlan[];
    isUpgrading?: boolean;
}

const TIER_COLORS = {
    STARTER: 'from-blue-500 to-blue-600',
    HOMECARE: 'from-purple-500 to-purple-600',
    PRIORITY: 'from-amber-500 to-amber-600'
};

const TIER_ICONS = {
    STARTER: Star,
    HOMECARE: Shield,
    PRIORITY: Crown
};

const PERK_ICONS = {
    'Priority Booking': Calendar,
    'Emergency Services': Zap,
    'Service Discounts': Percent,
    'Priority Support': Phone,
    'Free Monthly Service': Gift,
    'Unlimited Consultations': Clock,
    'Premium Features': Sparkles
};

export default function ServiceUpgradeModal({
    isOpen,
    onClose,
    currentTier,
    requiredTier,
    serviceName,
    onUpgrade,
    availablePlans,
    isUpgrading = false
}: ServiceUpgradeModalProps) {
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedTier, setSelectedTier] = useState(requiredTier);

    if (!isOpen) return null;

    const currentPlan = availablePlans.find(plan => plan.tier === currentTier);
    const targetPlan = availablePlans.find(plan => plan.tier === selectedTier);
    const requiredPlan = availablePlans.find(plan => plan.tier === requiredTier);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(price);
    };

    const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
        const yearlyMonthly = yearlyPrice / 12;
        const savings = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
        return Math.round(savings);
    };

    const getUpgradePrice = () => {
        if (!targetPlan) return 0;
        return selectedBillingCycle === 'monthly' ? targetPlan.monthlyPrice : targetPlan.yearlyPrice;
    };

    const getCurrentPrice = () => {
        if (!currentPlan) return 0;
        return selectedBillingCycle === 'monthly' ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;
    };

    const getPriceDifference = () => {
        return getUpgradePrice() - getCurrentPrice();
    };

    const handleUpgrade = async () => {
        try {
            await onUpgrade(selectedTier, selectedBillingCycle);
        } catch (error) {
            console.error('Upgrade error:', error);
        }
    };

    const renderPlanCard = (plan: SubscriptionPlan, isRecommended: boolean = false) => {
        const IconComponent = TIER_ICONS[plan.tier];
        const isSelected = selectedTier === plan.tier;
        const isCurrent = currentTier === plan.tier;
        const price = selectedBillingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);

        return (
            <Card
                key={plan.tier}
                className={`relative cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : isCurrent
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    } ${isCurrent ? 'opacity-60' : ''}`}
                onClick={() => !isCurrent && setSelectedTier(plan.tier)}
            >
                {isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1">
                            Recommended
                        </Badge>
                    </div>
                )}

                {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gray-500 text-white px-3 py-1">
                            Current Plan
                        </Badge>
                    </div>
                )}

                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${TIER_COLORS[plan.tier]}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="text-sm">
                                {plan.tier === 'STARTER' && 'Essential home services'}
                                {plan.tier === 'HOMECARE' && 'Comprehensive home care'}
                                {plan.tier === 'PRIORITY' && 'Premium priority service'}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {formatPrice(price)}
                        </div>
                        <div className="text-sm text-gray-600">
                            per {selectedBillingCycle === 'monthly' ? 'month' : 'year'}
                        </div>
                        {selectedBillingCycle === 'yearly' && savings > 0 && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                                Save {savings}% annually
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Key Features</h4>
                            <ul className="space-y-1">
                                {plan.features.slice(0, 3).map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Perks & Benefits</h4>
                            <ul className="space-y-1">
                                {plan.perks.slice(0, 2).map((perk, index) => {
                                    const PerkIcon = PERK_ICONS[perk as keyof typeof PERK_ICONS] || Sparkles;
                                    return (
                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                            <PerkIcon className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                            {perk}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {plan.serviceDiscounts > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                        {plan.serviceDiscounts}% off all services
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isSelected && !isCurrent && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-800">
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Selected for upgrade</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Upgrade Required</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Access to "{serviceName}" requires {requiredPlan?.name} plan or higher
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Service Access Info */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-amber-900 mb-1">Service Access Required</h3>
                                <p className="text-sm text-amber-800">
                                    The "{serviceName}" service is available to {requiredPlan?.name} subscribers and above.
                                    Upgrade your plan to unlock this service and many other premium benefits.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center justify-center">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setSelectedBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedBillingCycle === 'monthly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setSelectedBillingCycle('yearly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedBillingCycle === 'yearly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Yearly
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
                                    Save up to 20%
                                </Badge>
                            </button>
                        </div>
                    </div>

                    {/* Plan Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {availablePlans.map(plan =>
                            renderPlanCard(plan, plan.tier === requiredTier)
                        )}
                    </div>

                    {/* Upgrade Summary */}
                    {targetPlan && targetPlan.tier !== currentTier && (
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Upgrade Summary</h4>
                                        <p className="text-sm text-gray-600">
                                            {currentPlan?.name} → {targetPlan.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                            <span className="text-lg font-bold text-green-600">
                                                +{formatPrice(getPriceDifference())}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            per {selectedBillingCycle === 'monthly' ? 'month' : 'year'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Benefits of Upgrading */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                What You'll Get with {targetPlan?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Service Benefits</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            Access to "{serviceName}"
                                        </li>
                                        {targetPlan?.serviceDiscounts && targetPlan.serviceDiscounts > 0 && (
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <Percent className="h-4 w-4 text-green-600" />
                                                {targetPlan.serviceDiscounts}% discount on all services
                                            </li>
                                        )}
                                        {targetPlan?.prioritySupport && (
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="h-4 w-4 text-green-600" />
                                                Priority customer support
                                            </li>
                                        )}
                                        {targetPlan?.emergencyServices && (
                                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                                <Zap className="h-4 w-4 text-green-600" />
                                                24/7 emergency services
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Additional Perks</h4>
                                    <ul className="space-y-2">
                                        {targetPlan?.perks.slice(0, 4).map((perk, index) => {
                                            const PerkIcon = PERK_ICONS[perk as keyof typeof PERK_ICONS] || Gift;
                                            return (
                                                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <PerkIcon className="h-4 w-4 text-blue-600" />
                                                    {perk}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isUpgrading}
                            className="flex-1"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={handleUpgrade}
                            disabled={isUpgrading || selectedTier === currentTier}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            {isUpgrading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Upgrading...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Upgrade to {targetPlan?.name}
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Terms */}
                    <div className="text-xs text-gray-500 text-center">
                        <p>
                            By upgrading, you agree to our terms of service.
                            Your new plan will take effect immediately and you'll be charged the prorated amount.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}