import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BulkOperationParams {
    type: string;
    entityType: string;
    entityIds: string[];
    data?: Record<string, any>;
    options?: Record<string, any>;
    confirmed?: boolean;
}

interface BulkOperationResult {
    operationId: string;
    success: boolean;
    processed: number;
    failed: number;
    total: number;
    errors: Array<{ id: string; error: string }>;
    duration: number;
    status: string;
}

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

interface SupportedOperation {
    type: string;
    label: string;
    description: string;
    requiresConfirmation: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    supportedEntities: string[];
}

export function useBulkOperations() {
    const [activeOperations, setActiveOperations] = useState<Map<string, BulkOperationStatus>>(new Map());
    const queryClient = useQueryClient();

    // Execute bulk operation
    const executeBulkOperation = useMutation({
        mutationFn: async (params: BulkOperationParams): Promise<{ operationId: string; result: BulkOperationResult }> => {
            const response = await fetch('/api/bulk-operations/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to execute bulk operation');
            }

            return response.json();
        },
        onSuccess: (data, variables) => {
            toast.success(`Bulk ${variables.type} operation started successfully`);

            // Start polling for status updates
            pollOperationStatus(data.operationId);
        },
        onError: (error: Error) => {
            toast.error(`Failed to start bulk operation: ${error.message}`);
        }
    });

    // Validate bulk operation
    const validateBulkOperation = useMutation({
        mutationFn: async (params: Omit<BulkOperationParams, 'confirmed'>) => {
            const response = await fetch('/api/bulk-operations/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to validate bulk operation');
            }

            return response.json();
        }
    });

    // Cancel bulk operation
    const cancelBulkOperation = useMutation({
        mutationFn: async (operationId: string) => {
            const response = await fetch(`/api/bulk-operations/${operationId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel bulk operation');
            }

            return response.json();
        },
        onSuccess: (_, operationId) => {
            toast.success('Bulk operation cancelled successfully');

            // Update local state
            setActiveOperations(prev => {
                const updated = new Map(prev);
                const operation = updated.get(operationId);
                if (operation) {
                    updated.set(operationId, { ...operation, status: 'cancelled' });
                }
                return updated;
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to cancel operation: ${error.message}`);
        }
    });

    // Get operation status
    const getOperationStatus = useCallback(async (operationId: string): Promise<BulkOperationStatus | null> => {
        try {
            const response = await fetch(`/api/bulk-operations/${operationId}/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Operation not found (completed and cleaned up)
                }
                throw new Error('Failed to get operation status');
            }

            const data = await response.json();
            return data.status;
        } catch (error) {
            console.error('Error getting operation status:', error);
            return null;
        }
    }, []);

    // Poll operation status
    const pollOperationStatus = useCallback((operationId: string) => {
        const poll = async () => {
            const status = await getOperationStatus(operationId);

            if (!status) {
                // Operation completed and cleaned up
                setActiveOperations(prev => {
                    const updated = new Map(prev);
                    updated.delete(operationId);
                    return updated;
                });
                return;
            }

            // Update local state
            setActiveOperations(prev => {
                const updated = new Map(prev);
                updated.set(operationId, status);
                return updated;
            });

            // Continue polling if operation is still running
            if (status.status === 'running') {
                setTimeout(poll, 1000); // Poll every second
            } else {
                // Operation completed, show final status
                if (status.status === 'completed') {
                    toast.success(`Bulk operation completed: ${status.progress.processed}/${status.progress.total} items processed`);
                } else if (status.status === 'error') {
                    toast.error('Bulk operation failed');
                }

                // Remove from active operations after delay
                setTimeout(() => {
                    setActiveOperations(prev => {
                        const updated = new Map(prev);
                        updated.delete(operationId);
                        return updated;
                    });
                }, 5000);
            }
        };

        poll();
    }, [getOperationStatus]);

    // Get supported operations
    const { data: supportedOperations, isLoading: isLoadingSupportedOperations } = useQuery({
        queryKey: ['bulk-operations', 'supported'],
        queryFn: async (): Promise<SupportedOperation[]> => {
            const response = await fetch('/api/bulk-operations/supported-operations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch supported operations');
            }

            const data = await response.json();
            return data.operations;
        }
    });

    // Get active operations - only poll when there are active operations
    const { data: remoteActiveOperations } = useQuery({
        queryKey: ['bulk-operations', 'active'],
        queryFn: async (): Promise<BulkOperationStatus[]> => {
            const response = await fetch('/api/bulk-operations/active', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active operations');
            }

            const data = await response.json();
            return data.operations;
        },
        refetchInterval: (data) => {
            // Only poll if there are active operations, and at a slower rate
            const hasActiveOps = data && data.length > 0;
            return hasActiveOps ? 5000 : false; // Poll every 5 seconds if active, otherwise don't poll
        },
        staleTime: 2000, // Consider data stale after 2 seconds
    });

    // Update local state when remote operations change
    useEffect(() => {
        if (remoteActiveOperations) {
            setActiveOperations(prev => {
                const updated = new Map(prev);
                remoteActiveOperations.forEach(op => {
                    updated.set(op.id, op);
                });
                return updated;
            });
        }
    }, [remoteActiveOperations]);

    // Get operation history - only fetch when explicitly requested
    const getOperationHistory = useQuery({
        queryKey: ['bulk-operations', 'history'],
        queryFn: async () => {
            const response = await fetch('/api/bulk-operations/history', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch operation history');
            }

            return response.json();
        },
        enabled: false, // Don't auto-fetch, only when manually requested
        staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    });

    return {
        // Mutations
        executeBulkOperation,
        validateBulkOperation,
        cancelBulkOperation,

        // Queries
        supportedOperations: supportedOperations || [],
        isLoadingSupportedOperations,
        operationHistory: getOperationHistory.data,
        isLoadingHistory: getOperationHistory.isLoading,

        // State
        activeOperations: Array.from(activeOperations.values()),

        // Utilities
        getOperationStatus,
        pollOperationStatus
    };
}