'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Star,
  Check,
  Loader2
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
  savingsVsMonthly: number;
  savingsPercentage: number;
}

interface FrequencyComparisonTableProps {
  planTier?: string;
  currentFrequency?: string;
  className?: string;
}

export default function FrequencyComparisonTable({
  planTier,
  currentFrequency,
  className = ''
}: FrequencyComparisonTableProps) {
  const [options, setOptions] = useState<FrequencyOption[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getSavingsIcon = (savings: number) => {
    if (savings > 0) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    } else if (savings < 0) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    }
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 0) return 'text-green-600';
    if (savings < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Frequency Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading comparison data...</span>
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
          Payment Frequency Comparison
        </CardTitle>
        <p className="text-sm text-gray-600">
          Compare payment amounts and annual savings across different billing frequencies.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-900">
                  Frequency
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">
                  Payment Amount
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">
                  Annual Total
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">
                  Annual Savings
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-900">
                  Discount
                </th>
              </tr>
            </thead>
            <tbody>
              {options.map((option, index) => {
                const isCurrent = currentFrequency === option.frequency;
                const isRecommended = option.recommended;
                
                return (
                  <tr 
                    key={option.frequency}
                    className={`
                      border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${isCurrent ? 'bg-blue-50' : ''}
                    `}
                  >
                    {/* Frequency */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {option.schedule.label}
                        </span>
                        <div className="flex gap-1">
                          {isRecommended && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Best Value
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.schedule.description}
                      </div>
                    </td>

                    {/* Payment Amount */}
                    <td className="py-4 px-2 text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(option.pricing.paymentAmount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        per {option.schedule.label.toLowerCase()}
                      </div>
                    </td>

                    {/* Annual Total */}
                    <td className="py-4 px-2 text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(option.annual.totalPayments)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.schedule.periodsPerYear} payments/year
                      </div>
                    </td>

                    {/* Annual Savings */}
                    <td className="py-4 px-2 text-right">
                      <div className={`flex items-center justify-end gap-1 font-semibold ${getSavingsColor(option.annual.savingsVsMonthly)}`}>
                        {getSavingsIcon(option.annual.savingsVsMonthly)}
                        {option.annual.savingsVsMonthly > 0 ? '+' : ''}
                        {formatCurrency(Math.abs(option.annual.savingsVsMonthly))}
                      </div>
                      <div className={`text-sm ${getSavingsColor(option.annual.savingsVsMonthly)}`}>
                        {option.annual.savingsPercentage > 0 ? '+' : ''}
                        {option.annual.savingsPercentage.toFixed(1)}% vs monthly
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="py-4 px-2 text-center">
                      {option.pricing.discountPercentage > 0 ? (
                        <div>
                          <div className="font-semibold text-green-600">
                            {option.pricing.discountPercentage}%
                          </div>
                          <div className="text-sm text-gray-600">
                            -{formatCurrency(option.pricing.discountAmount)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          No discount
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Best Savings:</span>
              <div className="font-semibold text-green-600">
                {options.length > 0 && formatCurrency(Math.max(...options.map(o => o.annual.savingsVsMonthly)))} per year
              </div>
            </div>
            <div>
              <span className="text-gray-600">Standard Option:</span>
              <div className="font-semibold text-blue-600">
                Monthly payments
              </div>
            </div>
            <div>
              <span className="text-gray-600">Recommended:</span>
              <div className="font-semibold text-purple-600">
                {options.find(o => o.recommended)?.schedule.label || 'Yearly'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}