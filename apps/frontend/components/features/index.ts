/**
 * Feature Components
 * Business logic components organized by feature domain
 */

// Re-export existing feature components
export * from './auth';
export * from './services';
export * from './dashboard';

// Legacy feature exports for backward compatibility
export { default as ServiceCard } from './ServiceCard';