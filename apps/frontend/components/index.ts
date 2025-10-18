/**
 * Component Library Main Export
 * Centralized exports for the entire component library
 */

// Core UI Components
export * from './ui/core';
export * from './ui/forms';
export * from './ui/data-display';
export * from './ui/feedback';
export * from './ui/navigation';
export * from './ui/overlays';

// Layout Components
export * from './ui/layout';

// Shared Components
export * from './shared/animations';
export * from './shared/charts';
export * from './shared/utilities';

// Feature Components
export * from './features';

// Page Components
export * from './pages';

// Higher-Order Components
export * from './hoc';

// Component Utilities
export * from './utils';

// Component Registry
export * from './registry/ComponentRegistry';

// Component Patterns and Composition
export * from './patterns';

// Standardized Types
export * from './types';

// Legacy exports for backward compatibility
export { default as HomePageClient } from './HomePageClient';
export { default as ModernizedHomePageClient } from './ModernizedHomePageClient';
export { default as PlansSection } from './PlansSection';
export { default as PricingSection } from './PricingSection';
export { default as TestimonialsSection } from './TestimonialsSection';
export { default as QuoteRequestModal } from './QuoteRequestModal';
export { default as Providers } from './Providers';