"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface AdminProgressiveLoadingProps {
  steps: LoadingStep[];
  onRetry?: (stepId: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function AdminProgressiveLoading({
  steps,
  onRetry,
  onCancel,
  title = "Loading Data",
  description = "Please wait while we load your data..."
}: AdminProgressiveLoadingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = (completedSteps / totalSteps) * 100;
  
  const getStepIcon = (step: LoadingStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{completedSteps}/{totalSteps}</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Step Details */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              {getStepIcon(step)}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'error' ? 'text-red-600' : 
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'loading' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.label}
                </p>
                {step.error && (
                  <p className="text-xs text-red-500 mt-1">{step.error}</p>
                )}
                {step.status === 'loading' && step.progress !== undefined && (
                  <Progress value={step.progress} className="h-1 mt-1" />
                )}
              </div>
              {step.status === 'error' && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(step.id)}
                  className="text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        {onCancel && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for managing progressive loading states
export function useProgressiveLoading(initialSteps: Omit<LoadingStep, 'status'>[]) {
  const [steps, setSteps] = useState<LoadingStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' as const }))
  );

  const updateStep = (stepId: string, updates: Partial<LoadingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const startStep = (stepId: string) => {
    updateStep(stepId, { status: 'loading', progress: 0 });
  };

  const completeStep = (stepId: string) => {
    updateStep(stepId, { status: 'completed', progress: 100 });
  };

  const errorStep = (stepId: string, error: string) => {
    updateStep(stepId, { status: 'error', error });
  };

  const updateProgress = (stepId: string, progress: number) => {
    updateStep(stepId, { progress });
  };

  const reset = () => {
    setSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending' as const, 
      progress: undefined, 
      error: undefined 
    })));
  };

  return {
    steps,
    updateStep,
    startStep,
    completeStep,
    errorStep,
    updateProgress,
    reset
  };
}