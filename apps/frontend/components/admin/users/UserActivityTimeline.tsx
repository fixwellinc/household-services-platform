"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  Shield, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Clock,
  Activity,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityEvent {
  type: 'login' | 'permission_change' | 'role_change' | 'impersonation' | 'failed_login' | 'audit' | 'booking' | 'quote' | 'message';
  action: string;
  timestamp: string;
  metadata?: any;
  actor?: { id: string; email: string; name?: string };
}

interface UserActivityTimelineProps {
  activities: ActivityEvent[];
  loading?: boolean;
}

const eventIcons = {
  login: CheckCircle,
  permission_change: Shield,
  role_change: User,
  impersonation: Eye,
  failed_login: XCircle,
  audit: Activity,
  booking: Calendar,
  quote: FileText,
  message: MessageSquare
};

const eventColors = {
  login: 'text-green-600 bg-green-100',
  permission_change: 'text-blue-600 bg-blue-100',
  role_change: 'text-purple-600 bg-purple-100',
  impersonation: 'text-orange-600 bg-orange-100',
  failed_login: 'text-red-600 bg-red-100',
  audit: 'text-gray-600 bg-gray-100',
  booking: 'text-indigo-600 bg-indigo-100',
  quote: 'text-cyan-600 bg-cyan-100',
  message: 'text-pink-600 bg-pink-100'
};

export function UserActivityTimeline({ activities, loading }: UserActivityTimelineProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [showExport, setShowExport] = useState(false);

  const filteredActivities = activities.filter(activity => 
    filterType === 'all' || activity.type === filterType
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const exportActivity = () => {
    const csvContent = [
      ['Type', 'Action', 'Timestamp', 'Actor', 'Details'].join(','),
      ...filteredActivities.map(activity => [
        activity.type,
        `"${activity.action}"`,
        activity.timestamp,
        activity.actor ? `"${activity.actor.email}"` : '',
        `"${JSON.stringify(activity.metadata || {}).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Activity Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Activity Timeline</span>
            <Badge variant="secondary">{filteredActivities.length}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="role_change">Role Changes</SelectItem>
                <SelectItem value="permission_change">Permissions</SelectItem>
                <SelectItem value="impersonation">Impersonation</SelectItem>
                <SelectItem value="failed_login">Failed Logins</SelectItem>
                <SelectItem value="audit">Audit Events</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportActivity}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No activity found</p>
            {filterType !== 'all' && (
              <p className="text-sm">Try changing the filter or check back later</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const Icon = eventIcons[activity.type] || Activity;
              const timestamp = formatTimestamp(activity.timestamp);
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${eventColors[activity.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{timestamp.relative}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        {activity.actor && (
                          <span className="text-xs text-gray-500">
                            by {activity.actor.name || activity.actor.email}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {timestamp.date} at {timestamp.time}
                      </span>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-800">
                            View details
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
