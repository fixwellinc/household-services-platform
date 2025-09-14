'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
    Home,
    Plus,
    Edit,
    Trash2,
    MapPin,
    DollarSign,
    Upload,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Calendar,
    FileText,
    Shield
} from 'lucide-react';

interface Property {
    id: string;
    address: string;
    nickname?: string;
    monthlyFee: number;
    ownershipVerified: boolean;
    addedAt: string;
    displayName: string;
}

interface CostBreakdown {
    propertyCount: number;
    totalMonthlyFee: number;
    properties: Array<{
        id: string;
        address: string;
        nickname?: string;
        monthlyFee: number;
    }>;
}

interface PropertyManagerProps {
    className?: string;
}

export default function PropertyManager({ className = '' }: PropertyManagerProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [addingProperty, setAddingProperty] = useState(false);
    const [updatingProperty, setUpdatingProperty] = useState(false);
    const [deletingProperty, setDeletingProperty] = useState<string | null>(null);

    // Add property form state
    const [newProperty, setNewProperty] = useState({
        address: '',
        nickname: '',
        ownershipDocument: null as File | null
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/subscriptions/properties', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProperties(data.properties || []);
                setCostBreakdown(data.costBreakdown || null);
            } else {
                console.error('Failed to fetch properties');
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProperty = async () => {
        if (!newProperty.address.trim()) {
            toast.error('Property address is required');
            return;
        }

        setAddingProperty(true);
        try {
            const formData = new FormData();
            formData.append('address', newProperty.address.trim());
            if (newProperty.nickname.trim()) {
                formData.append('nickname', newProperty.nickname.trim());
            }
            if (newProperty.ownershipDocument) {
                formData.append('ownershipDocument', newProperty.ownershipDocument);
            }

            const response = await fetch('/api/subscriptions/add-property', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: newProperty.address.trim(),
                    nickname: newProperty.nickname.trim() || null,
                    ownershipVerification: newProperty.ownershipDocument ? {
                        documentType: 'deed', // Default type for now
                        documentUrl: 'pending_upload' // Would be handled by file upload service
                    } : null
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Property added successfully');
                setShowAddModal(false);
                setNewProperty({ address: '', nickname: '', ownershipDocument: null });
                await fetchProperties();
            } else {
                throw new Error(data.error || 'Failed to add property');
            }
        } catch (error) {
            console.error('Error adding property:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to add property');
        } finally {
            setAddingProperty(false);
        }
    };

    const handleUpdateProperty = async () => {
        if (!editingProperty) return;

        setUpdatingProperty(true);
        try {
            const response = await fetch(`/api/subscriptions/properties/${editingProperty.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    nickname: editingProperty.nickname?.trim() || null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Property updated successfully');
                setEditingProperty(null);
                await fetchProperties();
            } else {
                throw new Error(data.error || 'Failed to update property');
            }
        } catch (error) {
            console.error('Error updating property:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update property');
        } finally {
            setUpdatingProperty(false);
        }
    };

    const handleDeleteProperty = async (propertyId: string) => {
        setDeletingProperty(propertyId);
        try {
            const response = await fetch(`/api/subscriptions/properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Property removed successfully');
                await fetchProperties();
            } else {
                throw new Error(data.error || 'Failed to remove property');
            }
        } catch (error) {
            console.error('Error removing property:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to remove property');
        } finally {
            setDeletingProperty(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading properties...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Additional Properties
                    </CardTitle>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Property
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Cost Summary */}
                    {costBreakdown && costBreakdown.propertyCount > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">
                                        {costBreakdown.propertyCount} Additional {costBreakdown.propertyCount === 1 ? 'Property' : 'Properties'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-blue-900">
                                        ${costBreakdown.totalMonthlyFee.toFixed(2)}/month
                                    </div>
                                    <div className="text-sm text-blue-700">
                                        50% of base plan price per property
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Properties List */}
                    {properties.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Home className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Additional Properties</h3>
                            <p className="text-gray-600 mb-6">
                                Add additional properties to extend your subscription services to multiple locations.
                            </p>
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Your First Property
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => (
                                <div
                                    key={property.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                <h4 className="font-medium text-gray-900">
                                                    {property.displayName}
                                                </h4>
                                                <Badge
                                                    className={
                                                        property.ownershipVerified
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }
                                                >
                                                    {property.ownershipVerified ? (
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Verified
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Pending
                                                        </div>
                                                    )}
                                                </Badge>
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>{property.address}</div>
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        ${property.monthlyFee.toFixed(2)}/month
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Added {formatDate(property.addedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingProperty(property)}
                                                className="flex items-center gap-1"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteProperty(property.id)}
                                                disabled={deletingProperty === property.id}
                                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {deletingProperty === property.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Information Box */}
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-gray-900 mb-1">Additional Property Benefits</p>
                                <ul className="text-gray-700 space-y-1">
                                    <li>• Same visit allowances and perks as your main subscription</li>
                                    <li>• 50% discount on base plan price per additional property</li>
                                    <li>• Shared usage limits across all properties</li>
                                    <li>• Maximum of 5 additional properties per subscription</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Add Property Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add Additional Property</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Address *
                                </label>
                                <input
                                    type="text"
                                    value={newProperty.address}
                                    onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="123 Main Street, City, State 12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nickname (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={newProperty.nickname}
                                    onChange={(e) => setNewProperty(prev => ({ ...prev, nickname: e.target.value }))}
                                    placeholder="e.g., Vacation Home, Rental Property"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ownership Verification (Optional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">
                                        Upload property deed, tax bill, or mortgage statement
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setNewProperty(prev => ({ ...prev, ownershipDocument: file }));
                                        }}
                                        className="hidden"
                                        id="ownership-upload"
                                    />
                                    <label
                                        htmlFor="ownership-upload"
                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 cursor-pointer"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Choose File
                                    </label>
                                    {newProperty.ownershipDocument && (
                                        <p className="text-sm text-green-600 mt-2">
                                            Selected: {newProperty.ownershipDocument.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800">Property Requirements</p>
                                        <ul className="text-blue-700 mt-1 space-y-1">
                                            <li>• Must be owned by the subscriber</li>
                                            <li>• Verification helps prevent service delays</li>
                                            <li>• Same service benefits as main property</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddModal(false)}
                                disabled={addingProperty}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddProperty}
                                disabled={addingProperty || !newProperty.address.trim()}
                                className="flex-1"
                            >
                                {addingProperty ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Property'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Property Modal */}
            {editingProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Property</h3>
                            <button
                                onClick={() => setEditingProperty(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={editingProperty.address}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Address cannot be changed. Remove and re-add if needed.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nickname
                                </label>
                                <input
                                    type="text"
                                    value={editingProperty.nickname || ''}
                                    onChange={(e) => setEditingProperty(prev => 
                                        prev ? { ...prev, nickname: e.target.value } : null
                                    )}
                                    placeholder="e.g., Vacation Home, Rental Property"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setEditingProperty(null)}
                                disabled={updatingProperty}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateProperty}
                                disabled={updatingProperty}
                                className="flex-1"
                            >
                                {updatingProperty ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Property'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}