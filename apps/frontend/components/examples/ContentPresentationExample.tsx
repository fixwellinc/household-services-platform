'use client';

import React from 'react';
import {
  ResponsiveImage,
  ResponsiveImageGrid,
  ResponsiveHeroImage,
  AdaptiveImage,
} from '@/components/ui/images/ResponsiveImage';
import {
  ContentPriority,
  AdaptiveArticleLayout,
  AdaptiveCardLayout,
  ResponsiveTable,
  AdaptiveNavigation,
  BreakpointTransition,
} from '@/components/ui/layout/AdaptiveContentLayout';
import { ResponsiveContainer, ResponsiveSection } from '@/components/ui/layout/ResponsiveGrid';
import { FluidTypography } from '@/components/ui/layout/AdvancedResponsiveLayout';

export function ContentPresentationExample() {
  // Sample data for demonstrations
  const sampleImages = [
    { src: '/api/placeholder/400/300', alt: 'Sample Image 1', caption: 'Beautiful landscape' },
    { src: '/api/placeholder/400/300', alt: 'Sample Image 2', caption: 'Urban architecture' },
    { src: '/api/placeholder/400/300', alt: 'Sample Image 3', caption: 'Natural scenery' },
    { src: '/api/placeholder/400/300', alt: 'Sample Image 4', caption: 'Modern design' },
    { src: '/api/placeholder/400/300', alt: 'Sample Image 5', caption: 'Creative composition' },
    { src: '/api/placeholder/400/300', alt: 'Sample Image 6', caption: 'Artistic perspective' },
  ];

  const tableData = [
    { Service: 'Plumbing Repair', Price: '$89', Duration: '1-2 hours', Rating: '4.9/5' },
    { Service: 'Electrical Work', Price: '$125', Duration: '2-3 hours', Rating: '4.8/5' },
    { Service: 'HVAC Maintenance', Price: '$150', Duration: '2-4 hours', Rating: '4.9/5' },
    { Service: 'Appliance Repair', Price: '$95', Duration: '1-3 hours', Rating: '4.7/5' },
    { Service: 'Handyman Services', Price: '$75', Duration: '1-2 hours', Rating: '4.8/5' },
  ];

  const navigationItems = [
    { label: 'Home', href: '/', priority: 'high' as const, icon: '🏠' },
    { label: 'Services', href: '/services', priority: 'high' as const, icon: '🔧' },
    { label: 'About', href: '/about', priority: 'medium' as const, icon: 'ℹ️' },
    { label: 'Contact', href: '/contact', priority: 'medium' as const, icon: '📞' },
    { label: 'Blog', href: '/blog', priority: 'low' as const, icon: '📝' },
    { label: 'Careers', href: '/careers', priority: 'low' as const, icon: '💼' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Adaptive Navigation Example */}
      <AdaptiveNavigation
        items={navigationItems}
        logo={
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="font-bold text-xl">Fixwell</span>
          </div>
        }
        actions={
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">Login</button>
            <button className="btn btn-primary btn-sm">Sign Up</button>
          </div>
        }
      />

      {/* Hero Image with Adaptive Content */}
      <ResponsiveHeroImage
        src="/api/placeholder/1200/600"
        alt="Professional home services"
        overlay
        overlayColor="black"
        overlayOpacity={0.5}
        height={{ xs: '50vh', md: '60vh', lg: '70vh' }}
      >
        <BreakpointTransition duration="slow" easing="ease-out">
          <div className="text-center space-y-6 px-4">
            <FluidTypography variant="display" className="text-white font-bold">
              Professional Home Services
            </FluidTypography>
            <FluidTypography variant="subheading" className="text-white/90 max-w-2xl mx-auto">
              Expert technicians for all your household needs with responsive design that works perfectly on any device
            </FluidTypography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary btn-lg">Book Service</button>
              <button className="btn btn-secondary btn-lg">Learn More</button>
            </div>
          </div>
        </BreakpointTransition>
      </ResponsiveHeroImage>

      <ResponsiveContainer className="py-12">
        {/* Adaptive Article Layout Example */}
        <ResponsiveSection spacing="lg">
          <AdaptiveArticleLayout
            title={
              <FluidTypography variant="heading" className="text-gray-900">
                Responsive Content Presentation
              </FluidTypography>
            }
            subtitle={
              <FluidTypography variant="subheading" className="text-gray-600">
                Optimized layouts that prioritize important information on mobile devices
              </FluidTypography>
            }
            content={
              <div className="space-y-6">
                <FluidTypography variant="body" className="text-gray-700">
                  Our adaptive content system automatically reorganizes information based on screen size and device capabilities. 
                  On mobile devices, the most important content appears first, while secondary information is repositioned 
                  for optimal user experience.
                </FluidTypography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Mobile-First Priority</h4>
                    <p className="text-blue-800 text-sm">
                      Content is automatically reordered on mobile devices to show the most important information first.
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-emerald-900 mb-3">Smooth Transitions</h4>
                    <p className="text-emerald-800 text-sm">
                      Breakpoint changes include smooth transitions that maintain layout integrity.
                    </p>
                  </div>
                </div>
              </div>
            }
            sidebar={
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="font-semibold mb-4">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-semibold">&lt; 300ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile Score</span>
                      <span className="font-semibold">98/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accessibility</span>
                      <span className="font-semibold">WCAG AA</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="font-semibold mb-4">Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Lazy loading images
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Responsive breakpoints
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Content prioritization
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Smooth transitions
                    </li>
                  </ul>
                </div>
              </div>
            }
            metadata={
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Published: March 2024</span>
                <span>•</span>
                <span>Reading time: 5 min</span>
                <span>•</span>
                <span>Category: Web Development</span>
              </div>
            }
            actions={
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary">Get Started</button>
                <button className="btn btn-outline">View Demo</button>
                <button className="btn btn-ghost">Share</button>
              </div>
            }
            image={
              <ResponsiveImage
                src="/api/placeholder/600/400"
                alt="Responsive design illustration"
                aspectRatio="3 / 2"
                className="rounded-lg shadow-md"
              />
            }
          />
        </ResponsiveSection>

        {/* Responsive Image Grid Example */}
        <ResponsiveSection spacing="lg" background="subtle">
          <div className="text-center mb-12">
            <FluidTypography variant="heading" className="text-gray-900 mb-4">
              Responsive Image Gallery
            </FluidTypography>
            <FluidTypography variant="body" className="text-gray-600 max-w-2xl mx-auto">
              Images automatically adapt to different screen sizes with proper lazy loading and optimized sizing
            </FluidTypography>
          </div>

          <ResponsiveImageGrid
            images={sampleImages}
            columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
            gap="lg"
            aspectRatio="4 / 3"
            onImageClick={(index) => console.log(`Clicked image ${index}`)}
          />
        </ResponsiveSection>

        {/* Adaptive Card Layouts */}
        <ResponsiveSection spacing="lg">
          <div className="text-center mb-12">
            <FluidTypography variant="heading" className="text-gray-900 mb-4">
              Adaptive Card Layouts
            </FluidTypography>
            <FluidTypography variant="body" className="text-gray-600 max-w-2xl mx-auto">
              Cards that automatically adjust their layout based on available space and screen size
            </FluidTypography>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stacked Card */}
            <AdaptiveCardLayout
              layout="stacked"
              header={<h3 className="text-xl font-semibold">Stacked Layout</h3>}
              image={
                <ResponsiveImage
                  src="/api/placeholder/400/200"
                  alt="Stacked card example"
                  aspectRatio="2 / 1"
                  className="w-full"
                />
              }
              actions={
                <div className="flex gap-3">
                  <button className="btn btn-primary btn-sm">Primary</button>
                  <button className="btn btn-outline btn-sm">Secondary</button>
                </div>
              }
              footer={<p className="text-sm text-gray-500">Perfect for mobile devices</p>}
            >
              <p className="text-gray-700">
                This card uses a stacked layout that works great on mobile devices. 
                The image appears at the top, followed by content and actions.
              </p>
            </AdaptiveCardLayout>

            {/* Horizontal Card */}
            <AdaptiveCardLayout
              layout="horizontal"
              imagePosition="left"
              header={<h3 className="text-xl font-semibold">Horizontal Layout</h3>}
              image={
                <ResponsiveImage
                  src="/api/placeholder/200/200"
                  alt="Horizontal card example"
                  aspectRatio="1 / 1"
                  className="w-full h-full object-cover"
                />
              }
              actions={
                <div className="flex gap-3">
                  <button className="btn btn-primary btn-sm">Learn More</button>
                </div>
              }
              footer={<p className="text-sm text-gray-500">Optimized for desktop</p>}
            >
              <p className="text-gray-700">
                This card uses a horizontal layout that's perfect for desktop screens. 
                The image appears on the side with content flowing alongside.
              </p>
            </AdaptiveCardLayout>

            {/* Background Image Card */}
            <AdaptiveCardLayout
              layout="stacked"
              imagePosition="background"
              header={<h3 className="text-xl font-bold">Background Layout</h3>}
              image={
                <ResponsiveImage
                  src="/api/placeholder/600/300"
                  alt="Background card example"
                  fill
                  className="object-cover"
                />
              }
              actions={
                <div className="flex gap-3">
                  <button className="btn btn-secondary btn-sm">Explore</button>
                </div>
              }
              footer={<p className="text-sm text-white/80">Dramatic visual impact</p>}
              className="min-h-[300px]"
            >
              <p className="text-white/90">
                This card uses the image as a background with an overlay, 
                creating a dramatic visual effect perfect for hero sections.
              </p>
            </AdaptiveCardLayout>

            {/* Adaptive Card */}
            <AdaptiveCardLayout
              layout="adaptive"
              imagePosition="right"
              header={<h3 className="text-xl font-semibold">Adaptive Layout</h3>}
              image={
                <ResponsiveImage
                  src="/api/placeholder/300/200"
                  alt="Adaptive card example"
                  aspectRatio="3 / 2"
                  className="w-full"
                />
              }
              actions={
                <div className="flex gap-3">
                  <button className="btn btn-primary btn-sm">Adapt</button>
                  <button className="btn btn-outline btn-sm">Resize</button>
                </div>
              }
              footer={<p className="text-sm text-gray-500">Changes with screen size</p>}
            >
              <p className="text-gray-700">
                This card automatically adapts its layout. On mobile it stacks vertically, 
                on desktop it displays horizontally with the image on the right.
              </p>
            </AdaptiveCardLayout>
          </div>
        </ResponsiveSection>

        {/* Responsive Table Example */}
        <ResponsiveSection spacing="lg" background="subtle">
          <div className="text-center mb-12">
            <FluidTypography variant="heading" className="text-gray-900 mb-4">
              Responsive Data Tables
            </FluidTypography>
            <FluidTypography variant="body" className="text-gray-600 max-w-2xl mx-auto">
              Tables that transform into mobile-friendly card layouts on smaller screens
            </FluidTypography>
          </div>

          <div className="space-y-8">
            {/* Card Layout on Mobile */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Card Layout (Mobile)</h4>
              <ResponsiveTable
                headers={['Service', 'Price', 'Duration', 'Rating']}
                data={tableData}
                mobileLayout="cards"
                priorityColumns={['Service', 'Price']}
              />
            </div>

            {/* Stacked Layout on Mobile */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Stacked Layout (Mobile)</h4>
              <ResponsiveTable
                headers={['Service', 'Price', 'Duration', 'Rating']}
                data={tableData.slice(0, 3)}
                mobileLayout="stacked"
                priorityColumns={['Service']}
              />
            </div>

            {/* Horizontal Scroll on Mobile */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Horizontal Scroll (Mobile)</h4>
              <ResponsiveTable
                headers={['Service', 'Price', 'Duration', 'Rating']}
                data={tableData.slice(0, 3)}
                mobileLayout="horizontal-scroll"
              />
            </div>
          </div>
        </ResponsiveSection>

        {/* Content Priority Example */}
        <ResponsiveSection spacing="lg">
          <div className="text-center mb-12">
            <FluidTypography variant="heading" className="text-gray-900 mb-4">
              Content Priority System
            </FluidTypography>
            <FluidTypography variant="body" className="text-gray-600 max-w-2xl mx-auto">
              Content automatically reorders based on priority levels for optimal mobile experience
            </FluidTypography>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex flex-col space-y-6">
              <ContentPriority priority="high" className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-red-900 mb-2">High Priority Content</h4>
                <p className="text-red-800 text-sm">
                  This content appears first on mobile devices. It contains the most important information 
                  that users need to see immediately.
                </p>
              </ContentPriority>

              <ContentPriority priority="medium" className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-semibold text-yellow-900 mb-2">Medium Priority Content</h4>
                <p className="text-yellow-800 text-sm">
                  This content appears second on mobile devices. It provides additional context 
                  and supporting information.
                </p>
              </ContentPriority>

              <ContentPriority priority="low" className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
                <h4 className="font-semibold text-gray-900 mb-2">Low Priority Content</h4>
                <p className="text-gray-700 text-sm">
                  This content appears last on mobile devices. It includes supplementary information 
                  that's nice to have but not essential.
                </p>
              </ContentPriority>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> On desktop screens, content maintains its natural order. 
                The priority system only affects mobile layouts to improve user experience.
              </p>
            </div>
          </div>
        </ResponsiveSection>

        {/* Adaptive Images Example */}
        <ResponsiveSection spacing="lg" background="subtle">
          <div className="text-center mb-12">
            <FluidTypography variant="heading" className="text-gray-900 mb-4">
              Adaptive Images
            </FluidTypography>
            <FluidTypography variant="body" className="text-gray-600 max-w-2xl mx-auto">
              Images that automatically switch sources based on screen size for optimal performance
            </FluidTypography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Standard Responsive Image</h4>
              <ResponsiveImage
                src="/api/placeholder/600/400"
                alt="Standard responsive image"
                aspectRatio="3 / 2"
                className="rounded-lg shadow-md"
                responsive={{
                  xs: { width: 300, height: 200 },
                  sm: { width: 400, height: 267 },
                  md: { width: 500, height: 333 },
                  lg: { width: 600, height: 400 },
                }}
              />
              <p className="text-sm text-gray-600">
                This image uses responsive sizing to optimize for different screen sizes.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Adaptive Source Image</h4>
              <AdaptiveImage
                src="/api/placeholder/600/400"
                alt="Adaptive source image"
                aspectRatio="3 / 2"
                className="rounded-lg shadow-md"
                breakpointSources={{
                  xs: '/api/placeholder/300/200',
                  sm: '/api/placeholder/400/267',
                  md: '/api/placeholder/500/333',
                  lg: '/api/placeholder/600/400',
                }}
              />
              <p className="text-sm text-gray-600">
                This image switches to different source files based on screen size for optimal loading.
              </p>
            </div>
          </div>
        </ResponsiveSection>
      </ResponsiveContainer>
    </div>
  );
}