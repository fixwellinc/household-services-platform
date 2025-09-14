'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Badge, Progress } from '@/components/ui/shared';
import { 
  DollarSign, 
  Gift, 
  AlertCircle,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shared';

interface CreditBalance {
  available: number;
  used: number;
  expired: number;
  total: number;
}

interface CreditBalanceDisplayProps {
  balance: CreditBalance | null;
  onRefresh: () => void;
}

const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = ({ 
  balance, 
  onRefresh 
}) => {
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemReason, setRedeemReason] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  const handleRedeemCredits = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast.error('Please enter a valid amount to redeem');
      return;
    }

    if (!balance || parseFloat(redeemAmount) > balance.available) {
      toast.error('Insufficient credits available');
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch('/api/rewards/redeem-credits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(redeemAmount),
          reason: redeemReason || 'Manual redemption',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem credits');
      }

      const data = await response.json();
      
      toast.success(`Successfully redeemed $${data.data.redeemedAmount.toFixed(2)} in credits!`);
      
      // Reset form and close dialog
      setRedeemAmount('');
      setRedeemReason('');
      setShowRedeemDialog(false);
      
      // Refresh data
      onRefresh();

    } catch (err) {
      console.error('Error redeeming credits:', err);
      toast.error((err as Error).message || 'Failed to redeem credits. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
          <CardDescription>Loading credit information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
  const expiredPercentage = balance.total > 0 ? (balance.expired / balance.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          Credit Balance
        </CardTitle>
        <CardDescription>
          Manage your reward credits and redemptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-green-600">
            ${balance.available.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">Available Credits</p>
        </div>

        {/* Balance Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Earned</span>
            <Badge variant="secondary">${balance.total.toFixed(2)}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Used</span>
            <Badge variant="outline">${balance.used.toFixed(2)}</Badge>
          </div>
          
          {balance.expired > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-600">Expired</span>
              <Badge variant="destructive">${balance.expired.toFixed(2)}</Badge>
            </div>
          )}
        </div>

        {/* Usage Progress */}
        {balance.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Credit Usage</span>
              <span>{usagePercentage.toFixed(1)}% used</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {expiredPercentage > 0 && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {expiredPercentage.toFixed(1)}% of credits have expired
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          {balance.available > 0 && (
            <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Redeem Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Redeem Credits</DialogTitle>
                  <DialogDescription>
                    Convert your available credits to cash or other rewards.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Redeem</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className="pl-9"
                        min="0"
                        max={balance.available}
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum: ${balance.available.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Input
                      id="reason"
                      placeholder="e.g., Gift card, Cash out, etc."
                      value={redeemReason}
                      onChange={(e) => setRedeemReason(e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Redeemed credits will be processed within 3-5 business days.
                      You'll receive an email confirmation once processed.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRedeemDialog(false)}
                    disabled={isRedeeming}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRedeemCredits}
                    disabled={isRedeeming || !redeemAmount || parseFloat(redeemAmount) <= 0}
                  >
                    {isRedeeming ? 'Processing...' : 'Redeem Credits'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Credit Tips */}
        {balance.available === 0 && balance.total === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900">Earn Your First Credits!</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Refer friends to earn one month free per referral</li>
              <li>• Reach loyalty milestones for bonus rewards</li>
              <li>• Credits automatically apply to your next bill</li>
            </ul>
          </div>
        )}

        {balance.available > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Auto-Apply:</strong> Your credits will automatically be applied to your next subscription payment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditBalanceDisplay;