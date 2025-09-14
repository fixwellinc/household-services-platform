'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'retrying';
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
  };
  createdAt: string;
  description: string;
  failureReason?: string;
  retryAttempt?: number;
  nextRetryDate?: string;
  invoiceUrl?: string;
}

interface PaymentHistoryProps {
  userId?: string;
  limit?: number;
  showRetryStatus?: boolean;
}

export default function PaymentHistory({ 
  userId, 
  limit = 10, 
  showRetryStatus = true 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'failed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payments/history?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        throw new Error('Failed to load payment history');
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Failed to load payment history');
      // Mock data for demonstration
      setPayments([
        {
          id: 'pi_1',
          amount: 59.99,
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa'
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'HOMECARE Plan - Monthly Subscription'
        },
        {
          id: 'pi_2',
          amount: 59.99,
          currency: 'usd',
          status: 'failed',
          paymentMethod: {
            type: 'card',
            last4: '4000',
            brand: 'visa'
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'HOMECARE Plan - Monthly Subscription',
          failureReason: 'Your card was declined.',
          retryAttempt: 2,
          nextRetryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'pi_3',
          amount: 59.99,
          currency: 'usd',
          status: 'retrying',
          paymentMethod: {
            type: 'card',
            last4: '4000',
            brand: 'visa'
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'HOMECARE Plan - Monthly Subscription',
          failureReason: 'Insufficient funds',
          retryAttempt: 1,
          nextRetryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'retrying':
        return <Badge className="bg-blue-100 text-blue-800">Retrying</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch = searchTerm === '' || 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentMethod.last4.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const retryPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Payment retry initiated');
        await loadPaymentHistory();
      } else {
        throw new Error('Failed to retry payment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View your payment history and retry status
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadPaymentHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'succeeded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('succeeded')}
            >
              Paid
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              Failed
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
          </div>
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading payment history...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payments Found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "You don't have any payment history yet."
                : `No ${filter} payments found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{payment.description}</span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>{formatDate(payment.createdAt)}</span>
                          <span>
                            {payment.paymentMethod.brand.toUpperCase()} •••• {payment.paymentMethod.last4}
                          </span>
                        </div>
                        
                        {/* Failure Information */}
                        {payment.status === 'failed' && payment.failureReason && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">{payment.failureReason}</span>
                          </div>
                        )}
                        
                        {/* Retry Information */}
                        {showRetryStatus && payment.status === 'retrying' && payment.nextRetryDate && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <RefreshCw className="h-3 w-3" />
                            <span className="text-xs">
                              Retry attempt {payment.retryAttempt} - Next retry: {formatDate(payment.nextRetryDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {payment.invoiceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {payment.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => retryPayment(payment.id)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retry Information */}
        {showRetryStatus && filteredPayments.some(p => p.status === 'retrying' || p.status === 'failed') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">Payment Retry Information</div>
                <div className="text-blue-700">
                  • Failed payments are automatically retried up to 3 times<br />
                  • Your service remains active during the 7-day grace period<br />
                  • Update your payment method to resolve issues immediately
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}