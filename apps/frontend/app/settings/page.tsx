"use client";

import React, { useState } from 'react';
import { useCurrentUser, useUpdateProfile, useChangePassword, useUpdateNotifications, useDeleteAccount } from '@/hooks/use-api';
import { Button, Input } from '@/components/ui/shared';
import { Label } from '@/components/ui/shared';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateNotifications = useUpdateNotifications();
  const deleteAccount = useDeleteAccount();

  const user = userData?.user;
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [notifications, setNotifications] = useState({
    email: (user && (user as any).notifications?.email) ?? true,
    sms: (user && (user as any).notifications?.sms) ?? false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profile, {
      onSuccess: () => toast.success('Profile updated!'),
      onError: err => toast.error(err.message),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill out both fields.');
      return;
    }
    changePassword.mutate(passwords, {
      onSuccess: () => toast.success('Password changed!'),
      onError: err => toast.error(err.message),
    });
  };

  const handleNotificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateNotifications.mutate({ notifications }, {
      onSuccess: () => toast.success('Notification preferences updated!'),
      onError: err => toast.error(err.message),
    });
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm.');
      return;
    }
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        toast.success('Account deleted.');
        window.location.href = '/';
      },
      onError: err => toast.error(err.message),
    });
  };

  if (isLoading) return <div className="container mx-auto py-10">Loading...</div>;

  return (
    <main className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Profile Info */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input name="name" value={profile.name} onChange={handleProfileChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input name="email" value={profile.email} onChange={handleProfileChange} type="email" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input name="phone" value={profile.phone} onChange={handleProfileChange} />
          </div>
          <div>
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input name="avatar" value={profile.avatar} onChange={handleProfileChange} />
          </div>
          <Button type="submit">{updateProfile.isPending ? 'Saving...' : 'Save Profile'}</Button>
        </form>
      </section>

      {/* Change Password */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} type="password" />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} type="password" />
          </div>
          <Button type="submit">{changePassword.isPending ? 'Changing...' : 'Change Password'}</Button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Notification Preferences</h2>
        <form onSubmit={handleNotificationsSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="checkbox" id="email" name="email" checked={notifications.email} onChange={handleNotificationsChange} />
            <Label htmlFor="email">Email Notifications</Label>
          </div>
          <div className="flex items-center gap-4">
            <input type="checkbox" id="sms" name="sms" checked={notifications.sms} onChange={handleNotificationsChange} />
            <Label htmlFor="sms">SMS Notifications</Label>
          </div>
          <Button type="submit">{updateNotifications.isPending ? 'Saving...' : 'Save Preferences'}</Button>
        </form>
      </section>

      {/* Delete Account */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Delete Account</h2>
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <p className="text-sm text-gray-600">This action is irreversible. Type <span className="font-bold">DELETE</span> to confirm.</p>
          <Input name="deleteConfirm" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
          <Button type="submit" variant="destructive">{deleteAccount.isPending ? 'Deleting...' : 'Delete Account'}</Button>
        </form>
      </section>
    </main>
  );
} 