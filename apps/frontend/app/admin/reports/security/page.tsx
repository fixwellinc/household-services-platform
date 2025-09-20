"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Activity,
  Users,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2
} from 'lucide-react';

interface SecurityStats {
  activeUsers: number;
  exportsToday: number;
  exportsThisHour: number;
  rateLimits: {
    maxRecordsPerExport: number;
    maxExportsPerHour: number;
    maxExportsPerDay: number;
    sensitiveDataMaxRecords: number;
  };
}

interface SecurityValidation {
  approved: boolean;
  sensitiveFields: string[];
  requiresAdditionalAuth: boolean;
  warnings: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export default function ExportSecurityPage() {
  const { toast } = useToast();
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [validationResult, setValidationResult] = useState<SecurityValidation | null>(null);
  const [anonymizationPreview, setAnonymizationPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test form state
  const [testForm, setTestForm] = useState({
    entity: 'users',
    fields: ['email', 'name', 'phone'],
    limit: 1000,
    anonymize: false
  });

  useEffect(() => {
    loadSecurityStats();
  }, []);

  const loadSecurityStats = async () => {
    try {
      const response = await fetch('/api/admin/exports/security/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load security stats:', error);
      toast({
        title: "Error",
        description: "Failed to load security statistics",
        variant: "destructive"
      });
    }
  };

  const handleSecurityValidation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/exports/security/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(testForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        setValidationResult(data.validation);
        toast({
          title: "Validation Complete",
          description: data.validation.approved ? "Export approved" : "Export denied",
          variant: data.validation.approved ? "default" : "destructive"
        });
      } else {
        setValidationResult(data.validation);
        toast({
          title: "Validation Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Security validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate export request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymizationPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/exports/anonymize-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entity: testForm.entity,
          fields: testForm.fields,
          limit: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnonymizationPreview(data.preview);
      } else {
        throw new Error('Preview failed');
      }
    } catch (error) {
      console.error('Anonymization preview error:', error);
      toast({
        title: "Preview Error",
        description: "Failed to generate anonymization preview",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Security</h1>
          <p className="text-gray-600 mt-1">
            Monitor and test export security controls and data protection measures
          </p>
        </div>
      </div>

      {/* Security Statistics */}
      {securityStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Active Users</p>
                  <p className="text-lg font-semibold">{securityStats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Exports Today</p>
                  <p className="text-lg font-semibold">{securityStats.exportsToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Exports This Hour</p>
                  <p className="text-lg font-semibold">{securityStats.exportsThisHour}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Max Records/Export</p>
                  <p className="text-lg font-semibold">
                    {securityStats.rateLimits.maxRecordsPerExport.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Testing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Validation Test</span>
              </CardTitle>
              <CardDescription>
                Test export security controls with different parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select 
                  value={testForm.entity} 
                  onValueChange={(value) => setTestForm(prev => ({ ...prev, entity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="serviceRequests">Service Requests</SelectItem>
                    <SelectItem value="auditLogs">Audit Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fields (comma-separated)</Label>
                <Input
                  value={testForm.fields.join(', ')}
                  onChange={(e) => setTestForm(prev => ({
                    ...prev,
                    fields: e.target.value.split(',').map(f => f.trim())
                  }))}
                  placeholder="email, name, phone"
                />
              </div>

              <div className="space-y-2">
                <Label>Record Limit</Label>
                <Input
                  type="number"
                  value={testForm.limit}
                  onChange={(e) => setTestForm(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  min="1"
                  max="100000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymize"
                  checked={testForm.anonymize}
                  onCheckedChange={(checked) => setTestForm(prev => ({ ...prev, anonymize: !!checked }))}
                />
                <Label htmlFor="anonymize">Enable anonymization</Label>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSecurityValidation}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Validate Security
                </Button>
                <Button
                  onClick={handleAnonymizationPreview}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Anonymization
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          {securityStats && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits & Restrictions</CardTitle>
                <CardDescription>
                  Current security limits and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Records per Export</span>
                  <Badge variant="outline">
                    {securityStats.rateLimits.maxRecordsPerExport.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Exports per Hour</span>
                  <Badge variant="outline">
                    {securityStats.rateLimits.maxExportsPerHour}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Exports per Day</span>
                  <Badge variant="outline">
                    {securityStats.rateLimits.maxExportsPerDay}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sensitive Data Limit</span>
                  <Badge variant="outline">
                    {securityStats.rateLimits.sensitiveDataMaxRecords.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {validationResult.approved ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>Validation Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={validationResult.approved ? "default" : "destructive"}>
                    {validationResult.approved ? 'Approved' : 'Denied'}
                  </Badge>
                </div>

                {validationResult.sensitiveFields.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sensitive Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {validationResult.sensitiveFields.map(field => (
                        <Badge key={field} variant="outline" className="text-orange-600">
                          <Lock className="h-3 w-3 mr-1" />
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {validationResult.requiresAdditionalAuth && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Additional Authentication Required
                      </span>
                    </div>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Security Warnings:</p>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50">
                          {getSeverityIcon(warning.severity)}
                          <div className="flex-1">
                            <Badge className={`${getSeverityColor(warning.severity)} mb-1`}>
                              {warning.severity.toUpperCase()}
                            </Badge>
                            <p className="text-sm">{warning.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Anonymization Preview */}
          {anonymizationPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Anonymization Preview</CardTitle>
                <CardDescription>
                  Comparison of original vs anonymized data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Sensitive Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {anonymizationPreview.sensitiveFields.map((field: string) => (
                        <Badge key={field} variant="outline" className="text-orange-600">
                          <Lock className="h-3 w-3 mr-1" />
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Original Data</h4>
                      <div className="bg-gray-50 p-3 rounded-lg text-xs">
                        <pre>{JSON.stringify(anonymizationPreview.original, null, 2)}</pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Anonymized Data</h4>
                      <div className="bg-green-50 p-3 rounded-lg text-xs">
                        <pre>{JSON.stringify(anonymizationPreview.anonymized, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}