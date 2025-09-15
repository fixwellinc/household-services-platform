"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Mail,
  Phone,
  Users,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { UnifiedInbox } from './UnifiedInbox';
import { MessageComposer } from './MessageComposer';
import { TemplateManager } from './TemplateManager';
import { CampaignBuilder } from './CampaignBuilder';
import { CommunicationAnalytics } from './CommunicationAnalytics';
import { CommunicationSettings } from './CommunicationSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const communicationStats = {
    totalMessages: 1247,
    unreadMessages: 23,
    pendingTickets: 7,
    activeChats: 5,
    emailsSentToday: 156,
    responseTime: '2.4h'
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-600 mt-1">
            Manage all customer communications from one centralized hub
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={() => setShowComposer(true)}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total Messages</p>
                <p className="text-lg font-semibold">{communicationStats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Unread</p>
                <div className="flex items-center space-x-1">
                  <p className="text-lg font-semibold">{communicationStats.unreadMessages}</p>
                  <Badge variant="destructive" className="text-xs">
                    {communicationStats.unreadMessages}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Pending Tickets</p>
                <p className="text-lg font-semibold">{communicationStats.pendingTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Active Chats</p>
                <p className="text-lg font-semibold">{communicationStats.activeChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Emails Today</p>
                <p className="text-lg font-semibold">{communicationStats.emailsSentToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-600">Avg Response</p>
                <p className="text-lg font-semibold">{communicationStats.responseTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="inbox" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="composer" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Compose</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          <UnifiedInbox searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="composer" className="space-y-6">
          <MessageComposer />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignBuilder />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CommunicationAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <CommunicationSettings />
        </TabsContent>
      </Tabs>

      {/* Message Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <MessageComposer onClose={() => setShowComposer(false)} />
          </div>
        </div>
      )}
    </div>
  );
}