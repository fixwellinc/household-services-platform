'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { FileText, Download, Eye, Filter } from 'lucide-react';
import { useInvoices, useInvoicePDF } from '@/hooks/use-customer-invoices';
import { format } from 'date-fns';
import Link from 'next/link';

export function InvoicesList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [filters, setFilters] = useState<{ status?: string; limit?: number; offset?: number }>({
    limit: 20
  });
  const { data, isLoading, error } = useInvoices({ ...filters, status: statusFilter });
  const pdfMutation = useInvoicePDF();

  const handleDownloadPDF = async (invoiceId: string) => {
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load invoices. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const invoices = data?.data || [];

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No invoices found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter || ''}
          onChange={(e) => {
            const value = e.target.value || undefined;
            setStatusFilter(value);
            setFilters(prev => ({ ...prev, status: value }));
          }}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Invoice List */}
      {invoices.map((invoice: any) => (
        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {invoice.job?.serviceRequest?.service?.name || 'Service Invoice'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span>
                    Date: {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                  </span>
                  {invoice.dueDate && (
                    <span>
                      Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">
                    ${invoice.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadge(invoice.status)}>
                  {invoice.status}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/invoices/${invoice.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice.id)}
                    disabled={pdfMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data?.pagination?.hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                offset: (prev.offset || 0) + (prev.limit || 20)
              }));
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

