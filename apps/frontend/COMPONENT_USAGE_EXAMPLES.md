# Component Usage Examples

## Overview

This document provides practical examples of how to use the optimized Fixwell Services frontend components. Each example demonstrates best practices, common patterns, and proper implementation techniques.

## Table of Contents

1. [Basic UI Components](#basic-ui-components)
2. [Form Components](#form-components)
3. [Layout Components](#layout-components)
4. [Feature Components](#feature-components)
5. [Page Components](#page-components)
6. [Performance Patterns](#performance-patterns)
7. [Error Handling](#error-handling)
8. [Accessibility Examples](#accessibility-examples)

## Basic UI Components

### Button Component

```typescript
import { Button } from '@/components';

// Basic usage
<Button onClick={handleClick}>
  Click me
</Button>

// With variants and sizes
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Submit Form
</Button>

// Loading state
<Button loading={isSubmitting} onClick={handleSubmit}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>

// Disabled state
<Button disabled={!isValid} onClick={handleSubmit}>
  Submit
</Button>

// With icon
import { Plus } from 'lucide-react';

<Button variant="outline" onClick={handleAdd}>
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>

// As link
<Button as="a" href="/dashboard" variant="link">
  Go to Dashboard
</Button>
```

### Card Component

```typescript
import { Card } from '@/components';

// Basic card
<Card>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description goes here</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Card content</p>
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Interactive card
<Card 
  interactive 
  onClick={handleCardClick}
  className="cursor-pointer hover:shadow-lg"
>
  <Card.Content>
    Clickable card content
  </Card.Content>
</Card>

// Card with loading state
<Card loading={isLoading}>
  <Card.Content>
    {isLoading ? <CardSkeleton /> : <CardContent data={data} />}
  </Card.Content>
</Card>
```

### Input Component

```typescript
import { Input, Label } from '@/components';

// Basic input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>

// Input with error
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    error={errors.password}
    aria-describedby={errors.password ? 'password-error' : undefined}
  />
  {errors.password && (
    <p id="password-error" className="text-sm text-red-600">
      {errors.password}
    </p>
  )}
</div>

// Input with loading state
<Input
  placeholder="Search..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  loading={isSearching}
  disabled={isSearching}
/>
```

## Form Components

### Complete Form Example

```typescript
import { 
  Button, 
  Input, 
  Label, 
  Card,
  StandardErrorBoundary 
} from '@/components';
import { useFormValidation } from '@/hooks/shared';

const contactFormValidation = {
  name: (value) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  email: (value) => {
    if (!value) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
    return null;
  },
  message: (value) => {
    if (!value) return 'Message is required';
    if (value.length < 10) return 'Message must be at least 10 characters';
    return null;
  }
};

function ContactForm() {
  const {
    formData,
    errors,
    isValid,
    handleChange,
    handleSubmit,
    loading
  } = useFormValidation({
    initialData: { name: '', email: '', message: '' },
    validation: contactFormValidation,
    onSubmit: async (data) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send message');
    }
  });

  return (
    <StandardErrorBoundary>
      <Card className="max-w-md mx-auto">
        <Card.Header>
          <Card.Title>Contact Us</Card.Title>
          <Card.Description>
            Send us a message and we'll get back to you.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                value={formData.message}
                onChange={handleChange}
                required
              />
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message}</p>
              )}
            </div>
          </form>
        </Card.Content>
        <Card.Footer>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            loading={loading}
            disabled={!isValid || loading}
            className="w-full"
          >
            Send Message
          </Button>
        </Card.Footer>
      </Card>
    </StandardErrorBoundary>
  );
}
```

### Form with File Upload

```typescript
import { useState } from 'react';
import { Button, Input, Label, Card } from '@/components';
import { Upload } from 'lucide-react';

function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        console.log('File uploaded successfully');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <Card.Header>
        <Card.Title>Upload File</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Choose File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.png"
          />
        </div>
        
        {file && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
        
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </Card.Content>
      <Card.Footer>
        <Button 
          onClick={handleUpload}
          disabled={!file || uploading}
          loading={uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </Card.Footer>
    </Card>
  );
}
```

## Layout Components

### Responsive Grid Layout

```typescript
import { Card } from '@/components';

function DashboardGrid() {
  const stats = [
    { title: 'Total Users', value: '1,234', change: '+12%' },
    { title: 'Revenue', value: '$45,678', change: '+8%' },
    { title: 'Orders', value: '890', change: '+15%' },
    { title: 'Conversion', value: '3.2%', change: '-2%' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.change.startsWith('+') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
```

### Sidebar Layout

```typescript
import { useState } from 'react';
import { Button } from '@/components';
import { Menu, X } from 'lucide-react';

function SidebarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="p-4">
          {/* Navigation items */}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Page Title</h2>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Feature Components

### Service Card Component

```typescript
import { Card, Button } from '@/components';
import { Star, Clock, MapPin } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    rating: number;
    duration: string;
    location: string;
    image?: string;
  };
  onBook: (serviceId: string) => void;
  loading?: boolean;
}

function ServiceCard({ service, onBook, loading = false }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {service.image && (
        <div className="aspect-video bg-gray-200">
          <img 
            src={service.image} 
            alt={service.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <Card.Content className="p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">{service.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{service.rating}</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">{service.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{service.location}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="text-2xl font-bold text-green-600">
              ${service.price}
            </div>
            <Button 
              onClick={() => onBook(service.id)}
              loading={loading}
              disabled={loading}
            >
              Book Now
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
```

### User Profile Component

```typescript
import { useState } from 'react';
import { Card, Button, Input, Label } from '@/components';
import { useAuthState, useUserManagement } from '@/hooks/shared';
import { User, Edit, Save, X } from 'lucide-react';

function UserProfile() {
  const { user } = useAuthState();
  const { updateUser, loading } = useUserManagement();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleSave = async () => {
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <Card.Title>Profile</Card.Title>
              <Card.Description>Manage your account information</Card.Description>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Content className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          {isEditing ? (
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
            />
          ) : (
            <p className="text-sm py-2">{user?.name}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                email: e.target.value 
              }))}
            />
          ) : (
            <p className="text-sm py-2">{user?.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          {isEditing ? (
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                phone: e.target.value 
              }))}
            />
          ) : (
            <p className="text-sm py-2">{user?.phone || 'Not provided'}</p>
          )}
        </div>
      </Card.Content>
      
      {isEditing && (
        <Card.Footer className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}
```

## Page Components

### Home Page Sections

```typescript
// HeroSection.tsx
import { Button } from '@/components';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Professional Home Services
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Get reliable, professional services for your home with just a few clicks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary">
            Book a Service
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}

// ServicesSection.tsx
import { ServiceCard } from '@/components/features/services';
import { useApiRequest } from '@/hooks/shared';

export function ServicesSection() {
  const { data: services, loading, error } = useApiRequest('/api/services');

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-video rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4" />
                  <div className="bg-gray-200 h-3 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-600">Failed to load services</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from our wide range of professional home services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={(id) => console.log('Book service:', id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

## Performance Patterns

### Lazy Loading with Suspense

```typescript
import { lazy, Suspense } from 'react';
import { Card } from '@/components';

// Lazy load heavy components
const HeavyChart = lazy(() => import('@/components/ui/charts/HeavyChart'));
const DataTable = lazy(() => import('@/components/ui/data-display/DataTable'));

function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Lazy load chart with skeleton */}
      <Card>
        <Card.Header>
          <Card.Title>Analytics</Card.Title>
        </Card.Header>
        <Card.Content>
          <Suspense fallback={<ChartSkeleton />}>
            <HeavyChart data={chartData} />
          </Suspense>
        </Card.Content>
      </Card>
      
      {/* Lazy load table with skeleton */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Orders</Card.Title>
        </Card.Header>
        <Card.Content>
          <Suspense fallback={<TableSkeleton />}>
            <DataTable data={tableData} />
          </Suspense>
        </Card.Content>
      </Card>
    </div>
  );
}

// Skeleton components
function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-64 rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="bg-gray-200 h-4 rounded flex-1" />
          <div className="bg-gray-200 h-4 rounded w-20" />
          <div className="bg-gray-200 h-4 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
```

### Memoized Components

```typescript
import { memo, useMemo, useCallback } from 'react';
import { Card, Button } from '@/components';

interface ExpensiveListProps {
  items: Array<{ id: string; name: string; value: number }>;
  onItemClick: (id: string) => void;
  sortBy: 'name' | 'value';
}

const ExpensiveList = memo<ExpensiveListProps>(({ 
  items, 
  onItemClick, 
  sortBy 
}) => {
  // Memoize expensive calculations
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.value - a.value;
    });
  }, [items, sortBy]);

  // Memoize event handlers
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <ExpensiveListItem
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
});

const ExpensiveListItem = memo<{
  item: { id: string; name: string; value: number };
  onClick: (id: string) => void;
}>(({ item, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(item.id);
  }, [item.id, onClick]);

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md" onClick={handleClick}>
      <div className="flex justify-between items-center">
        <span className="font-medium">{item.name}</span>
        <span className="text-gray-600">${item.value}</span>
      </div>
    </Card>
  );
});

ExpensiveList.displayName = 'ExpensiveList';
ExpensiveListItem.displayName = 'ExpensiveListItem';
```

## Error Handling

### Error Boundary Usage

```typescript
import { StandardErrorBoundary } from '@/components';

// Wrap entire sections
function App() {
  return (
    <StandardErrorBoundary>
      <Header />
      <main>
        <StandardErrorBoundary fallback={<DashboardErrorFallback />}>
          <Dashboard />
        </StandardErrorBoundary>
      </main>
      <Footer />
    </StandardErrorBoundary>
  );
}

// Custom error fallback
function DashboardErrorFallback({ error, resetError }) {
  return (
    <Card className="max-w-md mx-auto mt-8">
      <Card.Header>
        <Card.Title className="text-red-600">Something went wrong</Card.Title>
      </Card.Header>
      <Card.Content>
        <p className="text-gray-600 mb-4">
          We encountered an error loading your dashboard.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error details
          </summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      </Card.Content>
      <Card.Footer>
        <Button onClick={resetError} className="w-full">
          Try Again
        </Button>
      </Card.Footer>
    </Card>
  );
}
```

### Loading State Wrapper

```typescript
import { LoadingStateWrapper } from '@/components';

function DataComponent() {
  const { data, loading, error } = useApiRequest('/api/data');

  return (
    <LoadingStateWrapper
      isLoading={loading}
      error={error}
      skeleton={<DataSkeleton />}
      emptyState={<EmptyDataState />}
      isEmpty={!data || data.length === 0}
    >
      <DataDisplay data={data} />
    </LoadingStateWrapper>
  );
}

function DataSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="bg-gray-200 w-12 h-12 rounded" />
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 h-4 rounded w-3/4" />
            <div className="bg-gray-200 h-3 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyDataState() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">No data available</p>
      <Button variant="outline">Refresh</Button>
    </div>
  );
}
```

## Accessibility Examples

### Accessible Form

```typescript
import { useId } from 'react';
import { Input, Label, Button } from '@/components';

function AccessibleForm() {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  return (
    <form className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>
          Email Address
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        </Label>
        <Input
          id={emailId}
          type="email"
          required
          aria-describedby={errors.email ? emailErrorId : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <div id={emailErrorId} role="alert" className="text-red-600 text-sm">
            {errors.email}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>
          Password
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        </Label>
        <Input
          id={passwordId}
          type="password"
          required
          aria-describedby={errors.password ? passwordErrorId : undefined}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <div id={passwordErrorId} role="alert" className="text-red-600 text-sm">
            {errors.password}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
```

### Accessible Modal

```typescript
import { useEffect, useRef } from 'react';
import { Button, Card } from '@/components';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function AccessibleModal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousFocusRef.current?.focus();
      
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <Card
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 max-w-md w-full mx-4 max-h-[90vh] overflow-auto"
        tabIndex={-1}
      >
        <Card.Header className="flex items-center justify-between">
          <Card.Title id="modal-title">{title}</Card.Title>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </Card.Header>
        <Card.Content>
          {children}
        </Card.Content>
      </Card>
    </div>
  );
}
```

These examples demonstrate the proper usage of the optimized component architecture, showing how to build maintainable, performant, and accessible user interfaces with the new component system.