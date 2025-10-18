# Frontend Optimization Migration Guide

## Overview

This guide helps developers migrate from the legacy component structure to the new optimized architecture. The migration preserves all existing functionality while improving maintainability, performance, and developer experience.

## Quick Reference

### Import Changes

| Legacy Import | New Import |
|---------------|------------|
| `import Button from '../ui/button'` | `import { Button } from '@/components'` |
| `import ServiceCard from '../features/ServiceCard'` | `import { ServiceCard } from '@/components/features/services'` |
| `import { useAuth } from '../hooks/useAuth'` | `import { useAuthState } from '@/hooks/shared'` |
| `import HomePageClient from './HomePageClient'` | `import { HeroSection, ServicesSection } from '@/components/pages/home'` |

### Component Changes

| Legacy Component | New Components |
|------------------|----------------|
| `ModernizedHomePageClient` (600+ lines) | `HeroSection`, `ServicesSection`, `FeaturesSection`, `CTASection` |
| Custom loading states | `StandardLoadingStates` component |
| Custom error handling | `StandardErrorBoundary` component |
| Inline form validation | `useFormValidation` hook |

## Step-by-Step Migration

### 1. Update Imports

#### Before
```typescript
// Legacy imports
import Button from '../ui/button';
import Card from '../ui/card';
import { LoginForm } from '../auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
```

#### After
```typescript
// New imports
import { Button, Card } from '@/components';
import { LoginForm } from '@/components/features/auth';
import { useAuthState, useApiRequest } from '@/hooks/shared';
```

### 2. Update Component Usage

#### Before - Large Monolithic Component
```typescript
function CustomerDashboard() {
  // 400+ lines of mixed concerns
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth logic
  useEffect(() => {
    // Authentication logic
  }, []);
  
  // API calls
  const fetchData = async () => {
    // API logic
  };
  
  // Form handling
  const handleSubmit = (data) => {
    // Form logic
  };
  
  return (
    <div>
      {/* All UI inline */}
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {/* Rest of component */}
    </div>
  );
}
```

#### After - Composed Components with Hooks
```typescript
function CustomerDashboard() {
  // Use shared hooks for common logic
  const { user, loading: authLoading } = useAuthState();
  const { data, loading, error } = useApiRequest('/api/dashboard');
  const { handleSubmit, loading: submitting } = useFormSubmission(submitData);
  
  return (
    <StandardErrorBoundary>
      <LoadingStateWrapper 
        isLoading={loading || authLoading} 
        error={error}
        skeleton={<DashboardSkeleton />}
      >
        <DashboardHeader user={user} />
        <DashboardContent data={data} />
        <DashboardActions onSubmit={handleSubmit} loading={submitting} />
      </LoadingStateWrapper>
    </StandardErrorBoundary>
  );
}
```

### 3. Extract Shared Logic to Hooks

#### Before - Inline Logic
```typescript
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchUser = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/users/${id}`);
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);
  
  // Component JSX
}
```

#### After - Using Shared Hook
```typescript
function UserProfile() {
  const { data: user, loading, error } = useApiRequest(`/api/users/${userId}`);
  
  return (
    <LoadingStateWrapper 
      isLoading={loading} 
      error={error}
      skeleton={<ProfileSkeleton />}
    >
      <ProfileContent user={user} />
    </LoadingStateWrapper>
  );
}
```

### 4. Standardize Error Handling

#### Before - Custom Error Handling
```typescript
function MyComponent() {
  const [error, setError] = useState(null);
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }
  
  // Component content
}
```

#### After - Standard Error Boundary
```typescript
function MyComponent() {
  return (
    <StandardErrorBoundary 
      fallback={<CustomErrorFallback />}
      onError={(error) => console.error('Component error:', error)}
    >
      <ComponentContent />
    </StandardErrorBoundary>
  );
}
```

### 5. Update Form Handling

#### Before - Manual Form State
```typescript
function ContactForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const validateField = (name, value) => {
    // Validation logic
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit logic
  };
  
  const handleChange = (e) => {
    // Change handling
  };
  
  // Form JSX
}
```

#### After - Using Form Hooks
```typescript
function ContactForm() {
  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
    loading
  } = useFormState({
    initialData: { name: '', email: '', message: '' },
    validation: contactFormValidation,
    onSubmit: submitContact
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        loading={loading}
      />
      <Button type="submit" loading={loading}>
        Submit
      </Button>
    </form>
  );
}
```

## Component-Specific Migrations

### Home Page Components

#### ModernizedHomePageClient Migration

**Before:**
```typescript
// Single large file (600+ lines)
function ModernizedHomePageClient() {
  // Hero section logic (150 lines)
  // Services section logic (200 lines)
  // Features section logic (150 lines)
  // CTA section logic (100 lines)
  
  return (
    <div>
      {/* All sections inline */}
    </div>
  );
}
```

**After:**
```typescript
// Main component (50-80 lines)
function ModernizedHomePageClient() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ServicesSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}

// Individual section files:
// components/pages/home/HeroSection.tsx (100-150 lines)
// components/pages/home/ServicesSection.tsx (100-150 lines)
// components/pages/home/FeaturesSection.tsx (100-150 lines)
// components/pages/home/CTASection.tsx (100-150 lines)
```

### Authentication Components

#### Login Form Migration

**Before:**
```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Login logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**After:**
```typescript
function LoginForm() {
  const { handleLogin, loading, error } = useAuthState();
  const {
    formData,
    errors,
    handleChange,
    handleSubmit
  } = useFormValidation({
    initialData: { email: '', password: '' },
    validation: loginValidation,
    onSubmit: handleLogin
  });
  
  return (
    <StandardErrorBoundary>
      <form onSubmit={handleSubmit}>
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Button type="submit" loading={loading}>
          Sign In
        </Button>
      </form>
    </StandardErrorBoundary>
  );
}
```

