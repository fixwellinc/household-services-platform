/**
 * Component Library Main Export
 * Centralized exports for the entire component library
 */

// Re-export existing UI components directly
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Card } from './ui/card';
export { Badge } from './ui/badge';
export { Avatar } from './ui/avatar';
export { Checkbox } from './ui/checkbox';
export { Label } from './ui/label';
export { Progress } from './ui/progress';
export { Select } from './ui/select';
export { Switch } from './ui/switch';
export { Textarea } from './ui/textarea';
export { Tooltip } from './ui/tooltip';
export { LoadingSpinner } from './ui/LoadingSpinner';
export { Skeleton } from './ui/Skeleton';

// Export standardized components that exist
export { StandardErrorBoundary } from './ui/error-handling/StandardErrorBoundary';
export { StandardLoadingStates } from './ui/feedback/StandardLoadingStates';
export { StandardErrorStates } from './ui/feedback/StandardErrorStates';

// Export page components that exist
export { default as HeroSection } from './pages/home/HeroSection';
export { default as ServicesSection } from './pages/home/ServicesSection';
export { default as FeaturesSection } from './pages/home/FeaturesSection';
export { default as CTASection } from './pages/home/CTASection';

// Export types that exist
export * from './types/base';
export * from './types/interfaces';
export * from './types/standards';

// Legacy exports for backward compatibility
export { default as HomePageClient } from './HomePageClient';
export { default as ModernizedHomePageClient } from './ModernizedHomePageClient';
export { default as PlansSection } from './PlansSection';
export { default as PricingSection } from './PricingSection';
export { default as TestimonialsSection } from './TestimonialsSection';
export { default as QuoteRequestModal } from './QuoteRequestModal';
export { default as Providers } from './Providers';