"use client";

import React from 'react';
import { Button } from '../../ui/button';
import { 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Filter, 
  Search,
  MoreHorizontal,
  Settings
} from 'lucide-react';

export interface PageAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

export interface PageActionsProps {
  actions?: PageAction[];
  primaryAction?: PageAction;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  showFilter?: boolean;
  onFilterClick?: () => void;
  showRefresh?: boolean;
  onRefreshClick?: () => void;
  className?: string;
}

export function PageActions({
  actions = [],
  primaryAction,
  searchValue = '',
  onSearchChange,
  showSearch = false,
  showFilter = false,
  onFilterClick,
  showRefresh = false,
  onRefreshClick,
  className = ''
}: PageActionsProps) {
  // Common action presets
  const commonActions = {
    add: (onClick: () => void, label = 'Add New') => ({
      id: 'add',
      label,
      icon: Plus,
      onClick,
      variant: 'default' as const
    }),
    export: (onClick: () => void, label = 'Export') => ({
      id: 'export',
      label,
      icon: Download,
      onClick,
      variant: 'outline' as const
    }),
    import: (onClick: () => void, label = 'Import') => ({
      id: 'import',
      label,
      icon: Upload,
      onClick,
      variant: 'outline' as const
    }),
    settings: (onClick: () => void, label = 'Settings') => ({
      id: 'settings',
      label,
      icon: Settings,
      onClick,
      variant: 'ghost' as const
    })
  };

  const allActions = [...actions];
  if (primaryAction) {
    allActions.unshift(primaryAction);
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
      )}

      {/* Filter Button */}
      {showFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterClick}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      )}

      {/* Refresh Button */}
      {showRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshClick}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      )}

      {/* Custom Actions */}
      {allActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'secondary'}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          title={action.tooltip}
          className="flex items-center space-x-2"
        >
          {action.loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            action.icon && <action.icon className="h-4 w-4" />
          )}
          <span>{action.label}</span>
        </Button>
      ))}

      {/* Overflow Menu for additional actions */}
      {allActions.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      )}
    </div>
  );
}

// Export common action creators for convenience
export const createCommonActions = {
  add: (onClick: () => void, label = 'Add New') => ({
    id: 'add',
    label,
    icon: Plus,
    onClick,
    variant: 'default' as const
  }),
  export: (onClick: () => void, label = 'Export') => ({
    id: 'export',
    label,
    icon: Download,
    onClick,
    variant: 'outline' as const
  }),
  import: (onClick: () => void, label = 'Import') => ({
    id: 'import',
    label,
    icon: Upload,
    onClick,
    variant: 'outline' as const
  }),
  settings: (onClick: () => void, label = 'Settings') => ({
    id: 'settings',
    label,
    icon: Settings,
    onClick,
    variant: 'ghost' as const
  }),
  refresh: (onClick: () => void, label = 'Refresh') => ({
    id: 'refresh',
    label,
    icon: RefreshCw,
    onClick,
    variant: 'ghost' as const
  })
};