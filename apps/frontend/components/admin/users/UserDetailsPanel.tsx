"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Activity, Shield, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserActivityTimeline } from './UserActivityTimeline';
import { UserDataExport } from './UserDataExport';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

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
  lastLoginAt?: string;
  passwordChangedAt?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
  forcePasswordChange?: boolean;
  failedLoginAttempts?: number;
  lastFailedLoginAt?: string;
}

interface ActivityEvent {
  type: string;
  action: string;
  timestamp: string;
  metadata?: any;
  actor?: { id: string; email: string; name?: string };
}

interface UserDetails {
  user: User;
  activities: ActivityEvent[];
  roleAssignments: any[];
  impersonationSessions: any[];
  stats: {
    totalBookings: number;
    totalQuotes: number;
    totalMessages: number;
    totalRoleAssignments: number;
    totalImpersonationSessions: number;
    failedLoginAttempts: number;
    isLocked: boolean;
    lastLoginAt?: string;
    passwordChangedAt?: string;
  };
}

interface UserDetailsPanelProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export function UserDetailsPanel({ user, onClose, onEdit, onRefresh }: UserDetailsPanelProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDataExport, setShowDataExport] = useState(false);
  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await request(`/admin/users/${user.id}`);
      if (response.success) {
        setUserDetails(response);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      showError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async () => {
    const reason = prompt('Enter reason for locking this account:');
    if (!reason) return;

    try {
      const response = await request(`/admin/users/${user.id}/lock`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      if (response.success) {
        showSuccess('User account locked successfully');
        fetchUserDetails();
        onRefresh();
      }
    } catch (error) {
      showError('Failed to lock user account');
    }
  };

  const handleUnlockUser = async () => {
    const reason = prompt('Enter reason for unlocking this account:');
    if (!reason) return;

    try {
      const response = await request(`/admin/users/${user.id}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      if (response.success) {
        showSuccess('User account unlocked successfully');
        fetchUserDetails();
        onRefresh();
      }
    } catch (error) {
      showError('Failed to unlock user account');
    }
  };

  const getStatusBadge = () => {
    if (userDetails?.stats.isLocked) {
      return <Badge variant="destructive">Locked</Badge>;
    }
    if (user.role === 'SUSPENDED') {
      return <Badge variant="secondary">Suspended</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle>User Details</CardTitle>
            {getStatusBadge()}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900">{user.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                {userDetails?.stats.lastLoginAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-sm text-gray-900">
                      {new Date(userDetails.stats.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {userDetails?.stats.passwordChangedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Password Changed</label>
                    <p className="text-sm text-gray-900">
                      {new Date(userDetails.stats.passwordChangedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {userDetails && (
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userDetails.stats.totalBookings}</div>
                    <div className="text-sm text-gray-600">Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{userDetails.stats.totalQuotes}</div>
                    <div className="text-sm text-gray-600">Quotes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{userDetails.stats.totalMessages}</div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{userDetails.stats.failedLoginAttempts}</div>
                    <div className="text-sm text-gray-600">Failed Logins</div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => setShowDataExport(true)}>
                  Export Data
                </Button>
                <Button onClick={onEdit}>
                  Edit User
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading activity...</p>
                </div>
              ) : (
                <UserActivityTimeline 
                  activities={userDetails?.activities || []} 
                  loading={loading}
                />
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Account Status</h3>
                    <p className="text-sm text-gray-600">
                      {userDetails?.stats.isLocked ? 'Account is locked' : 'Account is active'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {userDetails?.stats.isLocked ? (
                      <Button variant="outline" size="sm" onClick={handleUnlockUser}>
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock Account
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleLockUser}>
                        <Lock className="w-4 h-4 mr-2" />
                        Lock Account
                      </Button>
                    )}
                  </div>
                </div>

                {userDetails?.stats.failedLoginAttempts > 0 && (
                  <div className="flex items-center p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Failed Login Attempts</h3>
                      <p className="text-sm text-yellow-700">
                        {userDetails.stats.failedLoginAttempts} failed login attempts detected
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Role Assignments</h3>
                    <p className="text-sm text-gray-600">
                      {userDetails?.stats.totalRoleAssignments || 0} role assignments
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Impersonation Sessions</h3>
                    <p className="text-sm text-gray-600">
                      {userDetails?.stats.totalImpersonationSessions || 0} sessions
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Export Modal */}
      {showDataExport && (
        <UserDataExport
          userId={user.id}
          userEmail={user.email}
          userName={user.name}
          onClose={() => setShowDataExport(false)}
        />
      )}
    </div>
  );
}