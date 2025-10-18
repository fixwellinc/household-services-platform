# Component Library

This document outlines the new organized component structure for the Fixwell Services frontend application.

## Directory Structure

```
components/
├── types/
│   └── base.ts                 # Base component interfaces and TypeScript definitions
├── ui/
│   ├── core/                   # Basic UI primitives (Button, Input, Card)
│   ├── layout/                 # Layout components (Header, Footer, Sidebar)
│   ├── forms/                  # Form-specific components
│   ├── data-display/           # Tables, Lists, Charts
│   ├── feedback/               # Toasts, Alerts, Loading states
│   ├── navigation/             # Navigation components
│   └── overlays/               # Modals, Dropdowns, Tooltips
├── features/
│   ├── auth/                   # Authentication-related components
│   ├── services/               # Service booking components
│   ├── dashboard/              # Dashboard-specific components
│   └── admin/                  # Admin panel components
├── shared/
│   ├── animations/             # Reusable animation components
│   ├── charts/                 # Chart components
│   └── utilities/              # Utility components
├── pages/                      # Page-level components
├── hoc/                        # Higher-order components
├── utils/                      # Component utilities and helpers
├── registry/                   # Component registry for dynamic loading
└── index.ts                    # Main barrel export
```

## Usage

### Importing Components

```typescript
// Import specific components
import { Button, Input, Card } from '@/components';

// Import from specific categories
import { LoginForm } from '@/components/features/auth';
import { StaggeredGrid } from '@/components/shared/animations';

// Import types
import type { ButtonProps, BaseComponentProps } from '@/components';
```

### Component Composition

```typescript
import { createComposableComponent, cn } from '@/components/utils';

// Create a composable component
const Box = createComposableComponent('div', 'Box');

// Usage
<Box as="section" className="p-4">
  Content
</Box>
```

### Higher-Order Components

```typescript
import { withLoading, withErrorBoundary } from '@/components/hoc';

// Enhance components with loading and error handling
const EnhancedComponent = withErrorBoundary(
  withLoading(MyComponent)
);
```

### Component Registry

```typescript
import { registerComponent, getComponent } from '@/components';

// Register a new component
registerComponent('CustomWidget', MyCustomWidget);

// Get a component dynamically
const DynamicComponent = getComponent('CustomWidget');
```

## Component Standards

### Base Props

All components should extend `BaseComponentProps`:

```typescript
interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
  loading?: boolean;
  error?: Error | null;
}
```

### Error Handling

Components should implement consistent error handling:

```typescript
import { ErrorBoundary } from '@/components/hoc';

<ErrorBoundary fallback={CustomErrorFallback}>
  <MyComponent />
</ErrorBoundary>
```

### Loading States

Components should support loading states:

```typescript
import { withLoading } from '@/components/hoc';

const LoadingAwareComponent = withLoading(MyComponent);

<LoadingAwareComponent isLoading={true} />
```

### Accessibility

Components should include accessibility props:

```typescript
interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}
```

## Migration Guide

### From Old Structure

```typescript
// Old import
import Button from '../ui/button';

// New import
import { Button } from '@/components';
```

### Backward Compatibility

Legacy components are still available:

```typescript
// These still work
import HomePageClient from '@/components/HomePageClient';
import ModernizedHomePageClient from '@/components/ModernizedHomePageClient';
```

## Performance Considerations

### Lazy Loading

Components are lazy-loaded by default in the registry:

```typescript
const LazyComponent = lazy(() => import('./MyComponent'));
```

### Bundle Splitting

Components are organized to support optimal bundle splitting:

- Core UI components in separate chunks
- Feature components grouped by domain
- Shared utilities in common chunks

### Tree Shaking

The barrel export structure supports tree shaking:

```typescript
// Only imports Button, not the entire library
import { Button } from '@/components';
```

## Development Guidelines

### Creating New Components

1. Place components in the appropriate category directory
2. Extend `BaseComponentProps` for consistency
3. Include TypeScript interfaces
4. Add to the appropriate index.ts file
5. Update the component registry if needed

### Component Naming

- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Prefix with category for clarity (e.g., `FormInput`, `DataTable`)

### Testing

- Components should be testable in isolation
- Use the `testId` prop for test selectors
- Include accessibility testing

### Documentation

- Document component props and usage
- Include examples in Storybook (when available)
- Update this README when adding new categories

## Future Enhancements

- Storybook integration for component documentation
- Automated component testing
- Performance monitoring integration
- Design system tokens integration
- Component usage analytics