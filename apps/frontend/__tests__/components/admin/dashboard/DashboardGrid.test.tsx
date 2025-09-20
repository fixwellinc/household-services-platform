import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import { DashboardGrid } from '@/components/admin/dashboard/DashboardGrid';
import { mockDashboardWidgets } from '../../../utils/mock-data';

// Mock react-grid-layout
jest.mock('react-grid-layout', () => {
  const MockGridLayout = ({ children, onLayoutChange }: any) => (
    <div data-testid="grid-layout" onClick={() => onLayoutChange && onLayoutChange([])}>
      {children}
    </div>
  );
  return {
    Responsive: MockGridLayout,
    WidthProvider: (Component: any) => Component
  };
});

const defaultProps = {
  widgets: mockDashboardWidgets,
  onLayoutChange: jest.fn(),
  onWidgetUpdate: jest.fn(),
  onWidgetRemove: jest.fn(),
  editable: true
};

describe('DashboardGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard widgets', () => {
    render(<DashboardGrid {...defaultProps} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
  });

  it('handles layout changes', async () => {
    const onLayoutChange = jest.fn();
    render(<DashboardGrid {...defaultProps} onLayoutChange={onLayoutChange} />);
    
    const grid = screen.getByTestId('grid-layout');
    fireEvent.click(grid);
    
    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalled();
    });
  });

  it('shows widget controls in edit mode', () => {
    render(<DashboardGrid {...defaultProps} editable={true} />);
    
    const widgetControls = screen.getAllByTestId('widget-controls');
    expect(widgetControls).toHaveLength(2);
  });

  it('hides widget controls in view mode', () => {
    render(<DashboardGrid {...defaultProps} editable={false} />);
    
    const widgetControls = screen.queryAllByTestId('widget-controls');
    expect(widgetControls).toHaveLength(0);
  });

  it('handles widget removal', async () => {
    const onWidgetRemove = jest.fn();
    render(<DashboardGrid {...defaultProps} onWidgetRemove={onWidgetRemove} />);
    
    const removeButton = screen.getAllByLabelText('Remove widget')[0];
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(onWidgetRemove).toHaveBeenCalledWith('widget-1');
    });
  });

  it('handles widget configuration', async () => {
    const onWidgetUpdate = jest.fn();
    render(<DashboardGrid {...defaultProps} onWidgetUpdate={onWidgetUpdate} />);
    
    const configButton = screen.getAllByLabelText('Configure widget')[0];
    fireEvent.click(configButton);
    
    expect(screen.getByText('Widget Configuration')).toBeInTheDocument();
  });

  it('supports drag and drop', () => {
    render(<DashboardGrid {...defaultProps} />);
    
    const widget = screen.getByText('Total Users').closest('[data-testid="dashboard-widget"]');
    expect(widget).toHaveAttribute('draggable', 'true');
  });

  it('renders empty state when no widgets', () => {
    render(<DashboardGrid {...defaultProps} widgets={[]} />);
    
    expect(screen.getByText('No widgets configured')).toBeInTheDocument();
    expect(screen.getByText('Add Widget')).toBeInTheDocument();
  });

  it('handles responsive breakpoints', () => {
    render(<DashboardGrid {...defaultProps} />);
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    fireEvent(window, new Event('resize'));
    
    expect(screen.getByTestId('grid-layout')).toBeInTheDocument();
  });

  it('shows loading state for widgets', () => {
    const loadingWidgets = mockDashboardWidgets.map(w => ({ ...w, loading: true }));
    
    render(<DashboardGrid {...defaultProps} widgets={loadingWidgets} />);
    
    const loadingIndicators = screen.getAllByTestId('widget-loading');
    expect(loadingIndicators).toHaveLength(2);
  });

  it('handles widget errors', () => {
    const errorWidgets = mockDashboardWidgets.map(w => ({ 
      ...w, 
      error: 'Failed to load data' 
    }));
    
    render(<DashboardGrid {...defaultProps} widgets={errorWidgets} />);
    
    const errorMessages = screen.getAllByText('Failed to load data');
    expect(errorMessages).toHaveLength(2);
  });

  it('supports widget refresh', async () => {
    const onWidgetRefresh = jest.fn();
    render(<DashboardGrid {...defaultProps} onWidgetRefresh={onWidgetRefresh} />);
    
    const refreshButton = screen.getAllByLabelText('Refresh widget')[0];
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(onWidgetRefresh).toHaveBeenCalledWith('widget-1');
    });
  });

  it('filters widgets by permissions', () => {
    const userPermissions = ['READ_USERS']; // Only users permission
    
    render(
      <DashboardGrid 
        {...defaultProps} 
        userPermissions={userPermissions}
      />
    );
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.queryByText('Revenue Trend')).not.toBeInTheDocument();
  });

  it('handles widget auto-refresh', async () => {
    const widgetsWithRefresh = mockDashboardWidgets.map(w => ({
      ...w,
      refreshInterval: 5000
    }));
    
    render(<DashboardGrid {...defaultProps} widgets={widgetsWithRefresh} />);
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('widget-refreshing')).toHaveLength(2);
    });
  });
});