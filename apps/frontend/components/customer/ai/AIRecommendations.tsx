/**
 * AI-Powered Recommendations Component
 * 
 * Provides intelligent recommendations based on user behavior and data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Brain, 
  TrendingUp, 
  Star, 
  Zap, 
  Target, 
  Lightbulb,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'service' | 'upgrade' | 'optimization' | 'maintenance' | 'savings';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  category: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  reasoning: string;
  estimatedSavings?: number;
  estimatedTime?: number;
  tags: string[];
}

interface AIRecommendationsProps {
  userData: {
    subscription?: any;
    usageAnalytics?: any[];
    serviceRequests?: any[];
    preferences?: any;
  };
  className?: string;
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

const RECOMMENDATION_TYPES = {
  service: { icon: Zap, color: 'bg-blue-100 text-blue-800', label: 'Service' },
  upgrade: { icon: TrendingUp, color: 'bg-purple-100 text-purple-800', label: 'Upgrade' },
  optimization: { icon: Target, color: 'bg-green-100 text-green-800', label: 'Optimization' },
  maintenance: { icon: CheckCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance' },
  savings: { icon: Star, color: 'bg-emerald-100 text-emerald-800', label: 'Savings' },
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const IMPACT_COLORS = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-green-600',
};

export function AIRecommendations({ 
  userData, 
  className = '', 
  onRecommendationClick 
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    generateRecommendations();
  }, [userData]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const generatedRecommendations = await analyzeUserData(userData);
      setRecommendations(generatedRecommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUserData = async (data: any): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];

    // Analyze subscription usage
    if (data.subscription) {
      const subscription = data.subscription;
      
      // Check for underutilized features
      if (subscription.tier === 'PRIORITY' && subscription.usage?.servicesUsed < 3) {
        recommendations.push({
          id: 'underutilized-priority',
          type: 'optimization',
          title: 'Maximize Your Priority Plan',
          description: 'You\'re not using your Priority plan to its full potential. Consider scheduling more services.',
          priority: 'medium',
          confidence: 85,
          impact: 'high',
          category: 'usage',
          action: {
            label: 'View Services',
            url: '/customer-dashboard#services',
          },
          reasoning: 'Priority plan includes more services but current usage is low',
          estimatedSavings: 200,
          tags: ['usage', 'optimization', 'priority'],
        });
      }

      // Check for upgrade opportunities
      if (subscription.tier === 'STARTER' && subscription.usage?.servicesUsed > 8) {
        recommendations.push({
          id: 'upgrade-opportunity',
          type: 'upgrade',
          title: 'Upgrade to HomeCare Plan',
          description: 'You\'re using many services. Upgrading could save you money and give you more benefits.',
          priority: 'high',
          confidence: 92,
          impact: 'high',
          category: 'upgrade',
          action: {
            label: 'View Plans',
            url: '/customer-dashboard#subscription',
          },
          reasoning: 'High service usage suggests upgrade would be cost-effective',
          estimatedSavings: 150,
          tags: ['upgrade', 'savings', 'homecare'],
        });
      }
    }

    // Analyze usage patterns
    if (data.usageAnalytics && data.usageAnalytics.length > 0) {
      const analytics = data.usageAnalytics;
      const avgUsage = analytics.reduce((sum: number, item: any) => sum + (item.servicesUsed || 0), 0) / analytics.length;
      
      if (avgUsage > 5) {
        recommendations.push({
          id: 'high-usage-pattern',
          type: 'service',
          title: 'Consider Recurring Services',
          description: 'Your usage pattern suggests you might benefit from setting up recurring services.',
          priority: 'medium',
          confidence: 78,
          impact: 'medium',
          category: 'automation',
          action: {
            label: 'Set Up Recurring',
            onClick: () => console.log('Set up recurring services'),
          },
          reasoning: 'Consistent high usage indicates recurring services would be beneficial',
          estimatedTime: 10,
          tags: ['automation', 'recurring', 'convenience'],
        });
      }
    }

    // Analyze service requests
    if (data.serviceRequests && data.serviceRequests.length > 0) {
      const requests = data.serviceRequests;
      const categories = requests.reduce((acc: any, req: any) => {
        const category = req.service?.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const mostUsedCategory = Object.keys(categories).reduce((a, b) => 
        categories[a] > categories[b] ? a : b
      );

      if (mostUsedCategory === 'CLEANING' && categories[mostUsedCategory] > 3) {
        recommendations.push({
          id: 'cleaning-maintenance',
          type: 'maintenance',
          title: 'Schedule Regular Cleaning',
          description: 'You frequently request cleaning services. Consider setting up a regular cleaning schedule.',
          priority: 'medium',
          confidence: 88,
          impact: 'medium',
          category: 'maintenance',
          action: {
            label: 'Schedule Cleaning',
            onClick: () => console.log('Schedule regular cleaning'),
          },
          reasoning: 'Frequent cleaning requests suggest regular schedule would be beneficial',
          estimatedSavings: 50,
          tags: ['cleaning', 'maintenance', 'schedule'],
        });
      }
    }

    // Add seasonal recommendations
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      recommendations.push({
        id: 'spring-maintenance',
        type: 'maintenance',
        title: 'Spring Maintenance Package',
        description: 'Spring is the perfect time for home maintenance. Consider our spring cleaning package.',
        priority: 'low',
        confidence: 75,
        impact: 'medium',
        category: 'seasonal',
        action: {
          label: 'View Spring Package',
          onClick: () => console.log('View spring maintenance package'),
        },
        reasoning: 'Spring is optimal for home maintenance and cleaning',
        estimatedSavings: 100,
        tags: ['seasonal', 'spring', 'maintenance'],
      });
    }

    // Add savings opportunities
    recommendations.push({
      id: 'referral-program',
      type: 'savings',
      title: 'Referral Program',
      description: 'Refer friends and family to earn credits and discounts on future services.',
      priority: 'low',
      confidence: 95,
      impact: 'high',
      category: 'savings',
      action: {
        label: 'Learn More',
        onClick: () => console.log('Learn about referral program'),
      },
      reasoning: 'Referral programs offer easy savings opportunities',
      estimatedSavings: 50,
      tags: ['referral', 'savings', 'credits'],
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(recommendations.map(rec => rec.category)))];

  const getTypeIcon = (type: string) => {
    const typeConfig = RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES];
    return typeConfig ? typeConfig.icon : Lightbulb;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES];
    return typeConfig ? typeConfig.color : 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Analyzing your data to provide personalized recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Error loading recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateRecommendations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your usage patterns
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations</h3>
            <p className="text-gray-600">
              We need more data to provide personalized recommendations. Keep using the dashboard!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => {
              const TypeIcon = getTypeIcon(recommendation.type);
              const typeColor = getTypeColor(recommendation.type);
              
              return (
                <div
                  key={recommendation.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onRecommendationClick?.(recommendation)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeColor}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {recommendation.title}
                        </h4>
                        
                        <Badge className={`text-xs ${PRIORITY_COLORS[recommendation.priority]}`}>
                          {recommendation.priority}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {Math.round(recommendation.confidence)}% confidence
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {recommendation.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className={`${IMPACT_COLORS[recommendation.impact]}`}>
                          {recommendation.impact} impact
                        </span>
                        
                        {recommendation.estimatedSavings && (
                          <span className="text-green-600">
                            Save ${recommendation.estimatedSavings}
                          </span>
                        )}
                        
                        {recommendation.estimatedTime && (
                          <span>
                            {recommendation.estimatedTime} min
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {recommendation.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {recommendation.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              recommendation.action?.onClick?.();
                            }}
                          >
                            {recommendation.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {recommendations.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Recommendation Summary</span>
            </div>
            <div className="text-sm text-blue-800">
              {recommendations.length} recommendations found • 
              {recommendations.filter(r => r.estimatedSavings).reduce((sum, r) => sum + (r.estimatedSavings || 0), 0)} potential savings
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIRecommendations;
