"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    Mail,
    UserCheck,
    DollarSign,
    Target,
    MapPin,
    MessageSquare,
    Save,
    Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui/shared';

interface Salesman {
    id: string;
    userId: string;
    user: {
        id: string;
        email: string;
        name: string;
        phone?: string;
        createdAt: string;
    };
    referralCode: string;
    displayName: string;
    personalMessage?: string;
    commissionTier: string;
    territoryPostalCodes: string[];
    territoryRegions: string[];
    monthlyTarget: number;
    quarterlyTarget: number;
    yearlyTarget: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
    adminNotes?: string;
    terminationReason?: string;
    suspensionReason?: string;
    startDate: string;
    createdAt: string;
}

interface SalesmanFormProps {
    salesman?: Salesman | null;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export function SalesmanForm({ salesman, onSubmit, onCancel }: SalesmanFormProps) {
    const [formData, setFormData] = useState({
        userId: salesman?.userId || '',
        displayName: salesman?.displayName || '',
        personalMessage: salesman?.personalMessage || '',
        commissionTier: salesman?.commissionTier || 'BRONZE',
        territoryPostalCodes: salesman?.territoryPostalCodes || [],
        territoryRegions: salesman?.territoryRegions || [],
        monthlyTarget: salesman?.monthlyTarget || 1000,
        quarterlyTarget: salesman?.quarterlyTarget || 3000,
        yearlyTarget: salesman?.yearlyTarget || 12000,
        status: salesman?.status || 'ACTIVE',
        adminNotes: salesman?.adminNotes || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(
        salesman?.user ? {
            id: salesman.user.id,
            email: salesman.user.email,
            name: salesman.user.name,
            role: 'CUSTOMER' // Default role
        } : null
    );
    const [postalCodeInput, setPostalCodeInput] = useState('');
    const [regionInput, setRegionInput] = useState('');

    // Search for users when creating new salesman
    const searchUsers = async (query: string) => {
        if (!query.trim() || salesman) return; // Don't search when editing

        try {
            setSearchingUsers(true);
            // Search for both CUSTOMER and EMPLOYEE roles that can be converted to SALESMAN
            const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}&roles=CUSTOMER,EMPLOYEE`);
            const result = await response.json();

            if (result.success) {
                // Filter out users who are already salesmen or admins
                const eligibleUsers = (result.data || []).filter((user: User) =>
                    user.role === 'CUSTOMER' || user.role === 'EMPLOYEE'
                );
                setAvailableUsers(eligibleUsers);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchingUsers(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (userSearch && !salesman) {
                searchUsers(userSearch);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [userSearch, salesman]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const addPostalCode = () => {
        if (postalCodeInput.trim() && !formData.territoryPostalCodes.includes(postalCodeInput.trim())) {
            handleInputChange('territoryPostalCodes', [...formData.territoryPostalCodes, postalCodeInput.trim()]);
            setPostalCodeInput('');
        }
    };

    const removePostalCode = (code: string) => {
        handleInputChange('territoryPostalCodes', formData.territoryPostalCodes.filter(c => c !== code));
    };

    const addRegion = () => {
        if (regionInput.trim() && !formData.territoryRegions.includes(regionInput.trim())) {
            handleInputChange('territoryRegions', [...formData.territoryRegions, regionInput.trim()]);
            setRegionInput('');
        }
    };

    const removeRegion = (region: string) => {
        handleInputChange('territoryRegions', formData.territoryRegions.filter(r => r !== region));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!salesman && !selectedUser) {
            newErrors.userId = 'Please select a user';
        }

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        if (formData.monthlyTarget <= 0) {
            newErrors.monthlyTarget = 'Monthly target must be greater than 0';
        }

        if (formData.quarterlyTarget <= 0) {
            newErrors.quarterlyTarget = 'Quarterly target must be greater than 0';
        }

        if (formData.yearlyTarget <= 0) {
            newErrors.yearlyTarget = 'Yearly target must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);

            const submitData = {
                ...formData,
                userId: selectedUser?.id || formData.userId
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const commissionTiers = [
        { value: 'BRONZE', label: 'Bronze (5%)', description: 'Entry level commission' },
        { value: 'SILVER', label: 'Silver (7.5%)', description: 'Mid-tier commission' },
        { value: 'GOLD', label: 'Gold (10%)', description: 'High performance commission' },
        { value: 'PLATINUM', label: 'Platinum (12.5%)', description: 'Top tier commission' }
    ];

    const statusOptions = [
        { value: 'ACTIVE', label: 'Active', description: 'Salesman can receive referrals' },
        { value: 'INACTIVE', label: 'Inactive', description: 'Salesman cannot receive new referrals' },
        { value: 'SUSPENDED', label: 'Suspended', description: 'Salesman account is suspended' },
        { value: 'TERMINATED', label: 'Terminated', description: 'Employment permanently ended' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {salesman ? 'Edit Salesman' : 'Create New Salesman'}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {salesman ? 'Update salesman information and settings' : 'Set up a new salesman account'}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={onCancel}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* User Selection (for new salesman only) */}
                    {!salesman && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Select User
                                </CardTitle>
                                <CardDescription>
                                    Search and select an existing customer or employee to convert to salesman
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!selectedUser ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search customers and employees by name or email..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {searchingUsers && (
                                            <p className="text-sm text-gray-600">Searching users...</p>
                                        )}

                                        {availableUsers.length > 0 && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {availableUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        onClick={() => setSelectedUser(user)}
                                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{user.name}</p>
                                                            <p className="text-sm text-gray-600">{user.email}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge
                                                                variant="outline"
                                                                className={user.role === 'EMPLOYEE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                                                            >
                                                                {user.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {userSearch && !searchingUsers && availableUsers.length === 0 && (
                                            <p className="text-sm text-gray-600">No users found. Try a different search term.</p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between p-3 border border-green-200 rounded-md bg-green-50">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {selectedUser.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-900">{selectedUser.name}</p>
                                                <p className="text-sm text-green-700">{selectedUser.email}</p>
                                                <Badge variant="outline" className="mt-1 bg-white text-green-800 border-green-300">
                                                    Current: {selectedUser.role}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedUser(null)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                )}

                                {errors.userId && (
                                    <p className="text-sm text-red-600">{errors.userId}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter display name for salesman"
                                />
                                {errors.displayName && (
                                    <p className="text-sm text-red-600 mt-1">{errors.displayName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Personal Message
                                </label>
                                <textarea
                                    value={formData.personalMessage}
                                    onChange={(e) => handleInputChange('personalMessage', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional personal message for referral pages"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} - {option.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={formData.adminNotes}
                                    onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Internal notes about this salesman (visible only to admins)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    These notes are for internal use only and not visible to the salesman.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Commission & Targets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Commission & Targets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commission Tier
                                </label>
                                <select
                                    value={formData.commissionTier}
                                    onChange={(e) => handleInputChange('commissionTier', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {commissionTiers.map((tier) => (
                                        <option key={tier.value} value={tier.value}>
                                            {tier.label} - {tier.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Monthly Target ($) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={formData.monthlyTarget}
                                        onChange={(e) => handleInputChange('monthlyTarget', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.monthlyTarget && (
                                        <p className="text-sm text-red-600 mt-1">{errors.monthlyTarget}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quarterly Target ($) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={formData.quarterlyTarget}
                                        onChange={(e) => handleInputChange('quarterlyTarget', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.quarterlyTarget && (
                                        <p className="text-sm text-red-600 mt-1">{errors.quarterlyTarget}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Yearly Target ($) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={formData.yearlyTarget}
                                        onChange={(e) => handleInputChange('yearlyTarget', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.yearlyTarget && (
                                        <p className="text-sm text-red-600 mt-1">{errors.yearlyTarget}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Territory */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Territory (Optional)
                            </CardTitle>
                            <CardDescription>
                                Define postal codes and regions for this salesman's territory
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Postal Codes
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={postalCodeInput}
                                        onChange={(e) => setPostalCodeInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPostalCode())}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter postal code and press Enter"
                                    />
                                    <Button type="button" onClick={addPostalCode} variant="outline">
                                        Add
                                    </Button>
                                </div>
                                {formData.territoryPostalCodes.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.territoryPostalCodes.map((code, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="flex items-center gap-1 cursor-pointer"
                                                onClick={() => removePostalCode(code)}
                                            >
                                                {code}
                                                <X className="h-3 w-3" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Regions
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={regionInput}
                                        onChange={(e) => setRegionInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter region name and press Enter"
                                    />
                                    <Button type="button" onClick={addRegion} variant="outline">
                                        Add
                                    </Button>
                                </div>
                                {formData.territoryRegions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.territoryRegions.map((region, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="flex items-center gap-1 cursor-pointer"
                                                onClick={() => removeRegion(region)}
                                            >
                                                {region}
                                                <X className="h-3 w-3" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {salesman ? 'Update Salesman' : 'Create Salesman'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}