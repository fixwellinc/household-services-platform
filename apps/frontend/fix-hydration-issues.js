#!/usr/bin/env node

/**
 * Fix Hydration and Text Rendering Issues
 * Addresses React errors #418 (text rendering) and #306 (hydration mismatches)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing hydration and text rendering issues...');

// 1. Create a safe text component to prevent React error #418
const safeTextComponentContent = `'use client';

import { ReactNode, useMemo } from 'react';

interface SafeTextProps {
  children: unknown;
  fallback?: string;
  className?: string;
}

export function SafeText({ children, fallback = '', className }: SafeTextProps) {
  const safeContent = useMemo(() => {
    if (children === null || children === undefined) {
      return fallback;
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    if (typeof children === 'number') {
      return children.toString();
    }
    
    if (typeof children === 'boolean') {
      return children.toString();
    }
    
    if (Array.isArray(children)) {
      return children.join(' ');
    }
    
    try {
      return String(children);
    } catch (error) {
      console.warn('SafeText: Failed to convert to string:', error);
      return fallback;
    }
  }, [children, fallback]);

  return <span className={className}>{safeContent}</span>;
}

export function SafeDiv({ children, fallback = '', className, ...props }: SafeTextProps & React.HTMLAttributes<HTMLDivElement>) {
  const safeContent = useMemo(() => {
    if (children === null || children === undefined) {
      return fallback;
    }
    
    if (typeof children === 'string') {
      return children;
    }
    
    try {
      return String(children);
    } catch (error) {
      console.warn('SafeDiv: Failed to convert to string:', error);
      return fallback;
    }
  }, [children, fallback]);

  return <div className={className} {...props}>{safeContent}</div>;
}

// Utility function for safe text conversion
export function toSafeText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  try {
    return String(value);
  } catch (error) {
    console.warn('toSafeText: Failed to convert to string:', error);
    return fallback;
  }
}
`;

// 2. Create hydration-safe wrapper
const hydrationSafeWrapperContent = `'use client';

import { useEffect, useState, ReactNode } from 'react';

interface HydrationSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export default function HydrationSafe({ children, fallback = null, className }: HydrationSafeProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Hook for checking if component has mounted (client-side)
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

// Component for client-side only rendering
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const hasMounted = useHasMounted();
  
  if (!hasMounted) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
`;

// 3. Create conditional rendering utilities
const conditionalRenderContent = `'use client';

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
`;

// Create directories
const componentsDir = path.join(process.cwd(), 'components', 'common');
const utilsDir = path.join(process.cwd(), 'lib', 'utils');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Write the files
fs.writeFileSync(path.join(componentsDir, 'SafeText.tsx'), safeTextComponentContent);
fs.writeFileSync(path.join(componentsDir, 'HydrationSafe.tsx'), hydrationSafeWrapperContent);
fs.writeFileSync(path.join(utilsDir, 'conditional-render.tsx'), conditionalRenderContent);

console.log('✅ Created hydration-safe components');

// 4. Update package.json scripts for better error handling
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add development-friendly scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'dev:safe': 'NODE_ENV=development next dev --turbo=false',
    'dev:debug': 'NODE_ENV=development DEBUG=* next dev',
    'build:debug': 'NODE_ENV=production next build --debug',
    'start:safe': 'NODE_ENV=production next start',
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with safe development scripts');
}

// 5. Create a comprehensive error handling guide
const errorHandlingGuideContent = `# React Error Handling Guide

## Common React Errors and Solutions

### React Error #418 (Text Rendering)
This error occurs when React tries to render invalid text content.

**Solution:**
\`\`\`tsx
import { SafeText } from '@/components/common/SafeText';

// Instead of:
<div>{someVariable}</div>

// Use:
<SafeText>{someVariable}</SafeText>
\`\`\`

### React Error #306 (Hydration Mismatch)
This error occurs when server-side and client-side rendering don't match.

**Solution:**
\`\`\`tsx
import HydrationSafe from '@/components/common/HydrationSafe';

// Wrap client-side only content:
<HydrationSafe fallback={<div>Loading...</div>}>
  <ClientOnlyComponent />
</HydrationSafe>
\`\`\`

### Best Practices

1. **Always validate props before rendering:**
\`\`\`tsx
function MyComponent({ data }: { data?: string }) {
  if (!data) return null;
  return <div>{data}</div>;
}
\`\`\`

2. **Use error boundaries:**
\`\`\`tsx
import ErrorBoundary from '@/components/common/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
\`\`\`

3. **Handle async data safely:**
\`\`\`tsx
function DataComponent({ data }: { data?: any[] }) {
  if (!Array.isArray(data)) {
    return <div>No data available</div>;
  }
  
  return (
    <div>
      {data.map((item, index) => (
        <SafeText key={index}>{item.name}</SafeText>
      ))}
    </div>
  );
}
\`\`\`

4. **Use conditional rendering safely:**
\`\`\`tsx
import { ConditionalRender } from '@/lib/utils/conditional-render';

<ConditionalRender 
  condition={user?.isLoggedIn} 
  fallback={<LoginButton />}
>
  <UserDashboard />
</ConditionalRender>
\`\`\`

## Development Commands

- \`npm run dev:safe\` - Start development server with safer settings
- \`npm run dev:debug\` - Start with debug logging
- \`npm run build:debug\` - Build with debug information
- \`npm run start:safe\` - Start production server safely

## Debugging Tips

1. Check browser console for detailed error messages
2. Use React Developer Tools
3. Enable source maps in development
4. Use error boundaries to catch and log errors
5. Test with both development and production builds
`;

fs.writeFileSync(path.join(process.cwd(), 'ERROR_HANDLING_GUIDE.md'), errorHandlingGuideContent);

console.log('✅ Created error handling guide');

console.log('\n🎉 Hydration and Text Rendering Fix Complete!');
console.log('\n📋 What was created:');
console.log('• SafeText component for preventing text rendering errors');
console.log('• HydrationSafe wrapper for client-side only content');
console.log('• Conditional rendering utilities');
console.log('• Safe development scripts');
console.log('• Comprehensive error handling guide');
console.log('\n🚀 Usage examples:');
console.log('• Use <SafeText>{variable}</SafeText> for dynamic text');
console.log('• Wrap client components with <HydrationSafe>');
console.log('• Run npm run dev:safe for safer development');
console.log('• Check ERROR_HANDLING_GUIDE.md for more details');