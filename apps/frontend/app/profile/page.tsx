'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Input } from '@/components/ui/shared';
import { Label } from '@/components/ui/shared';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Edit3,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: userData, isLoading, refetch } = useCurrentUser();
  const { isAuthenticated } = useAuth();
  const user = userData?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    postalCode: ''
  });

  useEffect(() => {
    if (user) {
      console.log('User data loaded:', user);
      console.log('User postal code:', user.postalCode);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        postalCode: user.postalCode || ''
      });
      console.log('Form data initialized:', {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        postalCode: user.postalCode || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating field: ${field} with value: ${value}`);
    console.log(`Previous form data:`, formData);
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log(`New form data:`, newData);
      return newData;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    // Debug logging
    console.log('Saving profile data:', formData);
    console.log('Postal code value:', formData.postalCode);
    
    try {
      const response = await api.updateProfile(formData);
      console.log('Profile update response:', response);
      setSaveStatus('success');
      setIsEditing(false);
      refetch(); // Refresh user data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      postalCode: user?.postalCode || ''
    });
    setIsEditing(false);
    setSaveStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Fixwell</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to view your profile.
          </p>
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/customer">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
              <p className="text-gray-600 mt-2">
                Manage your personal information and preferences
              </p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Profile updated successfully!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to update profile. Please try again.</span>
          </div>
        )}

        {/* Profile Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your contact information and address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your email address"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full address"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Postal Code
              </Label>
              <Input
                id="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your postal code"
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="max-w-2xl mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and subscription information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-600">Account Type</span>
              <span className="text-sm text-gray-900 capitalize">{user.role.toLowerCase()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-600">Member Since</span>
              <span className="text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">Account Status</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 