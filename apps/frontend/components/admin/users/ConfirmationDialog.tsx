"use client";

import React, { useState } from 'react';
import { AlertTriangle, X, Shield, Lock, Trash2, UserX, UserCheck, Key } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  title: string;
  message: string | React.ReactNode;
  type: 'delete' | 'suspend' | 'activate' | 'reset-password' | 'role-change' | 'self-modification';
  userEmail?: string;
  userName?: string;
  currentUserEmail?: string;
  requireReason?: boolean;
  requirePassword?: boolean;
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  userEmail,
  userName,
  currentUserEmail,
  requireReason = false,
  requirePassword = false,
  loading = false
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState<{ reason?: string; password?: string; confirmText?: string }>({});

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'suspend':
        return <UserX className="w-6 h-6 text-yellow-600" />;
      case 'activate':
        return <UserCheck className="w-6 h-6 text-green-600" />;
      case 'reset-password':
        return <Key className="w-6 h-6 text-purple-600" />;
      case 'role-change':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'self-modification':
        return <Lock className="w-6 h-6 text-red-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'delete':
      case 'self-modification':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700',
          text: 'text-red-800'
        };
      case 'suspend':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          text: 'text-yellow-800'
        };
      case 'activate':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          button: 'bg-green-600 hover:bg-green-700',
          text: 'text-green-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-800'
        };
    }
  };

  const colors = getColorClasses();

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (requireReason && !reason.trim()) {
      newErrors.reason = 'Reason is required for this action';
    }

    if (requirePassword && !password.trim()) {
      newErrors.password = 'Password is required for this action';
    }

    // For self-modification protection, require typing the user's email
    if (type === 'self-modification' && userEmail && confirmText !== userEmail) {
      newErrors.confirmText = `Please type "${userEmail}" to confirm`;
    }

    // For critical operations, require typing "DELETE" or similar
    if ((type === 'delete' || type === 'suspend') && confirmText.toUpperCase() !== type.toUpperCase()) {
      newErrors.confirmText = `Please type "${type.toUpperCase()}" to confirm`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    const data: any = {};
    if (requireReason) data.reason = reason;
    if (requirePassword) data.password = password;

    onConfirm(data);
  };

  const requiresConfirmText = type === 'delete' || type === 'suspend' || type === 'self-modification';
  const expectedConfirmText = type === 'self-modification' ? userEmail : type.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${colors.border} ${colors.bg}`}>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h2 className={`text-lg font-semibold ${colors.text}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">{message}</p>

          {/* User Info */}
          {(userEmail || userName) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Target User:</p>
              <p className="font-medium text-gray-900">
                {userName && `${userName} `}
                {userEmail && `(${userEmail})`}
              </p>
            </div>
          )}

          {/* Self-modification warning */}
          {type === 'self-modification' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning: Self-Modification</p>
                  <p className="text-sm text-red-700 mt-1">
                    You are attempting to modify your own account. This action could potentially lock you out of the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current user info for self-modification protection */}
          {currentUserEmail && userEmail === currentUserEmail && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Self-Modification Protection</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Additional confirmation required when modifying your own account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason input */}
          {requireReason && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for this action *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors(prev => ({ ...prev, reason: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Please provide a detailed reason for this action..."
                disabled={loading}
              />
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            </div>
          )}

          {/* Password input */}
          {requirePassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
                disabled={loading}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Confirmation text input */}
          {requiresConfirmText && (
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                Type "{expectedConfirmText}" to confirm *
              </label>
              <input
                type="text"
                id="confirmText"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  if (errors.confirmText) setErrors(prev => ({ ...prev, confirmText: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmText ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={expectedConfirmText}
                disabled={loading}
              />
              {errors.confirmText && <p className="text-red-500 text-sm mt-1">{errors.confirmText}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (requiresConfirmText && confirmText !== expectedConfirmText)}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors.button}`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}