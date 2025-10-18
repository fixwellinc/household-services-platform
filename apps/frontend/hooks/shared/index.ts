// Authentication and User Management Hooks
export { useAuthState } from './useAuthState';
export { useUserManagement } from './useUserManagement';
export { usePermissions } from './usePermissions';

// Data Fetching and Caching Hooks
export { useApiRequest } from './useApiRequest';
export { useCachedData } from './useCachedData';
export { useInfiniteScroll } from './useInfiniteScroll';

// Form Validation and State Management Hooks
export { useFormState } from './useFormState';
export { useFormValidation, validators, combineValidators, validationSchemas } from './useFormValidation';
export { useFormSubmission } from './useFormSubmission';

// Type exports for better TypeScript support
export type { UseApiRequestOptions } from './useApiRequest';
export type { UseCachedDataOptions } from './useCachedData';
export type { UseInfiniteScrollOptions } from './useInfiniteScroll';
export type { UseFormStateOptions } from './useFormState';