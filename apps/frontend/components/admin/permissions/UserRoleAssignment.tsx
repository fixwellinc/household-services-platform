"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Trash2,
    Calendar,
    User,
    X,
    Check,
    AlertTriangle
} from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

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
    assignedBy: {
        id: string;
        email: string;
        name?: string;
    };
    role: Role;
}

interface UserRoleAssignmentProps {
    userId: string;
    userEmail: string;
    userName?: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export function UserRoleAssignment({
    userId,
    userEmail,
    userName,
    onClose,
    onUpdate
}: UserRoleAssignmentProps) {
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);

    const { request } = useApi();
    const { showSuccess, showError } = useToast();

    // Fetch user roles and available roles
    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRolesResponse, rolesResponse] = await Promise.all([
                request(`/api/admin/permissions/users/${userId}/roles`),
                request('/api/admin/permissions/roles')
            ]);

            if (userRolesResponse.success) {
                setUserRoles(userRolesResponse.userRoles);
                setUserPermissions(userRolesResponse.permissions);
            }

            if (rolesResponse.success) {
                setAvailableRoles(rolesResponse.roles);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showError("Failed to fetch user roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    // Handle role assignment
    const handleAssignRole = async (roleId: string, expiresAt?: string) => {
        try {
            const response = await request(`/api/admin/permissions/users/${userId}/roles`, {
                method: 'POST',
                body: JSON.stringify({
                    roleId,
                    expiresAt
                })
            });

            if (response.success) {
                showSuccess("Role assigned successfully");
                setShowAssignForm(false);
                fetchData();
                onUpdate?.();
            }
        } catch (error: any) {
            console.error('Error assigning role:', error);
            showError(error.message || "Failed to assign role");
        }
    };

    // Handle role removal
    const handleRemoveRole = async (roleId: string, roleName: string) => {
        if (!confirm(`Are you sure you want to remove the "${roleName}" role from this user?`)) {
            return;
        }

        try {
            const response = await request(`/api/admin/permissions/users/${userId}/roles/${roleId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showSuccess("Role removed successfully");
                fetchData();
                onUpdate?.();
            }
        } catch (error: any) {
            console.error('Error removing role:', error);
            showError(error.message || "Failed to remove role");
        }
    };

    // Get roles that are not already assigned
    const unassignedRoles = availableRoles.filter(
        role => !userRoles.some(ur => ur.role.id === role.id)
    );

    // Group permissions by category
    const permissionsByCategory = userRoles.reduce((acc, userRole) => {
        userRole.role.permissions.forEach(permission => {
            if (!acc[permission.category]) {
                acc[permission.category] = new Set();
            }
            acc[permission.category].add(permission.name);
        });
        return acc;
    }, {} as Record<string, Set<string>>);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">User Role Management</h2>
                            <p className="text-gray-600">
                                {userName || userEmail} • {userRoles.length} roles assigned
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAssignForm(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Assign Role</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
                    {/* Current Roles */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Roles</h3>
                        {userRoles.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No roles assigned to this user</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {userRoles.map((userRole) => {
                                    const isExpired = userRole.expiresAt && new Date(userRole.expiresAt) < new Date();
                                    const isExpiringSoon = userRole.expiresAt &&
                                        new Date(userRole.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                                    return (
                                        <div
                                            key={userRole.id}
                                            className={`border rounded-lg p-4 ${isExpired ? 'border-red-200 bg-red-50' :
                                                    isExpiringSoon ? 'border-yellow-200 bg-yellow-50' :
                                                        'border-gray-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="font-semibold text-gray-900">{userRole.role.name}</h4>
                                                        {isExpired && (
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center space-x-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                <span>Expired</span>
                                                            </span>
                                                        )}
                                                        {isExpiringSoon && !isExpired && (
                                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center space-x-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                <span>Expiring Soon</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {userRole.role.description && (
                                                        <p className="text-gray-600 text-sm mb-3">{userRole.role.description}</p>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                                        <div>
                                                            <span className="font-medium">Assigned by:</span> {userRole.assignedBy.name || userRole.assignedBy.email}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Assigned on:</span> {new Date(userRole.assignedAt).toLocaleDateString()}
                                                        </div>
                                                        {userRole.expiresAt && (
                                                            <div className="md:col-span-2">
                                                                <span className="font-medium">Expires on:</span> {new Date(userRole.expiresAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3">
                                                        <span className="text-sm font-medium text-gray-700">Permissions: </span>
                                                        <span className="text-sm text-gray-600">{userRole.role.permissions.length} permissions</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveRole(userRole.role.id, userRole.role.name)}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove Role"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Effective Permissions */}
                    {Object.keys(permissionsByCategory).length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Effective Permissions</h3>
                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                            {category.replace('_', ' ')} ({permissions.size})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(permissions).map((permission) => (
                                                <span
                                                    key={permission}
                                                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    <span>{permission}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Role Assignment Form */}
                {showAssignForm && (
                    <RoleAssignmentForm
                        availableRoles={unassignedRoles}
                        onAssign={handleAssignRole}
                        onClose={() => setShowAssignForm(false)}
                    />
                )}
            </div>
        </div>
    );
}

// Role Assignment Form Component
interface RoleAssignmentFormProps {
    availableRoles: Role[];
    onAssign: (roleId: string, expiresAt?: string) => void;
    onClose: () => void;
}

function RoleAssignmentForm({ availableRoles, onAssign, onClose }: RoleAssignmentFormProps) {
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [showPermissions, setShowPermissions] = useState(false);

    const selectedRole = availableRoles.find(role => role.id === selectedRoleId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoleId) {
            onAssign(selectedRoleId, expiresAt || undefined);
        }
    };

    if (availableRoles.length === 0) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                <div className="bg-white rounded-lg p-6 max-w-md">
                    <div className="text-center">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Roles</h3>
                        <p className="text-gray-600 mb-4">All available roles have already been assigned to this user.</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Assign Role</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Role *
                        </label>
                        <select
                            id="role"
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Choose a role...</option>
                            {availableRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name} ({role.permissions.length} permissions)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Description */}
                    {selectedRole && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">{selectedRole.name}</h4>
                            {selectedRole.description && (
                                <p className="text-blue-700 text-sm mb-3">{selectedRole.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-blue-700 text-sm">
                                    {selectedRole.permissions.length} permissions included
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowPermissions(!showPermissions)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    {showPermissions ? 'Hide' : 'Show'} Permissions
                                </button>
                            </div>

                            {showPermissions && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="flex flex-wrap gap-1">
                                        {selectedRole.permissions.map((permission) => (
                                            <span
                                                key={permission.id}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                            >
                                                {permission.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expiration Date */}
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                            Expiration Date (Optional)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="datetime-local"
                                id="expiresAt"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty for permanent assignment
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedRoleId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Assign Role
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}