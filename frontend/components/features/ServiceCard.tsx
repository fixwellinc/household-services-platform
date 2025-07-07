'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { formatPrice } from '@/lib/utils';
import { 
  Shield, 
  Star, 
  Clock, 
  MapPin, 
  Heart,
  Eye,
  BookOpen,
  Sparkles,
  Zap,
  Home,
  Wrench,
  Sparkle
} from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
    basePrice: number;
    complexity: string;
  };
  onBook?: (serviceId: string) => void;
  onView?: (serviceId: string) => void;
}

export default function ServiceCard({ service, onBook, onView }: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CLEANING':
        return <Home className="h-8 w-8" />;
      case 'MAINTENANCE':
        return <Wrench className="h-8 w-8" />;
      case 'REPAIR':
        return <Zap className="h-8 w-8" />;
      case 'ORGANIZATION':
        return <Sparkle className="h-8 w-8" />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'EASY':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'HARD':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl border-0 shadow-lg ${
        isHovered ? 'ring-2 ring-blue-500/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header with Icon */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-purple-200/20" />
        <div className={`text-6xl opacity-20 transition-all duration-500 ${isHovered ? 'scale-110 rotate-12' : ''}`}>
          {getCategoryIcon(service.category)}
        </div>
        
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          {onView && (
            <button
              onClick={() => onView(service.id)}
              className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-blue-600 shadow-lg transition-all duration-300"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300 flex items-center gap-2">
              {service.name}
              {isHovered && <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />}
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600 line-clamp-2">
              {service.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
            {service.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-blue-600">
            {formatPrice(service.basePrice)}
          </span>
          <Badge variant="secondary" className={getComplexityColor(service.complexity)}>
            {service.complexity}
          </Badge>
        </div>
        
        {/* Service Features */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="font-medium">Professional Service</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Quick Response Time</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-purple-500" />
            <span>Local Professionals</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onBook && (
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
              onClick={() => onBook(service.id)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Book Now
            </Button>
          )}
          {onView && (
            <Button 
              variant="outline" 
              className="flex-1 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
              onClick={() => onView(service.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
    </Card>
  );
} 