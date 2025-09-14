"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Users,
    Check,
    X,
    Search,
    Filter
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
    isSystem: boolean;
    isActive: boolean;
    permissions: Permission[];
    userCount: number;
    users: Array<{
        id: string;
        email: string;
        name?: string;
    }>;
}

interface RoleFormData {
    name: string;
    description: string;
    permissions: string[];
}

export function RoleBuilder() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const { request } = useApi();
    const { showSuccess, showError } = useToast();

    // Fetch roles and permissions
    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesResponse, permissionsResponse] = await Promise.all([
                request('/api/admin/permissions/roles'),
                request('/api/admin/permissions')
            ]);

            if (rolesResponse.success) {
                setRoles(rolesResponse.roles);
            }

            if (permissionsResponse.success) {
                setPermissions(permissionsResponse.permissions);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showError("Failed to fetch roles and permissions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle role creation/update
    const handleSaveRole = async (formData: RoleFormData) => {
        try {
            const isEditing = !!editingRole;
            const url = isEditing
                ? `/api/admin/permissions/roles/${editingRole.id}`
                : '/api/admin/permissions/roles';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await request(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (response.success) {
                showSuccess(`Role ${isEditing ? 'updated' : 'created'} successfully`);
                setShowRoleForm(false);
                setEditingRole(null);
                fetchData();
            }
        } catch (error: any) {
            console.error('Error saving role:', error);
            showError(error.message || `Failed to ${editingRole ? 'update' : 'create'} role`);
        }
    };

    // Handle role deletion
    const handleDeleteRole = async (role: Role) => {
        if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            return;
        }

        try {
            const response = await request(`/api/admin/permissions/roles/${role.id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showSuccess("Role deleted successfully");
                fetchData();
            }
        } catch (error: any) {
            console.error('Error deleting role:', error);
            showError(error.message || "Failed to delete role");
        }
    };

    // Filter roles based on search term
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Get permission categories for filter
    const categories = Object.keys(permissions);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                        <p className="text-gray-600">Create and manage user roles and permissions</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingRole(null);
                        setShowRoleForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Role</span>
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <div
                        key={role.id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                                    {role.isSystem && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            System
                                        </span>
                                    )}
                                </div>
                                {role.description && (
                                    <p className="text-gray-600 text-sm mb-3">{role.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Shield className="w-4 h-4" />
                                        <span>{role.permissions.length} permissions</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{role.userCount} users</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setSelectedRole(role)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Shield className="w-4 h-4" />
                                </button>
                                {!role.isSystem && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingRole(role);
                                                setShowRoleForm(true);
                                            }}
                                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role)}
                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Role"
                                            disabled={role.userCount > 0}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Permission Preview */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Key Permissions:</h4>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.slice(0, 3).map((permission) => (
                                    <span
                                        key={permission.id}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                    >
                                        {permission.action}
                                    </span>
                                ))}
                                {role.permissions.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        +{role.permissions.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Form Modal */}
            {showRoleForm && (
                <RoleForm
                    role={editingRole}
                    permissions={permissions}
                    onClose={() => {
                        setShowRoleForm(false);
                        setEditingRole(null);
                    }}
                    onSave={handleSaveRole}
                />
            )}

            {/* Role Details Modal */}
            {selectedRole && (
                <RoleDetailsModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onEdit={() => {
                        setEditingRole(selectedRole);
                        setShowRoleForm(true);
                        setSelectedRole(null);
                    }}
                />
            )}
        </div>
    );
}

// Role Form Component
interface RoleFormProps {
    role?: Role | null;
    permissions: Record<string, Permission[]>;
    onClose: () => void;
    onSave: (formData: RoleFormData) => void;
}

function RoleForm({ role, permissions, onClose, onSave }: RoleFormProps) {
    const [formData, setFormData] = useState<RoleFormData>({
        name: role?.name || '',
        description: role?.description || '',
        permissions: role?.permissions.map(p => p.id) || []
    });
    const [selectedCategory, setSelectedCategory] = useState('all');

    const isEditing = !!role;
    const categories = Object.keys(permissions);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const togglePermission = (permissionId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

    const toggleCategory = (category: string) => {
        const categoryPermissions = permissions[category].map(p => p.id);
        const allSelected = categoryPermissions.every(id => formData.permissions.includes(id));

        if (allSelected) {
            // Remove all category permissions
            setFormData(prev => ({
                ...prev,
                permissions: prev.permissions.filter(id => !categoryPermissions.includes(id))
            }));
        } else {
            // Add all category permissions
            setFormData(prev => ({
                ...prev,
                permissions: Array.from(new Set([...prev.permissions, ...categoryPermissions]))
            }));
        }
    };

    const filteredPermissions = selectedCategory === 'all'
        ? permissions
        : { [selectedCategory]: permissions[selectedCategory] };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Edit Role' : 'Create New Role'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter role name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter role description"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(filteredPermissions).map(([category, categoryPermissions]) => {
                                    const categoryPermissionIds = categoryPermissions.map(p => p.id);
                                    const allSelected = categoryPermissionIds.every(id => formData.permissions.includes(id));
                                    const someSelected = categoryPermissionIds.some(id => formData.permissions.includes(id));

                                    return (
                                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900 capitalize">
                                                    {category.replace('_', ' ')}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategory(category)}
                                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${allSelected
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : someSelected
                                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {allSelected ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {categoryPermissions.map((permission) => (
                                                    <label
                                                        key={permission.id}
                                                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissions.includes(permission.id)}
                                                            onChange={() => togglePermission(permission.id)}
                                                            className="mt-1 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{permission.name}</div>
                                                            {permission.description && (
                                                                <div className="text-sm text-gray-500 mt-1">{permission.description}</div>
                                                            )}
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {permission.resource}.{permission.action}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {isEditing ? 'Update Role' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Role Details Modal Component
interface RoleDetailsModalProps {
    role: Role;
    onClose: () => void;
    onEdit: () => void;
}

function RoleDetailsModal({ role, onClose, onEdit }: RoleDetailsModalProps) {
    // Group permissions by category
    const permissionsByCategory = role.permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{role.name}</h2>
                        {role.description && (
                            <p className="text-gray-600 mt-1">{role.description}</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {!role.isSystem && (
                            <button
                                onClick={onEdit}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Edit Role
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
                    {/* Role Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{role.permissions.length}</div>
                            <div className="text-sm text-blue-700">Permissions</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{role.userCount}</div>
                            <div className="text-sm text-green-700">Users</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{Object.keys(permissionsByCategory).length}</div>
                            <div className="text-sm text-purple-700">Categories</div>
                        </div>
                    </div>

                    {/* Assigned Users */}
                    {role.users.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Users</h3>
                            <div className="space-y-2">
                                {role.users.map((user) => (
                                    <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-medium text-sm">
                                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name || user.email}</div>
                                            {user.name && <div className="text-sm text-gray-500">{user.email}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Permissions by Category */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Permissions</h3>
                        <div className="space-y-4">
                            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                                <div key={category} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                        {category.replace('_', ' ')} ({permissions.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                                    {permission.description && (
                                                        <div className="text-xs text-gray-500">{permission.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}