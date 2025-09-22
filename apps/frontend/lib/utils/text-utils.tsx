'use client';

/**
 * Safe text rendering utilities to prevent React error #418
 */

import { ReactNode } from 'react';

export function safeText(text: unknown): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  if (typeof text === 'string') {
    return text;
  }
  
  if (typeof text === 'number') {
    return text.toString();
  }
  
  if (typeof text === 'boolean') {
    return text.toString();
  }
  
  return String(text);
}

export function SafeText({ children, fallback = '' }: { children: unknown; fallback?: string }) {
  try {
    const text = safeText(children);
    return <>{text}</>;
  } catch (error) {
    console.warn('SafeText rendering error:', error);
    return <>{fallback}</>;
  }
}

export function conditionalRender(condition: unknown, component: ReactNode): ReactNode {
  if (!condition) {
    return null;
  }
  return component;
}
