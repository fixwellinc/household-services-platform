/**
 * Component Patterns Index
 * 
 * Exports all component composition patterns and utilities
 */

// Higher-Order Components
export {
  withStandardizedProps,
  withLoadingState,
  withErrorBoundary,
  withAccessibility,
  withResponsive,
  withPerformanceOptimization,
  compose,
  createStandardComponent,
} from './withStandardizedProps';

// Composition Patterns
export {
  CompoundProvider,
  useCompoundContext,
  createCompoundComponent,
  DataFetcher,
  createPolymorphicComponent,
  Box,
  Text,
  Slot,
  SlotProvider,
  SlotFill,
  useSlot,
  composeComponents,
  createChildrenRenderer,
  Conditional,
  Switch,
  Case,
  Stack,
  Grid,
  composeProviders,
  MultiProvider,
} from './CompositionPatterns';

// Component Factory
export {
  createStandardComponent as createFactoryComponent,
  createButtonComponent,
  createInputComponent,
  createCardComponent,
  createTextComponent,
  createCompoundComponent,
  StandardButton,
  StandardInput,
  StandardCard,
  StandardText,
  StandardHeading,
  componentRegistry,
  defineComponent,
  getComponent,
  hasComponent,
  getAllComponents,
} from './ComponentFactory';

// Types
export type {
  ComponentFactoryOptions,
  StandardComponentProps,
} from './ComponentFactory';

export type {
  RenderPropComponent,
  DataFetcherProps,
  PolymorphicProps,
  SlotProps,
  ConditionalProps,
  SwitchProps,
  CaseProps,
  StackProps,
  GridProps,
  MultiProviderProps,
} from './CompositionPatterns';