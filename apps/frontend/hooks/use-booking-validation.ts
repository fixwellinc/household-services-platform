'use client';

import { useState, useEffect } from 'react';
import { BookingRequest } from '@/types/appointments';

interface ValidationErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  propertyAddress?: string;
  notes?: string;
}

interface UseBookingValidationProps {
  formData: Partial<Omit<BookingRequest, 'scheduledDate' | 'serviceType'>>;
  selectedDate?: Date;
  selectedTime?: string;
}

export function useBookingValidation({ 
  formData, 
  selectedDate, 
  selectedTime 
}: UseBookingValidationProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'customerName':
        if (!value || typeof value !== 'string') return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name is too long';
        break;

      case 'customerEmail':
        if (!value || typeof value !== 'string') return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        break;

      case 'customerPhone':
        if (value && typeof value === 'string') {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
          if (cleanPhone && !phoneRegex.test(cleanPhone)) {
            return 'Please enter a valid phone number';
          }
        }
        break;

      case 'propertyAddress':
        if (!value || typeof value !== 'string') return 'Property address is required';
        if (value.trim().length < 10) return 'Please enter a complete address';
        if (value.length > 500) return 'Address is too long';
        break;

      case 'notes':
        if (value && typeof value === 'string' && value.length > 1000) {
          return 'Notes are too long (maximum 1000 characters)';
        }
        break;

      default:
        break;
    }
    return undefined;
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field as keyof ValidationErrors] = error;
      }
    });

    // Check required fields
    const requiredFields = ['customerName', 'customerEmail', 'propertyAddress'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field as keyof ValidationErrors] = `${field.replace('customer', '').replace(/([A-Z])/g, ' $1').trim()} is required`;
      }
    });

    setErrors(newErrors);
    
    // Form is valid if no errors and required fields are filled
    const hasErrors = Object.keys(newErrors).length > 0;
    const hasRequiredFields = requiredFields.every(field => 
      formData[field as keyof typeof formData]
    );
    const hasDateAndTime = selectedDate && selectedTime;
    
    setIsValid(!hasErrors && hasRequiredFields && hasDateAndTime);
  };

  useEffect(() => {
    validateForm();
  }, [formData, selectedDate, selectedTime]);

  const validateSingleField = (field: string, value: any) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
    return error;
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    errors,
    isValid,
    validateSingleField,
    validateForm,
    clearErrors,
  };
}