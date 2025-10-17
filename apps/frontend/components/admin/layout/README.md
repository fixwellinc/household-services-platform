# Admin Page Layout Components

This directory contains shared layout components for admin pages that provide consistent structure, styling, and functionality across all admin dashboard pages.

## Components

### AdminPageLayout

The main wrapper component that provides consistent page structure with header, breadcrumbs, stats, and content area.

```tsx
import { AdminPageLayout } from '@/components/admin/layout';

<AdminPageLayout
  title="Page Title"
  description="Page description"
  breadcrumbs={breadcrumbs}
  stats={stats}
  actions={actions}
  loading={false}
  error={null}
>
  {/* Your page content */}
</AdminPageLayout>
```

**Props:**
- `title` (string): Page title
- `description` (string, optional): Page description
- `breadcrumbs` (BreadcrumbItem[], optional): Breadcrumb navigation items
- `stats` (StatItem[], optional): Statistics to display in cards
- `actions` (ReactNode, optional): Action buttons/components
- `loading` (boolean, optional): Show loading state
- `error` (Error, optional): Show error state
- `children` (ReactNode): Page content

### PageHeader

Renders the page header with title, description, breadcrumbs, and stats.

```tsx
import { PageHeader } from '@/components/admin/layout';

<PageHeader
  title="Page Title"
  description="Page description"
  breadcrumbs={breadcrumbs}
  stats={stats}
  actions={actions}
/>
```

### PageActions

Provides common page-level actions like search, filter, refresh, and custom actions.

```tsx
import { PageActions, createCommonActions } from '@/components/admin/layout';

<PageActions
  primaryAction={createCommonActions.add(() => handleAdd(), 'Add New')}
  actions={[
    createCommonActions.export(() => handleExport()),
    createCommonActions.settings(() => handleSettings())
  ]}
  showSearch={true}
  showFilter={true}
  showRefresh={true}
  onSearchChange={handleSearch}
  onFilterClick={handleFilter}
  onRefreshClick={handleRefresh}
/>
```

## Types

### BreadcrumbItem
```tsx
interface BreadcrumbItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

### StatItem
```tsx
interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ComponentType<{ className?: string }>;
}
```

### PageAction
```tsx
interface PageAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}
```

## Common Action Creators

Use `createCommonActions` for standard actions:

```tsx
import { createCommonActions } from '@/components/admin/layout';

const actions = [
  createCommonActions.add(() => handleAdd(), 'Add Item'),
  createCommonActions.export(() => handleExport(), 'Export Data'),
  createCommonActions.import(() => handleImport(), 'Import Data'),
  createCommonActions.settings(() => handleSettings(), 'Settings'),
  createCommonActions.refresh(() => handleRefresh(), 'Refresh')
];
```

## Usage Examples

### Basic Page
```tsx
export function BasicAdminPage() {
  return (
    <AdminPageLayout
      title="Users"
      description="Manage user accounts and permissions"
    >
      <div className="p-6">
        {/* Your content */}
      </div>
    </AdminPageLayout>
  );
}
```

### Page with Stats and Actions
```tsx
export function AdvancedAdminPage() {
  const stats = [
    {
      label: 'Total Users',
      value: 1234,
      change: { value: 12, type: 'increase' },
      icon: Users
    }
  ];

  const actions = (
    <PageActions
      primaryAction={createCommonActions.add(() => setShowAddModal(true))}
      showSearch={true}
      showFilter={true}
      onSearchChange={setSearchQuery}
      onFilterClick={() => setShowFilters(true)}
    />
  );

  return (
    <AdminPageLayout
      title="Users"
      description="Manage user accounts and permissions"
      stats={stats}
      actions={actions}
    >
      <div className="p-6">
        {/* Your content */}
      </div>
    </AdminPageLayout>
  );
}
```

### Page with Breadcrumbs
```tsx
export function NestedAdminPage() {
  const breadcrumbs = [
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Security' }
  ];

  return (
    <AdminPageLayout
      title="Security Settings"
      description="Configure security policies and access controls"
      breadcrumbs={breadcrumbs}
    >
      <div className="p-6">
        {/* Your content */}
      </div>
    </AdminPageLayout>
  );
}
```

## Features

- **Consistent Layout**: All admin pages use the same header structure
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Built-in loading and error state handling
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Error Boundaries**: Automatic error handling with AdminErrorBoundary
- **Flexible Actions**: Support for primary actions, secondary actions, and common patterns
- **Statistics Display**: Built-in stats cards with trend indicators
- **Breadcrumb Navigation**: Hierarchical navigation support

## Requirements Addressed

This implementation addresses the following requirements from the spec:

- **3.1**: Consistent header, sidebar, and content layout across all pages
- **3.2**: Highlighted active page navigation  
- **3.4**: Consistent design patterns and styling across page components

The components provide a reusable foundation for all admin pages while maintaining flexibility for page-specific content and actions.