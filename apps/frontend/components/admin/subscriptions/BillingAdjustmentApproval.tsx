"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  AlertTriangle,
  Eye,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea, Label } from '@/components/ui/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';

interface BillingAdjustment {
  id: string;
  subscriptionId: string;
  type: 'credit' | 'debit' | 'refund' | 'discount';
  amount: number;
  reason: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  effectiveDate: string;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  metadata?: any;
  subscription: {
    id: string;
    tier: string;
    user: {
      email: string;
      name?: string;
    };
  };
}

interface BillingAdjustmentApprovalProps {
  onRefresh?: () => void;
}

export function BillingAdjustmentApproval({ onRefresh }: BillingAdjustmentApprovalProps) {
  const [adjustments, setAdjustments] = useState<BillingAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedAdjustment, setSelectedAdjustment] = useState<BillingAdjustment | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState<'approve' | 'reject' | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await request(`/admin/billing-adjustments?${params}`);
      
      if (response.success) {
        setAdjustments(response.adjustments);
      }
    } catch (error) {
      console.error('Error fetching billing adjustments:', error);
      showError("Failed to fetch billing adjustments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAdjustment) return;

    try {
      setProcessingId(selectedAdjustment.id);
      const response = await request(`/admin/billing-adjustments/${selectedAdjustment.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: approvalNote })
      });

      if (response.success) {
        showSuccess('Billing adjustment approved successfully');
        setShowApprovalDialog(null);
        setApprovalNote('');
        setSelectedAdjustment(null);
        fetchAdjustments();
        onRefresh?.();
      }
    } catch (error: any) {
      console.error('Error approving adjustment:', error);
      showError(error.message || 'Failed to approve billing adjustment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAdjustment || !approvalNote.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(selectedAdjustment.id);
      const response = await request(`/admin/billing-adjustments/${selectedAdjustment.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: approvalNote })
      });

      if (response.success) {
        showSuccess('Billing adjustment rejected');
        setShowApprovalDialog(null);
        setApprovalNote('');
        setSelectedAdjustment(null);
        fetchAdjustments();
        onRefresh?.();
      }
    } catch (error: any) {
      console.error('Error rejecting adjustment:', error);
      showError(error.message || 'Failed to reject billing adjustment');
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'debit': return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'refund': return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'discount': return <DollarSign className="w-4 h-4 text-orange-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold">Billing Adjustment Approvals</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)} className="w-40">
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Status</option>
          </Select>
        </div>
      </div>

      {/* Adjustments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading adjustments...</p>
          </div>
        ) : adjustments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No billing adjustments found for the selected filter</p>
            </CardContent>
          </Card>
        ) : (
          adjustments.map((adjustment) => (
            <Card key={adjustment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getTypeIcon(adjustment.type)}
                      <h3 className="font-medium capitalize">{adjustment.type} Adjustment</h3>
                      {getStatusBadge(adjustment.status)}
                      <Badge variant="outline">${adjustment.amount.toFixed(2)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Customer:</span>
                        <p className="font-medium">{adjustment.subscription.user.email}</p>
                        {adjustment.subscription.user.name && (
                          <p className="text-sm text-gray-600">{adjustment.subscription.user.name}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Plan:</span>
                        <p className="font-medium">{adjustment.subscription.tier}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Effective Date:</span>
                        <p className="font-medium">{new Date(adjustment.effectiveDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <p className="font-medium">{adjustment.reason}</p>
                      <p className="text-sm text-gray-600 mt-1">{adjustment.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Created by {adjustment.createdBy} on {new Date(adjustment.createdAt).toLocaleDateString()}</span>
                      {adjustment.status === 'APPROVED' && adjustment.approvedBy && (
                        <span>Approved by {adjustment.approvedBy} on {new Date(adjustment.approvedAt!).toLocaleDateString()}</span>
                      )}
                      {adjustment.status === 'REJECTED' && adjustment.rejectedBy && (
                        <span>Rejected by {adjustment.rejectedBy} on {new Date(adjustment.rejectedAt!).toLocaleDateString()}</span>
                      )}
                    </div>

                    {adjustment.status === 'REJECTED' && adjustment.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-sm font-medium text-red-800">Rejection Reason:</span>
                        <p className="text-sm text-red-700 mt-1">{adjustment.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAdjustment(adjustment)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>

                    {adjustment.status === 'PENDING' && (
                      <PermissionGuard permission="billing.approve">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAdjustment(adjustment);
                              setShowApprovalDialog('approve');
                            }}
                            disabled={processingId === adjustment.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedAdjustment(adjustment);
                              setShowApprovalDialog('reject');
                            }}
                            disabled={processingId === adjustment.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </PermissionGuard>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={!!showApprovalDialog} onOpenChange={() => setShowApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showApprovalDialog === 'approve' ? 'Approve' : 'Reject'} Billing Adjustment
            </DialogTitle>
          </DialogHeader>
          
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium capitalize">{selectedAdjustment.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium">${selectedAdjustment.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">{selectedAdjustment.subscription.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Reason:</span>
                    <p className="font-medium">{selectedAdjustment.reason}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="approvalNote">
                  {showApprovalDialog === 'approve' ? 'Approval Note (optional)' : 'Rejection Reason (required)'}
                </Label>
                <Textarea
                  id="approvalNote"
                  value={approvalNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApprovalNote(e.target.value)}
                  placeholder={
                    showApprovalDialog === 'approve' 
                      ? 'Add any notes about this approval...'
                      : 'Please provide a reason for rejecting this adjustment...'
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowApprovalDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={showApprovalDialog === 'approve' ? handleApprove : handleReject}
                  disabled={processingId === selectedAdjustment.id}
                  variant={showApprovalDialog === 'approve' ? 'default' : 'destructive'}
                >
                  {processingId === selectedAdjustment.id ? 'Processing...' : 
                   showApprovalDialog === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}