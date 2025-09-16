"use client";

import React from 'react';
import { UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserImpersonationProps {
  userId: string;
  userEmail: string;
  userName?: string;
}

export function UserImpersonation({ userId, userEmail, userName }: UserImpersonationProps) {
  const handleImpersonate = () => {
    console.log('Impersonating user:', userId);
    // In a real implementation, this would start impersonation
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleImpersonate}
      className="p-1 text-purple-600 hover:text-purple-800"
      title="Impersonate User"
    >
      <UserCheck className="w-4 h-4" />
    </Button>
  );
}