'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';

interface SwipeNavigationProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  swipeThreshold?: number;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;
  onSlideChange?: (index: number) => void;
}

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  children,
  className,
  itemClassName,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  swipeThreshold = 50,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '1rem',
  onSlideChange,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const autoPlayRef = React.useRef<NodeJS.Timeout>();

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;

  // Calculate items per view based on screen size
  const [itemsVisible, setItemsVisible] = React.useState(itemsPerView.mobile);

  React.useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsVisible(itemsPerView.desktop);
      } else if (window.innerWidth >= 768) {
        setItemsVisible(itemsPerView.tablet);
      } else {
        setItemsVisible(itemsPerView.mobile);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, [itemsPerView]);

  const maxIndex = Math.max(0, totalItems - itemsVisible);

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && totalItems > itemsVisible) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, maxIndex, totalItems, itemsVisible]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
    onSlideChange?.(clampedIndex);
    
    // Clear auto-play when user interacts
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const goToPrevious = () => {
    goToSlide(currentIndex - 1);
  };

  const goToNext = () => {
    goToSlide(currentIndex + 1);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    
    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        // Swiped left - go to next
        goToNext();
      } else {
        // Swiped right - go to previous
        goToPrevious();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentIndex, maxIndex]);

  const translateX = -(currentIndex * (100 / itemsVisible));

  return (
    <div 
      ref={containerRef}
      className={cn('relative w-full', className)}
      tabIndex={0}
      role="region"
      aria-label="Swipeable carousel"
    >
      {/* Main carousel container */}
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${translateX}%)`,
            gap,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className={cn(
                'flex-shrink-0',
                itemClassName
              )}
              style={{
                width: `calc(${100 / itemsVisible}% - ${gap} * ${(itemsVisible - 1) / itemsVisible})`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalItems > itemsVisible && (
        <>
          <TouchOptimizedButton
            variant="ghost"
            size="icon"
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90',
              currentIndex === 0 && 'opacity-50 cursor-not-allowed'
            )}
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            aria-label="Previous slide"
            touchFeedback="medium"
          >
            <ChevronLeft className="h-5 w-5" />
          </TouchOptimizedButton>

          <TouchOptimizedButton
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90',
              currentIndex >= maxIndex && 'opacity-50 cursor-not-allowed'
            )}
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Next slide"
            touchFeedback="medium"
          >
            <ChevronRight className="h-5 w-5" />
          </TouchOptimizedButton>
        </>
      )}

      {/* Dot indicators */}
      {showDots && totalItems > itemsVisible && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-200 touch-manipulation',
                'min-w-[44px] min-h-[44px] flex items-center justify-center', // Touch-friendly size
                currentIndex === index
                  ? 'bg-primary-600 scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-200',
                  currentIndex === index ? 'bg-white' : 'bg-current'
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {currentIndex + 1} of {maxIndex + 1}
      </div>
    </div>
  );
};

export default SwipeNavigation;