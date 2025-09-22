'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, Clock, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityRule {
  id?: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  serviceType?: string | null;
  bufferMinutes: number;
  maxBookingsPerDay: number;
}

interface AvailabilityManagerProps {
  onRulesUpdate?: (rules: AvailabilityRule[]) => void;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const SERVICE_TYPES = [
  { value: null, label: 'All Services (Default)' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'inspection', label: 'Inspection' }
];

export default function AvailabilityManager({ onRulesUpdate }: AvailabilityManagerProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize default rules for all days
  const initializeDefaultRules = (): AvailabilityRule[] => {
    return DAYS_OF_WEEK.map((_, dayOfWeek) => ({
      dayOfWeek,
      isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5, // Monday to Friday by default
      startTime: '09:00',
      endTime: '17:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 8
    }));
  };

  // Load availability rules
  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/availability', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load availability rules');
      }
      
      const data = await response.json();
      
      if (data.success && data.rules.length > 0) {
        setRules(data.rules);
      } else {
        // Initialize with default rules if none exist
        setRules(initializeDefaultRules());
      }
    } catch (err) {
      console.error('Error loading availability rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability rules');
      // Fallback to default rules
      setRules(initializeDefaultRules());
    } finally {
      setLoading(false);
    }
  };

  // Save availability rules
  const saveRules = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ rules })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save availability rules');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRules(data.rules);
        onRulesUpdate?.(data.rules);
        toast({
          title: 'Success',
          description: 'Availability rules updated successfully',
        });
      }
    } catch (err) {
      console.error('Error saving availability rules:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save availability rules';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update a specific rule
  const updateRule = (dayOfWeek: number, updates: Partial<AvailabilityRule>) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.dayOfWeek === dayOfWeek 
          ? { ...rule, ...updates }
          : rule
      )
    );
  };

  // Validate time format
  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Validate time order
  const isValidTimeOrder = (startTime: string, endTime: string): boolean => {
    if (!isValidTime(startTime) || !isValidTime(endTime)) return false;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return startMinutes < endMinutes;
  };

  // Get validation errors for a rule
  const getRuleErrors = (rule: AvailabilityRule): string[] => {
    const errors: string[] = [];
    
    if (rule.isAvailable) {
      if (!isValidTime(rule.startTime)) {
        errors.push('Invalid start time format');
      }
      if (!isValidTime(rule.endTime)) {
        errors.push('Invalid end time format');
      }
      if (isValidTime(rule.startTime) && isValidTime(rule.endTime) && 
          !isValidTimeOrder(rule.startTime, rule.endTime)) {
        errors.push('Start time must be before end time');
      }
    }
    
    if (rule.bufferMinutes < 0 || rule.bufferMinutes > 120) {
      errors.push('Buffer time must be between 0 and 120 minutes');
    }
    
    if (rule.maxBookingsPerDay < 1 || rule.maxBookingsPerDay > 50) {
      errors.push('Max bookings must be between 1 and 50');
    }
    
    return errors;
  };

  // Check if there are any validation errors
  const hasValidationErrors = (): boolean => {
    return rules.some(rule => getRuleErrors(rule).length > 0);
  };

  useEffect(() => {
    loadRules();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading availability settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {rules.map((rule) => {
              const ruleErrors = getRuleErrors(rule);
              const hasErrors = ruleErrors.length > 0;
              
              return (
                <Card key={rule.dayOfWeek} className={hasErrors ? 'border-red-200' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {DAYS_OF_WEEK[rule.dayOfWeek]}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`available-${rule.dayOfWeek}`}>Available</Label>
                        <Switch
                          id={`available-${rule.dayOfWeek}`}
                          checked={rule.isAvailable}
                          onCheckedChange={(checked) => 
                            updateRule(rule.dayOfWeek, { isAvailable: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {rule.isAvailable && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`start-${rule.dayOfWeek}`}>Start Time</Label>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <Input
                                id={`start-${rule.dayOfWeek}`}
                                type="time"
                                value={rule.startTime}
                                onChange={(e) => 
                                  updateRule(rule.dayOfWeek, { startTime: e.target.value })
                                }
                                className={!isValidTime(rule.startTime) ? 'border-red-300' : ''}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`end-${rule.dayOfWeek}`}>End Time</Label>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <Input
                                id={`end-${rule.dayOfWeek}`}
                                type="time"
                                value={rule.endTime}
                                onChange={(e) => 
                                  updateRule(rule.dayOfWeek, { endTime: e.target.value })
                                }
                                className={!isValidTime(rule.endTime) ? 'border-red-300' : ''}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`buffer-${rule.dayOfWeek}`}>Buffer Time (minutes)</Label>
                            <Input
                              id={`buffer-${rule.dayOfWeek}`}
                              type="number"
                              min="0"
                              max="120"
                              value={rule.bufferMinutes}
                              onChange={(e) => 
                                updateRule(rule.dayOfWeek, { 
                                  bufferMinutes: parseInt(e.target.value) || 0 
                                })
                              }
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`max-${rule.dayOfWeek}`}>Max Bookings per Day</Label>
                            <Input
                              id={`max-${rule.dayOfWeek}`}
                              type="number"
                              min="1"
                              max="50"
                              value={rule.maxBookingsPerDay}
                              onChange={(e) => 
                                updateRule(rule.dayOfWeek, { 
                                  maxBookingsPerDay: parseInt(e.target.value) || 1 
                                })
                              }
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`service-${rule.dayOfWeek}`}>Service Type (Optional)</Label>
                          <Select
                            value={rule.serviceType || 'null'}
                            onValueChange={(value) => 
                              updateRule(rule.dayOfWeek, { 
                                serviceType: value === 'null' ? null : value 
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_TYPES.map((type) => (
                                <SelectItem key={type.value || 'null'} value={type.value || 'null'}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {!rule.isAvailable && (
                      <div className="text-center py-4 text-gray-500">
                        <Badge variant="secondary">Not Available</Badge>
                        <p className="text-sm mt-2">No appointments can be booked on this day</p>
                      </div>
                    )}
                    
                    {hasErrors && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <ul className="list-disc list-inside">
                            {ruleErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={loadRules}
              disabled={loading || saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              onClick={saveRules}
              disabled={saving || hasValidationErrors()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}