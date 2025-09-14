'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui/shared';
import { 
  Trophy, 
  Star, 
  Clock, 
  CheckCircle, 
  Gift,
  Crown,
  Zap
} from 'lucide-react';

interface LoyaltyStatus {
  subscriptionMonths: number;
  currentMilestone?: {
    months: number;
    type: string;
    description: string;
  };
  nextMilestone?: {
    months: number;
    monthsRemaining: number;
    type: string;
    description: string;
  };
  earnedMilestones: Array<{
    description: string;
    earnedAt: string;
    amount: number;
  }>;
  allMilestones: Array<{
    months: number;
    achieved: boolean;
    type: string;
    description: string;
  }>;
}

interface LoyaltyProgressIndicatorProps {
  loyaltyStatus: LoyaltyStatus | null;
  onCheckMilestones: () => void;
}

const LoyaltyProgressIndicator: React.FC<LoyaltyProgressIndicatorProps> = ({ 
  loyaltyStatus, 
  onCheckMilestones 
}) => {
  if (!loyaltyStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Progress</CardTitle>
          <CardDescription>Loading loyalty information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = loyaltyStatus.nextMilestone 
    ? ((loyaltyStatus.subscriptionMonths / loyaltyStatus.nextMilestone.months) * 100)
    : 100;

  const getMilestoneIcon = (type: string, achieved: boolean) => {
    const iconClass = `h-5 w-5 ${achieved ? 'text-yellow-500' : 'text-gray-400'}`;
    
    switch (type) {
      case 'FREE_SERVICE_VISIT':
        return <Gift className={iconClass} />;
      case 'PRIORITY_SERVICES':
        return <Zap className={iconClass} />;
      case 'ADDITIONAL_DISCOUNT':
        return <Crown className={iconClass} />;
      default:
        return <Star className={iconClass} />;
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'FREE_SERVICE_VISIT':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'PRIORITY_SERVICES':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'ADDITIONAL_DISCOUNT':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Loyalty Progress
        </CardTitle>
        <CardDescription>
          Track your subscription milestones and unlock exclusive rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold text-purple-600">
            {loyaltyStatus.subscriptionMonths} months
          </div>
          <p className="text-sm text-muted-foreground">
            {loyaltyStatus.currentMilestone 
              ? `Current milestone: ${loyaltyStatus.currentMilestone.description}`
              : 'Building your loyalty journey'
            }
          </p>
        </div>

        {/* Progress to Next Milestone */}
        {loyaltyStatus.nextMilestone && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress to next milestone</span>
              <span>
                {loyaltyStatus.subscriptionMonths} / {loyaltyStatus.nextMilestone.months} months
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {loyaltyStatus.nextMilestone.monthsRemaining} months remaining
              </Badge>
            </div>
            <div className={`p-3 rounded-lg border ${getMilestoneColor(loyaltyStatus.nextMilestone.type)}`}>
              <div className="flex items-center gap-2">
                {getMilestoneIcon(loyaltyStatus.nextMilestone.type, false)}
                <span className="font-medium">Next Reward:</span>
              </div>
              <p className="text-sm mt-1">{loyaltyStatus.nextMilestone.description}</p>
            </div>
          </div>
        )}

        {/* Earned Milestones */}
        {loyaltyStatus.earnedMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Earned Rewards ({loyaltyStatus.earnedMilestones.length})
            </h4>
            <div className="space-y-2">
              {loyaltyStatus.earnedMilestones.slice(0, 3).map((milestone, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{milestone.description}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(milestone.earnedAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
              {loyaltyStatus.earnedMilestones.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{loyaltyStatus.earnedMilestones.length - 3} more rewards earned
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Milestones Preview */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Upcoming Milestones
          </h4>
          <div className="space-y-2">
            {loyaltyStatus.allMilestones
              .filter(milestone => !milestone.achieved)
              .slice(0, 2)
              .map((milestone, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getMilestoneIcon(milestone.type, false)}
                    <div>
                      <span className="text-sm font-medium">{milestone.months} Month Milestone</span>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {milestone.months - loyaltyStatus.subscriptionMonths} months
                  </Badge>
                </div>
              ))}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={onCheckMilestones}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Trophy className="h-4 w-4" />
          Check for New Milestones
        </Button>

        {/* Loyalty Tips */}
        {loyaltyStatus.subscriptionMonths < 12 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900">Loyalty Program Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 12 months: Free service visit</li>
              <li>• 24 months: Priority emergency services</li>
              <li>• 36 months: Additional 5% discount on all services</li>
            </ul>
          </div>
        )}

        {loyaltyStatus.subscriptionMonths >= 36 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 text-center">
            <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h4 className="font-bold text-yellow-900">VIP Member!</h4>
            <p className="text-sm text-yellow-800">
              You've unlocked all loyalty milestones. Thank you for being a valued long-term customer!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyProgressIndicator;