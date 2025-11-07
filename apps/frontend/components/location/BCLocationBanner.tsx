'use client';

import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/shared';
import { MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateAndFormatPostalCode, isBCPostalCode } from '@/lib/location';

export default function BCLocationBanner() {
  const { userLocation, userCity, isInBC, setUserLocation, clearUserLocation, isLoading } = useLocation();
  const { user } = useAuth();
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Check if user is logged in and has postal code
  const hasUserPostalCode = user?.postalCode && user.postalCode.trim() !== '';
  const userIsInServiceArea = hasUserPostalCode && isBCPostalCode(user.postalCode!);

  // When opening the modal, pre-fill with current location or user's postal code
  const handleOpenLocationModal = () => {
    setPostalCodeInput(userLocation || user?.postalCode || '');
    setShowLocationInput(true);
  };

  // Auto-set user's postal code if they're logged in and have one
  React.useEffect(() => {
    if (hasUserPostalCode && !userLocation && userIsInServiceArea && user?.postalCode) {
      setUserLocation(user.postalCode);
    }
  }, [hasUserPostalCode, userLocation, userIsInServiceArea, user?.postalCode, setUserLocation]);

  // Don't show banner while loading
  if (isLoading) return null;

  // Don't show banner for admin users
  if (user?.role === 'ADMIN') return null;

  return (
    <>
      {/* If user is in BC and has a location, show success banner */}
      {isInBC && userLocation && userCity ? (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700" data-location-banner>
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200 block">
                    Service available in {userCity}, BC
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 block sm:inline sm:ml-2">
                    ({userLocation})
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenLocationModal}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 underline px-3 py-2 rounded-md hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors duration-200 min-h-[44px] flex items-center"
              >
                Change location
              </button>
            </div>
          </div>
        </div>
      ) : userLocation && !isInBC ? (
        /* If user is not in BC, show warning banner */
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700" data-location-banner>
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200 block">
                    Currently serving Lower Mainland residents only
                  </span>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 block sm:inline sm:ml-2">
                    Your postal code ({userLocation}) is outside our service area (within 50km of Surrey)
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenLocationModal}
                className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline px-3 py-2 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors duration-200 min-h-[44px] flex items-center"
              >
                Update location
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Default banner for users without location */
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200 block">
                    Currently serving Lower Mainland residents
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 block sm:inline sm:ml-2">
                    {hasUserPostalCode 
                      ? `Using your profile postal code: ${user.postalCode}`
                      : 'Enter your postal code to check availability (within 50km of Surrey)'
                    }
                  </span>
                </div>
              </div>
              {!hasUserPostalCode && (
                <Button
                  onClick={handleOpenLocationModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium w-full sm:w-auto min-h-[44px] shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Check Availability
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Input Modal - Always rendered */}
      {showLocationInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Check Service Availability
              </h3>
              <button
                onClick={() => {
                  setShowLocationInput(false);
                  setPostalCodeInput(userLocation || '');
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close location input"
                title="Close location input"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  maxLength={7}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                <p className="text-xs text-gray-500 mt-1">
                  We currently serve Lower Mainland residents only (within 50km of Surrey)
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-sm font-medium min-h-[44px] shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isValidating ? 'Checking...' : 'Check Availability'}
                </Button>
                <Button
                  onClick={() => {
                    setShowLocationInput(false);
                    setPostalCodeInput(userLocation || '');
                  }}
                  variant="outline"
                  className="w-full sm:flex-1 py-3 px-4 text-sm font-medium min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
              
              {/* Clear Location Button */}
              {userLocation && (
                <div className="flex justify-center sm:justify-end mt-4">
                  <Button
                    onClick={() => {
                      clearUserLocation();
                      setShowLocationInput(false);
                      setPostalCodeInput('');
                    }}
                    variant="ghost"
                    className="text-red-600 hover:text-red-800 px-4 py-2 text-sm font-medium min-h-[44px] hover:bg-red-50 rounded-md transition-colors duration-200"
                  >
                    Clear Location
                  </Button>
                </div>
              )}
              
              {postalCodeInput && !isBCPostalCode(postalCodeInput) && postalCodeInput.length >= 6 && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  This postal code is not in our service area. We currently serve Lower Mainland residents only (within 50km of Surrey).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 