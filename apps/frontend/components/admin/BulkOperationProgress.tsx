'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  Pause,
  RotateCcw
} from 'lucide-react';
import { useBulkOperations } from '@/hooks/use-bulk-operations';

interface BulkOperationStatus {
  id: string;
  type: string;
  entityType: string;
  status: 'running' | 'completed' | 'cancelled' | 'error';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
  };
  errors: Array<{ id: string; error: string }>;
  startTime: string;
  duration: number;
}

interface BulkOperationProgressProps {
  operations: BulkOperationStatus[];
  onDismiss?: (operationId: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <Play className="h-4 w-4 text-blue-600" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'cancelled':
      return <Pause className="h-4 w-4 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};

export function BulkOperationProgress({ 
  operations, 
  onDismiss 
}: BulkOperationProgressProps) {
  const { cancelBulkOperation } = useBulkOperations();

  if (operations.length === 0) {
    return null;
  }

  const handleCancel = async (operationId: string) => {
    try {
      await cancelBulkOperation.mutateAsync(operationId);
    } catch (error) {
      console.error('Failed to cancel operation:', error);
    }
  };

  return (
    <div className="space-y-4">
      {operations.map((operation) => (
        <Card key={operation.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(operation.status)}
                Bulk {operation.type} - {operation.entityType}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={getStatusColor(operation.status)}
                >
                  {operation.status.toUpperCase()}
                </Badge>
                {onDismiss && operation.status !== 'running' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(operation.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Progress: {operation.progress.processed} / {operation.progress.total}
                </span>
                <span>{operation.progress.percentage}%</span>
              </div>
              <Progress 
                value={operation.progress.percentage} 
                className="h-2"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Total</div>
                <div className="font-medium">{operation.progress.total}</div>
              </div>
              <div>
                <div className="text-gray-500">Processed</div>
                <div className="font-medium text-green-600">
                  {operation.progress.processed}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Failed</div>
                <div className="font-medium text-red-600">
                  {operation.progress.failed}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="font-medium">
                  {formatDuration(operation.duration)}
                </div>
              </div>
            </div>

            {/* Timing Information */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started: {formatTime(operation.startTime)}</span>
              <span>ID: {operation.id.slice(0, 8)}...</span>
            </div>

            {/* Errors */}
            {operation.errors.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">
                  Errors ({operation.errors.length}):
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {operation.errors.slice(0, 5).map((error, index) => (
                    <div 
                      key={index}
                      className="text-xs bg-red-50 border border-red-200 rounded p-2"
                    >
                      <div className="font-medium">ID: {error.id}</div>
                      <div className="text-red-700">{error.error}</div>
                    </div>
                  ))}
                  {operation.errors.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      ... and {operation.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {operation.status === 'running' && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(operation.id)}
                  disabled={cancelBulkOperation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  {cancelBulkOperation.isPending ? (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Cancel Operation
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}