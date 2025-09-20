import { renderHook, waitFor, act } from '@testing-library/react';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API
const mockBulkApi = {
  suspendUsers: jest.fn(),
  deleteUsers: jest.fn(),
  updateSubscriptions: jest.fn(),
  getBulkOperationHistory: jest.fn()
};

jest.mock('@/lib/api', () => ({
  bulkApi: mockBulkApi
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useBulkOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.operationResult).toBeNull();
  });

  it('should handle item selection', () => {
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItem('item-1');
    });

    expect(result.current.selectedItems).toEqual(['item-1']);

    act(() => {
      result.current.selectItem('item-2');
    });

    expect(result.current.selectedItems).toEqual(['item-1', 'item-2']);
  });

  it('should handle item deselection', () => {
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['item-1', 'item-2', 'item-3']);
    });

    act(() => {
      result.current.deselectItem('item-2');
    });

    expect(result.current.selectedItems).toEqual(['item-1', 'item-3']);
  });

  it('should handle select all functionality', () => {
    const allItems = ['item-1', 'item-2', 'item-3'];
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectAll(allItems);
    });

    expect(result.current.selectedItems).toEqual(allItems);
  });

  it('should handle clear selection', () => {
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['item-1', 'item-2']);
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should execute bulk user suspension', async () => {
    const mockResult = {
      success: true,
      processed: 2,
      failed: 0,
      errors: []
    };

    mockBulkApi.suspendUsers.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1', 'user-2']);
    });

    await act(async () => {
      await result.current.suspendUsers('Policy violation');
    });

    expect(mockBulkApi.suspendUsers).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      'Policy violation'
    );

    await waitFor(() => {
      expect(result.current.operationResult).toEqual(mockResult);
      expect(result.current.isProcessing).toBe(false);
    });
  });

  it('should execute bulk user deletion with confirmation', async () => {
    const mockResult = {
      success: true,
      processed: 1,
      failed: 0,
      errors: []
    };

    mockBulkApi.deleteUsers.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1']);
    });

    await act(async () => {
      await result.current.deleteUsers('DELETE_USERS_CONFIRMED');
    });

    expect(mockBulkApi.deleteUsers).toHaveBeenCalledWith(
      ['user-1'],
      'DELETE_USERS_CONFIRMED'
    );

    await waitFor(() => {
      expect(result.current.operationResult).toEqual(mockResult);
    });
  });

  it('should handle bulk operation errors', async () => {
    const error = new Error('Bulk operation failed');
    mockBulkApi.suspendUsers.mockRejectedValue(error);

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1']);
    });

    await act(async () => {
      try {
        await result.current.suspendUsers('Test reason');
      } catch (e) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  it('should track operation progress', async () => {
    let progressCallback: ((progress: number) => void) | undefined;

    mockBulkApi.suspendUsers.mockImplementation((items, reason, options) => {
      progressCallback = options?.onProgress;
      return new Promise(resolve => {
        setTimeout(() => {
          progressCallback?.(50);
          setTimeout(() => {
            progressCallback?.(100);
            resolve({
              success: true,
              processed: items.length,
              failed: 0,
              errors: []
            });
          }, 100);
        }, 100);
      });
    });

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1', 'user-2']);
    });

    await act(async () => {
      await result.current.suspendUsers('Test reason');
    });

    // Progress should have been updated
    expect(result.current.progress).toBe(100);
  });

  it('should support operation cancellation', async () => {
    let cancelCallback: (() => void) | undefined;

    mockBulkApi.suspendUsers.mockImplementation((items, reason, options) => {
      cancelCallback = options?.onCancel;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve({
            success: true,
            processed: items.length,
            failed: 0,
            errors: []
          });
        }, 1000);

        if (cancelCallback) {
          cancelCallback = () => {
            clearTimeout(timeout);
            reject(new Error('Operation cancelled'));
          };
        }
      });
    });

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1', 'user-2']);
    });

    // Start operation
    const operationPromise = act(async () => {
      return result.current.suspendUsers('Test reason');
    });

    // Cancel operation
    act(() => {
      result.current.cancelOperation();
    });

    await expect(operationPromise).rejects.toThrow('Operation cancelled');
  });

  it('should validate operation limits', () => {
    const { result } = renderHook(() => useBulkOperations({ maxItems: 5 }), {
      wrapper: createWrapper()
    });

    const tooManyItems = Array.from({ length: 10 }, (_, i) => `item-${i}`);

    act(() => {
      result.current.selectItems(tooManyItems);
    });

    expect(result.current.canExecuteOperation('suspend')).toBe(false);
    expect(result.current.validationErrors).toContain(
      'Maximum 5 items allowed for bulk operations'
    );
  });

  it('should check user permissions', () => {
    const userPermissions = ['SUSPEND_USERS'];
    
    const { result } = renderHook(() => useBulkOperations({ userPermissions }), {
      wrapper: createWrapper()
    });

    expect(result.current.canExecuteOperation('suspend')).toBe(true);
    expect(result.current.canExecuteOperation('delete')).toBe(false);
  });

  it('should get operation history', async () => {
    const mockHistory = [
      {
        id: 'op-1',
        type: 'suspend_users',
        itemCount: 5,
        processed: 5,
        failed: 0,
        createdAt: new Date()
      }
    ];

    mockBulkApi.getBulkOperationHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.loadOperationHistory();
    });

    await waitFor(() => {
      expect(result.current.operationHistory).toEqual(mockHistory);
    });
  });

  it('should handle partial operation failures', async () => {
    const mockResult = {
      success: true,
      processed: 2,
      failed: 1,
      errors: [
        { id: 'user-3', error: 'User not found' }
      ]
    };

    mockBulkApi.suspendUsers.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1', 'user-2', 'user-3']);
    });

    await act(async () => {
      await result.current.suspendUsers('Test reason');
    });

    await waitFor(() => {
      expect(result.current.operationResult).toEqual(mockResult);
      expect(result.current.hasPartialFailures).toBe(true);
    });
  });

  it('should support custom operation callbacks', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() => useBulkOperations({ onSuccess, onError }), {
      wrapper: createWrapper()
    });

    const mockResult = {
      success: true,
      processed: 1,
      failed: 0,
      errors: []
    };

    mockBulkApi.suspendUsers.mockResolvedValue(mockResult);

    act(() => {
      result.current.selectItems(['user-1']);
    });

    await act(async () => {
      await result.current.suspendUsers('Test reason');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });
  });

  it('should reset operation state', () => {
    const { result } = renderHook(() => useBulkOperations(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.selectItems(['user-1', 'user-2']);
      // Simulate some operation state
      result.current.progress = 50;
      result.current.operationResult = { success: true, processed: 2, failed: 0, errors: [] };
    });

    act(() => {
      result.current.resetOperation();
    });

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.progress).toBe(0);
    expect(result.current.operationResult).toBeNull();
  });
});