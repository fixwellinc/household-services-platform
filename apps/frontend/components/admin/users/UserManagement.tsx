"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Key,
  Shield
} from 'lucide-react';
import { EnhancedDataTable } from '../EnhancedDataTable';
import { SimpleSearchAndFilter } from '../search/SimpleSearchAndFilter';
import { UserDetailsPanel } from './UserDetailsPanel';
import { UserForm } from './UserForm';
import { BulkOperationsToolbar } from '../BulkOperationsToolbar';
import { UserRoleAssignment } from '../permissions/UserRoleAssignment';
import { UserImpersonation } from '../permissions/UserImpersonation';
import { ConfirmationDialog } from './ConfirmationDialog';
import { UserSuspensionWorkflow } from './UserSuspensionWorkflow';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AdminLoadingState, AdminTableLoadingState } from '../AdminLoadingState';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  };
}

interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRoleAssignment, setShowRoleAssignment] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState<User | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();

  // Set current user email from auth context to prevent self-modification
  useEffect(() => {
    if (currentUser?.email) {
      setCurrentUserEmail(currentUser.email);
    }
  }, [currentUser]);

  // Fetch users with filters and pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Only add non-empty parameters
      if (pagination.page) params.append('page', pagination.page.toString());
      if (pagination.limit) params.append('limit', pagination.limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(key, value.toString());
        }
      });

      const response = await request(`/admin/users?${params.toString()}`);
      
      if (response.success) {
        setUsers(response.users || []);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showError(error instanceof Error ? error.message : "Failed to fetch users");
      // Set empty state on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page, pagination.limit, sortBy, sortOrder]);

  // Handle user actions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleDeleteUser = (user: User) => {
    setShowDeleteDialog(user);
  };

  const confirmDeleteUser = async () => {
    if (!showDeleteDialog) return;

    try {
      const response = await request(`/admin/users/${showDeleteDialog.id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        showSuccess("User deleted successfully");
        fetchUsers();
        setShowDeleteDialog(null);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showError(error.message || "Failed to delete user");
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      const response = await request(`/admin/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      if (response.success) {
        showSuccess("User suspended successfully");
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to suspend user";
      console.error('Error suspending user:', error);
      showError(errorMessage);
      throw error; // Re-throw to handle in component
    }
  };

  const handleActivateUser = async (userId: string, reason: string, newRole: string) => {
    try {
      const response = await request(`/admin/users/${userId}/activate`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole, reason })
      });

      if (response.success) {
        showSuccess("User activated successfully");
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to activate user";
      console.error('Error activating user:', error);
      showError(errorMessage);
      throw error; // Re-throw to handle in component
    }
  };

  const handleResetPassword = (user: User) => {
    setShowPasswordDialog(user);
  };

  const confirmResetPassword = async (data: { password: string }) => {
    if (!showPasswordDialog) return;

    try {
      const response = await request(`/admin/users/${showPasswordDialog.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: data.password })
      });

      if (response.success) {
        showSuccess("Password reset successfully");
        setShowPasswordDialog(null);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showError(error.message || "Failed to reset password");
    }
  };

  const handleManageRoles = (user: User) => {
    setShowRoleAssignment(user);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user: User) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.email}</span>
          {user.name && <span className="text-sm text-gray-500">{user.name}</span>}
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
          user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
          user.role === 'SUSPENDED' ? 'bg-gray-100 text-gray-800' :
          'bg-green-100 text-green-800'
        }`}>
          {user.role}
        </span>
      )
    },
    {
      key: 'subscription',
      label: 'Subscription',
      render: (user: User) => (
        user.subscription ? (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.subscription.tier}</span>
            <span className={`text-xs ${
              user.subscription.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              {user.subscription.status}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">No subscription</span>
        )
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (user: User) => user.phone || '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (user: User) => new Date(user.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <PermissionGuard permission="users.view">
            <button
              onClick={() => handleViewUser(user)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </PermissionGuard>
          
          <PermissionGuard permission="users.update">
            <button
              onClick={() => handleEditUser(user)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Edit User"
            >
              <Edit className="w-4 h-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="roles.assign">
            <button
              onClick={() => handleManageRoles(user)}
              className="p-1 text-indigo-600 hover:text-indigo-800"
              title="Manage Roles"
            >
              <Shield className="w-4 h-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="users.impersonate">
            <UserImpersonation
              userId={user.id}
              userEmail={user.email}
              userName={user.name}
            />
          </PermissionGuard>
          
          <PermissionGuard permission="users.suspend">
            {user.role === 'SUSPENDED' ? (
              <button
                onClick={() => handleViewUser(user)} // Open details panel for full workflow
                className="p-1 text-green-600 hover:text-green-800"
                title="Activate User (opens details)"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleViewUser(user)} // Open details panel for full workflow
                className="p-1 text-yellow-600 hover:text-yellow-800"
                title="Suspend User (opens details)"
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
          </PermissionGuard>

          <PermissionGuard permission="users.update">
            <button
              onClick={() => handleResetPassword(user)}
              className="p-1 text-purple-600 hover:text-purple-800"
              title="Reset Password"
            >
              <Key className="w-4 h-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="users.delete">
            <button
              onClick={() => handleDeleteUser(user)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Delete User"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];





  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>
        </div>
        <PermissionGuard permission="users.create">
          <button
            onClick={handleCreateUser}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Search and Filters */}
      <SimpleSearchAndFilter
        entity="users"
        onFiltersChange={setFilters}
      />

      {/* Bulk Operations */}
      {selectedUsers.length > 0 && (
        <PermissionGuard permission="users.suspend">
          <BulkOperationsToolbar
            selectedItems={selectedUsers}
            entityType="users"
            onSelectionChange={setSelectedUsers}
            onOperationComplete={() => {
              setSelectedUsers([]);
              fetchUsers();
            }}
          />
        </PermissionGuard>
      )}

      {/* Users Table */}
      {loading && users.length === 0 ? (
        <AdminTableLoadingState rows={10} />
      ) : (
        <EnhancedDataTable
          title="Users"
          data={users}
          columns={columns}
          entityType="users"
          loading={loading}
          onRefresh={fetchUsers}
          pageSize={pagination.limit}
          enableBulkOperations={true}
        />
      )}

      {/* User Details Panel */}
      {selectedUser && (
        <UserDetailsPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={() => {
            setEditingUser(selectedUser);
            setShowUserForm(true);
            setSelectedUser(null);
          }}
          onRefresh={fetchUsers}
        />
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowUserForm(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Role Assignment Modal */}
      {showRoleAssignment && (
        <UserRoleAssignment
          userId={showRoleAssignment.id}
          userEmail={showRoleAssignment.email}
          userName={showRoleAssignment.name}
          onClose={() => setShowRoleAssignment(null)}
          onUpdate={fetchUsers}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!showDeleteDialog}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${showDeleteDialog?.name || showDeleteDialog?.email}? This action cannot be undone.`}
        type={showDeleteDialog?.email === currentUserEmail ? 'self-modification' : 'delete'}
        userEmail={showDeleteDialog?.email}
        userName={showDeleteDialog?.name}
        currentUserEmail={currentUserEmail}
        loading={loading}
      />

      {/* Password Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!showPasswordDialog}
        onClose={() => setShowPasswordDialog(null)}
        onConfirm={confirmResetPassword}
        title="Reset User Password"
        message={`Are you sure you want to reset the password for ${showPasswordDialog?.name || showPasswordDialog?.email}?`}
        type="reset-password"
        userEmail={showPasswordDialog?.email}
        userName={showPasswordDialog?.name}
        requirePassword={true}
        loading={loading}
      />
    </div>
  );
}