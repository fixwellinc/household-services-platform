'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Database, Shield } from 'lucide-react';

interface BulkOperationSummary {
  type: string;
  entityType: string;
  itemCount: number;
  batchSize: number;
  estimatedBatches: number;
  estimatedDuration: number;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface BulkOperationConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: BulkOperationSummary | null;
  isLoading?: boolean;
}

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskLevelIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <Shield className="h-4 w-4" />;
    default:
      return <Database className="h-4 w-4" />;
  }
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export function BulkOperationConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  summary,
  isLoading = false
}: BulkOperationConfirmDialogProps) {
  if (!summary) return null;

  const isDestructive = ['delete', 'suspend'].includes(summary.type);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getRiskLevelIcon(summary.riskLevel)}
            Confirm Bulk Operation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to perform a bulk <strong>{summary.type}</strong> operation 
                on <strong>{summary.itemCount}</strong> {summary.entityType} records.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge 
                    variant="outline" 
                    className={getRiskLevelColor(summary.riskLevel)}
                  >
                    {summary.riskLevel.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Items to process:</span>
                  <span className="text-sm">{summary.itemCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Batch size:</span>
                  <span className="text-sm">{summary.batchSize}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated batches:</span>
                  <span className="text-sm">{summary.estimatedBatches}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Estimated duration:
                  </span>
                  <span className="text-sm">{formatDuration(summary.estimatedDuration)}</span>
                </div>
              </div>

              {isDestructive && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Warning: Destructive Operation</p>
                      <p className="mt-1">
                        This operation cannot be undone. Please ensure you have 
                        selected the correct items before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Operation Details:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Progress will be tracked in real-time</li>
                    <li>• You can cancel the operation at any time</li>
                    <li>• Detailed error reporting will be provided</li>
                    <li>• All actions will be logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Starting...' : `Confirm ${summary.type}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}