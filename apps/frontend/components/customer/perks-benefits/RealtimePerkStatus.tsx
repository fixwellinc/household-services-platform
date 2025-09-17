"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Zap,
  Star,
  Shield,
  Calendar
} from 'lucide-react';

interface PerkUpdate {
  perkType: string;
  available: boolean;
  usageCount: number;
  limit?: number;
  resetDate?: string;
  message?: string;
}

interface RealtimePerkStatusProps {
  perkUpdates: PerkUpdate[];
  lastUpdated?: Date;
}

export default function RealtimePerkStatus({
  perkUpdates,
  lastUpdated
}: RealtimePerkStatusProps) {
  const getPerkIcon = (perkType: string) => {
    switch (perkType.toLowerCase()) {
      case 'priority_booking':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'emergency_service':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'discount':
        return <Gift className="h-5 w-5 text-green-500" />;
      case 'free_service':
        return <Zap className="h-5 w-5 text-blue-500" />;
      default:
        return <Gift className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPerkDisplayName = (perkType: string) => {
    switch (perkType.toLowerCase()) {
      case 'priority_booking':
        return 'Priority Booking';
      case 'emergency_service':
        return 'Emergency Service';
      case 'discount':
        return 'Service Discount';
      case 'free_service':
        return 'Free Service';
      default:
        return perkType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadge = (perk: PerkUpdate) => {
    if (!perk.available) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Unavailable
        </Badge>
      );
    }

    if (perk.limit && perk.usageCount >= perk.limit) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Limit Reached
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Available
      </Badge>
    );
  };

  const getUsageText = (perk: PerkUpdate) => {
    if (perk.limit) {
      return `${perk.usageCount} / ${perk.limit} used`;
    }
    return `${perk.usageCount} used`;
  };

  const getResetText = (resetDate?: string) => {
    if (!resetDate) return null;
    
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Resets today';
    } else if (diffDays === 1) {
      return 'Resets tomorrow';
    } else if (diffDays <= 7) {
      return `Resets in ${diffDays} days`;
    } else {
      return `Resets ${reset.toLocaleDateString()}`;
    }
  };

  if (perkUpdates.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-purple-600" />
            Perk Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              No real-time perk updates available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-purple-600" />
          Live Perk Status
          {lastUpdated && (
            <Badge variant="outline" className="ml-auto text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {perkUpdates.map((perk, index) => (
            <div
              key={`${perk.perkType}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getPerkIcon(perk.perkType)}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {getPerkDisplayName(perk.perkType)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">
                      {getUsageText(perk)}
                    </span>
                    {perk.resetDate && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getResetText(perk.resetDate)}
                        </span>
                      </>
                    )}
                  </div>
                  {perk.message && (
                    <p className="text-xs text-gray-500 mt-1">
                      {perk.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(perk)}
                {perk.limit && (
                  <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        perk.usageCount >= perk.limit
                          ? 'bg-red-500'
                          : perk.usageCount / perk.limit >= 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((perk.usageCount / perk.limit) * 100, 100)}%`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}