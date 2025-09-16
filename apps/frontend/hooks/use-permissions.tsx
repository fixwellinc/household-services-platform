"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface UserRole {
  id: string;
  assignedAt: string;
  expiresAt?: string;
  role: Role;
}

interface PermissionContextType {
  permissions: string[];
  userRoles: UserRole[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export function PermissionProvider({ children, userId }: PermissionProviderProps) {
  const { request } = useApi();
  const queryClient = useQueryClient();

  // Use TanStack Query to fetch permissions
  const { data: permissionsData, isLoading: loading, error } = useQuery({
    queryKey: ['admin', 'permissions', 'users', userId, 'roles'],
    queryFn: async () => {
      if (!userId) {
        return { success: true, userRoles: [], permissions: [] };
      }
      // Fixed URL: removed /api prefix since useApi already adds /api
      return await request(`/admin/permissions/users/${userId}/roles`);
    },
    enabled: !!userId,
    retry: false, // Prevent infinite retries
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Extract data from query results
  const permissions = permissionsData?.permissions || [];
  const userRoles = permissionsData?.userRoles || [];

  // Show error in console but don't crash the app
  useEffect(() => {
    if (error) {
      console.error('Error fetching permissions:', error);
    }
  }, [error]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasRole = (roleName: string): boolean => {
    return userRoles.some(userRole => 
      userRole.role.name === roleName && 
      (!userRole.expiresAt || new Date(userRole.expiresAt) > new Date())
    );
  };

  const refreshPermissions = async () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'permissions', 'users', userId, 'roles'] });
  };

  const value: PermissionContextType = {
    permissions,
    userRoles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasRole,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Hook for checking permissions without context (for standalone use)
export function usePermissionCheck() {
  const { request } = useApi();

  const checkPermission = async (userId: string, permission: string): Promise<boolean> => {
    try {
      // Fixed URL: removed /api prefix since useApi already adds /api
      const response = await request(`/admin/permissions/users/${userId}/roles`);
      if (response.success) {
        return response.permissions.includes(permission);
      }
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const checkAnyPermission = async (userId: string, permissions: string[]): Promise<boolean> => {
    try {
      // Fixed URL: removed /api prefix since useApi already adds /api
      const response = await request(`/admin/permissions/users/${userId}/roles`);
      if (response.success) {
        return permissions.some(permission => response.permissions.includes(permission));
      }
      return false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  return {
    checkPermission,
    checkAnyPermission
  };
}

// Permission Guard Component
interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  permissions = [], 
  role,
  requireAll = false,
  fallback = null,
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>;
  }

  // Check role if specified
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Higher-order component for permission-based rendering
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[] | string,
  fallback?: ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return (
      <PermissionGuard permissions={permissions} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// Hook for conditional rendering based on permissions
export function useConditionalRender() {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  const renderIf = (condition: boolean, component: ReactNode, fallback?: ReactNode) => {
    return condition ? component : (fallback || null);
  };

  const renderIfPermission = (permission: string, component: ReactNode, fallback?: ReactNode) => {
    return renderIf(hasPermission(permission), component, fallback);
  };

  const renderIfAnyPermission = (permissions: string[], component: ReactNode, fallback?: ReactNode) => {
    return renderIf(hasAnyPermission(permissions), component, fallback);
  };

  const renderIfRole = (role: string, component: ReactNode, fallback?: ReactNode) => {
    return renderIf(hasRole(role), component, fallback);
  };

  return {
    renderIf,
    renderIfPermission,
    renderIfAnyPermission,
    renderIfRole
  };
}