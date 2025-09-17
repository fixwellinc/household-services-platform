'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { 
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Plus
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // For cards: visa, mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft';
  date: string;
  dueDate?: string;
  downloadUrl?: string;
  hostedInvoiceUrl?: string;
  description: string;
}

interface BillingInformationProps {
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  onUpdatePaymentMethod?: () => void;
  onAddPaymentMethod?: () => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
  isLoading?: boolean;
}

const INVOICE_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-gray-100 text-gray-800 border-gray-200'
};

const INVOICE_STATUS_ICONS = {
  paid: CheckCircle,
  pending: Clock,
  failed: AlertTriangle,
  draft: FileText
};

export default function BillingInformation({
  paymentMethods = [],
  invoices = [],
  onUpdatePaymentMethod,
  onAddPaymentMethod,
  onDownloadInvoice,
  onViewInvoice,
  isLoading = false
}: BillingInformationProps) {
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd have actual card brand icons
    const brandMap: { [key: string]: string } = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      default: '💳'
    };
    return brandMap[brand?.toLowerCase()] || brandMap.default;
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return {
        display: `${getCardBrandIcon(method.brand || '')} •••• ${method.last4}`,
        details: method.expiryMonth && method.expiryYear 
          ? `Expires ${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}`
          : 'Card',
        type: method.brand?.toUpperCase() || 'CARD'
      };
    } else {
      return {
        display: `🏦 •••• ${method.last4}`,
        details: 'Bank Account',
        type: 'BANK'
      };
    }
  };

  const defaultPaymentMethod = paymentMethods.find(method => method.isDefault);
  const displayedInvoices = showAllInvoices ? invoices : invoices.slice(0, 5);

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Billing Information
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Manage your payment methods and billing history
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onUpdatePaymentMethod}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Update
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Payment Method */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </h4>
          
          {defaultPaymentMethod ? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    {getPaymentMethodDisplay(defaultPaymentMethod).type}
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">
                      {getPaymentMethodDisplay(defaultPaymentMethod).display}
                    </div>
                    <div className="text-sm text-blue-700">
                      {getPaymentMethodDisplay(defaultPaymentMethod).details}
                    </div>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Default
                </Badge>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">No payment method on file</span>
                </div>
                <Button
                  size="sm"
                  onClick={onAddPaymentMethod}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Method
                </Button>
              </div>
            </div>
          )}

          {/* Additional Payment Methods */}
          {paymentMethods.length > 1 && (
            <div className="mt-3 space-y-2">
              <div className="text-sm font-medium text-gray-700">Other Payment Methods</div>
              {paymentMethods.filter(method => !method.isDefault).map((method) => (
                <div key={method.id} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-gray-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        {getPaymentMethodDisplay(method).type}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getPaymentMethodDisplay(method).display}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getPaymentMethodDisplay(method).details}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Billing History
            </h4>
            {invoices.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllInvoices(!showAllInvoices)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAllInvoices ? 'Show Less' : `View All (${invoices.length})`}
              </Button>
            )}
          </div>

          {displayedInvoices.length > 0 ? (
            <div className="space-y-3">
              {displayedInvoices.map((invoice) => {
                const StatusIcon = INVOICE_STATUS_ICONS[invoice.status];
                return (
                  <div key={invoice.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(invoice.date)}
                          </span>
                        </div>
                        <Badge className={`${INVOICE_STATUS_COLORS[invoice.status]} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatPrice(invoice.amount, invoice.currency)}
                          </div>
                          <div className="text-xs text-gray-600">
                            Invoice #{invoice.number}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {invoice.hostedInvoiceUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewInvoice?.(invoice.id)}
                              className="h-8 w-8 p-0"
                              title="View Invoice"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {invoice.downloadUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadInvoice?.(invoice.id)}
                              className="h-8 w-8 p-0"
                              title="Download Invoice"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {invoice.description && (
                      <div className="mt-2 text-sm text-gray-600">
                        {invoice.description}
                      </div>
                    )}
                    
                    {invoice.status === 'failed' && invoice.dueDate && (
                      <div className="mt-2 text-sm text-red-600">
                        Payment failed - Due: {formatDate(invoice.dueDate)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No billing history available</p>
              <p className="text-sm text-gray-500 mt-1">
                Your invoices will appear here once billing begins
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdatePaymentMethod}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Update Payment Method
            </Button>
            {invoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // In a real app, this would export all invoices
                  console.log('Export all invoices');
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}