'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { 
  DollarSign, 
  Clock, 
  Wrench, 
  CheckCircle, 
  Loader2,
  X
} from 'lucide-react';

interface QuoteCreationFormProps {
  serviceRequest: {
    id: string;
    category: string;
    description: string;
    customer: {
      name: string;
      address: string;
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface QuoteData {
  estimatedHours: number;
  materialsCost: number;
  laborCost: number;
  technicianNotes: string;
}

export default function QuoteCreationForm({ 
  serviceRequest, 
  onSuccess, 
  onCancel 
}: QuoteCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuoteData>({
    estimatedHours: 0,
    materialsCost: 0,
    laborCost: 0,
    technicianNotes: ''
  });

  const handleInputChange = (field: keyof QuoteData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return formData.materialsCost + formData.laborCost;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.estimatedHours || !formData.materialsCost || !formData.laborCost) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quotes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceRequestId: serviceRequest.id,
          estimatedHours: formData.estimatedHours,
          materialsCost: formData.materialsCost,
          laborCost: formData.laborCost,
          technicianNotes: formData.technicianNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create quote');
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Quote created successfully!');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Failed to create quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Create Quote
            </CardTitle>
            <CardDescription>
              Create a detailed quote for {serviceRequest.customer.name}
            </CardDescription>
          </div>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Service Request Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Service Request Details</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div><span className="font-medium">Category:</span> {serviceRequest.category}</div>
            <div><span className="font-medium">Description:</span> {serviceRequest.description}</div>
            <div><span className="font-medium">Customer:</span> {serviceRequest.customer.name}</div>
            <div><span className="font-medium">Address:</span> {serviceRequest.customer.address}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Estimated Hours *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2.5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimate how long the job will take to complete
            </p>
          </div>

          {/* Materials Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Wrench className="h-4 w-4 inline mr-1" />
              Materials Cost ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.materialsCost}
              onChange={(e) => handleInputChange('materialsCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 45.50"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Cost of materials and parts needed for the job
            </p>
          </div>

          {/* Labor Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Labor Cost ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.laborCost}
              onChange={(e) => handleInputChange('laborCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 120.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Cost of labor based on estimated hours and your rate
            </p>
          </div>

          {/* Total Cost Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-blue-900">Total Cost:</span>
              <span className="text-2xl font-bold text-blue-900">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-blue-700 mt-2">
              Materials: ${formData.materialsCost.toFixed(2)} + Labor: ${formData.laborCost.toFixed(2)}
            </div>
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.technicianNotes}
              onChange={(e) => handleInputChange('technicianNotes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional details, special considerations, or notes for the customer..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional notes to help the customer understand the quote
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Quote...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Quote
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
