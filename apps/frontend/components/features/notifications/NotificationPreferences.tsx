'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  TrendingUp, 
  Heart,
  Settings,
  Check,
  X,
  Loader2,
  Phone,
  AlertCircle,
  Info
} from 'lucide-react';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  paymentReminders: boolean;
  upgradeSuggestions: boolean;
  engagementReminders: boolean;
  marketingEmails: boolean;
}

interface NotificationPreferencesProps {
  userId?: string;
  onPreferencesUpdate?: (preferences: NotificationPreferences) => void;
}

export default function NotificationPreferences({ 
  userId, 
  onPreferencesUpdate 
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    paymentReminders: true,
    upgradeSuggestions: true,
    engagementReminders: true,
    marketingEmails: false
  });
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const userData = await response.json();
        if (userData.notifications) {
          setPreferences(userData.notifications);
        }
        if (userData.phone) {
          setPhone(userData.phone);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          phone: phone || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Notification preferences updated successfully');
        onPreferencesUpdate?.(preferences);
      } else {
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add +1 for North American numbers
    if (cleaned && !cleaned.startsWith('+')) {
      return '+1' + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading preferences...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you'd like to receive notifications about your subscription and services.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </div>
                  </div>
                </div>
                <Button
                  variant={preferences.email ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('email', !preferences.email)}
                >
                  {preferences.email ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive urgent notifications via text message
                    </div>
                  </div>
                </div>
                <Button
                  variant={preferences.sms ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('sms', !preferences.sms)}
                >
                  {preferences.sms ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>

              {preferences.sms && (
                <div className="ml-8 space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+1234567890"
                        className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {phone && !validatePhoneNumber(phone) && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Please enter a valid phone number (e.g., +1234567890)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium">Payment Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified about upcoming payments and payment issues
                    </div>
                  </div>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                <Button
                  variant={preferences.paymentReminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('paymentReminders', !preferences.paymentReminders)}
                >
                  {preferences.paymentReminders ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Upgrade Suggestions</div>
                    <div className="text-sm text-muted-foreground">
                      Receive personalized plan upgrade recommendations
                    </div>
                  </div>
                </div>
                <Button
                  variant={preferences.upgradeSuggestions ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('upgradeSuggestions', !preferences.upgradeSuggestions)}
                >
                  {preferences.upgradeSuggestions ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">Service Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Get reminded to use your subscription benefits
                    </div>
                  </div>
                </div>
                <Button
                  variant={preferences.engagementReminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('engagementReminders', !preferences.engagementReminders)}
                >
                  {preferences.engagementReminders ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Marketing Emails</div>
                    <div className="text-sm text-muted-foreground">
                      Receive updates about new features and promotions
                    </div>
                  </div>
                </div>
                <Button
                  variant={preferences.marketingEmails ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('marketingEmails', !preferences.marketingEmails)}
                >
                  {preferences.marketingEmails ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">About Notifications</div>
                <div className="text-blue-700">
                  • Payment reminders help you avoid service interruptions<br />
                  • SMS notifications are only sent for urgent matters<br />
                  • You can change these preferences anytime<br />
                  • We never share your contact information
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={savePreferences}
              disabled={isSaving || (preferences.sms && !!phone && !validatePhoneNumber(phone))}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}