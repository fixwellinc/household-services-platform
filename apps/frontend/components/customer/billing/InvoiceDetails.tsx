'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { FileText, Download, ArrowLeft, Calendar, DollarSign, User } from 'lucide-react';
import { useInvoice, useInvoicePDF } from '@/hooks/use-customer-invoices';
import { format } from 'date-fns';
import Link from 'next/link';

interface InvoiceDetailsProps {
  invoiceId: string;
  onBack?: () => void;
}

export function InvoiceDetails({ invoiceId, onBack }: InvoiceDetailsProps) {
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const pdfMutation = useInvoicePDF();

  const handleDownloadPDF = async () => {
    try {
      const blob = await pdfMutation.mutateAsync(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download invoice PDF. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PAID': 'default',
      'PENDING': 'outline',
      'OVERDUE': 'destructive',
      'CANCELLED': 'secondary',
    };
    return variants[status] || 'outline';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !invoice) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load invoice details.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
              </CardTitle>
            </div>
            <Badge variant={getStatusBadge(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {invoice.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.paidAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Paid Date</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(invoice.paidAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {invoice.job?.technician && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Technician</p>
                      <p className="font-medium text-gray-900">
                        {invoice.job.technician.name || invoice.job.technician.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Information */}
          {invoice.job?.serviceRequest?.service && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Service Information</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {invoice.job.serviceRequest.service.name}
                </p>
                {invoice.job.serviceRequest.service.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {invoice.job.serviceRequest.service.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Amount Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${invoice.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${invoice.taxAmount?.toFixed(2) || '0.00'}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>${invoice.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleDownloadPDF}
              disabled={pdfMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {invoice.status === 'PENDING' && (
              <Button asChild className="flex-1">
                <Link href={`/billing/pay?invoice=${invoice.id}`}>
                  Pay Now
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

