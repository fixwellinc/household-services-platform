/**
 * Component Types Index
 * 
 * Central export point for all component type definitions
 */

// Export all base types and interfaces
export * from './base';
export * from './interfaces';
export * from './standards';

// Re-export commonly used types for convenience
export type {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ColorScheme,
  StandardEventHandlers,
  ValidationRule,
  ValidationResult,
  ComponentState,
  ComponentLifecycle,
  DataFetchingProps,
  PerformanceOptimizationProps
} from './base';

export type {
  ButtonProps,
  InputProps,
  FormProps,
  FormFieldProps,
  SelectProps,
  CheckboxProps,
  RadioGroupProps,
  SwitchProps,
  AlertProps,
  ToastProps,
  ModalProps,
  TableProps,
  TableColumn,
  ListProps,
  ContainerProps,
  GridProps,
  FlexProps,
  TextProps,
  HeadingProps
} from './interfaces';

export {
  STANDARD_SIZES,
  STANDARD_VARIANTS,
  STANDARD_COLORS,
  PropValidators,
  createStandardComponent,
  validateComponentStandards,
  COMPONENT_STANDARDS_CHECKLIST
} from './standards';