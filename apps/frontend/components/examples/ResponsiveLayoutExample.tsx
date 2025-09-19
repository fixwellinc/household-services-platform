'use client';

import React from 'react';
import {
  ResponsiveGrid,
  ResponsiveContainer,
  ResponsiveSection,
  FlexResponsive,
  GridAreaLayout,
  GridAreaHeader,
  GridAreaMain,
  GridAreaSidebar,
  GridAreaFooter,
  ResponsiveShow,
  HierarchySpacing,
} from '@/components/ui/layout/ResponsiveGrid';
import {
  AdvancedResponsiveLayout,
  ResponsiveCardGrid,
  AdaptiveContentLayout,
  ResponsiveHeroLayout,
  FluidTypography,
  ResponsiveSpacing,
  BreakpointVisibility,
} from '@/components/ui/layout/AdvancedResponsiveLayout';
import { useBreakpoint, useResponsiveValue } from '@/hooks/use-container-query';

export function ResponsiveLayoutExample() {
  const { current: breakpoint } = useBreakpoint();
  
  const cardColumns = useResponsiveValue({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Grid Area Layout Example */}
      <GridAreaLayout className="min-h-screen">
        <GridAreaHeader className="bg-white shadow-sm border-b">
          <ResponsiveContainer>
            <FlexResponsive justify="between" align="center" className="py-4">
              <FluidTypography variant="heading">
                Responsive Layout System
              </FluidTypography>
              
              <BreakpointVisibility show={['md', 'lg', 'xl', '2xl']}>
                <nav className="flex gap-6">
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Home
                  </a>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    About
                  </a>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Services
                  </a>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Contact
                  </a>
                </nav>
              </BreakpointVisibility>

              <ResponsiveShow on="mobile">
                <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </ResponsiveShow>
            </FlexResponsive>
          </ResponsiveContainer>
        </GridAreaHeader>

        <GridAreaMain className="overflow-auto">
          <ResponsiveContainer className="py-8">
            <HierarchySpacing size="lg">
              {/* Hero Section with Responsive Layout */}
              <ResponsiveSection spacing="lg" background="gradient">
                <ResponsiveHeroLayout
                  title={
                    <FluidTypography variant="display" className="text-gray-900">
                      Advanced Responsive Grid System
                    </FluidTypography>
                  }
                  subtitle={
                    <FluidTypography variant="subheading" className="text-gray-600">
                      CSS Grid layouts that adapt seamlessly across all breakpoints with container queries
                    </FluidTypography>
                  }
                  content={
                    <FluidTypography variant="body" className="text-gray-700">
                      Experience modern responsive design with our advanced grid system that uses CSS Grid,
                      container queries, and flexible spacing to create layouts that work perfectly on any device.
                    </FluidTypography>
                  }
                  actions={
                    <FlexResponsive gap="md" className="mt-6">
                      <button className="btn btn-primary btn-lg">
                        Get Started
                      </button>
                      <button className="btn btn-outline btn-lg">
                        Learn More
                      </button>
                    </FlexResponsive>
                  }
                  media={
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/20 rounded-lg h-16"></div>
                        <div className="bg-purple-500/20 rounded-lg h-16"></div>
                        <div className="bg-emerald-500/20 rounded-lg h-16 col-span-2"></div>
                        <div className="bg-orange-500/20 rounded-lg h-12"></div>
                        <div className="bg-pink-500/20 rounded-lg h-12"></div>
                      </div>
                    </div>
                  }
                />
              </ResponsiveSection>

              {/* Responsive Card Grid Example */}
              <ResponsiveSection>
                <FluidTypography variant="heading" className="text-center mb-8">
                  Responsive Card Grid
                </FluidTypography>
                
                <ResponsiveCardGrid minCardWidth={280} maxColumns={4}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="card hover-lift bg-white p-6 rounded-xl shadow-sm border"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2">Feature {i + 1}</h3>
                      <p className="text-gray-600 text-sm">
                        This card adapts its layout based on the container size using container queries.
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button className="btn btn-primary btn-sm w-full">
                          Learn More
                        </button>
                      </div>
                    </div>
                  ))}
                </ResponsiveCardGrid>
              </ResponsiveSection>

              {/* Different Grid Variants */}
              <ResponsiveSection background="subtle">
                <FluidTypography variant="heading" className="text-center mb-8">
                  Grid Variants
                </FluidTypography>

                <div className="space-y-12">
                  {/* Services Grid */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Services Grid</h3>
                    <ResponsiveGrid variant="services" gap="lg">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="card bg-white p-6 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto mb-4"></div>
                          <h4 className="font-semibold mb-2">Service {i + 1}</h4>
                          <p className="text-gray-600 text-sm">Professional service description</p>
                        </div>
                      ))}
                    </ResponsiveGrid>
                  </div>

                  {/* Testimonials Grid */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Testimonials Grid</h3>
                    <ResponsiveGrid variant="testimonials" gap="md">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="card bg-white p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mr-4"></div>
                            <div>
                              <h4 className="font-semibold">Customer {i + 1}</h4>
                              <p className="text-gray-600 text-sm">Verified Customer</p>
                            </div>
                          </div>
                          <p className="text-gray-700 italic">
                            "This responsive grid system is amazing! It works perfectly on all devices."
                          </p>
                        </div>
                      ))}
                    </ResponsiveGrid>
                  </div>

                  {/* Pricing Grid */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Pricing Grid</h3>
                    <ResponsiveGrid variant="pricing" gap="lg">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className={`card p-8 text-center ${i === 1 ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                          <h4 className="text-2xl font-bold mb-2">
                            {['Basic', 'Pro', 'Enterprise'][i]}
                          </h4>
                          <div className="text-4xl font-bold mb-4">
                            ${[29, 99, 299][i]}
                            <span className="text-lg font-normal">/mo</span>
                          </div>
                          <ul className="space-y-2 mb-6 text-sm">
                            <li>Feature 1</li>
                            <li>Feature 2</li>
                            <li>Feature 3</li>
                          </ul>
                          <button className={`btn w-full ${i === 1 ? 'btn-secondary' : 'btn-primary'}`}>
                            Choose Plan
                          </button>
                        </div>
                      ))}
                    </ResponsiveGrid>
                  </div>
                </div>
              </ResponsiveSection>

              {/* Adaptive Content Layout Example */}
              <ResponsiveSection>
                <FluidTypography variant="heading" className="text-center mb-8">
                  Adaptive Content Layout
                </FluidTypography>

                <AdaptiveContentLayout
                  sidebar={
                    <div className="space-y-4">
                      <div className="card bg-white p-4">
                        <h4 className="font-semibold mb-2">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                          <li><a href="#" className="text-blue-600 hover:underline">Documentation</a></li>
                          <li><a href="#" className="text-blue-600 hover:underline">Examples</a></li>
                          <li><a href="#" className="text-blue-600 hover:underline">API Reference</a></li>
                        </ul>
                      </div>
                      <div className="card bg-white p-4">
                        <h4 className="font-semibold mb-2">Resources</h4>
                        <ul className="space-y-2 text-sm">
                          <li><a href="#" className="text-blue-600 hover:underline">Tutorials</a></li>
                          <li><a href="#" className="text-blue-600 hover:underline">Best Practices</a></li>
                          <li><a href="#" className="text-blue-600 hover:underline">Community</a></li>
                        </ul>
                      </div>
                    </div>
                  }
                >
                  <div className="card bg-white p-8">
                    <FluidTypography variant="heading" className="mb-4">
                      Main Content Area
                    </FluidTypography>
                    <FluidTypography variant="body" className="mb-6">
                      This layout automatically adapts based on the container size. On larger screens,
                      the sidebar appears next to the main content. On smaller screens, it moves below
                      the main content for better mobile experience.
                    </FluidTypography>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Responsive Design</h4>
                        <p className="text-gray-600 text-sm">
                          Layouts that work perfectly on any screen size.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Container Queries</h4>
                        <p className="text-gray-600 text-sm">
                          Component-level responsive design for better control.
                        </p>
                      </div>
                    </div>
                  </div>
                </AdaptiveContentLayout>
              </ResponsiveSection>

              {/* Responsive Spacing Example */}
              <ResponsiveSection background="subtle">
                <FluidTypography variant="heading" className="text-center mb-8">
                  Responsive Spacing
                </FluidTypography>

                <ResponsiveSpacing size="xl" type="padding">
                  <div className="card bg-white">
                    <ResponsiveSpacing size="lg" type="padding">
                      <FluidTypography variant="subheading" className="mb-4">
                        Fluid Spacing System
                      </FluidTypography>
                      <FluidTypography variant="body">
                        This content uses responsive spacing that scales smoothly across all breakpoints.
                        The padding and margins adjust automatically based on the screen size.
                      </FluidTypography>
                    </ResponsiveSpacing>
                  </div>
                </ResponsiveSpacing>
              </ResponsiveSection>

              {/* Debug Information */}
              <ResponsiveSection>
                <div className="card bg-gray-900 text-white p-6">
                  <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
                    <div>
                      <strong>Current Breakpoint:</strong> {breakpoint}
                    </div>
                    <div>
                      <strong>Grid Columns:</strong> {cardColumns}
                    </div>
                    <div>
                      <strong>Window Width:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
                    </div>
                  </div>
                </div>
              </ResponsiveSection>
            </HierarchySpacing>
          </ResponsiveContainer>
        </GridAreaMain>

        <GridAreaSidebar className="bg-gray-50 border-l">
          <ResponsiveShow on="desktop">
            <ResponsiveSpacing size="lg" type="padding">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Navigation</h4>
                  <nav className="space-y-2">
                    <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      Grid System
                    </a>
                    <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      Container Queries
                    </a>
                    <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      Responsive Utilities
                    </a>
                    <a href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      Examples
                    </a>
                  </nav>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">12+</div>
                      <div className="text-sm text-gray-600">Grid Variants</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">5</div>
                      <div className="text-sm text-gray-600">Breakpoints</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">100%</div>
                      <div className="text-sm text-gray-600">Responsive</div>
                    </div>
                  </div>
                </div>
              </div>
            </ResponsiveSpacing>
          </ResponsiveShow>
        </GridAreaSidebar>

        <GridAreaFooter className="bg-gray-900 text-white">
          <ResponsiveContainer>
            <ResponsiveSpacing size="lg" type="padding">
              <FlexResponsive justify="between" align="center">
                <FluidTypography variant="body">
                  © 2024 Responsive Layout System. Built with modern CSS Grid and container queries.
                </FluidTypography>
                
                <BreakpointVisibility show={['md', 'lg', 'xl', '2xl']}>
                  <div className="flex gap-4">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      Privacy
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      Terms
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      Support
                    </a>
                  </div>
                </BreakpointVisibility>
              </FlexResponsive>
            </ResponsiveSpacing>
          </ResponsiveContainer>
        </GridAreaFooter>
      </GridAreaLayout>
    </div>
  );
}