'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import {
    Star,
    Crown,
    Check,
    X,
    TrendingUp,
    DollarSign,
    Calendar,
    Shield,
    Clock
} from 'lucide-react';

interface PlanComparisonTableProps {
    currentTier: string;
    onPlanSelect: (tier: string, billingCycle: 'monthly' | 'yearly') => void;
    className?: string;
}

interface PlanFeature {
    name: string;
    basic: string | boolean;
    premium: string | boolean;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    icon: any;
    color: string;
    popular?: boolean;
    features: string[];
}

const PLANS: Record<string, Plan> = {
    BASIC: {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for light upkeep & peace of mind',
        monthlyPrice: 21.99,
        yearlyPrice: 237.49,
        icon: Star,
        color: 'from-blue-500 to-blue-600',
        features: [
            '1 visit per month (up to 0.5 hour)',
            'Minor repairs & maintenance',
            'Lightbulb replacements',
            'Basic safety checks',
            'Priority scheduling',
            'Free annual inspection'
        ]
    },
    PREMIUM: {
        id: 'premium',
        name: 'Premium Plan',
        description: 'Monthly help for ongoing maintenance',
        monthlyPrice: 54.99,
        yearlyPrice: 593.89,
        icon: Crown,
        color: 'from-purple-500 to-purple-600',
        popular: true,
        features: [
            '1 visit per month (up to 1 hour)',
            'Everything from Basic Plan',
            'Seasonal maintenance',
            'Small repairs & touch-ups',
            'Appliance checks',
            '10% off add-on services',
            'Emergency visits at standard rate'
        ]
    }
};

const COMPARISON_FEATURES: PlanFeature[] = [
    {
        name: 'Visit Frequency',
        basic: 'Monthly',
        premium: 'Monthly'
    },
    {
        name: 'Time Per Visit',
        basic: '0.5 hours',
        premium: '1 hour'
    },
    {
        name: 'Emergency Callouts',
        basic: 'Standard rate',
        premium: 'Priority booking'
    },
    {
        name: 'Service Discounts',
        basic: false,
        premium: '10% off add-ons'
    },
    {
        name: 'Free Consumables',
        basic: false,
        premium: false
    },
    {
        name: 'Smart Home Setup',
        basic: false,
        premium: false
    },
    {
        name: 'Annual Inspection',
        basic: true,
        premium: true
    }
];

export default function PlanComparisonTable({
    currentTier,
    onPlanSelect,
    className = ''
}: PlanComparisonTableProps) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
        const yearlyMonthly = monthlyPrice * 12;
        const savings = yearlyMonthly - yearlyPrice;
        return savings;
    };

    const renderFeatureValue = (value: string | boolean) => {
        if (typeof value === 'boolean') {
            return value ? (
                <Check className="h-4 w-4 text-green-600 mx-auto" />
            ) : (
                <X className="h-4 w-4 text-gray-400 mx-auto" />
            );
        }
        return <span className="text-sm">{value}</span>;
    };

    const getPlanIcon = (tier: string) => {
        const plan = PLANS[tier];
        if (!plan) return null;
        const IconComponent = plan.icon;
        return <IconComponent className="h-5 w-5 text-white" />;
    };

    const isCurrentPlan = (tier: string) => {
        return currentTier === tier;
    };

    const isUpgrade = (tier: string) => {
        const tierHierarchy = { BASIC: 1, PREMIUM: 2 } as const;
        return (tierHierarchy as any)[tier] > (tierHierarchy as any)[currentTier];
    };

    const isDowngrade = (tier: string) => {
        const tierHierarchy = { BASIC: 1, PREMIUM: 2 } as const;
        return (tierHierarchy as any)[tier] < (tierHierarchy as any)[currentTier];
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Billing Cycle Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Plan Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'yearly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-1">
                                    Yearly
                                    <Badge className="bg-green-100 text-green-800 text-xs">Save 10%</Badge>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {Object.entries(PLANS).map(([tier, plan]) => {
                            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                            const displayPrice = billingCycle === 'yearly' ? price / 12 : price;
                            const savings = billingCycle === 'yearly' ? getYearlySavings(plan.monthlyPrice, plan.yearlyPrice) : 0;

                            return (
                                <Card
                                    key={tier}
                                    className={`relative ${plan.popular ? 'border-purple-200 shadow-lg' : ''
                                        } ${isCurrentPlan(tier) ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                                        </div>
                                    )}

                                    {isCurrentPlan(tier) && (
                                        <div className="absolute -top-3 right-4">
                                            <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center">
                                        <div className={`mx-auto p-3 rounded-lg bg-gradient-to-r ${plan.color} mb-4`}>
                                            {getPlanIcon(tier)}
                                        </div>
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <p className="text-sm text-gray-600">{plan.description}</p>

                                        <div className="mt-4">
                                            <div className="text-3xl font-bold">
                                                {formatCurrency(displayPrice)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                per month{billingCycle === 'yearly' && ', billed yearly'}
                                            </div>
                                            {billingCycle === 'yearly' && savings > 0 && (
                                                <div className="text-sm text-green-600 font-medium mt-1">
                                                    Save {formatCurrency(savings)} per year
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <ul className="space-y-2 mb-6">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            onClick={() => onPlanSelect(tier, billingCycle)}
                                            disabled={isCurrentPlan(tier)}
                                            className={`w-full ${isCurrentPlan(tier)
                                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                    : isUpgrade(tier)
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : isDowngrade(tier)
                                                            ? 'bg-orange-600 hover:bg-orange-700'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                        >
                                            {isCurrentPlan(tier) ? (
                                                'Current Plan'
                                            ) : isUpgrade(tier) ? (
                                                <>
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Upgrade to {plan.name}
                                                </>
                                            ) : isDowngrade(tier) ? (
                                                'Change to ' + plan.name
                                            ) : (
                                                'Select ' + plan.name
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Feature Comparison Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Features</th>
                                    <th className="text-center py-3 px-4 font-medium">Starter</th>
                                    <th className="text-center py-3 px-4 font-medium">HomeCare</th>
                                    <th className="text-center py-3 px-4 font-medium">Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_FEATURES.map((feature, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{feature.name}</td>
                                        <td className="py-3 px-4 text-center">
                                            {renderFeatureValue(feature.starter)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {renderFeatureValue(feature.homecare)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {renderFeatureValue(feature.priority)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}