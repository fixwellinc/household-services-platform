'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'ADMIN' | 'CUSTOMER' | 'TECHNICIAN' | 'SALESMAN';

interface Permission {
  resource: string;
  action: string;
}

interface PermissionCheck {
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccess: (permissions: Permission[]) => boolean;
}

/**
 * Shared permissions hook for role-based access control
 * Provides consistent permission checking across components
 */
export function usePermissions(): PermissionCheck {
  const { user, isAuthenticated } = useAuth();

  const permissions = useMemo(() => {
    if (!isAuthenticated || !user) {
      return {
        hasPermission: () => false,
        hasRole: () => false,
        hasAnyRole: () => false,
        canAccess: () => false,
      };
    }

    const userRole = user.role as UserRole;

    // Define role-based permissions
    const rolePermissions: Record<UserRole, Permission[]> = {
      ADMIN: [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
        { resource: 'users', action: 'delete' },
        { resource: 'services', action: 'read' },
        { resource: 'services', action: 'write' },
        { resource: 'services', action: 'delete' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
        { resource: 'bookings', action: 'delete' },
        { resource: 'reports', action: 'read' },
        { resource: 'settings', action: 'read' },
        { resource: 'settings', action: 'write' },
      ],
      CUSTOMER: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'write' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
        { resource: 'services', action: 'read' },
      ],
      TECHNICIAN: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'write' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
        { resource: 'services', action: 'read' },
      ],
      SALESMAN: [
        { resource: 'profile', action: 'read' },
        { resource: 'profile', action: 'write' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
        { resource: 'services', action: 'read' },
        { resource: 'customers', action: 'read' },
      ],
    };

    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = (resource: string, action: string): boolean => {
      return userPermissions.some(
        (permission) => permission.resource === resource && permission.action === action
      );
    };

    const hasRole = (role: UserRole): boolean => {
      return userRole === role;
    };

    const hasAnyRole = (roles: UserRole[]): boolean => {
      return roles.includes(userRole);
    };

    const canAccess = (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every((permission) =>
        hasPermission(permission.resource, permission.action)
      );
    };

    return {
      hasPermission,
      hasRole,
      hasAnyRole,
      canAccess,
    };
  }, [user, isAuthenticated]);

  return permissions;
}