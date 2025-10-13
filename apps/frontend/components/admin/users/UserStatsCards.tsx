"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/use-api';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  adminUsers: number;
  employeeUsers: number;
  technicianUsers: number;
  salesmanUsers: number;
  recentUsers: number; // Last 7 days
  inactiveUsers: number; // No login in 30+ days
  usersWithFailedLogins: number;
}

export function UserStatsCards() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await request('/admin/users/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Unable to load user statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'All system users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      description: 'Currently active',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Suspended Users',
      value: stats.suspendedUsers,
      description: 'Account suspended',
      icon: UserX,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Locked Accounts',
      value: stats.lockedUsers,
      description: 'Security locked',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const roleStats = [
    {
      role: 'Admin',
      count: stats.adminUsers,
      color: 'bg-red-100 text-red-800'
    },
    {
      role: 'Employee',
      count: stats.employeeUsers,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      role: 'Technician',
      count: stats.technicianUsers,
      color: 'bg-green-100 text-green-800'
    },
    {
      role: 'Salesman',
      count: stats.salesmanUsers,
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New users (7 days)</span>
                <Badge variant="secondary">{stats.recentUsers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inactive (30+ days)</span>
                <Badge variant="outline">{stats.inactiveUsers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed logins</span>
                <Badge variant={stats.usersWithFailedLogins > 0 ? "destructive" : "secondary"}>
                  {stats.usersWithFailedLogins}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roleStats.map((roleStat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{roleStat.role}</span>
                  <Badge className={roleStat.color}>
                    {roleStat.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lockedUsers > 0 && (
                <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded">
                  <Shield className="w-4 h-4 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {stats.lockedUsers} locked accounts
                    </p>
                    <p className="text-xs text-red-600">
                      Requires immediate attention
                    </p>
                  </div>
                </div>
              )}
              
              {stats.usersWithFailedLogins > 0 && (
                <div className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.usersWithFailedLogins} users with failed logins
                    </p>
                    <p className="text-xs text-yellow-600">
                      Monitor for security threats
                    </p>
                  </div>
                </div>
              )}

              {stats.lockedUsers === 0 && stats.usersWithFailedLogins === 0 && (
                <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded">
                  <UserCheck className="w-4 h-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      All systems secure
                    </p>
                    <p className="text-xs text-green-600">
                      No security alerts
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
