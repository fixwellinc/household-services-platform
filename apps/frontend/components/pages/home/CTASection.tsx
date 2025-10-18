'use client';

import { Button } from '@/components/ui/shared';
import { ProgressiveReveal } from '@/components/ui/animations/ProgressiveReveal';
import Link from 'next/link';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  return (
    <section className={`py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-700 dark:via-purple-700 dark:to-blue-800 relative overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <ProgressiveReveal delay={400}>
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Get Started Today
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied Lower Mainland customers who trust us with their household needs
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-100 dark:text-blue-700 dark:hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 font-medium" 
              >
                <span className="flex items-center gap-2">
                  Let's Get You Started
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white px-8 py-4 font-medium transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center gap-2">
                  Browse Services
                  <MapPin className="h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
        </ProgressiveReveal>
      </div>
    </section>
  );
}