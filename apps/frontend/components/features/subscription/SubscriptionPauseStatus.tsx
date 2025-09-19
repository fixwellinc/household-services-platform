'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import {
    Pause,
    Play,
    Calendar,
    Clock,
    AlertTriangle,
    Loader2,
    CheckCircle,
    Info,
    History,
    CreditCard
} from 'lucide-react';

interface PauseStatus {
    isPaused: boolean;
    currentPause?: {
        id: string;
        startDate: string;
        endDate: string;
        reason?: string;
        daysRemaining: number;
    };
    pauseHistory: Array<{
        id: string;
        startDate: string;
        endDate: string;
        reason?: string;
        status: string;
        duration: number;
    }>;
    canPause: boolean;
}

interface SubscriptionPauseStatusProps {
    onStatusChange?: () => void;
    subscriptionStatus?: string;
}

export default function SubscriptionPauseStatus({
    onStatusChange,
    subscriptionStatus = 'ACTIVE'
}: SubscriptionPauseStatusProps) {
    const [pauseStatus, setPauseStatus] = useState<PauseStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [resuming, setResuming] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Enhanced routing for payment links
    const dashboardRouting = useDashboardRouting();

    useEffect(() => {
        fetchPauseStatus();
    }, []);

    const fetchPauseStatus = async () => {
        try {
            const response = await fetch('/api/subscriptions/pause-status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPauseStatus(data.pauseStatus);
            } else {
                console.error('Failed to fetch pause status');
            }
        } catch (error) {
            console.error('Error fetching pause status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResume = async () => {
        setResuming(true);
        try {
            const response = await fetch('/api/subscriptions/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Subscription resumed successfully');
                await fetchPauseStatus();
                onStatusChange?.();
            } else {
                throw new Error(data.error || 'Failed to resume subscription');
            }
        } catch (error) {
            console.error('Error resuming subscription:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to resume subscription');
        } finally {
            setResuming(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDaysText = (days: number) => {
        if (days === 0) return 'Today';
        if (days === 1) return '1 day';
        return `${days} days`;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading pause status...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!pauseStatus) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Pause className="h-5 w-5" />
                    Subscription Pause
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Current Status */}
                    {subscriptionStatus === 'PAST_DUE' && pauseStatus?.isPaused && pauseStatus.currentPause ? (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Payment Failed - Grace Period</span>
                                </div>
                                <Badge className="bg-red-100 text-red-800">
                                    Past Due
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-red-700">Payment failed on:</span>
                                    <span className="text-red-900 font-medium">
                                        {formatDate(pauseStatus.currentPause.startDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700">Grace period ends:</span>
                                    <span className="text-red-900 font-medium">
                                        {formatDate(pauseStatus.currentPause.endDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700">Time remaining:</span>
                                    <span className="text-red-900 font-medium">
                                        {getDaysText(pauseStatus.currentPause.daysRemaining)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-red-200">
                                <div className="flex items-start gap-2 mb-3">
                                    <Info className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-red-700">
                                        <p className="font-medium mb-1">During grace period:</p>
                                        <ul className="space-y-1">
                                            <li>• Services remain active for {getDaysText(pauseStatus.currentPause.daysRemaining)}</li>
                                            <li>• Update payment method to avoid suspension</li>
                                            <li>• We'll retry payment automatically</li>
                                        </ul>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    className="w-full bg-red-600 hover:bg-red-700"
                                >
                                    <a href={`${dashboardRouting.getDashboardUrl()}/subscription/payment`}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Update Payment Method
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ) : subscriptionStatus === 'SUSPENDED' ? (
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Pause className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Subscription Suspended</span>
                                </div>
                                <Badge className="bg-gray-100 text-gray-800">
                                    Suspended
                                </Badge>
                            </div>

                            <p className="text-sm text-gray-700 mb-4">
                                Your subscription has been suspended due to payment issues. Update your payment method to reactivate.
                            </p>

                            <Button
                                asChild
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                <a href={`${dashboardRouting.getDashboardUrl()}/subscription/payment`}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Reactivate Subscription
                                </a>
                            </Button>
                        </div>
                    ) : pauseStatus?.isPaused && pauseStatus.currentPause ? (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Pause className="h-5 w-5 text-orange-600" />
                                    <span className="font-medium text-orange-900">Subscription Paused</span>
                                </div>
                                <Badge className="bg-orange-100 text-orange-800">
                                    Paused
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-orange-700">Paused on:</span>
                                    <span className="text-orange-900 font-medium">
                                        {formatDate(pauseStatus.currentPause.startDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-orange-700">Resumes on:</span>
                                    <span className="text-orange-900 font-medium">
                                        {formatDate(pauseStatus.currentPause.endDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-orange-700">Time remaining:</span>
                                    <span className="text-orange-900 font-medium">
                                        {getDaysText(pauseStatus.currentPause.daysRemaining)}
                                    </span>
                                </div>
                                {pauseStatus.currentPause.reason && (
                                    <div className="flex justify-between">
                                        <span className="text-orange-700">Reason:</span>
                                        <span className="text-orange-900 font-medium">
                                            {pauseStatus.currentPause.reason === 'PAYMENT_FAILED' ? 'Payment Issue' : pauseStatus.currentPause.reason}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-orange-200">
                                <div className="flex items-start gap-2 mb-3">
                                    <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-orange-700">
                                        <p className="font-medium mb-1">During the pause:</p>
                                        <ul className="space-y-1">
                                            <li>• No billing will occur</li>
                                            <li>• Service scheduling is suspended</li>
                                            <li>• Your plan benefits are preserved</li>
                                        </ul>
                                    </div>
                                </div>

                                {pauseStatus.currentPause.reason !== 'PAYMENT_FAILED' && (
                                    <Button
                                        onClick={handleResume}
                                        disabled={resuming}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {resuming ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Resuming...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 mr-2" />
                                                Resume Now
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Subscription Active</span>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                    Active
                                </Badge>
                            </div>

                            <p className="text-sm text-green-700 mb-4">
                                Your subscription is active and all services are available. Payments are automatically processed.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800">Automatic Payment Management</p>
                                        <p className="text-blue-700 mt-1">
                                            If a payment fails, your account will enter a grace period where services remain active while we retry payment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pause History */}
                    {pauseStatus.pauseHistory.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
                            >
                                <History className="h-4 w-4" />
                                Pause History ({pauseStatus.pauseHistory.length})
                                <span className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {showHistory && (
                                <div className="space-y-2">
                                    {pauseStatus.pauseHistory.slice(0, 5).map((pause) => (
                                        <div
                                            key={pause.id}
                                            className="bg-gray-50 p-3 rounded-lg text-sm"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium">
                                                    {formatDate(pause.startDate)} - {formatDate(pause.endDate)}
                                                </span>
                                                <Badge
                                                    className={
                                                        pause.status === 'COMPLETED'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }
                                                >
                                                    {pause.status}
                                                </Badge>
                                            </div>
                                            <div className="text-gray-600">
                                                Duration: {pause.duration} days
                                                {pause.reason && ` • Reason: ${pause.reason}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}