## Hook Migrations

### Authentication Hooks

**Before:**
```typescript
// Multiple custom hooks with similar logic
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // Auth logic
}

function useLogin() {
  const [loading, setLoading] = useState(false);
  // Login logic
}

function useLogout() {
  // Logout logic
}
```

**After:**
```typescript
// Single comprehensive hook
import { useAuthState, useUserManagement } from '@/hooks/shared';

function MyComponent() {
  const { user, loading, login, logout } = useAuthState();
  const { updateUser, deleteUser } = useUserManagement();
  
  // Use consolidated auth functionality
}
```

### API Hooks

**Before:**
```typescript
function useApiCall(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch logic
  }, [url]);
  
  return { data, loading, error };
}
```

**After:**
```typescript
import { useApiRequest, useCachedData } from '@/hooks/shared';

function MyComponent() {
  // Simple API request
  const { data, loading, error } = useApiRequest('/api/data');
  
  // Cached API request
  const { data: cachedData } = useCachedData('/api/cached-data', {
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

## Performance Optimizations

### Lazy Loading Migration

**Before:**
```typescript
// All components loaded upfront
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import ReportsPage from './ReportsPage';

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}
```

**After:**
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const CustomerDashboard = lazy(() => import('./CustomerDashboard'));
const ReportsPage = lazy(() => import('./ReportsPage'));

function App() {
  return (
    <Routes>
      <Route 
        path="/admin" 
        element={
          <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/customer" 
        element={
          <Suspense fallback={<DashboardSkeleton />}>
            <CustomerDashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <Suspense fallback={<ReportsSkeleton />}>
            <ReportsPage />
          </Suspense>
        } 
      />
    </Routes>
  );
}
```

### Bundle Optimization

**Before:**
```typescript
// Importing entire libraries
import * as icons from 'lucide-react';
import _ from 'lodash';
import moment from 'moment';

function MyComponent() {
  return (
    <div>
      <icons.User />
      {_.capitalize(name)}
      {moment().format('YYYY-MM-DD')}
    </div>
  );
}
```

**After:**
```typescript
// Import only what's needed
import { User } from 'lucide-react';
import { capitalize } from 'lodash-es';
import { format } from 'date-fns';

function MyComponent() {
  return (
    <div>
      <User />
      {capitalize(name)}
      {format(new Date(), 'yyyy-MM-dd')}
    </div>
  );
}
```

## Testing Migration

### Component Tests

**Before:**
```typescript
// Testing large monolithic components
describe('ModernizedHomePageClient', () => {
  it('renders all sections', () => {
    render(<ModernizedHomePageClient />);
    // Test all functionality in one large test
  });
});
```

**After:**
```typescript
// Testing individual components
describe('HeroSection', () => {
  it('renders hero content', () => {
    render(<HeroSection />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});

describe('ServicesSection', () => {
  it('displays services', () => {
    render(<ServicesSection services={mockServices} />);
    expect(screen.getAllByTestId('service-card')).toHaveLength(3);
  });
});

// Integration test for composition
describe('ModernizedHomePageClient Integration', () => {
  it('renders all sections together', () => {
    render(<ModernizedHomePageClient />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('services-section')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Migration Issues

1. **Import Resolution Errors**
   ```bash
   # Problem: Module not found
   Error: Cannot resolve module '@/components/ui/Button'
   
   # Solution: Use barrel exports
   import { Button } from '@/components';
   ```

2. **Type Errors**
   ```typescript
   // Problem: Props interface mismatch
   interface OldProps {
     class?: string;
     click?: () => void;
   }
   
   // Solution: Use standardized props
   interface NewProps extends BaseComponentProps {
     onClick?: () => void;
   }
   ```

3. **Performance Regressions**
   ```typescript
   // Problem: Component re-renders too often
   const Component = ({ data, onUpdate }) => {
     const handleUpdate = () => onUpdate(data); // New function every render
   };
   
   // Solution: Use useCallback
   const handleUpdate = useCallback(() => 
     onUpdate(data), [onUpdate, data]
   );
   ```

### Migration Checklist

- [ ] Update all imports to use barrel exports
- [ ] Replace custom hooks with shared hooks
- [ ] Wrap components in error boundaries
- [ ] Add loading states using standard components
- [ ] Extract large components into smaller ones
- [ ] Add lazy loading for heavy components
- [ ] Update tests to test individual components
- [ ] Verify performance improvements
- [ ] Check accessibility compliance
- [ ] Update documentation

## Rollback Plan

If issues arise during migration:

1. **Gradual Rollback**
   ```typescript
   // Keep legacy components available
   import LegacyComponent from '@/components/legacy/LegacyComponent';
   
   // Use feature flags
   const useNewComponent = process.env.FEATURE_NEW_COMPONENTS === 'true';
   
   return useNewComponent ? <NewComponent /> : <LegacyComponent />;
   ```

2. **Import Aliases**
   ```typescript
   // Create temporary aliases
   export { LegacyButton as Button } from './legacy/Button';
   export { NewButton } from './ui/Button';
   ```

3. **Incremental Migration**
   - Migrate one component at a time
   - Test thoroughly before moving to next component
   - Keep both versions available during transition

## Support

For migration assistance:

1. Check this guide for common patterns
2. Review the component documentation
3. Test changes thoroughly
4. Create issues for migration-specific problems

The migration improves maintainability, performance, and developer experience while preserving all existing functionality.