'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Pause,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import { BulkOperationConfirmDialog } from './BulkOperationConfirmDialog';
import { toast } from 'sonner';

interface BulkOperationsToolbarProps {
  selectedItems: string[];
  entityType: string;
  onSelectionChange?: (selectedItems: string[]) => void;
  onOperationComplete?: () => void;
}

interface SupportedOperation {
  type: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  supportedEntities: string[];
}

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'delete':
      return <Trash2 className="h-4 w-4" />;
    case 'update':
      return <Edit className="h-4 w-4" />;
    case 'activate':
      return <CheckCircle className="h-4 w-4" />;
    case 'deactivate':
      return <XCircle className="h-4 w-4" />;
    case 'suspend':
      return <Pause className="h-4 w-4" />;
    default:
      return <Edit className="h-4 w-4" />;
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export function BulkOperationsToolbar({
  selectedItems,
  entityType,
  onSelectionChange,
  onOperationComplete
}: BulkOperationsToolbarProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<SupportedOperation | null>(null);
  const [operationSummary, setOperationSummary] = useState<any>(null);

  const {
    supportedOperations,
    isLoadingSupportedOperations,
    executeBulkOperation,
    validateBulkOperation
  } = useBulkOperations();

  // Filter operations supported for this entity type
  const availableOperations = supportedOperations.filter(op =>
    op.supportedEntities.includes(entityType)
  );

  const handleOperationSelect = async (operation: SupportedOperation) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to perform bulk operations');
      return;
    }

    setSelectedOperation(operation);

    // Validate the operation first
    try {
      const validation = await validateBulkOperation.mutateAsync({
        type: operation.type,
        entityType,
        entityIds: selectedItems
      });

      if (!validation.valid) {
        toast.error(`Operation validation failed: ${validation.error}`);
        return;
      }

      setOperationSummary(validation.summary);

      // If confirmation is required, show dialog
      if (operation.requiresConfirmation) {
        setConfirmDialogOpen(true);
      } else {
        // Execute immediately for low-risk operations
        executeOperation(operation);
      }
    } catch (error) {
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const executeOperation = async (operation: SupportedOperation) => {
    try {
      await executeBulkOperation.mutateAsync({
        type: operation.type,
        entityType,
        entityIds: selectedItems,
        confirmed: true
      });

      // Clear selection after successful operation
      if (onSelectionChange) {
        onSelectionChange([]);
      }

      // Notify parent component
      if (onOperationComplete) {
        onOperationComplete();
      }

      setConfirmDialogOpen(false);
      setSelectedOperation(null);
      setOperationSummary(null);
    } catch (error) {
      // Error is already handled by the mutation
      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmOperation = () => {
    if (selectedOperation) {
      executeOperation(selectedOperation);
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmDialogOpen(false);
    setSelectedOperation(null);
    setOperationSummary(null);
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedItems.length} selected
          </Badge>
          <span className="text-sm text-gray-600">
            Bulk operations available:
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isLoadingSupportedOperations || availableOperations.length === 0}
            >
              {isLoadingSupportedOperations ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  Choose Action
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {availableOperations.length === 0 ? (
              <DropdownMenuItem disabled>
                No operations available for {entityType}
              </DropdownMenuItem>
            ) : (
              availableOperations.map((operation) => (
                <DropdownMenuItem
                  key={operation.type}
                  onClick={() => handleOperationSelect(operation)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {getOperationIcon(operation.type)}
                    <div>
                      <div className="font-medium">{operation.label}</div>
                      <div className="text-xs text-gray-500">
                        {operation.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {operation.requiresConfirmation && (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    <div className={`text-xs ${getRiskLevelColor(operation.riskLevel)}`}>
                      {operation.riskLevel}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange?.([])}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear Selection
        </Button>
      </div>

      <BulkOperationConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmOperation}
        summary={operationSummary}
        isLoading={executeBulkOperation.isPending}
      />
    </>
  );
}