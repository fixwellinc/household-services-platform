'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Progress, Alert, AlertDescription } from '@/components/ui/shared';
import { 
  Star, 
  Users, 
  DollarSign, 
  Trophy, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import ReferralLinkGenerator from '@/components/features/rewards/ReferralLinkGenerator';
import CreditBalanceDisplay from '@/components/features/rewards/CreditBalanceDisplay';
import LoyaltyProgressIndicator from '@/components/features/rewards/LoyaltyProgressIndicator';
import CreditTransactionHistory from '@/components/features/rewards/CreditTransactionHistory';

interface RewardsDashboardProps {
  userId: string;
}

interface CreditBalance {
  available: number;
  used: number;
  expired: number;
  total: number;
}

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

interface ReferralStats {
  referralLink: string;
  referralCode: string;
  stats: {
    totalReferrals: number;
    totalCreditsEarned: number;
  };
}

const RewardsDashboard: React.FC<RewardsDashboardProps> = ({ userId }) => {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRewardsData();
  }, [userId]);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all rewards data in parallel
      const [creditsResponse, loyaltyResponse, referralResponse] = await Promise.all([
        fetch('/api/rewards/credits', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/rewards/loyalty-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/rewards/referral-link', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (!creditsResponse.ok || !loyaltyResponse.ok || !referralResponse.ok) {
        throw new Error('Failed to fetch rewards data');
      }

      const [creditsData, loyaltyData, referralData] = await Promise.all([
        creditsResponse.json(),
        loyaltyResponse.json(),
        referralResponse.json(),
      ]);

      setCreditBalance(creditsData.data.balance);
      setLoyaltyStatus(loyaltyData.data);
      setReferralStats(referralData.data);

    } catch (err) {
      console.error('Error fetching rewards data:', err);
      setError('Failed to load rewards data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMilestones = async () => {
    try {
      const response = await fetch('/api/rewards/check-milestones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check milestones');
      }

      const data = await response.json();
      
      if (data.data.awardedMilestones.length > 0) {
        toast.success(`Congratulations! You've earned ${data.data.awardedMilestones.length} new milestone reward(s)!`);
        fetchRewardsData(); // Refresh data
      } else {
        toast.info('No new milestones available at this time.');
      }

    } catch (err) {
      console.error('Error checking milestones:', err);
      toast.error('Failed to check milestones. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const loyaltyProgress = loyaltyStatus?.nextMilestone 
    ? ((loyaltyStatus.subscriptionMonths / loyaltyStatus.nextMilestone.months) * 100)
    : 100;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your credits, referrals, and loyalty rewards</p>
        </div>
        <Button onClick={handleCheckMilestones} variant="outline" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Check Milestones
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${creditBalance?.available.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total earned: ${creditBalance?.total.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {referralStats?.stats.totalReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Earned: ${referralStats?.stats.totalCreditsEarned.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loyaltyStatus?.subscriptionMonths || 0} months
            </div>
            <p className="text-xs text-muted-foreground">
              {loyaltyStatus?.currentMilestone ? 'Current milestone achieved' : 'Building loyalty'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loyaltyStatus?.earnedMilestones.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" currentValue={activeTab} onValueChange={setActiveTab}>Overview</TabsTrigger>
          <TabsTrigger value="referrals" currentValue={activeTab} onValueChange={setActiveTab}>Referrals</TabsTrigger>
          <TabsTrigger value="loyalty" currentValue={activeTab} onValueChange={setActiveTab}>Loyalty</TabsTrigger>
          <TabsTrigger value="history" currentValue={activeTab} onValueChange={setActiveTab}>History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" currentValue={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreditBalanceDisplay 
              balance={creditBalance}
              onRefresh={fetchRewardsData}
            />
            <LoyaltyProgressIndicator 
              loyaltyStatus={loyaltyStatus}
              onCheckMilestones={handleCheckMilestones}
            />
          </div>
        </TabsContent>

        <TabsContent value="referrals" currentValue={activeTab} className="space-y-6">
          <ReferralLinkGenerator 
            referralStats={referralStats}
            onRefresh={fetchRewardsData}
          />
        </TabsContent>

        <TabsContent value="loyalty" currentValue={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Loyalty Program
              </CardTitle>
              <CardDescription>
                Track your subscription milestones and unlock exclusive rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loyaltyStatus && (
                <>
                  {/* Current Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to next milestone</span>
                      <span>
                        {loyaltyStatus.subscriptionMonths} / {loyaltyStatus.nextMilestone?.months || loyaltyStatus.subscriptionMonths} months
                      </span>
                    </div>
                    <Progress value={loyaltyProgress} className="h-2" />
                    {loyaltyStatus.nextMilestone && (
                      <p className="text-sm text-muted-foreground">
                        {loyaltyStatus.nextMilestone.monthsRemaining} months until: {loyaltyStatus.nextMilestone.description}
                      </p>
                    )}
                  </div>

                  {/* All Milestones */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Milestone Rewards</h4>
                    {loyaltyStatus.allMilestones.map((milestone, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          milestone.achieved 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {milestone.achieved ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{milestone.months} Month Milestone</p>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          </div>
                        </div>
                        <Badge variant={milestone.achieved ? 'default' : 'secondary'}>
                          {milestone.achieved ? 'Achieved' : 'Locked'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" currentValue={activeTab} className="space-y-6">
          <CreditTransactionHistory userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardsDashboard;