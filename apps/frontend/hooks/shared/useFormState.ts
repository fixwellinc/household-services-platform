'use client';

import { useState, useCallback, useRef } from 'react';

interface FormError {
  field: string;
  message: string;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, formValues: T) => string | null;
}

interface UseFormStateOptions<T> {
  initialValues: T;
  validationRules?: ValidationRule<T>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Shared form state management hook
 * Provides consistent form handling patterns across components
 */
export function useFormState<T extends Record<string, any>>(
  options: UseFormStateOptions<T>
) {
  const {
    initialValues,
    validationRules = [],
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const initialValuesRef = useRef(initialValues);
  
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: any, formValues: T): string | null => {
    const rule = validationRules.find(r => r.field === field);
    if (!rule) return null;
    
    return rule.validator(value, formValues);
  }, [validationRules]);

  // Validate all fields
  const validateForm = useCallback((values: T): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    validationRules.forEach(rule => {
      const fieldName = rule.field as string;
      const error = rule.validator(values[fieldName], values);
      if (error) {
        errors[fieldName] = error;
      }
    });
    
    return errors;
  }, [validationRules]);

  // Check if form is dirty
  const checkIsDirty = useCallback((values: T): boolean => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, []);

  // Set field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const isDirty = checkIsDirty(newValues);
      
      let newErrors = prev.errors;
      
      // Validate on change if enabled
      if (validateOnChange) {
        const fieldError = validateField(field, value, newValues);
        newErrors = {
          ...prev.errors,
          [field as string]: fieldError || '',
        };
        // Remove empty error messages
        if (!fieldError) {
          delete newErrors[field as string];
        }
      }
      
      const isValid = Object.keys(newErrors).length === 0;
      
      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty,
        isValid,
      };
    });
  }, [validateOnChange, validateField, checkIsDirty]);

  // Set multiple values
  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...values };
      const isDirty = checkIsDirty(newValues);
      
      let newErrors = prev.errors;
      
      // Validate changed fields if enabled
      if (validateOnChange) {
        Object.keys(values).forEach(field => {
          const fieldError = validateField(field as keyof T, values[field as keyof T], newValues);
          if (fieldError) {
            newErrors = { ...newErrors, [field]: fieldError };
          } else {
            const { [field]: removed, ...rest } = newErrors;
            newErrors = rest;
          }
        });
      }
      
      const isValid = Object.keys(newErrors).length === 0;
      
      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty,
        isValid,
      };
    });
  }, [validateOnChange, validateField, checkIsDirty]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setState(prev => {
      const newTouched = { ...prev.touched, [field as string]: true };
      
      let newErrors = prev.errors;
      
      // Validate on blur if enabled
      if (validateOnBlur) {
        const fieldError = validateField(field, prev.values[field], prev.values);
        if (fieldError) {
          newErrors = { ...prev.errors, [field as string]: fieldError };
        } else {
          const { [field as string]: removed, ...rest } = prev.errors;
          newErrors = rest;
        }
      }
      
      const isValid = Object.keys(newErrors).length === 0;
      
      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
        isValid,
      };
    });
  }, [validateOnBlur, validateField]);

  // Set field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field as string]: error },
      isValid: false,
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setState(prev => {
      const { [field as string]: removed, ...rest } = prev.errors;
      const isValid = Object.keys(rest).length === 0;
      
      return {
        ...prev,
        errors: rest,
        isValid,
      };
    });
  }, []);

  // Set form errors
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // Validate entire form
  const validate = useCallback((): boolean => {
    const errors = validateForm(state.values);
    setErrors(errors);
    return Object.keys(errors).length === 0;
  }, [state.values, validateForm, setErrors]);

  // Reset form
  const reset = useCallback(() => {
    setState({
      values: initialValuesRef.current,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, []);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback((field: keyof T) => ({
    value: state.values[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(field, e.target.value);
    },
    onBlur: () => handleBlur(field),
    error: state.errors[field as string],
    touched: state.touched[field as string],
  }), [state.values, state.errors, state.touched, setValue, handleBlur]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    setErrors,
    clearErrors,
    handleBlur,
    validate,
    reset,
    setSubmitting,
    getFieldProps,
  };
}