"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  MessageSquare,
  FileText,
  Activity,
  Edit,
  Shield,
  Clock
} from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { UserSuspensionWorkflow } from './UserSuspensionWorkflow';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  activatedAt?: string;
  activatedBy?: string;
  activationReason?: string;
  subscription?: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  };
}

interface Activity {
  type: 'booking' | 'quote' | 'message' | 'audit';
  action: string;
  timestamp: string;
  data: any;
}

interface UserStats {
  totalBookings: number;
  totalQuotes: number;
  totalMessages: number;
}

interface UserDetailsPanelProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export function UserDetailsPanel({ user, onClose, onEdit, onRefresh }: UserDetailsPanelProps) {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'subscription' | 'security'>('overview');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchUserDetails();
    getCurrentUser();
  }, [user.id]);

  const getCurrentUser = async () => {
    try {
      const response = await request('/auth/me');
      if (response.success) {
        setCurrentUserEmail(response.user.email);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
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
        fetchUserDetails();
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error suspending user:', error);
      showError(error.message || "Failed to suspend user");
      throw error;
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
        fetchUserDetails();
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error activating user:', error);
      showError(error.message || "Failed to activate user");
      throw error;
    }
  };

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await request(`/admin/users/${user.id}`);
      
      if (response.success) {
        setUserDetails(response.user);
        setActivities(response.activities || []);
        setStats(response.stats || { totalBookings: 0, totalQuotes: 0, totalMessages: 0 });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      showError("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'quote':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'audit':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'border-blue-200 bg-blue-50';
      case 'quote':
        return 'border-green-200 bg-green-50';
      case 'message':
        return 'border-purple-200 bg-purple-50';
      case 'audit':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {userDetails?.avatar ? (
                <img 
                  src={userDetails.avatar} 
                  alt={userDetails.name || userDetails.email}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {userDetails?.name || userDetails?.email}
              </h2>
              <p className="text-gray-600">{userDetails?.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              userDetails?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
              userDetails?.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
              userDetails?.role === 'SUSPENDED' ? 'bg-gray-100 text-gray-800' :
              'bg-green-100 text-green-800'
            }`}>
              {userDetails?.role}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity Timeline
          </button>
          {userDetails?.subscription && (
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'subscription'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Subscription
            </button>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Security & Access
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Information */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{userDetails?.email}</p>
                      </div>
                    </div>
                    {userDetails?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{userDetails.phone}</p>
                        </div>
                      </div>
                    )}
                    {userDetails?.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">
                            {userDetails.address}
                            {userDetails.postalCode && `, ${userDetails.postalCode}`}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Registered</p>
                        <p className="font-medium">{formatDate(userDetails?.createdAt || '')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium">{formatDate(userDetails?.updatedAt || '')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-bold text-blue-600">{stats?.totalBookings || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Quotes</span>
                      <span className="font-bold text-green-600">{stats?.totalQuotes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Messages</span>
                      <span className="font-bold text-purple-600">{stats?.totalMessages || 0}</span>
                    </div>
                  </div>
                </div>

                {userDetails?.subscription && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Subscription</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Plan</p>
                        <p className="font-medium">{userDetails.subscription.tier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userDetails.subscription.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.subscription.status}
                        </span>
                      </div>
                      {userDetails.subscription.currentPeriodEnd && (
                        <div>
                          <p className="text-sm text-gray-500">Next Billing</p>
                          <p className="font-medium">
                            {formatDate(userDetails.subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Activity Timeline</h3>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className={`flex items-start space-x-4 p-4 rounded-lg border ${getActivityColor(activity.type)}`}>
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.action}</p>
                        <span className="text-sm text-gray-500">{formatDate(activity.timestamp)}</span>
                      </div>
                      {activity.data && (
                        <div className="mt-2 text-sm text-gray-600">
                          <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(activity.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activity found for this user</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subscription' && userDetails?.subscription && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Subscription Details</h3>
              <div className="bg-white border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Subscription ID</p>
                    <p className="font-mono text-sm">{userDetails.subscription.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plan</p>
                    <p className="font-medium">{userDetails.subscription.tier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userDetails.subscription.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userDetails.subscription.status}
                    </span>
                  </div>
                  {userDetails.subscription.currentPeriodStart && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Period Start</p>
                      <p className="font-medium">{formatDate(userDetails.subscription.currentPeriodStart)}</p>
                    </div>
                  )}
                  {userDetails.subscription.currentPeriodEnd && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Period End</p>
                      <p className="font-medium">{formatDate(userDetails.subscription.currentPeriodEnd)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Security & Access Management</h3>
              
              {/* Account Status & Suspension Workflow */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4">Account Status Management</h4>
                <UserSuspensionWorkflow
                  user={userDetails || user}
                  currentUserEmail={currentUserEmail}
                  onSuspend={handleSuspendUser}
                  onActivate={handleActivateUser}
                  loading={loading}
                />
              </div>

              {/* Role Information */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4">Role & Permissions</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Role</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userDetails?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      userDetails?.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                      userDetails?.role === 'SUSPENDED' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {userDetails?.role}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Created</p>
                      <p className="font-medium">{formatDate(userDetails?.createdAt || '')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="font-medium">{formatDate(userDetails?.updatedAt || '')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Actions */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4">Security Actions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Password Reset</p>
                      <p className="text-sm text-gray-600">Reset the user's password</p>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Reset Password
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Force Logout</p>
                      <p className="text-sm text-gray-600">Force logout from all devices</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      Force Logout
                    </button>
                  </div>
                  
                  {userDetails?.role !== 'SUSPENDED' && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-800">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete this user account</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}