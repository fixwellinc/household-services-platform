"use client";

import React, { useState } from 'react';
import { UserX, UserCheck, Clock, AlertTriangle, User, Calendar, MessageSquare } from 'lucide-react';
import { ConfirmationDialog } from './ConfirmationDialog';

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    suspendedAt?: string;
    suspendedBy?: string;
    suspensionReason?: string;
    activatedAt?: string;
    activatedBy?: string;
    activationReason?: string;
}

interface UserSuspensionWorkflowProps {
    user: User;
    currentUserEmail: string;
    onSuspend: (userId: string, reason: string) => Promise<void>;
    onActivate: (userId: string, reason: string, newRole: string) => Promise<void>;
    loading?: boolean;
}

export function UserSuspensionWorkflow({
    user,
    currentUserEmail,
    onSuspend,
    onActivate,
    loading = false
}: UserSuspensionWorkflowProps) {
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState('CUSTOMER');

    const isSuspended = user.role === 'SUSPENDED';
    const isSelfAction = user.email === currentUserEmail;

    const handleSuspend = async (data: { reason: string }) => {
        try {
            await onSuspend(user.id, data.reason);
            setShowSuspendDialog(false);
        } catch (error) {
            // Error handling is done in parent component
        }
    };

    const handleActivate = async (data: { reason: string }) => {
        try {
            await onActivate(user.id, data.reason, selectedRole);
            setShowActivateDialog(false);
        } catch (error) {
            // Error handling is done in parent component
        }
    };

    const roleOptions = [
        { value: 'CUSTOMER', label: 'Customer', description: 'Regular customer access' },
        { value: 'EMPLOYEE', label: 'Employee', description: 'Employee access with extended permissions' },
        { value: 'ADMIN', label: 'Administrator', description: 'Full administrative access' }
    ];

    return (
        <div className="space-y-4">
            {/* Current Status */}
            <div className={`p-4 rounded-lg border ${isSuspended
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center space-x-3">
                    {isSuspended ? (
                        <UserX className="w-5 h-5 text-red-600" />
                    ) : (
                        <UserCheck className="w-5 h-5 text-green-600" />
                    )}
                    <div className="flex-1">
                        <h3 className={`font-medium ${isSuspended ? 'text-red-800' : 'text-green-800'
                            }`}>
                            Account Status: {isSuspended ? 'Suspended' : 'Active'}
                        </h3>
                        <p className={`text-sm ${isSuspended ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {isSuspended
                                ? 'This user account is currently suspended and cannot access the system'
                                : 'This user account is active and can access the system normally'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Suspension History */}
            {(user.suspendedAt || user.activatedAt) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Account History</span>
                    </h4>
                    <div className="space-y-3">
                        {user.suspendedAt && (
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                            Suspended on {new Date(user.suspendedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {user.suspensionReason && (
                                        <div className="flex items-start space-x-2 mt-1">
                                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                            <p className="text-sm text-gray-600">{user.suspensionReason}</p>
                                        </div>
                                    )}
                                    {user.suspendedBy && (
                                        <div className="flex items-center space-x-2 mt-1">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">by Admin ID: {user.suspendedBy}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {user.activatedAt && (
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                            Activated on {new Date(user.activatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {user.activationReason && (
                                        <div className="flex items-start space-x-2 mt-1">
                                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                            <p className="text-sm text-gray-600">{user.activationReason}</p>
                                        </div>
                                    )}
                                    {user.activatedBy && (
                                        <div className="flex items-center space-x-2 mt-1">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">by Admin ID: {user.activatedBy}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Self-Action Warning */}
            {isSelfAction && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-yellow-800">Self-Modification Warning</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                You are about to modify your own account. {isSuspended ? 'Activating' : 'Suspending'} your own account
                                {isSuspended ? ' will restore your access.' : ' will immediately log you out and prevent future access.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
                {isSuspended ? (
                    <button
                        onClick={() => setShowActivateDialog(true)}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>Activate Account</span>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowSuspendDialog(true)}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <UserX className="w-4 h-4" />
                        <span>Suspend Account</span>
                    </button>
                )}
            </div>

            {/* Suspend Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showSuspendDialog}
                onClose={() => setShowSuspendDialog(false)}
                onConfirm={handleSuspend}
                title="Suspend User Account"
                message={`Are you sure you want to suspend ${user.name || user.email}? This will immediately prevent them from accessing the system.`}
                type={isSelfAction ? 'self-modification' : 'suspend'}
                userEmail={user.email}
                userName={user.name}
                currentUserEmail={currentUserEmail}
                requireReason={true}
                loading={loading}
            />

            {/* Activate Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showActivateDialog}
                onClose={() => setShowActivateDialog(false)}
                onConfirm={handleActivate}
                title="Activate User Account"
                message={
                    <div className="space-y-4">
                        <p>Are you sure you want to activate {user.name || user.email}? This will restore their access to the system.</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Role for Activated User
                            </label>
                            <div className="space-y-2">
                                {roleOptions.map((option) => (
                                    <label key={option.value} className="flex items-start space-x-3 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="activationRole"
                                            value={option.value}
                                            checked={selectedRole === option.value}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="mt-1 text-green-600 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">{option.label}</span>
                                            <p className="text-sm text-gray-500">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                }
                type={isSelfAction ? 'self-modification' : 'activate'}
                userEmail={user.email}
                userName={user.name}
                currentUserEmail={currentUserEmail}
                requireReason={true}
                loading={loading}
            />
        </div>
    );
}