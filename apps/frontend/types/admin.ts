import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  id: string;
  name: string;
  icon: LucideIcon;
  path?: string;
  permissions?: string[];
  children?: NavigationItem[];
  badge?: {
    count: number;
    variant: 'info' | 'warning' | 'error';
  };
}

export interface NavigationState {
  activeItem: string;
  expandedItems: string[];
  favoriteItems: string[];
  recentItems: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  permissions?: string[];
  lastLoginAt?: Date;
  preferences?: AdminPreferences;
}

export interface AdminPreferences {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  defaultFilters: Record<string, any>;
  dashboardLayout?: DashboardLayout;
  notificationSettings?: NotificationSettings;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  config: WidgetConfig;
  refreshInterval?: number;
  permissions: string[];
}

export interface WidgetConfig {
  dataSource: string;
  parameters: Record<string, any>;
  visualization?: any;
  alerts?: AlertConfig[];
}

export interface AlertConfig {
  id: string;
  threshold: number;
  condition: 'greater' | 'less' | 'equal';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  desktop: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    sessionId: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  admin?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface AuditLogFilters {
  adminId?: string;
  action?: string;
  entityType?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  auditLogs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface AuditLogStats {
  totalActions: number;
  actionsByType: Array<{ action: string; _count: { action: number } }>;
  actionsBySeverity: Array<{ severity: string; _count: { severity: number } }>;
  topAdmins: Array<{ adminId: string; _count: { adminId: number } }>;
  dateRange: { startDate: Date; endDate: Date };
}

export interface BulkOperation {
  id: string;
  label: string;
  action: (selectedIds: string[]) => Promise<BulkOperationResult>;
  confirmationRequired: boolean;
  permissions: string[];
  maxItems?: number;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// Search and Filter Types
export interface SearchConfig {
  entity: string;
  fields: SearchField[];
  filters: FilterConfig[];
  sorting: SortConfig[];
}

export interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  searchable: boolean;
  filterable: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'daterange';
  options?: Array<{ value: string; label: string }>;
  operators?: FilterOperator[];
}

export interface FilterOperator {
  value: string;
  label: string;
  type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greater' | 'less' | 'between' | 'in' | 'notIn';
}

export interface SortConfig {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  query: string;
  filters: Record<string, FilterValue>;
  sorting: { field: string; direction: 'asc' | 'desc' };
  pagination: { page: number; limit: number };
}

export interface FilterValue {
  operator: string;
  value: any;
  values?: any[];
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  totalCount: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  optimization?: {
    executionTime: number;
    indexHints: string[];
    suggestions: string[];
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'entity' | 'field';
  count?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  entity: string;
  filterState: FilterState;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}