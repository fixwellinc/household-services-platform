"use client";

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  title: string;
  message: string;
  type?: 'delete' | 'reset-password' | 'self-modification';
  userEmail?: string;
  userName?: string;
  currentUserEmail?: string;
  requirePassword?: boolean;
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'delete',
  userEmail,
  userName,
  currentUserEmail,
  requirePassword = false,
  loading = false
}: ConfirmationDialogProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requirePassword) {
      onConfirm({ password });
    } else {
      onConfirm();
    }
    setPassword('');
  };

  const isSelfModification = userEmail === currentUserEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          
          {isSelfModification && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ You are about to modify your own account. Please proceed with caution.
              </p>
            </div>
          )}

          {requirePassword && (
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm} 
              disabled={loading || (requirePassword && !password.trim())}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}