'use client';

import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  return (
    <section className={`py-16 bg-blue-600 text-white ${className || ''}`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust Fixwell for their home service needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center">
            Book a Service Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            View All Services
          </button>
        </div>
      </div>
    </section>
  );
}