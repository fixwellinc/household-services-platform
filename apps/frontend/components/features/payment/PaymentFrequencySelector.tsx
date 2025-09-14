'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
    Calendar,
    DollarSign,
    TrendingDown,
    Check,
    Loader2,
    Info,
    Star,
    Zap
} from 'lucide-react';

interface FrequencyOption {
    frequency: string;
    planTier: string;
    frequencyConfig: {
        multiplier: number;
        periodsPerYear: number;
        discount: number;
        label: string;
        description: string;
    };
    pricing: {
        monthlyBasePrice: number;
        paymentAmount: number;
        baseAmount: number;
        discountAmount: number;
        discountPercentage: number;
    };
    annual: {
        totalPayments: number;
        totalDiscount: number;
        savingsVsMonthly: number;
        savingsPercentage: number;
    };
    schedule: {
        periodsPerYear: number;
        label: string;
        description: string;
    };
    recommended?: boolean;
    isCurrent?: boolean;
}

interface PaymentFrequencySelectorProps {
    currentFrequency?: string;
    planTier?: string;
    onFrequencySelect?: (frequency: string, option: FrequencyOption) => void;
    disabled?: boolean;
    className?: string;
}

const FREQUENCY_ICONS = {
    MONTHLY: Calendar,
    YEARLY: Zap
};

const FREQUENCY_COLORS = {
    MONTHLY: 'border-gray-200 bg-gray-50',
    YEARLY: 'border-green-200 bg-green-50'
};

export default function PaymentFrequencySelector({
    currentFrequency,
    planTier,
    onFrequencySelect,
    disabled = false,
    className = ''
}: PaymentFrequencySelectorProps) {
    const [options, setOptions] = useState<FrequencyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFrequency, setSelectedFrequency] = useState<string>(currentFrequency || 'MONTHLY');

    useEffect(() => {
        fetchFrequencyOptions();
    }, [planTier]);

    const fetchFrequencyOptions = async () => {
        try {
            setLoading(true);
            const queryParams = planTier ? `?planTier=${planTier}` : '';
            const response = await fetch(`/api/subscriptions/frequency-options${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setOptions(data.options || []);
            } else {
                throw new Error('Failed to fetch frequency options');
            }
        } catch (error) {
            console.error('Error fetching frequency options:', error);
            toast.error('Failed to load payment frequency options');
        } finally {
            setLoading(false);
        }
    };

    const handleFrequencySelect = (frequency: string, option: FrequencyOption) => {
        if (disabled) return;

        setSelectedFrequency(frequency);
        onFrequencySelect?.(frequency, option);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getFrequencyIcon = (frequency: string) => {
        const IconComponent = FREQUENCY_ICONS[frequency as keyof typeof FREQUENCY_ICONS] || Calendar;
        return <IconComponent className="h-4 w-4" />;
    };

    const getSavingsBadge = (option: FrequencyOption) => {
        if (option.annual.savingsVsMonthly <= 0) return null;

        return (
            <Badge className="bg-green-100 text-green-800 text-xs">
                Save {formatCurrency(option.annual.savingsVsMonthly)}/year
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Payment Frequency
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading frequency options...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Payment Frequency
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Choose how often you'd like to be billed. Save more with longer billing periods.
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {options.map((option) => {
                        const isSelected = selectedFrequency === option.frequency;
                        const isCurrent = currentFrequency === option.frequency;
                        const colorClass = FREQUENCY_COLORS[option.frequency as keyof typeof FREQUENCY_COLORS] || 'border-gray-200 bg-gray-50';

                        return (
                            <div
                                key={option.frequency}
                                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${isSelected ? 'border-blue-500 bg-blue-50' : colorClass}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                `}
                                onClick={() => handleFrequencySelect(option.frequency, option)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                      p-2 rounded-lg 
                      ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}
                    `}>
                                            {getFrequencyIcon(option.frequency)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {option.schedule.label}
                                                </h3>
                                                {option.recommended && (
                                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                        Recommended
                                                    </Badge>
                                                )}
                                                {isCurrent && (
                                                    <Badge className="bg-gray-100 text-gray-800 text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {option.schedule.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-gray-900">
                                                {formatCurrency(option.pricing.paymentAmount)}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                per {option.schedule.label.toLowerCase()}
                                            </span>
                                        </div>
                                        {getSavingsBadge(option)}
                                    </div>
                                </div>

                                {/* Discount Information */}
                                {option.pricing.discountPercentage > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-sm">
                                            <TrendingDown className="h-4 w-4 text-green-600" />
                                            <span className="text-green-600 font-medium">
                                                {option.pricing.discountPercentage}% discount applied
                                            </span>
                                            <span className="text-gray-600">
                                                (Save {formatCurrency(option.pricing.discountAmount)} per payment)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Annual Savings */}
                                {option.annual.savingsVsMonthly > 0 && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign className="h-4 w-4 text-blue-600" />
                                            <span className="text-blue-600 font-medium">
                                                Annual savings: {formatCurrency(option.annual.savingsVsMonthly)}
                                            </span>
                                            <span className="text-gray-600">
                                                ({option.annual.savingsPercentage.toFixed(1)}% vs monthly)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary Information */}
                {selectedFrequency && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                {(() => {
                                    const selectedOption = options.find(o => o.frequency === selectedFrequency);
                                    if (!selectedOption) return null;

                                    return (
                                        <>
                                            <p className="text-blue-800 font-medium mb-1">
                                                Selected: {selectedOption.schedule.label}
                                            </p>
                                            <p className="text-blue-700">
                                                You'll be charged {formatCurrency(selectedOption.pricing.paymentAmount)}
                                                {' '}every {selectedOption.schedule.label.toLowerCase()}.
                                                {selectedOption.annual.savingsVsMonthly > 0 && (
                                                    <span className="font-medium">
                                                        {' '}This saves you {formatCurrency(selectedOption.annual.savingsVsMonthly)} per year!
                                                    </span>
                                                )}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}