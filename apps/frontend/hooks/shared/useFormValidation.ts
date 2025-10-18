'use client';

import { useCallback } from 'react';

// Common validation functions
export const validators = {
  required: (message = 'This field is required') => (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message;
    }
    return null;
  },

  email: (message = 'Please enter a valid email address') => (value: string) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return null;
    const msg = message || `Must be at least ${min} characters`;
    return value.length >= min ? null : msg;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return null;
    const msg = message || `Must be no more than ${max} characters`;
    return value.length <= max ? null : msg;
  },

  pattern: (regex: RegExp, message = 'Invalid format') => (value: string) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  phone: (message = 'Please enter a valid phone number') => (value: string) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{9,15}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) ? null : message;
  },

  password: (message = 'Password must be at least 6 characters') => (value: string) => {
    if (!value) return null;
    return value.length >= 6 ? null : message;
  },

  confirmPassword: (passwordField: string, message = 'Passwords do not match') => 
    (value: string, formValues?: Record<string, any>) => {
      if (!value || !formValues) return null;
      return value === formValues[passwordField] ? null : message;
    },

  url: (message = 'Please enter a valid URL') => (value: string) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  },

  number: (message = 'Please enter a valid number') => (value: string) => {
    if (!value) return null;
    return !isNaN(Number(value)) ? null : message;
  },

  min: (min: number, message?: string) => (value: string | number) => {
    if (!value) return null;
    const num = typeof value === 'string' ? Number(value) : value;
    const msg = message || `Must be at least ${min}`;
    return num >= min ? null : msg;
  },

  max: (max: number, message?: string) => (value: string | number) => {
    if (!value) return null;
    const num = typeof value === 'string' ? Number(value) : value;
    const msg = message || `Must be no more than ${max}`;
    return num <= max ? null : msg;
  },

  custom: (validator: (value: any, formValues?: Record<string, any>) => boolean, message: string) => 
    (value: any, formValues?: Record<string, any>) => {
      return validator(value, formValues) ? null : message;
    },
};

// Combine multiple validators
export function combineValidators(...validatorFns: Array<(value: any, formValues?: Record<string, any>) => string | null>) {
  return (value: any, formValues?: Record<string, any>): string | null => {
    for (const validator of validatorFns) {
      const error = validator(value, formValues);
      if (error) return error;
    }
    return null;
  };
}

// Common validation schemas
export const validationSchemas = {
  auth: {
    email: combineValidators(
      validators.required('Email is required'),
      validators.email()
    ),
    password: combineValidators(
      validators.required('Password is required'),
      validators.password()
    ),
    confirmPassword: combineValidators(
      validators.required('Please confirm your password'),
      validators.confirmPassword('password')
    ),
    name: combineValidators(
      validators.required('Name is required'),
      validators.minLength(2, 'Name must be at least 2 characters')
    ),
  },

  profile: {
    name: combineValidators(
      validators.required('Name is required'),
      validators.minLength(2, 'Name must be at least 2 characters'),
      validators.maxLength(100, 'Name is too long')
    ),
    email: combineValidators(
      validators.required('Email is required'),
      validators.email()
    ),
    phone: validators.phone(),
    address: combineValidators(
      validators.required('Address is required'),
      validators.minLength(10, 'Please enter a complete address'),
      validators.maxLength(500, 'Address is too long')
    ),
  },

  booking: {
    customerName: combineValidators(
      validators.required('Name is required'),
      validators.minLength(2, 'Name must be at least 2 characters'),
      validators.maxLength(100, 'Name is too long')
    ),
    customerEmail: combineValidators(
      validators.required('Email is required'),
      validators.email()
    ),
    customerPhone: validators.phone(),
    propertyAddress: combineValidators(
      validators.required('Property address is required'),
      validators.minLength(10, 'Please enter a complete address'),
      validators.maxLength(500, 'Address is too long')
    ),
    notes: validators.maxLength(1000, 'Notes are too long (maximum 1000 characters)'),
  },

  service: {
    name: combineValidators(
      validators.required('Service name is required'),
      validators.minLength(3, 'Service name must be at least 3 characters'),
      validators.maxLength(100, 'Service name is too long')
    ),
    description: combineValidators(
      validators.required('Description is required'),
      validators.minLength(10, 'Description must be at least 10 characters'),
      validators.maxLength(1000, 'Description is too long')
    ),
    price: combineValidators(
      validators.required('Price is required'),
      validators.number(),
      validators.min(0, 'Price must be positive')
    ),
  },
};

/**
 * Hook for form validation with common patterns
 */
export function useFormValidation() {
  const validateField = useCallback((
    value: any,
    validatorFn: (value: any, formValues?: Record<string, any>) => string | null,
    formValues?: Record<string, any>
  ): string | null => {
    return validatorFn(value, formValues);
  }, []);

  const validateFields = useCallback((
    values: Record<string, any>,
    schema: Record<string, (value: any, formValues?: Record<string, any>) => string | null>
  ): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    Object.keys(schema).forEach(field => {
      const error = schema[field](values[field], values);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  }, []);

  return {
    validators,
    combineValidators,
    validationSchemas,
    validateField,
    validateFields,
  };
}