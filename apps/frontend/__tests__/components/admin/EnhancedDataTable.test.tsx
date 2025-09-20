import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { EnhancedDataTable } from '@/components/admin/EnhancedDataTable';
import { mockUsers, mockFilterConfigs } from '../../utils/mock-data';

// Mock the virtualization library
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize }: any) => (
    <div data-testid="virtual-list" style={{ height: itemCount * itemSize }}>
      {Array.from({ length: itemCount }, (_, index) => children({ index, style: {} }))}
    </div>
  )
}));

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'status', label: 'Status', sortable: true }
];

const defaultProps = {
  data: mockUsers,
  columns: mockColumns,
  loading: false,
  onSort: jest.fn(),
  onFilter: jest.fn(),
  onSelect: jest.fn(),
  onBulkAction: jest.fn()
};

describe('EnhancedDataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with data', () => {
    render(<EnhancedDataTable {...defaultProps} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Test User 1')).toBeInTheDocument();
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<EnhancedDataTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('handles column sorting', async () => {
    const onSort = jest.fn();
    render(<EnhancedDataTable {...defaultProps} onSort={onSort} />);
    
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    
    await waitFor(() => {
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });
  });

  it('handles row selection', async () => {
    const onSelect = jest.fn();
    render(<EnhancedDataTable {...defaultProps} onSelect={onSelect} selectable />);
    
    const checkbox = screen.getAllByRole('checkbox')[1]; // First row checkbox
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(['user-1']);
    });
  });

  it('handles select all functionality', async () => {
    const onSelect = jest.fn();
    render(<EnhancedDataTable {...defaultProps} onSelect={onSelect} selectable />);
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]; // Header checkbox
    fireEvent.click(selectAllCheckbox);
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(['user-1', 'user-2']);
    });
  });

  it('displays empty state when no data', () => {
    render(<EnhancedDataTable {...defaultProps} data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const pagination = {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10
    };
    
    render(<EnhancedDataTable {...defaultProps} pagination={pagination} />);
    
    expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-10 of 100 items')).toBeInTheDocument();
  });

  it('renders with virtual scrolling for large datasets', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@test.com`,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    }));
    
    render(<EnhancedDataTable {...defaultProps} data={largeDataset} virtualized />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('handles bulk actions', async () => {
    const onBulkAction = jest.fn();
    const bulkActions = [
      { id: 'suspend', label: 'Suspend Users', icon: 'UserX' }
    ];
    
    render(
      <EnhancedDataTable 
        {...defaultProps} 
        onBulkAction={onBulkAction}
        bulkActions={bulkActions}
        selectable
        selectedRows={['user-1']}
      />
    );
    
    const bulkActionButton = screen.getByText('Suspend Users');
    fireEvent.click(bulkActionButton);
    
    await waitFor(() => {
      expect(onBulkAction).toHaveBeenCalledWith('suspend', ['user-1']);
    });
  });

  it('applies filters correctly', async () => {
    const onFilter = jest.fn();
    render(
      <EnhancedDataTable 
        {...defaultProps} 
        onFilter={onFilter}
        filterConfigs={mockFilterConfigs}
        showFilters
      />
    );
    
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } });
    
    await waitFor(() => {
      expect(onFilter).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
  });

  it('handles search functionality', async () => {
    const onSearch = jest.fn();
    render(<EnhancedDataTable {...defaultProps} onSearch={onSearch} searchable />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('john');
    }, { timeout: 1000 }); // Account for debounce
  });

  it('displays row actions', () => {
    const rowActions = [
      { id: 'edit', label: 'Edit', icon: 'Edit' },
      { id: 'delete', label: 'Delete', icon: 'Trash2' }
    ];
    
    render(<EnhancedDataTable {...defaultProps} rowActions={rowActions} />);
    
    const actionButton = screen.getAllByLabelText('Row actions')[0];
    fireEvent.click(actionButton);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<EnhancedDataTable {...defaultProps} />);
    
    const table = screen.getByRole('table');
    fireEvent.keyDown(table, { key: 'ArrowDown' });
    
    // Should focus first row
    expect(document.activeElement).toHaveAttribute('data-row-index', '0');
  });

  it('supports custom cell renderers', () => {
    const customColumns = [
      {
        key: 'status',
        label: 'Status',
        render: (value: string) => (
          <span className={`status-${value.toLowerCase()}`}>{value}</span>
        )
      }
    ];
    
    render(<EnhancedDataTable {...defaultProps} columns={customColumns} />);
    
    expect(screen.getByText('ACTIVE')).toHaveClass('status-active');
  });
});