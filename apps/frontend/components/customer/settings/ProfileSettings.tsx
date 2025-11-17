'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shared';
import { Button, Input } from '@/components/ui/shared';
import { User, Mail, Phone, MapPin, Upload, Loader2 } from 'lucide-react';
import { useCustomerProfile, useUpdateCustomerProfile } from '@/hooks/use-customer-profile';
import { useAuth } from '@/contexts/AuthContext';

export function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useCustomerProfile();
  const updateMutation = useUpdateCustomerProfile();

  const [formData, setFormData] = useState({
    name: profile?.data?.name || user?.name || '',
    phone: profile?.data?.phone || user?.phone || '',
    address: profile?.data?.address || user?.address || '',
    postalCode: profile?.data?.postalCode || user?.postalCode || '',
    avatar: profile?.data?.avatar || user?.avatar || '',
  });

  React.useEffect(() => {
    if (profile?.data) {
      setFormData({
        name: profile.data.name || '',
        phone: profile.data.phone || '',
        address: profile.data.address || '',
        postalCode: profile.data.postalCode || '',
        avatar: profile.data.avatar || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, this would upload to a file storage service
    // For now, we'll just update the form data with a placeholder
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        avatar: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Update your personal information and account details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={profile?.data?.email || user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Address
            </label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your address"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <Input
              id="postalCode"
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
              placeholder="Enter your postal code"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

