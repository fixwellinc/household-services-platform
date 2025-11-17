'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { DollarSign, Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useBillingOverview } from '@/hooks/use-customer-billing';
import { format } from 'date-fns';
import Link from 'next/link';

export function BillingOverview() {
  const { data, isLoading, error } = useBillingOverview();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load billing information. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingCharges.nextBillingDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Next Billing Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(data.upcomingCharges.nextBillingDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${data.upcomingCharges.nextPaymentAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Payment will be processed automatically using your default payment method.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No upcoming charges</p>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Balance */}
      {data.outstandingBalance > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Total Outstanding</p>
                <p className="text-2xl font-bold text-amber-900">
                  ${data.outstandingBalance.toFixed(2)}
                </p>
              </div>
              <Button asChild>
                <Link href="/billing/pay">
                  Pay Now
                </Link>
              </Button>
            </div>
            {data.outstandingInvoices.length > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  Outstanding Invoices ({data.outstandingInvoices.length})
                </p>
                <div className="space-y-2">
                  {data.outstandingInvoices.slice(0, 3).map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between text-sm">
                      <span className="text-amber-800">
                        Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                      </span>
                      <span className="font-medium text-amber-900">
                        ${invoice.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {data.recentTransactions && data.recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your recent payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.job?.serviceRequest?.service?.name || 'Service Payment'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.paidAt
                          ? format(new Date(transaction.paidAt), 'MMM d, yyyy')
                          : format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${transaction.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" asChild className="w-full">
                <Link href="/billing/history">View Full Billing History</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" asChild className="h-auto p-4">
          <Link href="/billing/payment-methods">
            <CreditCard className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Manage Payment Methods</p>
              <p className="text-sm text-gray-600">Add or update payment methods</p>
            </div>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto p-4">
          <Link href="/billing/invoices">
            <DollarSign className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">View Invoices</p>
              <p className="text-sm text-gray-600">Download and manage invoices</p>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}

