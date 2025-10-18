/**
 * Standardized Component Interface Registry
 * 
 * This file provides specific interfaces for different component categories
 * ensuring consistent API patterns across the application.
 */

import { ComponentType, ReactNode } from 'react';
import { 
  BaseComponentProps, 
  ComponentSize, 
  ComponentVariant, 
  ColorScheme,
  StandardEventHandlers,
  ValidationRule,
  ValidationResult
} from './base';

// =============================================================================
// UI COMPONENT INTERFACES
// =============================================================================

// Layout Components
export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: ComponentSize;
  centered?: boolean;
  fluid?: boolean;
}

export interface GridProps extends BaseComponentProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: ComponentSize;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export interface FlexProps extends BaseComponentProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: ComponentSize;
}

// Typography Components
export interface TextProps extends BaseComponentProps {
  as?: 'p' | 'span' | 'div' | 'label';
  size?: ComponentSize;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: ColorScheme | string;
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  lineClamp?: number;
}

export interface HeadingProps extends BaseComponentProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: ComponentSize;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: ColorScheme | string;
  align?: 'left' | 'center' | 'right';
}

// Form Components
export interface FormProps extends BaseComponentProps, StandardEventHandlers {
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  validationSchema?: Record<string, ValidationRule[]>;
  initialValues?: Record<string, any>;
  resetOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  helperText?: string;
  errorMessage?: string;
  size?: ComponentSize;
  validationRules?: ValidationRule[];
}

export interface SelectProps extends FormFieldProps {
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  value?: string | number | Array<string | number>;
  defaultValue?: string | number | Array<string | number>;
  onChange?: (value: string | number | Array<string | number>) => void;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  placeholder?: string;
  noOptionsMessage?: string;
  loadingMessage?: string;
}

export interface CheckboxProps extends FormFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

export interface RadioGroupProps extends FormFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface SwitchProps extends FormFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: ComponentSize;
}

// Feedback Components
export interface AlertProps extends BaseComponentProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
  icon?: ComponentType<any> | boolean;
  closable?: boolean;
  onClose?: () => void;
  actions?: ReactNode;
}

export interface ToastProps extends BaseComponentProps {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ProgressProps extends BaseComponentProps {
  value?: number;
  max?: number;
  size?: ComponentSize;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  animated?: boolean;
  striped?: boolean;
}

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

// Navigation Components
export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
  }>;
  separator?: ReactNode;
  maxItems?: number;
}

export interface TabsProps extends BaseComponentProps {
  items: Array<{
    key: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
    icon?: ComponentType<any>;
  }>;
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (key: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  siblingCount?: number;
  size?: ComponentSize;
  variant?: 'default' | 'outline';
}

// Data Display Components
export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ComponentType<any>;
  sortable?: boolean;
  selectable?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  size?: ComponentSize;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  rowKey?: keyof T | ((row: T) => string | number);
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  fixed?: 'left' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  sorter?: (a: T, b: T) => number;
  filters?: Array<{ text: string; value: any }>;
  onFilter?: (value: any, row: T) => boolean;
}

export interface ListProps<T = any> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ComponentType<any>;
  divided?: boolean;
  bordered?: boolean;
  size?: ComponentSize;
  virtual?: boolean;
  itemHeight?: number;
  onItemClick?: (item: T, index: number) => void;
}

// Overlay Components
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  scrollable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  overlay?: boolean;
}

export interface DrawerProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  size?: ComponentSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export interface PopoverProps extends BaseComponentProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  trigger?: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end';
  offset?: number;
  arrow?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  arrow?: boolean;
  disabled?: boolean;
}

// =============================================================================
// SPECIALIZED COMPONENT INTERFACES
// =============================================================================

// Chart Components
export interface ChartProps extends BaseComponentProps {
  data: any[];
  width?: number;
  height?: number;
  responsive?: boolean;
  theme?: 'light' | 'dark';
  colors?: string[];
  loading?: boolean;
  error?: Error | null;
  onDataPointClick?: (data: any) => void;
}

export interface LineChartProps extends ChartProps {
  xAxisKey: string;
  yAxisKey: string;
  lines: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export interface BarChartProps extends ChartProps {
  xAxisKey: string;
  yAxisKey: string;
  bars: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  orientation?: 'horizontal' | 'vertical';
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

// Media Components
export interface ImageProps extends Omit<BaseComponentProps, 'loading'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  fallback?: ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: ComponentSize;
  variant?: 'circular' | 'rounded' | 'square';
  fallback?: ReactNode;
  showBorder?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

// =============================================================================
// COMPONENT COMPOSITION INTERFACES
// =============================================================================

export interface CompoundComponentProps extends BaseComponentProps {
  components: Record<string, ComponentType<any>>;
  defaultComponent?: string;
  componentProps?: Record<string, any>;
}

export interface PolymorphicComponentProps<T extends keyof JSX.IntrinsicElements = 'div'> extends BaseComponentProps {
  as?: T | ComponentType<any>;
}

// =============================================================================
// EXPORT ALL INTERFACES
// =============================================================================

export type {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ColorScheme,
  StandardEventHandlers,
  ValidationRule,
  ValidationResult
} from './base';