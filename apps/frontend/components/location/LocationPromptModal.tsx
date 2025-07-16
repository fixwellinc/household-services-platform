'use client';

import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/shared';
import { MapPin, X, AlertCircle, CheckCircle } from 'lucide-react';
import { validateAndFormatPostalCode, isBCPostalCode } from '@/lib/location';
import { toast } from 'sonner';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: () => void;
  planName?: string;
}

export default function LocationPromptModal({ 
  isOpen, 
  onClose, 
  onLocationSet, 
  planName = "plan" 
}: LocationPromptModalProps) {
  const { setUserLocation } = useLocation();
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postalCodeInput.trim()) {
      setValidationError('Please enter your postal code');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const formattedPostalCode = validateAndFormatPostalCode(postalCodeInput.trim());
      
      if (!formattedPostalCode) {
        setValidationError('Please enter a valid Canadian postal code');
        setIsValidating(false);
        return;
      }

      if (!isBCPostalCode(formattedPostalCode)) {
        setValidationError('We currently only serve BC residents in the Lower Mainland area');
        setIsValidating(false);
        return;
      }

      // Location is valid, save it
      setUserLocation(formattedPostalCode);
      toast.success('Location saved successfully!', {
        description: 'You can now proceed with your subscription.',
      });
      
      setPostalCodeInput('');
      setValidationError('');
      onLocationSet();
      onClose();
    } catch (error) {
      setValidationError('Please enter a valid postal code');
    }
    
    setIsValidating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Location
            </h2>
            <p className="text-gray-600">
              To subscribe to the {planName} plan, we need to confirm you're in our BC service area.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                BC Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={postalCodeInput}
                onChange={(e) => setPostalCodeInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="V6B 1A1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationError ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={7}
                disabled={isValidating}
                autoFocus
              />
              {validationError && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  {validationError}
                </div>
              )}
            </div>

            {/* Service Area Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Current Service Area
                  </p>
                  <p className="text-sm text-blue-700">
                    We serve BC residents in the Lower Mainland, including Vancouver, Surrey, Burnaby, Richmond, and surrounding areas.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isValidating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isValidating || !postalCodeInput.trim()}
              >
                {isValidating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Validating...
                  </span>
                ) : (
                  'Confirm Location'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 