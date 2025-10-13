'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Star, 
  Crown, 
  Sparkles,
  CheckCircle,
  Lock,
  Zap,
  Shield,
  Clock,
  Gift,
  Percent,
  Phone,
  Calendar,
  ArrowUp
} from 'lucide-react';

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  isIncluded: boolean;
  isPremium: boolean;
  requiredTier?: 'BASIC' | 'PREMIUM' | 'STARTER' | 'HOMECARE' | 'PRIORITY';
  usageLimit?: number;
  currentUsage?: number;
  category: 'BOOKING' | 'BILLING' | 'SUPPORT' | 'EXCLUSIVE';
}

interface PerksListProps {
  userTier: 'BASIC' | 'PREMIUM' | 'STARTER' | 'HOMECARE' | 'PRIORITY';
  perks: Perk[];
  onUpgradeClick?: (requiredTier: string) => void;
}

const PERK_ICONS = {
  star: Star,
  crown: Crown,
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  clock: Clock,
  gift: Gift,
  percent: Percent,
  phone: Phone,
  calendar: Calendar
};

const TIER_COLORS = {
  BASIC: 'from-blue-500 to-blue-600',
  PREMIUM: 'from-purple-500 to-purple-600',
  // Legacy mapping for backward compatibility
  STARTER: 'from-blue-500 to-blue-600',
  HOMECARE: 'from-purple-500 to-purple-600',
  PRIORITY: 'from-amber-500 to-amber-600'
};

const TIER_NAMES = {
  BASIC: 'Basic',
  PREMIUM: 'Premium',
  // Legacy mapping for backward compatibility
  STARTER: 'Starter',
  HOMECARE: 'Premium',
  PRIORITY: 'Premium'
};

const CATEGORY_COLORS = {
  BOOKING: 'bg-blue-50 border-blue-200 text-blue-800',
  BILLING: 'bg-green-50 border-green-200 text-green-800',
  SUPPORT: 'bg-purple-50 border-purple-200 text-purple-800',
  EXCLUSIVE: 'bg-amber-50 border-amber-200 text-amber-800'
};

const PerksList = React.memo(function PerksList({ userTier, perks, onUpgradeClick }: PerksListProps) {
  const getTierLevel = (tier: string) => {
    const levels = { BASIC: 1, PREMIUM: 2, STARTER: 1, HOMECARE: 2, PRIORITY: 3 };
    return levels[tier as keyof typeof levels] || 0;
  };

  const isAccessible = (perk: Perk) => {
    if (!perk.requiredTier) return true;
    return getTierLevel(userTier) >= getTierLevel(perk.requiredTier);
  };

  const getUsagePercentage = (perk: Perk) => {
    if (!perk.usageLimit || !perk.currentUsage) return 0;
    return Math.min((perk.currentUsage / perk.usageLimit) * 100, 100);
  };

  const groupedPerks = (perks || []).reduce((acc, perk) => {
    if (!acc[perk.category]) {
      acc[perk.category] = [];
    }
    acc[perk.category].push(perk);
    return acc;
  }, {} as Record<string, Perk[]>);

  const renderPerkCard = (perk: Perk) => {
    const IconComponent = PERK_ICONS[perk.icon as keyof typeof PERK_ICONS] || Star;
    const accessible = isAccessible(perk);
    const usagePercentage = getUsagePercentage(perk);

    return (
      <Card 
        key={perk.id} 
        className={`transition-all duration-200 hover:shadow-md ${
          accessible ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              accessible 
                ? perk.isPremium 
                  ? `bg-gradient-to-r ${TIER_COLORS[perk.requiredTier || 'STARTER']}` 
                  : 'bg-blue-100'
                : 'bg-gray-100'
            }`}>
              <IconComponent className={`h-4 w-4 ${
                accessible 
                  ? perk.isPremium ? 'text-white' : 'text-blue-600'
                  : 'text-gray-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium text-sm ${
                  accessible ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {perk.name}
                </h4>
                
                {accessible ? (
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                ) : (
                  <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                
                {perk.isPremium && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5">
                    Premium
                  </Badge>
                )}
              </div>
              
              <p className={`text-xs ${
                accessible ? 'text-gray-600' : 'text-gray-400'
              } mb-2`}>
                {perk.description}
              </p>
              
              {/* Usage tracking for accessible perks */}
              {accessible && perk.usageLimit && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {perk.currentUsage || 0} of {perk.usageLimit} used
                    </span>
                    <span className="text-gray-500">
                      {Math.round(usagePercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        usagePercentage >= 90 ? 'bg-red-500' :
                        usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Unlimited indicator */}
              {accessible && !perk.usageLimit && perk.isIncluded && (
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Unlimited</span>
                </div>
              )}
              
              {/* Upgrade prompt for locked perks */}
              {!accessible && perk.requiredTier && onUpgradeClick && (
                <button
                  onClick={() => onUpgradeClick(perk.requiredTier!)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 group"
                >
                  <ArrowUp className="h-3 w-3 group-hover:translate-y-[-1px] transition-transform" />
                  Upgrade to {TIER_NAMES[perk.requiredTier]}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Perks & Benefits</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enjoy these exclusive benefits with your {TIER_NAMES[userTier]} plan
          </p>
        </div>
        <Badge className={`${CATEGORY_COLORS.EXCLUSIVE} px-3 py-1`}>
          {TIER_NAMES[userTier]} Plan
        </Badge>
      </div>

      {Object.entries(groupedPerks).map(([category, categoryPerks]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-800 text-sm">
              {category?.charAt(0) + category?.slice(1).toLowerCase() || 'Unknown'} Benefits
            </h4>
            <Badge className={`${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} text-xs px-2 py-0.5`}>
              {categoryPerks.filter(p => isAccessible(p)).length} of {categoryPerks.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryPerks.map(renderPerkCard)}
          </div>
        </div>
      ))}

      {/* Summary stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Total Benefits</h4>
              <p className="text-xs text-gray-600 mt-1">
                You have access to {perks.filter(p => isAccessible(p)).length} out of {perks.length} available perks
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {perks.filter(p => isAccessible(p)).length}
              </div>
              <div className="text-xs text-gray-500">Active Perks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default PerksList;