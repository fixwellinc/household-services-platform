"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Shield, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

interface UserRole {
  id: string;
  roleId: string;
  role: Role;
  assignedBy: string;
  assignedByUser: {
    id: string;
    email: string;
    name?: string;
  };
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface UserRoleAssignmentProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserRoleAssignment({ userId, userEmail, userName, onClose, onUpdate }: UserRoleAssignmentProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, userRolesResponse] = await Promise.all([
        request('/admin/roles'),
        request(`/admin/users/${userId}/roles`)
      ]);

      if (rolesResponse.success) {
        setAvailableRoles(rolesResponse.roles || []);
      }

      if (userRolesResponse.success) {
        setUserRoles(userRolesResponse.roles || []);
      }
    } catch (error) {
      console.error('Error fetching role data:', error);
      showError('Failed to fetch role information');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) {
      showError('Please select a role');
      return;
    }

    try {
      setAssigning(true);
      const response = await request(`/admin/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({
          roleId: selectedRole,
          expiresAt: expirationDate || null
        })
      });

      if (response.success) {
        showSuccess('Role assigned successfully');
        setSelectedRole('');
        setExpirationDate('');
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      showError('Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) {
      return;
    }

    try {
      const response = await request(`/admin/users/${userId}/roles/${userRoleId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        showSuccess('Role removed successfully');
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing role:', error);
      showError('Failed to remove role');
    }
  };

  const getAvailableRolesForAssignment = () => {
    const assignedRoleIds = userRoles.map(ur => ur.roleId);
    return availableRoles.filter(role => !assignedRoleIds.includes(role.id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manage User Roles</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading role information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Manage User Roles</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">{userName || userEmail}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Current Role Assignments */}
          <div>
            <h3 className="text-lg font-medium mb-4">Current Role Assignments</h3>
            {userRoles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No role assignments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userRoles.map((userRole) => (
                  <div key={userRole.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge variant={userRole.role.isSystem ? "default" : "secondary"}>
                          {userRole.role.name}
                        </Badge>
                        {isExpired(userRole.expiresAt) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {!userRole.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      {userRole.role.description && (
                        <p className="text-sm text-gray-600 mt-1">{userRole.role.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Assigned by: {userRole.assignedByUser.name || userRole.assignedByUser.email}</span>
                        <span>Assigned: {formatDate(userRole.assignedAt)}</span>
                        {userRole.expiresAt && (
                          <span>Expires: {formatDate(userRole.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Role */}
          <div>
            <h3 className="text-lg font-medium mb-4">Assign New Role</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-select">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRolesForAssignment().map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          <span>{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiration-date">Expiration Date (Optional)</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent assignment
                </p>
              </div>

              <Button
                onClick={handleAssignRole}
                disabled={!selectedRole || assigning}
                className="w-full"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Role
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}