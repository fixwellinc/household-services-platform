"use client";

import React from 'react';
import { UserManagement } from '@/components/admin/users/UserManagement';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export default function AdminUsersPage() {
  return (
    <AdminErrorBoundary>
      <UserManagement />
    </AdminErrorBoundary>
  );
}