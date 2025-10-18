/**
 * Base component interfaces and TypeScript definitions
 * Following the frontend optimization design architecture
 * 
 * This file provides standardized interfaces for all components
 * to ensure consistency across the application.
 */

import { ReactNode, ComponentType, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base component props interface - all components should extend this
export interface BaseComponentProps {
  /** Additional CSS classes to apply */
  className?: string;
  /** Child elements */
  children?: ReactNode;
  /** Test identifier for automated testing */
  testId?: string;
  /** Loading state indicator */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Unique identifier for the component */
  id?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Additional data attributes */
  [key: `data-${string}`]: any;
}

// Performance tracking interface
export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  timestamp: number;
}

// Bundle optimization interface
export interface BundleConfig {
  chunkName: string;
  maxSize: number;
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
}

// Component composition patterns - for polymorphic components
export interface ComposableComponentProps extends BaseComponentProps {
  /** Render as a different component or HTML element */
  as?: ComponentType<any> | keyof JSX.IntrinsicElements;
  /** Visual variant of the component */
  variant?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Standard size type used across components
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Standard variant types
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

// Standard color scheme
export type ColorScheme = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Error handling interfaces
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  componentStack?: string;
}

// Loading state interfaces
export interface LoadingStateProps extends BaseComponentProps {
  isLoading: boolean;
  skeleton?: ComponentType<any>;
  fallback?: ReactNode;
  delay?: number;
}

// Animation interfaces
export interface AnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  disabled?: boolean;
}

// Responsive interfaces
export interface ResponsiveProps {
  breakpoints?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
  };
  hideOn?: 'mobile' | 'tablet' | 'desktop';
  showOn?: 'mobile' | 'tablet' | 'desktop';
}

// Form interfaces
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  errorMessage?: string;
}

// Data display interfaces
export interface DataDisplayProps extends BaseComponentProps {
  data: any;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  loadingState?: ReactNode;
}

// Navigation interfaces
export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: ComponentType<any>;
  children?: NavigationItem[];
  disabled?: boolean;
}

// Layout interfaces
export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  padding?: string;
}

// Card interfaces
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  media?: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
}

// Button interfaces - standardized button component props
export interface ButtonProps extends BaseComponentProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Visual variant of the button */
  variant?: ComponentVariant;
  /** Size of the button */
  size?: ComponentSize;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Icon to display on the left side */
  leftIcon?: ComponentType<any>;
  /** Icon to display on the right side */
  rightIcon?: ComponentType<any>;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Whether to render as child component */
  asChild?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

// Input interfaces - standardized input component props
export interface InputProps extends Omit<FormFieldProps, 'name'>, Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Field name */
  name?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Change handler with string value */
  onChange?: (value: string) => void;
  /** Size variant */
  size?: ComponentSize;
  /** Left icon */
  leftIcon?: ComponentType<any>;
  /** Right icon */
  rightIcon?: ComponentType<any>;
  /** Whether input is clearable */
  clearable?: boolean;
}

// Modal interfaces
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Toast interfaces
export interface ToastProps extends BaseComponentProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Table interfaces
export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => ReactNode;
}

// Component factory types
export type ComponentFactoryFunction<P = {}> = (props: P & BaseComponentProps) => JSX.Element;

// Higher-order component types
export type WithLoadingHOC = <P extends object>(
  Component: ComponentType<P>
) => ComponentType<P & LoadingStateProps>;

export type WithErrorBoundaryHOC = <P extends object>(
  Component: ComponentType<P>
) => ComponentType<P & ErrorBoundaryProps>;

// Component registry types
export interface ComponentRegistry {
  [key: string]: ComponentType<any>;
}

// Theme interfaces
export interface ThemeProps {
  theme?: 'light' | 'dark' | 'auto';
  colorScheme?: string;
  customColors?: Record<string, string>;
}

// Accessibility interfaces
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Combined props for comprehensive components
export interface ComprehensiveComponentProps 
  extends BaseComponentProps, 
         ResponsiveProps, 
         AnimationProps, 
         ThemeProps, 
         AccessibilityProps {}

// Standardized event handlers
export interface StandardEventHandlers {
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
}

// Standardized state interfaces
export interface ComponentState {
  isLoading: boolean;
  isDisabled: boolean;
  isVisible: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Validation interfaces
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Component lifecycle interfaces
export interface ComponentLifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (prevProps: any) => void;
  onError?: (error: Error) => void;
}

// Data fetching interfaces
export interface DataFetchingProps<T = any> {
  data?: T;
  loading?: boolean;
  error?: Error | null;
  refetch?: () => void;
  onDataChange?: (data: T) => void;
}

// Pagination interfaces
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showSizeSelector?: boolean;
  showInfo?: boolean;
}

// Selection interfaces
export interface SelectionProps<T = any> {
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  isItemSelected?: (item: T) => boolean;
  getItemKey?: (item: T) => string | number;
}

// Sorting interfaces
export interface SortingProps {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  sortableFields?: string[];
}

// Filtering interfaces
export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'daterange';
  options?: Array<{ value: string; label: string }>;
}

export interface FilteringProps {
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  availableFilters?: FilterConfig[];
  clearFilters?: () => void;
}

// Search interfaces
export interface SearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  searchFields?: string[];
  debounceMs?: number;
}

// Component factory interfaces
export interface ComponentFactoryInterface<P extends BaseComponentProps = BaseComponentProps> {
  (props: P): JSX.Element;
  displayName?: string;
  defaultProps?: Partial<P>;
}

// HOC interfaces
export interface WithLoadingProps {
  isLoading: boolean;
  loadingComponent?: ComponentType<any>;
  loadingText?: string;
}

export interface WithErrorProps {
  error?: Error | null;
  errorComponent?: ComponentType<{ error: Error; retry?: () => void }>;
  onRetry?: () => void;
}

// Component registry for dynamic loading
export interface ComponentRegistryEntry {
  name: string;
  component: ComponentType<any>;
  props?: Record<string, any>;
  lazy?: boolean;
  preload?: boolean;
}

// Performance optimization interfaces
export interface PerformanceOptimizationProps {
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean;
  memoize?: boolean;
  virtualizeThreshold?: number;
  lazyLoad?: boolean;
}
// =============================================================================
// EXPORTS
// =============================================================================

// Re-export all interfaces and types for easy access
export * from './interfaces';
export * from './standards';