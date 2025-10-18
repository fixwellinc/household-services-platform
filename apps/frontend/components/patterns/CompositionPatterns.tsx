'use client';

import React, { ComponentType, ReactNode, createContext, useContext } from 'react';
import { BaseComponentProps, ComposableComponentProps } from '@/components/types';
import { cn } from '@/lib/utils';

// =============================================================================
// COMPOUND COMPONENT PATTERN
// =============================================================================

/**
 * Context for compound components to share state
 */
interface CompoundComponentContext {
  [key: string]: any;
}

const CompoundContext = createContext<CompoundComponentContext>({});

/**
 * Provider for compound component pattern
 */
export function CompoundProvider({ 
  value, 
  children 
}: { 
  value: CompoundComponentContext; 
  children: ReactNode;
}) {
  return (
    <CompoundContext.Provider value={value}>
      {children}
    </CompoundContext.Provider>
  );
}

/**
 * Hook to access compound component context
 */
export function useCompoundContext() {
  const context = useContext(CompoundContext);
  if (!context) {
    throw new Error('useCompoundContext must be used within a CompoundProvider');
  }
  return context;
}

/**
 * Higher-order component to create compound components
 */
export function createCompoundComponent<T extends Record<string, ComponentType<any>>>(
  components: T,
  RootComponent: ComponentType<any>
) {
  const CompoundComponent = Object.assign(RootComponent, components);
  return CompoundComponent as typeof RootComponent & T;
}

// =============================================================================
// RENDER PROP PATTERN
// =============================================================================

/**
 * Generic render prop component
 */
export interface RenderPropComponent<T> extends Omit<BaseComponentProps, 'children'> {
  children: (props: T) => ReactNode;
  render?: (props: T) => ReactNode;
}

/**
 * Data fetcher with render prop pattern
 */
export interface DataFetcherProps<T> extends RenderPropComponent<{
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}> {
  url: string;
  dependencies?: any[];
}

export function DataFetcher<T>({ 
  url, 
  dependencies = [], 
  children, 
  render 
}: DataFetcherProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const renderProps = { data, loading, error, refetch: fetchData };
  return <>{(render || children)(renderProps)}</>;
}

// =============================================================================
// POLYMORPHIC COMPONENT PATTERN
// =============================================================================

/**
 * Polymorphic component that can render as different elements
 */
export interface PolymorphicProps<T extends keyof JSX.IntrinsicElements = 'div'> 
  extends BaseComponentProps {
  as?: T | ComponentType<any>;
}

export function createPolymorphicComponent<
  DefaultElement extends keyof JSX.IntrinsicElements = 'div'
>(
  defaultElement: DefaultElement,
  displayName?: string
) {
  const PolymorphicComponent = React.forwardRef<
    HTMLElement,
    PolymorphicProps<any>
  >(({ as: Element = defaultElement, className, children, ...props }, ref) => {
    return React.createElement(
      Element as any,
      {
        ref,
        className,
        ...props,
      },
      children
    );
  });

  PolymorphicComponent.displayName = displayName || 'PolymorphicComponent';
  return PolymorphicComponent as any;
}

/**
 * Box component - polymorphic container
 */
export const Box = createPolymorphicComponent('div', 'Box');

/**
 * Text component - polymorphic text element
 */
export const Text = createPolymorphicComponent('span', 'Text');

// =============================================================================
// SLOT PATTERN
// =============================================================================

/**
 * Slot component for flexible content placement
 */
export interface SlotProps extends BaseComponentProps {
  name?: string;
  fallback?: ReactNode;
}

export const Slot: React.FC<SlotProps> = ({ 
  name, 
  fallback, 
  children, 
  className 
}) => {
  return (
    <div className={className} data-slot={name}>
      {children || fallback}
    </div>
  );
};

/**
 * SlotProvider for managing multiple slots
 */
interface SlotProviderProps extends BaseComponentProps {
  slots: Record<string, ReactNode>;
}

const SlotContext = createContext<Record<string, ReactNode>>({});

export const SlotProvider: React.FC<SlotProviderProps> = ({ 
  slots, 
  children 
}) => {
  return (
    <SlotContext.Provider value={slots}>
      {children}
    </SlotContext.Provider>
  );
};

/**
 * Hook to access slot content
 */
export function useSlot(name: string): ReactNode {
  const slots = useContext(SlotContext);
  return slots[name];
}

/**
 * SlotFill component for content injection
 */
export const SlotFill: React.FC<{ name: string }> = ({ name }) => {
  const content = useSlot(name);
  return <>{content}</>;
};

// =============================================================================
// COMPOSITION UTILITIES
// =============================================================================

/**
 * Compose multiple components together
 */
export function composeComponents(...components: ComponentType<any>[]): ComponentType<any> {
  if (components.length === 0) {
    return ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, {}, children);
  }
  
  return components.reduce(
    (AccumulatedComponents: ComponentType<any>, CurrentComponent: ComponentType<any>) => {
      const ComposedComponent: ComponentType<any> = (props: any) => {
        return React.createElement(
          AccumulatedComponents,
          {},
          React.createElement(CurrentComponent, props)
        );
      };
      return ComposedComponent;
    }
  );
}

/**
 * Create a component that renders children with additional props
 */
export function createChildrenRenderer<P extends object>(
  additionalProps: P
) {
  return function ChildrenRenderer({ 
    children 
  }: { 
    children: (props: P) => ReactNode;
  }) {
    return <>{children(additionalProps)}</>;
  };
}

/**
 * Conditional rendering component
 */
export interface ConditionalProps extends BaseComponentProps {
  condition: boolean;
  fallback?: ReactNode;
}

export const Conditional: React.FC<ConditionalProps> = ({ 
  condition, 
  children, 
  fallback 
}) => {
  return <>{condition ? children : fallback}</>;
};

/**
 * Switch/Case rendering component
 */
export interface SwitchProps extends BaseComponentProps {
  value: string | number;
  fallback?: ReactNode;
}

export interface CaseProps extends BaseComponentProps {
  value: string | number;
}

export const Switch: React.FC<SwitchProps> = ({ 
  value, 
  children, 
  fallback 
}) => {
  const cases = React.Children.toArray(children) as React.ReactElement<CaseProps>[];
  const matchingCase = cases.find(child => child.props.value === value);
  
  return <>{matchingCase || fallback}</>;
};

export const Case: React.FC<CaseProps> = ({ children }) => {
  return <>{children}</>;
};

// =============================================================================
// LAYOUT COMPOSITION PATTERNS
// =============================================================================

/**
 * Stack component for vertical/horizontal layouts
 */
export interface StackProps extends BaseComponentProps {
  direction?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  children,
}) => {
  const spacingClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Grid component for grid layouts
 */
export interface GridProps extends BaseComponentProps {
  columns?: number | 'auto' | 'fit';
  rows?: number | 'auto';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
}

export const Grid: React.FC<GridProps> = ({
  columns = 'auto',
  rows = 'auto',
  gap = 'md',
  minItemWidth = '200px',
  className,
  children,
}) => {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const getGridColumns = () => {
    if (columns === 'auto') return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
    if (columns === 'fit') return `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`;
    return `repeat(${columns}, 1fr)`;
  };

  const getGridRows = () => {
    if (rows === 'auto') return 'auto';
    return `repeat(${rows}, 1fr)`;
  };

  return (
    <div
      className={cn('grid', gapClasses[gap], className)}
      style={{
        gridTemplateColumns: getGridColumns(),
        gridTemplateRows: getGridRows(),
      }}
    >
      {children}
    </div>
  );
};

// =============================================================================
// PROVIDER COMPOSITION PATTERN
// =============================================================================

/**
 * Compose multiple providers together
 */
export function composeProviders(
  ...providers: Array<ComponentType<{ children: ReactNode }>>
) {
  return providers.reduce(
    (AccumulatedProviders, CurrentProvider) => {
      return function ComposedProviders({ children }: { children: ReactNode }) {
        return (
          <AccumulatedProviders>
            <CurrentProvider>{children}</CurrentProvider>
          </AccumulatedProviders>
        );
      };
    },
    ({ children }: { children: ReactNode }) => <>{children}</>
  );
}

/**
 * Multi-provider component
 */
export interface MultiProviderProps {
  providers: Array<{
    component: ComponentType<any>;
    props?: any;
  }>;
  children: ReactNode;
}

export const MultiProvider: React.FC<MultiProviderProps> = ({ 
  providers, 
  children 
}) => {
  return providers.reduceRight(
    (acc, { component: Provider, props = {} }) => (
      <Provider {...props}>{acc}</Provider>
    ),
    children as React.ReactElement
  );
};