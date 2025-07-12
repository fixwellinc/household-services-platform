'use client';

import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/shared';
import { MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateAndFormatPostalCode, isBCPostalCode } from '@/lib/location';

export default function BCLocationBanner() {
  const { userLocation, userCity, isInBC, setUserLocation, clearUserLocation, isLoading } = useLocation();
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // When opening the modal, pre-fill with current location
  const handleOpenLocationModal = () => {
    setPostalCodeInput(userLocation || '');
    setShowLocationInput(true);
  };

  // Don't show banner while loading
  if (isLoading) return null;

  return (
    <>
      {/* If user is in BC and has a location, show success banner */}
      {isInBC && userLocation && userCity ? (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <span className="text-sm font-medium text-green-800">
                    Service available in {userCity}, BC
                  </span>
                  <span className="text-xs text-green-600 ml-2">
                    ({userLocation})
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenLocationModal}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                Change location
              </button>
            </div>
          </div>
        </div>
      ) : userLocation && !isInBC ? (
        /* If user is not in BC, show warning banner */
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="text-sm font-medium text-yellow-800">
                    Currently serving British Columbia residents only
                  </span>
                  <span className="text-xs text-yellow-600 ml-2">
                    Your postal code ({userLocation}) is outside our service area
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenLocationModal}
                className="text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                Update location
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Default banner for users without location */
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm font-medium text-blue-800">
                    Currently serving British Columbia residents
                  </span>
                  <span className="text-xs text-blue-600 ml-2">
                    Enter your postal code to check availability
                  </span>
                </div>
              </div>
              <Button
                onClick={handleOpenLocationModal}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Input Modal - Always rendered */}
      {showLocationInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Check Service Availability
              </h3>
              <button
                onClick={() => {
                  setShowLocationInput(false);
                  setPostalCodeInput(userLocation || '');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your postal code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={postalCodeInput}
                  onChange={(e) => {
                    const formatted = validateAndFormatPostalCode(e.target.value);
                    setPostalCodeInput(formatted);
                  }}
                  placeholder="V6B 2Z9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We currently serve British Columbia residents only
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setIsValidating(true);
                    if (isBCPostalCode(postalCodeInput)) {
                      setUserLocation(postalCodeInput);
                      setShowLocationInput(false);
                      setPostalCodeInput('');
                    }
                    setIsValidating(false);
                  }}
                  disabled={!postalCodeInput || postalCodeInput.length < 6 || isValidating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isValidating ? 'Checking...' : 'Check Availability'}
                </Button>
                <Button
                  onClick={() => {
                    setShowLocationInput(false);
                    setPostalCodeInput(userLocation || '');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              
              {/* Clear Location Button */}
              {userLocation && (
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => {
                      clearUserLocation();
                      setShowLocationInput(false);
                      setPostalCodeInput('');
                    }}
                    variant="ghost"
                    className="text-red-600 hover:text-red-800"
                  >
                    Clear Location
                  </Button>
                </div>
              )}
              
              {postalCodeInput && !isBCPostalCode(postalCodeInput) && postalCodeInput.length >= 6 && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  This postal code is not in British Columbia. We currently serve BC residents only.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 