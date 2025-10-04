"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Shield, 
  Settings, 
  Mail, 
  Bell, 
  Database, 
  CreditCard, 
  Globe, 
  Monitor,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Zap,
  Star,
  Target,
  Award,
  BookOpen,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  
  // Preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    desktop: boolean;
  };
  
  // Security
  twoFactorEnabled: boolean;
  passwordChanged: boolean;
  
  // Dashboard Setup
  dashboardLayout: string;
  favoriteWidgets: string[];
  
  // Training
  watchedTutorials: string[];
  completedTasks: string[];
}

export function AdminOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
      desktop: true
    },
    twoFactorEnabled: false,
    passwordChanged: false,
    dashboardLayout: 'default',
    favoriteWidgets: [],
    watchedTutorials: [],
    completedTasks: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FixWell Admin',
      description: 'Let\'s get you set up with everything you need to manage the platform effectively.',
      icon: Star,
      completed: false,
      required: true
    },
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us a bit about yourself to personalize your admin experience.',
      icon: User,
      completed: false,
      required: true
    },
    {
      id: 'security',
      title: 'Security Setup',
      description: 'Configure your security settings to keep your account safe.',
      icon: Shield,
      completed: false,
      required: true
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your admin panel to match your working style.',
      icon: Settings,
      completed: false,
      required: false
    },
    {
      id: 'dashboard',
      title: 'Dashboard Setup',
      description: 'Configure your dashboard with the widgets and information you need most.',
      icon: BarChart3,
      completed: false,
      required: false
    },
    {
      id: 'training',
      title: 'Quick Training',
      description: 'Learn the key features and workflows you\'ll use daily.',
      icon: BookOpen,
      completed: false,
      required: false
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'You\'re ready to start managing FixWell. Welcome aboard!',
      icon: CheckCircle,
      completed: false,
      required: true
    }
  ];

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const markStepCompleted = (stepId: string) => {
    // Update step completion logic here
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      
      const response = await request('/admin/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(onboardingData)
      });
      
      if (response.success) {
        showSuccess('Onboarding completed successfully!');
        // Redirect to admin dashboard
        window.location.href = '/admin';
      } else {
        throw new Error(response.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      showError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (window.confirm('Are you sure you want to skip the onboarding process? You can always complete it later from your profile settings.')) {
      try {
        setLoading(true);
        
        const response = await request('/admin/onboarding/skip', {
          method: 'POST'
        });
        
        if (response.success) {
          showSuccess('Onboarding skipped. You can complete it later from your profile.');
          window.location.href = '/admin';
        } else {
          throw new Error(response.error || 'Failed to skip onboarding');
        }
      } catch (err) {
        console.error('Error skipping onboarding:', err);
        showError(err instanceof Error ? err.message : 'Failed to skip onboarding');
      } finally {
        setLoading(false);
      }
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <AdminErrorBoundary context="AdminOnboardingFlow">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Admin Onboarding</h1>
                  <p className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={skipOnboarding} disabled={loading}>
                  Skip for now
                </Button>
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <currentStepData.icon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </CardTitle>
              
              <p className="text-gray-600 mt-2">
                {currentStepData.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Step Content */}
              {currentStep === 0 && <WelcomeStep />}
              {currentStep === 1 && <PersonalInfoStep data={onboardingData} updateData={updateOnboardingData} />}
              {currentStep === 2 && <SecurityStep data={onboardingData} updateData={updateOnboardingData} />}
              {currentStep === 3 && <PreferencesStep data={onboardingData} updateData={updateOnboardingData} />}
              {currentStep === 4 && <DashboardStep data={onboardingData} updateData={updateOnboardingData} />}
              {currentStep === 5 && <TrainingStep data={onboardingData} updateData={updateOnboardingData} />}
              {currentStep === 6 && <CompleteStep />}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentStep ? 'bg-blue-600' : 
                        index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {currentStep === steps.length - 1 ? (
                  <Button onClick={completeOnboarding} disabled={loading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Completing...' : 'Complete Setup'}
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600">Manage customers, employees, and permissions</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600">Track performance and insights</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">System Control</h3>
          <p className="text-sm text-gray-600">Configure and monitor the platform</p>
        </div>
      </div>
      
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          This onboarding will take about 5-10 minutes and will help you get the most out of your admin panel.
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface StepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

function PersonalInfoStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={data.timezone} onValueChange={(value) => updateData({ timezone: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SecurityStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Security is crucial for admin accounts. Let's set up the basics to keep your account safe.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <Switch
            checked={data.twoFactorEnabled}
            onCheckedChange={(checked) => updateData({ twoFactorEnabled: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Change Default Password</h3>
            <p className="text-sm text-gray-600">Update your password to something secure and unique</p>
          </div>
          <Button variant="outline" size="sm">
            Change Password
          </Button>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">Security Best Practices</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use a strong, unique password</li>
          <li>• Enable two-factor authentication</li>
          <li>• Log out when finished</li>
          <li>• Don't share your credentials</li>
        </ul>
      </div>
    </div>
  );
}

function PreferencesStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select value={data.theme} onValueChange={(value: any) => updateData({ theme: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="auto">Auto (System)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={data.language} onValueChange={(value) => updateData({ language: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive important updates via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={data.notifications.email}
              onCheckedChange={(checked) => updateData({ 
                notifications: { ...data.notifications, email: checked }
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-gray-600">Get real-time alerts in your browser</p>
            </div>
            <Switch
              id="push-notifications"
              checked={data.notifications.push}
              onCheckedChange={(checked) => updateData({ 
                notifications: { ...data.notifications, push: checked }
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
              <p className="text-sm text-gray-600">Show notifications on your desktop</p>
            </div>
            <Switch
              id="desktop-notifications"
              checked={data.notifications.desktop}
              onCheckedChange={(checked) => updateData({ 
                notifications: { ...data.notifications, desktop: checked }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardStep({ data, updateData }: StepProps) {
  const widgets = [
    { id: 'users', name: 'User Statistics', icon: Users },
    { id: 'revenue', name: 'Revenue Overview', icon: CreditCard },
    { id: 'bookings', name: 'Booking Analytics', icon: Calendar },
    { id: 'system', name: 'System Health', icon: Monitor },
    { id: 'communications', name: 'Communications', icon: Mail },
    { id: 'reports', name: 'Reports', icon: FileText }
  ];

  const toggleWidget = (widgetId: string) => {
    const currentWidgets = data.favoriteWidgets;
    const newWidgets = currentWidgets.includes(widgetId)
      ? currentWidgets.filter(id => id !== widgetId)
      : [...currentWidgets, widgetId];
    
    updateData({ favoriteWidgets: newWidgets });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
        <Select value={data.dashboardLayout} onValueChange={(value) => updateData({ dashboardLayout: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Layout</SelectItem>
            <SelectItem value="compact">Compact Layout</SelectItem>
            <SelectItem value="detailed">Detailed Layout</SelectItem>
            <SelectItem value="custom">Custom Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Favorite Widgets</h3>
        <p className="text-sm text-gray-600 mb-4">Select the widgets you want to see on your dashboard</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                data.favoriteWidgets.includes(widget.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleWidget(widget.id)}
            >
              <div className="flex items-center space-x-3">
                <widget.icon className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">{widget.name}</span>
                {data.favoriteWidgets.includes(widget.id) && (
                  <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrainingStep({ data, updateData }: StepProps) {
  const tutorials = [
    { id: 'dashboard', title: 'Dashboard Overview', duration: '3 min', icon: BarChart3 },
    { id: 'users', title: 'User Management', duration: '5 min', icon: Users },
    { id: 'analytics', title: 'Analytics & Reports', duration: '4 min', icon: FileText },
    { id: 'settings', title: 'System Settings', duration: '3 min', icon: Settings }
  ];

  const markTutorialWatched = (tutorialId: string) => {
    const currentTutorials = data.watchedTutorials;
    const newTutorials = currentTutorials.includes(tutorialId)
      ? currentTutorials
      : [...currentTutorials, tutorialId];
    
    updateData({ watchedTutorials: newTutorials });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          These quick tutorials will help you get familiar with the key features. You can watch them now or later.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        {tutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <tutorial.icon className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{tutorial.title}</h3>
                <p className="text-sm text-gray-600">{tutorial.duration}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {data.watchedTutorials.includes(tutorial.id) ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Watched
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markTutorialWatched(tutorial.id)}
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Watch
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Quick Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use the search bar to quickly find users, orders, or settings</li>
          <li>• Set up alerts for important events</li>
          <li>• Export data regularly for backup</li>
          <li>• Check the audit logs for security monitoring</li>
        </ul>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-6 bg-green-100 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
        <p className="text-gray-600">
          You're all set up and ready to start managing FixWell. Your admin panel is configured 
          and you have access to all the tools you need.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Ready to Go</h3>
          <p className="text-sm text-gray-600">Start managing users and orders</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Fully Configured</h3>
          <p className="text-sm text-gray-600">Your preferences are saved</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Optimized</h3>
          <p className="text-sm text-gray-600">Dashboard tailored to your needs</p>
        </div>
      </div>
      
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          You can always update your preferences and settings from the admin panel at any time.
        </AlertDescription>
      </Alert>
    </div>
  );
}
