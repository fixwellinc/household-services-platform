/**
 * Component API Standards and Guidelines
 * 
 * This file defines the standardized patterns and conventions
 * that all components should follow for consistency.
 */

import React, { ComponentType } from 'react';
import { BaseComponentProps } from './base';

// =============================================================================
// NAMING CONVENTIONS
// =============================================================================

/**
 * Component naming standards:
 * - PascalCase for component names
 * - Descriptive and specific names
 * - Avoid abbreviations unless widely understood
 * - Use consistent suffixes (Button, Input, Modal, etc.)
 */

// =============================================================================
// PROP NAMING CONVENTIONS
// =============================================================================

/**
 * Prop naming standards:
 * - camelCase for prop names
 * - Boolean props should start with 'is', 'has', 'can', 'should'
 * - Event handlers should start with 'on'
 * - Render props should start with 'render' or end with 'Component'
 * - Size props should use standard size scale
 * - Variant props should use consistent naming
 */

export const STANDARD_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export const STANDARD_VARIANTS = ['default', 'primary', 'secondary', 'outline', 'ghost', 'destructive'] as const;
export const STANDARD_COLORS = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

// =============================================================================
// COMPONENT STRUCTURE STANDARDS
// =============================================================================

/**
 * Standard component structure:
 * 1. Imports (React, types, utilities)
 * 2. Interface definitions
 * 3. Component implementation
 * 4. Default props (if needed)
 * 5. Display name
 * 6. Exports
 */

export interface ComponentStructureStandards {
  // All components must have proper TypeScript interfaces
  hasInterface: boolean;
  // All components must use forwardRef when appropriate
  usesForwardRef: boolean;
  // All components must have display names
  hasDisplayName: boolean;
  // All components must handle className merging
  handlesClassNames: boolean;
  // All components must support testId
  supportsTestId: boolean;
}

// =============================================================================
// ACCESSIBILITY STANDARDS
// =============================================================================

export interface AccessibilityStandards {
  // Components must support ARIA attributes
  supportsAria: boolean;
  // Interactive components must support keyboard navigation
  supportsKeyboard: boolean;
  // Components must have proper focus management
  handlesFocus: boolean;
  // Components must support screen readers
  supportsScreenReaders: boolean;
  // Components must have proper color contrast
  hasProperContrast: boolean;
}

// =============================================================================
// PERFORMANCE STANDARDS
// =============================================================================

export interface PerformanceStandards {
  // Components should be memoized when appropriate
  isMemoized: boolean;
  // Components should use lazy loading when appropriate
  supportsLazyLoading: boolean;
  // Components should minimize re-renders
  minimizesReRenders: boolean;
  // Components should handle large datasets efficiently
  handlesLargeData: boolean;
}

// =============================================================================
// ERROR HANDLING STANDARDS
// =============================================================================

export interface ErrorHandlingStandards {
  // Components must handle errors gracefully
  handlesErrors: boolean;
  // Components must provide error boundaries when needed
  hasErrorBoundary: boolean;
  // Components must validate props
  validateProps: boolean;
  // Components must provide meaningful error messages
  hasErrorMessages: boolean;
}

// =============================================================================
// TESTING STANDARDS
// =============================================================================

export interface TestingStandards {
  // Components must have unit tests
  hasUnitTests: boolean;
  // Components must support test IDs
  supportsTestIds: boolean;
  // Components must be testable in isolation
  isTestableInIsolation: boolean;
  // Components must have accessibility tests
  hasA11yTests: boolean;
}

// =============================================================================
// DOCUMENTATION STANDARDS
// =============================================================================

export interface DocumentationStandards {
  // Components must have JSDoc comments
  hasJSDoc: boolean;
  // Components must have usage examples
  hasExamples: boolean;
  // Components must document all props
  documentsProps: boolean;
  // Components must have Storybook stories
  hasStories: boolean;
}

// =============================================================================
// COMPONENT VALIDATION UTILITIES
// =============================================================================

/**
 * Validates if a component follows the established standards
 */
export function validateComponentStandards(
  component: ComponentType<any>,
  standards: Partial<ComponentStructureStandards>
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check display name
  if (standards.hasDisplayName && !component.displayName) {
    violations.push('Component must have a displayName');
  }

  // Add more validation logic as needed

  return {
    isValid: violations.length === 0,
    violations
  };
}

// =============================================================================
// PROP VALIDATION UTILITIES
// =============================================================================

/**
 * Standard prop validators
 */
export const PropValidators = {
  size: (value: string) => STANDARD_SIZES.includes(value as any),
  variant: (value: string) => STANDARD_VARIANTS.includes(value as any),
  color: (value: string) => STANDARD_COLORS.includes(value as any),
};

// =============================================================================
// COMPONENT FACTORY UTILITIES
// =============================================================================

/**
 * Creates a standardized component with common patterns
 */
export function createStandardComponent<P extends BaseComponentProps>(
  name: string,
  implementation: ComponentType<P>,
  options?: {
    forwardRef?: boolean;
    memo?: boolean;
    defaultProps?: Partial<P>;
  }
): ComponentType<P> {
  let component = implementation;

  // Apply memo if requested
  if (options?.memo) {
    component = React.memo(component as React.ComponentType<P>) as any;
  }

  // Set display name
  component.displayName = name;

  // Set default props if provided
  if (options?.defaultProps) {
    (component as any).defaultProps = options.defaultProps;
  }

  return component;
}

// =============================================================================
// STYLE STANDARDS
// =============================================================================

export interface StyleStandards {
  // Components should use CSS-in-JS or CSS modules
  usesScopedStyles: boolean;
  // Components should support theme customization
  supportsTheming: boolean;
  // Components should be responsive by default
  isResponsive: boolean;
  // Components should follow design system tokens
  usesDesignTokens: boolean;
}

// =============================================================================
// EXPORT STANDARDS CHECKLIST
// =============================================================================

export interface ComponentStandardsChecklist 
  extends ComponentStructureStandards,
          AccessibilityStandards,
          PerformanceStandards,
          ErrorHandlingStandards,
          TestingStandards,
          DocumentationStandards,
          StyleStandards {}

/**
 * Complete standards checklist for component validation
 */
export const COMPONENT_STANDARDS_CHECKLIST: ComponentStandardsChecklist = {
  // Structure
  hasInterface: true,
  usesForwardRef: true,
  hasDisplayName: true,
  handlesClassNames: true,
  supportsTestId: true,
  
  // Accessibility
  supportsAria: true,
  supportsKeyboard: true,
  handlesFocus: true,
  supportsScreenReaders: true,
  hasProperContrast: true,
  
  // Performance
  isMemoized: false, // Only when needed
  supportsLazyLoading: false, // Only when appropriate
  minimizesReRenders: true,
  handlesLargeData: false, // Only for data components
  
  // Error Handling
  handlesErrors: true,
  hasErrorBoundary: false, // Only when needed
  validateProps: true,
  hasErrorMessages: true,
  
  // Testing
  hasUnitTests: true,
  supportsTestIds: true,
  isTestableInIsolation: true,
  hasA11yTests: true,
  
  // Documentation
  hasJSDoc: true,
  hasExamples: true,
  documentsProps: true,
  hasStories: false, // Optional
  
  // Styles
  usesScopedStyles: true,
  supportsTheming: true,
  isResponsive: true,
  usesDesignTokens: true,
};