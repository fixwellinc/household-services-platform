'use client';

import * as React from 'react';
import { 
  TouchOptimizedForm,
  MobileNavigation,
  MobileLoadingStates,
  MobileSkeleton,
  PullToRefresh,
  NetworkStatus,
  TouchOptimizedButton,
  SwipeNavigation,
  TouchOptimizedCard
} from '@/components/ui/touch';
import { Mail, Phone, User, Lock, MessageCircle, Star, Heart, Share } from 'lucide-react';

const MobileOptimizedExample: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = React.useState(false);
  const [loadingState, setLoadingState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  // Mock user data
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Customer',
  };

  // Form fields configuration
  const contactFormFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text' as const,
      placeholder: 'Enter your full name',
      required: true,
      icon: <User className="w-5 h-5" />,
      validation: { minLength: 2 },
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      placeholder: 'Enter your email',
      required: true,
      icon: <Mail className="w-5 h-5" />,
      validation: { email: true },
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel' as const,
      placeholder: 'Enter your phone number',
      required: true,
      icon: <Phone className="w-5 h-5" />,
      validation: { phone: true },
      hint: 'We\'ll use this to contact you about your service request',
    },
    {
      name: 'message',
      label: 'Message',
      type: 'text' as const,
      placeholder: 'Describe your service needs...',
      required: true,
      icon: <MessageCircle className="w-5 h-5" />,
      validation: { minLength: 10, maxLength: 500 },
    },
  ];

  // Mock services for swipe navigation
  const services = [
    {
      id: 1,
      title: 'Plumbing Repair',
      description: 'Professional plumbing services for all your home needs',
      price: '$89/hour',
      rating: 4.8,
      image: '🔧',
    },
    {
      id: 2,
      title: 'Electrical Work',
      description: 'Licensed electricians for safe and reliable electrical services',
      price: '$95/hour',
      rating: 4.9,
      image: '⚡',
    },
    {
      id: 3,
      title: 'HVAC Service',
      description: 'Heating, ventilation, and air conditioning maintenance',
      price: '$110/hour',
      rating: 4.7,
      image: '🌡️',
    },
  ];

  const handleFormSubmit = async (data: Record<string, string>) => {
    setLoadingState('loading');
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearInterval(progressInterval);
    setProgress(100);
    setLoadingState('success');

    // Reset after success
    setTimeout(() => {
      setLoadingState('idle');
      setProgress(0);
    }, 3000);

    console.log('Form submitted:', data);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    setPullDistance(0);
  };

  const simulateLoading = () => {
    setShowSkeleton(true);
    setTimeout(() => setShowSkeleton(false), 3000);
  };

  const simulateError = () => {
    setLoadingState('error');
    setTimeout(() => setLoadingState('idle'), 3000);
  };

  // Pull-to-refresh simulation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const startY = e.touches[0].clientY;
      
      const handleTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        setPullDistance(distance);
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        
        if (pullDistance >= 100 && !isRefreshing) {
          handleRefresh();
        } else {
          setPullDistance(0);
        }
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" onTouchStart={handleTouchStart}>
      {/* Network Status */}
      <NetworkStatus />

      {/* Mobile Navigation */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Mobile Demo
          </h1>
          <MobileNavigation
            isOpen={isNavOpen}
            onToggle={() => setIsNavOpen(!isNavOpen)}
            onClose={() => setIsNavOpen(false)}
            user={mockUser}
            onLogout={() => console.log('Logout')}
          />
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={100}
        onRefresh={handleRefresh}
      />

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Loading States Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Loading States
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={() => setLoadingState('loading')}
              touchFeedback="medium"
            >
              Loading
            </TouchOptimizedButton>
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={() => setLoadingState('success')}
              touchFeedback="medium"
            >
              Success
            </TouchOptimizedButton>
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={simulateError}
              touchFeedback="medium"
            >
              Error
            </TouchOptimizedButton>
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={simulateLoading}
              touchFeedback="medium"
            >
              Skeleton
            </TouchOptimizedButton>
          </div>

          <MobileLoadingStates
            state={loadingState}
            message={
              loadingState === 'loading' ? 'Processing your request...' :
              loadingState === 'success' ? 'Request completed successfully!' :
              loadingState === 'error' ? 'Failed to process request' :
              undefined
            }
            progress={progress}
            showProgress={loadingState === 'loading'}
            hapticFeedback={true}
          />
        </section>

        {/* Skeleton Loading Demo */}
        {showSkeleton && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Loading Content...
            </h2>
            <MobileSkeleton lines={4} showAvatar={true} showButton={true} />
          </section>
        )}

        {/* Service Cards with Swipe Navigation */}
        {!showSkeleton && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Our Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Swipe to browse services or use the arrow buttons
            </p>
            
            <SwipeNavigation
              itemsPerView={{ mobile: 1, tablet: 1, desktop: 1 }}
              showArrows={true}
              showDots={true}
              autoPlay={false}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
            >
              {services.map((service) => (
                <div key={service.id} className="p-4">
                  <TouchOptimizedCard
                    title={service.title}
                    description={service.description}
                    interactive={true}
                    expandable={true}
                    touchFeedback="medium"
                    onTap={() => console.log('Service tapped:', service.title)}
                    onLongPress={() => console.log('Service bookmarked:', service.title)}
                    className="h-full"
                  >
                    <div className="space-y-4">
                      <div className="text-4xl text-center">{service.image}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-primary-600">
                          {service.price}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {service.rating}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <TouchOptimizedButton
                          variant="outline"
                          size="sm"
                          icon={<Heart className="w-4 h-4" />}
                          touchFeedback="medium"
                          className="flex-1"
                        >
                          Save
                        </TouchOptimizedButton>
                        <TouchOptimizedButton
                          variant="ghost"
                          size="sm"
                          icon={<Share className="w-4 h-4" />}
                          touchFeedback="subtle"
                        >
                          Share
                        </TouchOptimizedButton>
                      </div>
                    </div>
                  </TouchOptimizedCard>
                </div>
              ))}
            </SwipeNavigation>
          </section>
        )}

        {/* Touch-Optimized Form */}
        {!showSkeleton && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Contact Form
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Experience our mobile-optimized form with real-time validation and haptic feedback
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <TouchOptimizedForm
                fields={contactFormFields}
                onSubmit={handleFormSubmit}
                submitLabel="Send Message"
                loading={loadingState === 'loading'}
                showProgress={true}
                hapticFeedback={true}
                autoValidate={true}
              />
            </div>
          </section>
        )}

        {/* Instructions */}
        <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Mobile Features Demo
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-1">Touch Interactions:</h4>
              <ul className="space-y-1 text-xs">
                <li>• All buttons have 44px+ touch targets</li>
                <li>• Haptic feedback on interactions</li>
                <li>• Visual feedback with animations</li>
                <li>• Gesture support for cards and navigation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Mobile Navigation:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Swipe left to close menu</li>
                <li>• Touch-friendly menu items</li>
                <li>• Smooth animations and transitions</li>
                <li>• Keyboard navigation support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Form Enhancements:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Proper keyboard types for inputs</li>
                <li>• Real-time validation with feedback</li>
                <li>• Progress tracking and visual cues</li>
                <li>• Touch-optimized input sizing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Try These Actions:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Pull down to refresh (at top of page)</li>
                <li>• Tap menu button to open navigation</li>
                <li>• Swipe through service cards</li>
                <li>• Fill out the contact form</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileOptimizedExample;