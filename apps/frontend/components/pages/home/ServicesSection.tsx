'use client';

import { Wrench, Star, Clock, MapPin } from 'lucide-react';

interface ServicesSectionProps {
  className?: string;
}

const mockServices = [
  {
    id: '1',
    name: 'House Cleaning',
    description: 'Professional deep cleaning services for your home',
    price: 120,
    rating: 4.8,
    duration: '2-3 hours',
    location: 'All areas'
  },
  {
    id: '2', 
    name: 'Plumbing Repair',
    description: 'Expert plumbing services for all your needs',
    price: 85,
    rating: 4.9,
    duration: '1-2 hours',
    location: 'All areas'
  },
  {
    id: '3',
    name: 'Electrical Work',
    description: 'Safe and reliable electrical installations and repairs',
    price: 95,
    rating: 4.7,
    duration: '1-3 hours', 
    location: 'All areas'
  }
];

export default function ServicesSection({ className }: ServicesSectionProps) {
  return (
    <section className={`py-16 bg-gray-50 ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Wrench className="h-4 w-4" />
            Professional Services
          </div>
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from our wide range of professional home services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.rating}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{service.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    ${service.price}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}