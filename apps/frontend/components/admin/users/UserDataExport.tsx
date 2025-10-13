"use client";

import React, { useState } from 'react';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface UserDataExportProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
}

interface ExportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export function UserDataExport({ userId, userEmail, userName, onClose }: UserDataExportProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const response = await request(`/admin/users/${userId}/export-data`, {
        method: 'POST'
      });

      if (response.success) {
        setExportStatus(response.export);
        showSuccess('Data export started successfully');
        
        // Poll for status updates
        pollExportStatus(response.export.id);
      }
    } catch (error) {
      console.error('Error starting data export:', error);
      showError('Failed to start data export');
    } finally {
      setIsExporting(false);
    }
  };

  const pollExportStatus = async (exportId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await request(`/admin/users/${userId}/export-data/${exportId}/status`);
        if (response.success) {
          setExportStatus(response.export);
          
          if (response.export.status === 'completed' || response.export.status === 'failed') {
            clearInterval(pollInterval);
            if (response.export.status === 'completed') {
              showSuccess('Data export completed successfully');
            } else {
              showError('Data export failed');
            }
          }
        }
      } catch (error) {
        console.error('Error polling export status:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const handleDownload = () => {
    if (exportStatus?.downloadUrl) {
      const link = document.createElement('a');
      link.href = exportStatus.downloadUrl;
      link.download = `user-data-${userEmail}-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
    }
  };

  const getStatusBadge = () => {
    if (!exportStatus) return null;
    
    switch (exportStatus.status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (!exportStatus) return <FileText className="w-5 h-5" />;
    
    switch (exportStatus.status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export User Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">{userName || userEmail}</p>
            <p className="text-sm text-gray-600">{userEmail}</p>
          </div>

          {/* Export Info */}
          <div className="space-y-3">
            <h3 className="font-medium">What will be exported:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• User profile information</li>
              <li>• Account activity and login history</li>
              <li>• Bookings and service requests</li>
              <li>• Messages and communications</li>
              <li>• Quotes and invoices</li>
              <li>• Audit trail and permissions</li>
            </ul>
          </div>

          {/* Export Status */}
          {exportStatus && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="font-medium">Export Status</span>
                </div>
                {getStatusBadge()}
              </div>
              
              {exportStatus.status === 'processing' && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{exportStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {exportStatus.status === 'completed' && exportStatus.downloadUrl && (
                <div className="mt-3">
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Export
                  </Button>
                </div>
              )}

              {exportStatus.status === 'failed' && exportStatus.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {exportStatus.error}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Started: {new Date(exportStatus.createdAt).toLocaleString()}
                {exportStatus.completedAt && (
                  <span className="ml-2">
                    Completed: {new Date(exportStatus.completedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {!exportStatus || exportStatus.status === 'failed' ? (
              <Button 
                onClick={handleExportData} 
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Start Export
                  </>
                )}
              </Button>
            ) : null}
          </div>

          {/* GDPR Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>GDPR Compliance:</strong> This export contains all personal data associated with the user account. 
            The data is provided in a machine-readable format as required by GDPR Article 20.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
