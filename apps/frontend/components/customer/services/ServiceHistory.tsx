'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { Calendar, CheckCircle, DollarSign, User, RefreshCw, Filter } from 'lucide-react';
import { useServiceHistory } from '@/hooks/use-customer-service-requests';
import { format } from 'date-fns';
import Link from 'next/link';

export function ServiceHistory() {
  const [filters, setFilters] = useState<{ limit?: number; offset?: number }>({ limit: 20 });
  const { data, isLoading, error } = useServiceHistory(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded" />
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
          <p className="text-red-600">Failed to load service history. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const jobs = data?.data || [];

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No service history found</p>
          <Button asChild className="mt-4">
            <Link href="/book-appointment">Book a Service</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {job.serviceRequest?.service?.name || 'Service'}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {job.completedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Completed on {format(new Date(job.completedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {job.technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Technician: {job.technician.name || job.technician.email}</span>
                    </div>
                  )}
                  {job.invoices && job.invoices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Total: ${job.invoices[0].totalAmount?.toFixed(2) || '0.00'}
                        {job.invoices[0].discountAmount > 0 && (
                          <span className="text-green-600 ml-2">
                            (Saved ${job.invoices[0].discountAmount.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {job.customerRating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < job.customerRating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      {job.customerFeedback && (
                        <span className="text-xs text-gray-500 ml-2">
                          "{job.customerFeedback}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {job.invoices && job.invoices.length > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/invoices/${job.invoices[0].id}`}>
                      View Invoice
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle re-book - would navigate to booking form with pre-filled data
                    console.log('Re-book service:', job.serviceRequest?.service?.id);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-book
                </Button>
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

