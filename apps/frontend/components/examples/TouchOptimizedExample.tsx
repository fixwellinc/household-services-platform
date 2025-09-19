'use client';

import * as React from 'react';
import { TouchOptimizedButton } from '@/components/ui/touch/TouchOptimizedButton';
import { SwipeNavigation } from '@/components/ui/touch/SwipeNavigation';
import { TouchOptimizedCard } from '@/components/ui/touch/TouchOptimizedCard';
import { Heart, Share, Bookmark, Star, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';

const TouchOptimizedExample: React.FC = () => {
  const [selectedService, setSelectedService] = React.useState<number | null>(null);
  const [bookmarkedServices, setBookmarkedServices] = React.useState<Set<number>>(new Set());

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
    {
      id: 4,
      title: 'Appliance Repair',
      description: 'Fix all major home appliances quickly and efficiently',
      price: '$75/hour',
      rating: 4.6,
      image: '🔨',
    },
    {
      id: 5,
      title: 'Handyman Services',
      description: 'General home maintenance and repair services',
      price: '$65/hour',
      rating: 4.5,
      image: '🛠️',
    },
  ];

  const handleServiceTap = (serviceId: number) => {
    setSelectedService(serviceId);
  };

  const handleServiceBookmark = (serviceId: number) => {
    setBookmarkedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleServiceShare = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service && navigator.share) {
      navigator.share({
        title: service.title,
        text: service.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Touch-Optimized Interface Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience our mobile-first design with touch-friendly buttons, swipe navigation, 
          and gesture-enabled cards. All elements are optimized for touch interaction.
        </p>
      </div>

      {/* Touch-Optimized Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Touch-Optimized Buttons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TouchOptimizedButton 
            variant="default" 
            size="lg"
            icon={<Phone className="w-5 h-5" />}
            touchFeedback="medium"
          >
            Call Now
          </TouchOptimizedButton>
          
          <TouchOptimizedButton 
            variant="outline" 
            size="lg"
            icon={<Mail className="w-5 h-5" />}
            iconPosition="right"
            touchFeedback="subtle"
          >
            Send Message
          </TouchOptimizedButton>
          
          <TouchOptimizedButton 
            variant="premium" 
            size="lg"
            icon={<Star className="w-5 h-5" />}
            touchFeedback="strong"
          >
            Book Service
          </TouchOptimizedButton>
          
          <TouchOptimizedButton 
            variant="secondary" 
            size="default"
            loading={false}
            touchFeedback="lift"
          >
            Get Quote
          </TouchOptimizedButton>
          
          <TouchOptimizedButton 
            variant="ghost" 
            size="icon-lg"
            touchFeedback="medium"
          >
            <MapPin className="w-6 h-6" />
          </TouchOptimizedButton>
          
          <TouchOptimizedButton 
            variant="destructive" 
            size="sm"
            touchFeedback="subtle"
          >
            Cancel
          </TouchOptimizedButton>
        </div>
      </section>

      {/* Swipe Navigation Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Swipe Navigation</h2>
        <p className="text-gray-600">
          Swipe left or right to navigate through services. Works with touch gestures and keyboard arrows.
        </p>
        
        <SwipeNavigation
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
          showArrows={true}
          showDots={true}
          autoPlay={false}
          className="bg-gray-50 p-4 rounded-lg"
          onSlideChange={(index) => console.log('Slide changed to:', index)}
        >
          {services.map((service) => (
            <div key={service.id} className="p-4">
              <TouchOptimizedCard
                title={service.title}
                description={service.description}
                interactive={true}
                expandable={true}
                touchFeedback="medium"
                onTap={() => handleServiceTap(service.id)}
                onLongPress={() => handleServiceBookmark(service.id)}
                className={`h-full ${selectedService === service.id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="space-y-3">
                  <div className="text-4xl text-center">{service.image}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-primary-600">
                      {service.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{service.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <TouchOptimizedButton
                      variant="outline"
                      size="sm"
                      icon={<Heart className={`w-4 h-4 ${bookmarkedServices.has(service.id) ? 'fill-red-500 text-red-500' : ''}`} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceBookmark(service.id);
                      }}
                      touchFeedback="medium"
                    >
                      {bookmarkedServices.has(service.id) ? 'Saved' : 'Save'}
                    </TouchOptimizedButton>
                    
                    <TouchOptimizedButton
                      variant="ghost"
                      size="sm"
                      icon={<Share className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceShare(service.id);
                      }}
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

      {/* Gesture-Enabled Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Gesture-Enabled Cards</h2>
        <p className="text-gray-600">
          Try different gestures: tap to select, long press to bookmark, double tap for quick action.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TouchOptimizedCard
            title="Quick Service Request"
            description="Tap to expand, long press to bookmark, double tap to call"
            interactive={true}
            expandable={true}
            touchFeedback="medium"
            onTap={() => console.log('Card tapped')}
            onDoubleTap={() => console.log('Quick call initiated')}
            onLongPress={() => console.log('Card bookmarked')}
            onSwipeLeft={() => console.log('Swiped left - next option')}
            onSwipeRight={() => console.log('Swiped right - previous option')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Emergency Service</span>
                <span className="text-lg font-semibold text-green-600">Available 24/7</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Get immediate assistance for urgent home repairs. Our certified technicians 
                  are ready to help with plumbing, electrical, and HVAC emergencies.
                </p>
                
                <div className="flex gap-2">
                  <TouchOptimizedButton variant="default" size="sm" className="flex-1">
                    Request Service
                  </TouchOptimizedButton>
                  <TouchOptimizedButton variant="outline" size="sm">
                    Learn More
                  </TouchOptimizedButton>
                </div>
              </div>
            </div>
          </TouchOptimizedCard>

          <TouchOptimizedCard
            title="Service History"
            description="View your past services and schedule follow-ups"
            interactive={true}
            touchFeedback="subtle"
            onTap={() => console.log('History viewed')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Service</span>
                <span className="font-medium">Plumbing Repair</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">March 15, 2024</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              
              <TouchOptimizedButton 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                View All History
              </TouchOptimizedButton>
            </div>
          </TouchOptimizedCard>
        </div>
      </section>

      {/* Instructions */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Touch Interaction Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Button Interactions:</h4>
            <ul className="space-y-1">
              <li>• Tap for primary action</li>
              <li>• Visual and haptic feedback</li>
              <li>• Minimum 44px touch targets</li>
              <li>• Loading states with animations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Card Gestures:</h4>
            <ul className="space-y-1">
              <li>• Tap to select/expand</li>
              <li>• Long press to bookmark</li>
              <li>• Double tap for quick actions</li>
              <li>• Swipe left/right to navigate</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TouchOptimizedExample;