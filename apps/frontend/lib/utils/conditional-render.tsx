'use client';

import { ReactNode } from 'react';

interface ConditionalProps {
  condition: unknown;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ConditionalRender({ condition, children, fallback = null }: ConditionalProps) {
  // Safe boolean conversion
  const isTrue = Boolean(condition);
  
  if (!isTrue) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function SafeConditional({ condition, children, fallback = null }: ConditionalProps) {
  try {
    const isTrue = Boolean(condition);
    return isTrue ? <>{children}</> : <>{fallback}</>;
  } catch (error) {
    console.warn('SafeConditional error:', error);
    return <>{fallback}</>;
  }
}

// Safe array rendering
export function SafeList<T>({ 
  items, 
  renderItem, 
  fallback = null,
  keyExtractor 
}: {
  items: T[] | null | undefined;
  renderItem: (item: T, index: number) => ReactNode;
  fallback?: ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <>{fallback}</>;
  }

  try {
    return (
      <>
        {items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return (
            <div key={key}>
              {renderItem(item, index)}
            </div>
          );
        })}
      </>
    );
  } catch (error) {
    console.warn('SafeList rendering error:', error);
    return <>{fallback}</>;
  }
}
