"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
}

interface UserDetailsPanelProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export function UserDetailsPanel({ user, onClose, onEdit, onRefresh }: UserDetailsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
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
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              Edit User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}