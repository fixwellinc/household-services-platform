"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Using custom separator since ui component may not be available

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ResponsiveFormLayoutProps {
  title?: string;
  description?: string;
  sections: FormSection[];
  actions?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  loading?: boolean;
  className?: string;
  singleColumn?: boolean; // Force single column layout
}

export function ResponsiveFormLayout({
  title,
  description,
  sections,
  actions,
  onSubmit,
  loading = false,
  className = '',
  singleColumn = false
}: ResponsiveFormLayoutProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {/* Form Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Form Sections */}
      <div className={`
        grid gap-6
        ${singleColumn 
          ? 'grid-cols-1' 
          : 'grid-cols-1 lg:grid-cols-2'
        }
      `}>
        {sections.map((section, index) => (
          <Card key={section.id} className={`
            ${singleColumn ? '' : 'lg:col-span-1'}
            ${section.className || ''}
          `}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {section.children}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Actions */}
      {actions && (
        <>
          <div className="border-t border-gray-200" />
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {actions}
          </div>
        </>
      )}
    </form>
  );
}

// Responsive field group component
export interface FieldGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ResponsiveFieldGroup({ 
  children, 
  columns = 1, 
  className = '' 
}: FieldGroupProps) {
  const getGridClasses = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1';
    }
  };

  return (
    <div className={`grid gap-4 ${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Responsive field wrapper
export interface ResponsiveFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
  fullWidth?: boolean; // Span full width in grid
}

export function ResponsiveField({
  label,
  children,
  error,
  required = false,
  description,
  className = '',
  fullWidth = false
}: ResponsiveFieldProps) {
  return (
    <div className={`space-y-2 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Responsive action buttons
export interface ResponsiveFormActionsProps {
  primaryAction?: {
    label: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    variant?: 'outline' | 'ghost';
  };
  additionalActions?: Array<{
    label: string;
    onClick?: () => void;
    variant?: 'outline' | 'ghost' | 'destructive';
    disabled?: boolean;
  }>;
  className?: string;
}

export function ResponsiveFormActions({
  primaryAction,
  secondaryAction,
  additionalActions = [],
  className = ''
}: ResponsiveFormActionsProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 ${className}`}>
      {/* Additional actions - shown first on mobile, last on desktop */}
      {additionalActions.length > 0 && (
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:order-first">
          {additionalActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              disabled={action.disabled}
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Secondary action */}
      {secondaryAction && (
        <Button
          variant={secondaryAction.variant || 'outline'}
          onClick={secondaryAction.onClick}
          className="w-full sm:w-auto"
        >
          {secondaryAction.label}
        </Button>
      )}

      {/* Primary action */}
      {primaryAction && (
        <Button
          type={primaryAction.type || 'button'}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          className="w-full sm:w-auto"
        >
          {primaryAction.loading ? 'Loading...' : primaryAction.label}
        </Button>
      )}
    </div>
  );
}