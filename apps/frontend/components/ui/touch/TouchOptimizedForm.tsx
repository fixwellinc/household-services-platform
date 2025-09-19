'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TouchOptimizedInput } from './TouchOptimizedInput';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Check, AlertCircle, Mail, Phone, User, Lock, Search } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'search' | 'url' | 'number';
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
  };
  hint?: string;
}

interface TouchOptimizedFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
  showProgress?: boolean;
  hapticFeedback?: boolean;
  autoValidate?: boolean;
  children?: React.ReactNode;
}

export const TouchOptimizedForm: React.FC<TouchOptimizedFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  className,
  showProgress = true,
  hapticFeedback = true,
  autoValidate = true,
  children,
}) => {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = React.useState(0);

  const triggerHapticFeedback = (type: 'success' | 'error' | 'light' = 'light') => {
    if (hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        success: [10, 50, 10],
        error: [50, 100, 50],
        light: 10,
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const validateField = (field: FormField, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { minLength, maxLength, pattern, email, phone } = field.validation;

      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }

      if (maxLength && value.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }

      if (email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }

      if (phone && value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }

      if (pattern && value && !pattern.test(value)) {
        return `${field.label} format is invalid`;
      }
    }

    return '';
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    if (autoValidate && touched[fieldName]) {
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        
        if (error) {
          triggerHapticFeedback('error');
        } else if (value && touched[fieldName]) {
          triggerHapticFeedback('success');
        }
      }
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const field = fields.find(f => f.name === fieldName);
    if (field && autoValidate) {
      const value = formData[fieldName] || '';
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    const fieldIndex = fields.findIndex(f => f.name === fieldName);
    if (fieldIndex !== -1) {
      setCurrentFieldIndex(fieldIndex);
    }
    triggerHapticFeedback('light');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || loading) return;

    const isValid = validateForm();
    
    if (!isValid) {
      triggerHapticFeedback('error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      triggerHapticFeedback('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({});
        setErrors({});
        setTouched({});
        setSubmitSuccess(false);
        setCurrentFieldIndex(0);
      }, 2000);
    } catch (error) {
      triggerHapticFeedback('error');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (field: FormField) => {
    if (field.icon) return field.icon;
    
    // Default icons based on field type
    switch (field.type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'tel':
        return <Phone className="w-5 h-5" />;
      case 'password':
        return <Lock className="w-5 h-5" />;
      case 'search':
        return <Search className="w-5 h-5" />;
      default:
        if (field.name.toLowerCase().includes('name')) {
          return <User className="w-5 h-5" />;
        }
        return undefined;
    }
  };

  const completedFields = fields.filter(field => 
    formData[field.name] && !errors[field.name]
  ).length;
  
  const progressPercentage = (completedFields / fields.length) * 100;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Progress Indicator */}
      {showProgress && fields.length > 1 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{completedFields} of {fields.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.name}
            className={cn(
              'transition-all duration-300',
              currentFieldIndex === index && 'ring-2 ring-blue-500/20 rounded-lg p-1 -m-1'
            )}
          >
            <TouchOptimizedInput
              type={field.type}
              label={field.label}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              onFocus={() => handleFieldFocus(field.name)}
              error={touched[field.name] ? errors[field.name] : ''}
              success={
                touched[field.name] && formData[field.name] && !errors[field.name]
                  ? 'Valid'
                  : ''
              }
              hint={field.hint}
              icon={getFieldIcon(field)}
              showPasswordToggle={field.type === 'password'}
              autoValidate={autoValidate}
              hapticFeedback={hapticFeedback}
              validationRules={{
                required: field.required,
                ...field.validation,
              }}
              disabled={isSubmitting || loading}
            />
          </div>
        ))}
      </div>

      {/* Custom Children */}
      {children}

      {/* Submit Button */}
      <div className="pt-4">
        <TouchOptimizedButton
          type="submit"
          variant={submitSuccess ? 'default' : 'premium'}
          size="lg"
          className="w-full"
          loading={isSubmitting || loading}
          loadingText="Submitting..."
          disabled={isSubmitting || loading || Object.keys(errors).some(key => errors[key])}
          touchFeedback="medium"
          hapticFeedback={hapticFeedback}
          icon={submitSuccess ? <Check className="w-5 h-5" /> : undefined}
        >
          {submitSuccess ? 'Success!' : submitLabel}
        </TouchOptimizedButton>
      </div>

      {/* Form Status */}
      {submitSuccess && (
        <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <Check className="w-5 h-5" />
          <span className="font-medium">Form submitted successfully!</span>
        </div>
      )}
    </form>
  );
};

export default TouchOptimizedForm;