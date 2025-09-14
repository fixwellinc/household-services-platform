'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui/shared';
import { 
  Share2, 
  Copy, 
  CheckCircle, 
  Users, 
  DollarSign,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralStats {
  referralLink: string;
  referralCode: string;
  stats: {
    totalReferrals: number;
    totalCreditsEarned: number;
  };
}

interface ReferralLinkGeneratorProps {
  referralStats: ReferralStats | null;
  onRefresh: () => void;
}

const ReferralLinkGenerator: React.FC<ReferralLinkGeneratorProps> = ({ 
  referralStats, 
  onRefresh 
}) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopyLink = async () => {
    if (!referralStats?.referralLink) return;

    try {
      await navigator.clipboard.writeText(referralStats.referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const handleShare = async (platform: string) => {
    if (!referralStats?.referralLink) return;

    setSharing(true);
    
    const shareText = `Join Fixwell Services and get professional home maintenance! Use my referral link to get started: ${referralStats.referralLink}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(referralStats.referralLink);

    let shareUrl = '';

    switch (platform) {
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join Fixwell Services!')}&body=${encodedText}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'native':
        if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
          try {
            await navigator.share({
              title: 'Join Fixwell Services!',
              text: 'Get professional home maintenance services',
              url: referralStats.referralLink,
            });
            toast.success('Shared successfully!');
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error('Error sharing:', err);
              toast.error('Failed to share. Please try again.');
            }
          }
        }
        setSharing(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      toast.success('Share window opened!');
    }

    setSharing(false);
  };

  if (!referralStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Loading referral information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {referralStats.stats.totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">
              Friends you've referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${referralStats.stats.totalCreditsEarned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From referral rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends and earn one month free for each successful referral!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {referralStats.referralCode}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Friends can use this code during signup
              </span>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex gap-2">
              <Input
                value={referralStats.referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share with friends</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={sharing}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>

              <Button
                onClick={() => handleShare('sms')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={sharing}
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </Button>

              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={sharing}
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>

              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={sharing}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>

              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={sharing}
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  onClick={() => handleShare('native')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={sharing}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900">How Referrals Work</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share your referral link or code with friends</li>
              <li>• They sign up and complete their first payment</li>
              <li>• You earn one month free subscription credit</li>
              <li>• Credits are automatically applied to your next bill</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralLinkGenerator;