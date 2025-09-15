"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  LogOut, 
  AlertTriangle, 
  Clock, 
  User,
  Eye,
  Shield,
  X
} from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface ImpersonationSession {
  id: string;
  targetUser: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
  startedAt: string;
  reason: string;
}

interface ImpersonationStatus {
  isImpersonating: boolean;
  session?: ImpersonationSession;
  originalAdmin?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface UserImpersonationProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  onImpersonationStart?: () => void;
  onImpersonationEnd?: () => void;
}

export function UserImpersonation({ 
  userId, 
  userEmail, 
  userName,
  onImpersonationStart,
  onImpersonationEnd 
}: UserImpersonationProps) {
  const [status, setStatus] = useState<ImpersonationStatus>({ isImpersonating: false });
  const [loading, setLoading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Check impersonation status
  const checkStatus = async () => {
    try {
      const response = await request('/admin/impersonation/status');
      if (response.success) {
        setStatus(response);
      }
    } catch (error) {
      console.error('Error checking impersonation status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Start impersonation
  const startImpersonation = async (targetUserId: string, reason: string) => {
    try {
      setLoading(true);
      const response = await request('/admin/impersonation/start', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          reason
        })
      });

      if (response.success) {
        // Store the impersonation token
        if (response.impersonationToken) {
          localStorage.setItem('auth_token', response.impersonationToken);
          // Also set as cookie for API requests
          document.cookie = `auth_token=${response.impersonationToken}; path=/; max-age=14400`; // 4 hours
        }

        showSuccess(`Impersonation started - Now viewing as ${response.session.targetUser.email}`);

        setShowStartForm(false);
        checkStatus();
        onImpersonationStart?.();

        // Reload the page to apply impersonation
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      showError(error.message || "Failed to start impersonation");
    } finally {
      setLoading(false);
    }
  };

  // End impersonation
  const endImpersonation = async () => {
    try {
      setLoading(true);
      const response = await request('/admin/impersonation/end', {
        method: 'POST'
      });

      if (response.success) {
        // Restore original token
        if (response.originalToken) {
          localStorage.setItem('auth_token', response.originalToken);
          document.cookie = `auth_token=${response.originalToken}; path=/; max-age=86400`; // 24 hours
        }

        showSuccess("Impersonation ended - Returned to your original account");

        checkStatus();
        onImpersonationEnd?.();

        // Reload the page to apply changes
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error ending impersonation:', error);
      showError(error.message || "Failed to end impersonation");
    } finally {
      setLoading(false);
    }
  };

  // If currently impersonating, show the impersonation banner
  if (status.isImpersonating && status.session) {
    return (
      <ImpersonationBanner
        session={status.session}
        originalAdmin={status.originalAdmin}
        onEnd={endImpersonation}
        loading={loading}
      />
    );
  }

  // If userId is provided, show impersonation button
  if (userId) {
    return (
      <>
        <button
          onClick={() => setShowStartForm(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          title="Impersonate User"
        >
          <UserCheck className="w-4 h-4" />
          <span>Impersonate</span>
        </button>

        {showStartForm && (
          <ImpersonationStartForm
            targetUserId={userId}
            targetUserEmail={userEmail || ''}
            targetUserName={userName}
            onStart={startImpersonation}
            onClose={() => setShowStartForm(false)}
            loading={loading}
          />
        )}
      </>
    );
  }

  return null;
}

// Impersonation Banner Component
interface ImpersonationBannerProps {
  session: ImpersonationSession;
  originalAdmin?: {
    id: string;
    email: string;
    name?: string;
  };
  onEnd: () => void;
  loading: boolean;
}

function ImpersonationBanner({ session, originalAdmin, onEnd, loading }: ImpersonationBannerProps) {
  const duration = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60);

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-3 z-50 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">IMPERSONATING USER</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>
                {session.targetUser.name || session.targetUser.email}
                <span className="ml-1 text-yellow-700">({session.targetUser.role})</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{duration} min{duration !== 1 ? 's' : ''} ago</span>
            </div>

            {originalAdmin && (
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Original: {originalAdmin.name || originalAdmin.email}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onEnd}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{loading ? 'Ending...' : 'End Impersonation'}</span>
        </button>
      </div>
    </div>
  );
}

// Impersonation Start Form Component
interface ImpersonationStartFormProps {
  targetUserId: string;
  targetUserEmail: string;
  targetUserName?: string;
  onStart: (userId: string, reason: string) => void;
  onClose: () => void;
  loading: boolean;
}

function ImpersonationStartForm({ 
  targetUserId, 
  targetUserEmail, 
  targetUserName, 
  onStart, 
  onClose, 
  loading 
}: ImpersonationStartFormProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onStart(targetUserId, reason.trim());
    }
  };

  const reasonOptions = [
    'Customer support assistance',
    'Technical troubleshooting',
    'Account verification',
    'Billing inquiry resolution',
    'Feature demonstration',
    'Bug investigation',
    'Data verification',
    'Other (specify below)'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Start Impersonation</h3>
              <p className="text-sm text-gray-600">
                {targetUserName || targetUserEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Important Notice</p>
                <p className="text-yellow-700">
                  You are about to impersonate another user. All actions performed will be logged 
                  and attributed to your admin account. Use this feature responsibly and only 
                  for legitimate support purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Impersonation *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              required
            >
              <option value="">Select a reason...</option>
              {reasonOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason */}
          {reason === 'Other (specify below)' && (
            <div>
              <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                Please specify the reason
              </label>
              <textarea
                id="customReason"
                value={reason === 'Other (specify below)' ? '' : reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                rows={3}
                placeholder="Describe the specific reason for impersonation..."
                required
              />
            </div>
          )}

          {/* Target User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Target User</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">Email:</span> {targetUserEmail}</div>
              {targetUserName && (
                <div><span className="font-medium">Name:</span> {targetUserName}</div>
              )}
              <div><span className="font-medium">User ID:</span> {targetUserId}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting...' : 'Start Impersonation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Impersonation History Component
export function ImpersonationHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });

  const { request } = useApi();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await request(`/admin/impersonation/history?${params}`);
      
      if (response.success) {
        setSessions(response.sessions);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching impersonation history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pagination.page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Impersonation History</h3>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No impersonation sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {session.admin.name || session.admin.email}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900">
                      {session.targetUser.name || session.targetUser.email}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{session.reason}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
                    {session.endedAt && (
                      <span>Ended: {new Date(session.endedAt).toLocaleString()}</span>
                    )}
                    {session.ipAddress && (
                      <span>IP: {session.ipAddress}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}