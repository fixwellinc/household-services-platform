'use client';

import React, { createContext, useContext, useId } from 'react';
import { useForm, FormProvider, useFormContext, FieldPath, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

// Form Context
interface FormFieldContextValue {
  name: string;
}

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormItemContext = createContext<{ id: string }>({} as { id: string });

// Enhanced Form Root Component
interface EnhancedFormProps<T extends FieldValues> {
  schema?: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  defaultValues?: Partial<T>;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  submitText?: string;
  resetText?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function EnhancedForm<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
  title,
  description,
  submitText = 'Submit',
  resetText = 'Reset',
  loading = false,
  disabled = false
}: EnhancedFormProps<T>) {
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onChange'
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </CardHeader>
      )}
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {children}
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || disabled || !form.formState.isValid}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  submitText
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={loading || disabled}
              >
                {resetText}
              </Button>
              
              {form.formState.isDirty && (
                <span className="text-sm text-amber-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Unsaved changes
                </span>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Form Field Component
interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  children: React.ReactNode;
}

export function FormField<T extends FieldValues>({ name, children }: FormFieldProps<T>) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {children}
    </FormFieldContext.Provider>
  );
}

// Form Item Component
interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

export function FormItem({ children, className }: FormItemProps) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

// Form Label Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  const { id } = useContext(FormItemContext);

  return (
    <Label
      htmlFor={id}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );
}

// Form Control Component
interface FormControlProps {
  children: React.ReactNode;
}

export function FormControl({ children }: FormControlProps) {
  const { name } = useContext(FormFieldContext);
  const { id } = useContext(FormItemContext);
  const { formState } = useFormContext();

  const error = formState.errors[name];
  const isValid = formState.touchedFields[name] && !error;

  return (
    <div className="relative">
      {React.cloneElement(children as React.ReactElement, {
        id,
        name,
        'aria-invalid': !!error,
        'aria-describedby': error ? `${id}-error` : undefined,
        className: cn(
          (children as React.ReactElement).props.className,
          error && 'border-red-500 focus-visible:ring-red-500',
          isValid && 'border-green-500 focus-visible:ring-green-500'
        )
      })}
      
      {isValid && (
        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
      )}
    </div>
  );
}

// Form Description Component
interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600', className)}>
      {children}
    </p>
  );
}

// Form Message Component
interface FormMessageProps {
  className?: string;
}

export function FormMessage({ className }: FormMessageProps) {
  const { name } = useContext(FormFieldContext);
  const { id } = useContext(FormItemContext);
  const { formState } = useFormContext();

  const error = formState.errors[name];

  if (!error) return null;

  return (
    <p
      id={`${id}-error`}
      className={cn('text-sm text-red-600 flex items-center', className)}
    >
      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
      {error.message as string}
    </p>
  );
}

// Enhanced Input Component
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export function EnhancedInput({
  label,
  description,
  required,
  showPasswordToggle,
  type,
  className,
  ...props
}: EnhancedInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const { name } = useContext(FormFieldContext);
  const { register, formState } = useFormContext();

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <FormItem>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      {description && <FormDescription>{description}</FormDescription>}
      <FormControl>
        <div className="relative">
          <Input
            type={inputType}
            className={cn(
              showPasswordToggle && type === 'password' && 'pr-10',
              className
            )}
            {...register(name)}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

// Enhanced Textarea Component
interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export function EnhancedTextarea({
  label,
  description,
  required,
  showCharCount,
  maxLength,
  className,
  ...props
}: EnhancedTextareaProps) {
  const { name } = useContext(FormFieldContext);
  const { register, watch } = useFormContext();
  const value = watch(name) || '';

  return (
    <FormItem>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      {description && <FormDescription>{description}</FormDescription>}
      <FormControl>
        <Textarea
          className={className}
          maxLength={maxLength}
          {...register(name)}
          {...props}
        />
      </FormControl>
      {showCharCount && maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
}

// Enhanced Select Component
interface EnhancedSelectProps {
  label?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string;
}

export function EnhancedSelect({
  label,
  description,
  required,
  placeholder,
  options,
  className
}: EnhancedSelectProps) {
  const { name } = useContext(FormFieldContext);
  const { register } = useFormContext();

  return (
    <FormItem>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      {description && <FormDescription>{description}</FormDescription>}
      <FormControl>
        <select
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...register(name)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

// Form Section Component for grouping fields
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="border-b pb-2">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}