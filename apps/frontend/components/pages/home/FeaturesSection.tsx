'use client';

import { Shield, Clock, Star, Users, CheckCircle, Award } from 'lucide-react';

interface FeaturesSectionProps {
  className?: string;
}

const features = [
  {
    icon: Shield,
    title: 'Fully Insured & Bonded',
    description: 'All our service providers are fully insured and bonded for your peace of mind.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book services at your convenience with our flexible scheduling options.',
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description: 'We guarantee the quality of our work with our satisfaction promise.',
  },
  {
    icon: Users,
    title: 'Trusted Professionals',
    description: 'Our network consists of verified, experienced, and trusted professionals.',
  },
  {
    icon: CheckCircle,
    title: 'Easy Booking',
    description: 'Simple online booking process that takes just a few minutes.',
  },
  {
    icon: Award,
    title: 'Award Winning',
    description: 'Recognized for excellence in customer service and quality delivery.',
  },
];

export default function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section className={`py-16 bg-white ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Fixwell?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're committed to providing exceptional service experiences that exceed your expectations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div key={feature.title} className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}