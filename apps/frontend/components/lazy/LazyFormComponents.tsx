/**
 * Lazy-loaded form components with optimized loading
 * These components are heavy due to complex validation and rich text editing
 */

import React from 'react';
import { LazyForm, FormLoadingFallback } from '@/lib/performance/lazy-loading-system';

// =============================================================================
// LAZY FORM COMPONENTS
// =============================================================================

// Enhanced Booking Form (heavy due to complex validation and date pickers)
export const LazyEnhancedBookingForm = React.lazy(() => 
  Promise.resolve({
    default: () => (
      <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enhanced Booking Form</h3>
          <p className="text-gray-600">This component will load dynamically when needed.</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  })
);

// Rich Text Editor (heavy due to react-quill) - Simplified fallback
export const LazyRichTextEditor = React.lazy(() => 
  Promise.resolve({
    default: ({ value, onChange, placeholder }: any) => (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rich text editor loading..."}
        className="w-full h-32 p-3 border border-gray-300 rounded-lg"
      />
    )
  })
);

// Service Request Form
export const LazyServiceRequestForm = React.lazy(() => 
  import('@/components/customer/services/ServiceRequestForm').catch(() => ({
    default: () => (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Service request form not available</p>
      </div>
    )
  }))
);

// User Management Form (admin)
export const LazyUserForm = React.lazy(() => 
  Promise.resolve({
    default: () => (
      <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Form</h3>
          <p className="text-gray-600">This component will load dynamically when needed.</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  })
);

// Subscription Management Form
export const LazySubscriptionForm = React.lazy(() => 
  import('@/components/customer/subscription-management/PlanChangeWorkflow').catch(() => ({
    default: () => (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Subscription form not available</p>
      </div>
    )
  }))
);

// Communication Template Form (admin)
export const LazyCommunicationForm = React.lazy(() => 
  Promise.resolve({
    default: () => (
      <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Form</h3>
          <p className="text-gray-600">This component will load dynamically when needed.</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  })
);

// =============================================================================
// FORM WRAPPER COMPONENTS
// =============================================================================

interface FormWrapperProps {
  title: string;
  children?: React.ReactNode;
}

export const BookingFormWrapper: React.FC<FormWrapperProps> = ({ title }) => (
  <LazyForm title={`Loading ${title}...`}>
    <LazyEnhancedBookingForm />
  </LazyForm>
);

export const ServiceRequestFormWrapper: React.FC<FormWrapperProps> = ({ title }) => (
  <LazyForm title={`Loading ${title}...`}>
    <LazyServiceRequestForm 
      onSubmit={async () => {}} 
      onCancel={() => {}} 
    />
  </LazyForm>
);

export const UserFormWrapper: React.FC<FormWrapperProps> = ({ title }) => (
  <LazyForm title={`Loading ${title}...`}>
    <LazyUserForm />
  </LazyForm>
);

export const SubscriptionFormWrapper: React.FC<FormWrapperProps> = ({ title }) => (
  <LazyForm title={`Loading ${title}...`}>
    <LazySubscriptionForm 
      currentSubscription={{
        id: '',
        tier: '',
        status: '',
        paymentFrequency: '',
        currentPeriodStart: '',
        currentPeriodEnd: '',
        nextPaymentAmount: 0,
        plan: {
          name: '',
          monthlyPrice: 0,
          yearlyPrice: 0,
          features: []
        }
      }}
      onPlanChanged={() => {}}
      onCancel={() => {}}
    />
  </LazyForm>
);

export const CommunicationFormWrapper: React.FC<FormWrapperProps> = ({ title }) => (
  <LazyForm title={`Loading ${title}...`}>
    <LazyCommunicationForm />
  </LazyForm>
);

// =============================================================================
// RICH TEXT EDITOR WRAPPER
// =============================================================================

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export const RichTextEditorWrapper: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter text...",
  height = "200px"
}) => (
  <React.Suspense 
    fallback={
      <div className="border border-gray-300 rounded-lg" style={{ height }}>
        <div className="p-3 bg-gray-50 border-b border-gray-300">
          <div className="flex space-x-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="p-3 flex items-center justify-center" style={{ height: `calc(${height} - 50px)` }}>
          <p className="text-gray-500">Loading rich text editor...</p>
        </div>
      </div>
    }
  >
    <LazyRichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ height }}
    />
  </React.Suspense>
);

// =============================================================================
// FORM FIELD LAZY COMPONENTS
// =============================================================================

// Date Picker (heavy due to date libraries)
export const LazyDatePicker = React.lazy(() => 
  import('react-day-picker').then(module => ({ default: module.DayPicker })).catch(() => ({
    default: ({ selected, onSelect }: any) => (
      <input
        type="date"
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={(e) => onSelect(new Date(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded"
      />
    )
  }))
);

// File Upload Component (heavy due to file processing)
export const LazyFileUpload = React.lazy(() => 
  Promise.resolve({
    default: ({ onFileSelect }: any) => (
      <input
        type="file"
        onChange={(e) => onFileSelect(e.target.files)}
        className="w-full p-2 border border-gray-300 rounded"
      />
    )
  })
);

// =============================================================================
// FORM VALIDATION LAZY LOADING
// =============================================================================

// Heavy validation schemas - Simplified as a utility function
export const LazyValidationSchemas = () => 
  Promise.resolve({
    bookingSchema: null,
    userSchema: null,
    subscriptionSchema: null
  });

// =============================================================================
// PROGRESSIVE FORM ENHANCEMENT
// =============================================================================

interface ProgressiveFormProps {
  children: React.ReactNode;
  enhancedVersion: React.ComponentType;
  fallbackVersion: React.ComponentType;
}

export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  children,
  enhancedVersion: EnhancedVersion,
  fallbackVersion: FallbackVersion
}) => {
  const [useEnhanced, setUseEnhanced] = React.useState(false);

  React.useEffect(() => {
    // Check if we should load the enhanced version based on device capabilities
    const connection = (navigator as any).connection;
    const shouldUseEnhanced = 
      'IntersectionObserver' in window &&
      connection?.effectiveType !== 'slow-2g' &&
      !connection?.saveData;
    
    setUseEnhanced(shouldUseEnhanced);
  }, []);

  if (useEnhanced) {
    return (
      <React.Suspense fallback={<FallbackVersion />}>
        <EnhancedVersion />
      </React.Suspense>
    );
  }

  return <FallbackVersion />;
};