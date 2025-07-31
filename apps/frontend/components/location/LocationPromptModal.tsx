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

  // Debug logging
  console.log('LocationPromptModal render - isOpen:', isOpen, 'planName:', planName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LocationPromptModal handleSubmit called');
    
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

      console.log('Location is valid, saving and calling onLocationSet');
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative transform transition-all duration-300 hover:scale-105">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Verify Your Location
            </h2>
            <p className="text-gray-600 text-lg">
              To subscribe to the {planName} plan, we need to confirm you're in our BC service area.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="postalCode" className="block text-lg font-semibold text-gray-700 mb-3">
                BC Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={postalCodeInput}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Only allow letters and numbers, auto-format with space
                  const cleaned = value.replace(/[^A-Z0-9]/g, '');
                  if (cleaned.length <= 6) {
                    let formatted = cleaned;
                    if (cleaned.length >= 3) {
                      formatted = cleaned.substring(0, 3) + ' ' + cleaned.substring(3);
                    }
                    setPostalCodeInput(formatted);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="V6B 1A1"
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                  validationError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
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
              {!validationError && postalCodeInput && (
                <div className="flex items-center mt-2 text-blue-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  Format: A1A 1A1 (e.g., V6B 1A1)
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
            <div className="flex space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 py-4 text-lg font-semibold border-2 hover:border-gray-400 transition-all duration-300"
                disabled={isValidating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled={isValidating || !postalCodeInput.trim()}
              >
                {isValidating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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