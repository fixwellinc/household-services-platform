'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isBCPostalCode, getBCCityFromPostalCode, formatPostalCode } from '../lib/location';

interface LocationContextType {
  userLocation: string | null;
  userCity: string | null;
  isInBC: boolean;
  setUserLocation: (postalCode: string) => void;
  clearUserLocation: () => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [userLocation, setUserLocationState] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is in BC based on postal code
  const isInBC = userLocation ? isBCPostalCode(userLocation) : false;

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocationState(savedLocation);
      const city = getBCCityFromPostalCode(savedLocation);
      setUserCity(city);
    }
    setIsLoading(false);
  }, []);

  // Update city when location changes
  useEffect(() => {
    if (userLocation) {
      const city = getBCCityFromPostalCode(userLocation);
      setUserCity(city);
    } else {
      setUserCity(null);
    }
  }, [userLocation]);

  const setUserLocation = (postalCode: string) => {
    const formattedPostalCode = formatPostalCode(postalCode);
    setUserLocationState(formattedPostalCode);
    localStorage.setItem('userLocation', formattedPostalCode);
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    setUserCity(null);
    localStorage.removeItem('userLocation');
  };

  const value: LocationContextType = {
    userLocation,
    userCity,
    isInBC,
    setUserLocation,
    clearUserLocation,
    isLoading,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
} 