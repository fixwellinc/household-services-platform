'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  ThumbsUp,
  Award
} from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Premium Member',
    avatar: 'SJ',
    rating: 5,
    content: 'The Premium plan has transformed how I manage my household. The priority booking and faster response times make all the difference for my busy schedule. I can\'t imagine going back to managing everything manually!',
    service: 'House Cleaning',
    date: '2 weeks ago'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'VIP Member',
    avatar: 'MC',
    rating: 5,
    content: 'As a VIP member, I get the white-glove treatment I expect. My dedicated account manager knows exactly what I need before I even ask. The service quality is consistently outstanding.',
    service: 'Home Maintenance',
    date: '1 month ago'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Basic Member',
    avatar: 'ER',
    rating: 5,
    content: 'Perfect for my needs! The Basic plan gives me access to reliable services without breaking the bank. Great value for money and the professionals are always punctual and professional.',
    service: 'Garden Care',
    date: '3 weeks ago'
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Premium Member',
    avatar: 'DT',
    rating: 5,
    content: 'The recurring service setup is a game-changer. I have my cleaning scheduled automatically and never have to worry about remembering to book. The team is always reliable and thorough.',
    service: 'Recurring Cleaning',
    date: '1 week ago'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    role: 'VIP Member',
    avatar: 'LW',
    rating: 5,
    content: 'The concierge service is incredible. They handle everything from scheduling to follow-up, and the quality is consistently excellent. Worth every penny for the peace of mind.',
    service: 'Concierge Service',
    date: '2 months ago'
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Customer Stories
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Customers Say
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied customers who trust us with their household needs
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Main Testimonial */}
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
              
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {testimonials[currentIndex].avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Quote Icon */}
                    <Quote className="h-8 w-8 text-blue-200 mb-4" />
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {renderStars(testimonials[currentIndex].rating)}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Verified Customer
                      </Badge>
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">
                      &ldquo;{testimonials[currentIndex].content}&rdquo;
                    </blockquote>

                    {/* Customer Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {testimonials[currentIndex].name}
                        </h4>
                        <p className="text-gray-600">
                          {testimonials[currentIndex].role} • {testimonials[currentIndex].service}
                        </p>
                        <p className="text-sm text-gray-500">
                          {testimonials[currentIndex].date}
                        </p>
                      </div>
                      
                      {/* Action Icons */}
                      <div className="flex gap-2">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                          <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                          <ThumbsUp className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-20">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">10k+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-2">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
} 