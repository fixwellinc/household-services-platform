import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { BulkOperationsToolbar } from '@/components/admin/BulkOperationsToolbar';
import { mockBulkOperations } from '../../utils/mock-data';

const defaultProps = {
  selectedCount: 5,
  operations: mockBulkOperations,
  onOperation: jest.fn(),
  onClearSelection: jest.fn(),
  disabled: false
};

describe('BulkOperationsToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with selected count', () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    expect(screen.getByText('5 items selected')).toBeInTheDocument();
  });

  it('shows available operations', () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    expect(screen.getByText('Suspend Users')).toBeInTheDocument();
    expect(screen.getByText('Delete Users')).toBeInTheDocument();
  });

  it('handles operation selection', async () => {
    const onOperation = jest.fn();
    render(<BulkOperationsToolbar {...defaultProps} onOperation={onOperation} />);
    
    const suspendButton = screen.getByText('Suspend Users');
    fireEvent.click(suspendButton);
    
    await waitFor(() => {
      expect(onOperation).toHaveBeenCalledWith('bulk-suspend');
    });
  });

  it('handles clear selection', async () => {
    const onClearSelection = jest.fn();
    render(<BulkOperationsToolbar {...defaultProps} onClearSelection={onClearSelection} />);
    
    const clearButton = screen.getByText('Clear Selection');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(onClearSelection).toHaveBeenCalled();
    });
  });

  it('disables operations when disabled prop is true', () => {
    render(<BulkOperationsToolbar {...defaultProps} disabled={true} />);
    
    const suspendButton = screen.getByText('Suspend Users');
    expect(suspendButton).toBeDisabled();
  });

  it('shows warning for destructive operations', () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete Users');
    expect(deleteButton).toHaveClass('destructive');
  });

  it('respects max items limit', () => {
    const propsWithTooManyItems = {
      ...defaultProps,
      selectedCount: 150 // Exceeds max limit of 100 for suspend operation
    };
    
    render(<BulkOperationsToolbar {...propsWithTooManyItems} />);
    
    const suspendButton = screen.getByText('Suspend Users');
    expect(suspendButton).toBeDisabled();
    expect(screen.getByText('Maximum 100 items allowed')).toBeInTheDocument();
  });

  it('hides toolbar when no items selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedCount={0} />);
    
    expect(screen.queryByText('items selected')).not.toBeInTheDocument();
  });

  it('shows progress indicator during operation', () => {
    render(<BulkOperationsToolbar {...defaultProps} isProcessing={true} />);
    
    expect(screen.getByTestId('bulk-operation-progress')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('filters operations by permissions', () => {
    const userPermissions = ['SUSPEND_USERS']; // Only suspend permission
    
    render(
      <BulkOperationsToolbar 
        {...defaultProps} 
        userPermissions={userPermissions}
      />
    );
    
    expect(screen.getByText('Suspend Users')).toBeInTheDocument();
    expect(screen.queryByText('Delete Users')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog for dangerous operations', async () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete Users');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Bulk Operation')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    const toolbar = screen.getByRole('toolbar');
    fireEvent.keyDown(toolbar, { key: 'Tab' });
    
    expect(document.activeElement).toHaveTextContent('Suspend Users');
  });

  it('displays operation tooltips', async () => {
    render(<BulkOperationsToolbar {...defaultProps} />);
    
    const suspendButton = screen.getByText('Suspend Users');
    fireEvent.mouseEnter(suspendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Suspend selected users')).toBeInTheDocument();
    });
  });
});