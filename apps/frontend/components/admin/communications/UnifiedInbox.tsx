"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  User,
  Star,
  Archive,
  Reply,
  Forward,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Tag
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  type: 'chat' | 'email' | 'ticket' | 'sms';
  subject?: string;
  content: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: Date;
  status: 'unread' | 'read' | 'replied' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  threadId?: string;
  messageCount?: number;
}

interface UnifiedInboxProps {
  searchQuery: string;
}

export function UnifiedInbox({ searchQuery }: UnifiedInboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        type: 'email',
        subject: 'Service Inquiry - Deep Cleaning',
        content: 'Hi, I would like to schedule a deep cleaning service for next week. Could you please provide me with available time slots?',
        sender: {
          id: 'user1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          avatar: '/avatars/sarah.jpg'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'unread',
        priority: 'medium',
        tags: ['service-inquiry', 'deep-cleaning'],
        threadId: 'thread1',
        messageCount: 1
      },
      {
        id: '2',
        type: 'chat',
        content: 'Hello! I have a question about my subscription billing. The charge seems incorrect.',
        sender: {
          id: 'user2',
          name: 'Mike Chen',
          email: 'mike.chen@email.com',
          avatar: '/avatars/mike.jpg'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'read',
        priority: 'high',
        tags: ['billing', 'subscription'],
        threadId: 'thread2',
        messageCount: 3
      },
      {
        id: '3',
        type: 'ticket',
        subject: 'Cancellation Request',
        content: 'I need to cancel my subscription effective immediately due to relocation. Please process this request.',
        sender: {
          id: 'user3',
          name: 'Emma Davis',
          email: 'emma.davis@email.com',
          avatar: '/avatars/emma.jpg'
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        status: 'pending',
        priority: 'urgent',
        tags: ['cancellation', 'subscription'],
        threadId: 'thread3',
        messageCount: 2
      },
      {
        id: '4',
        type: 'sms',
        content: 'Thank you for the excellent service today! The team was professional and thorough.',
        sender: {
          id: 'user4',
          name: 'David Wilson',
          email: 'david.wilson@email.com',
          avatar: '/avatars/david.jpg'
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: 'read',
        priority: 'low',
        tags: ['feedback', 'positive'],
        threadId: 'thread4',
        messageCount: 1
      },
      {
        id: '5',
        type: 'email',
        subject: 'Rescheduling Request',
        content: 'I need to reschedule my cleaning appointment from tomorrow to Friday. Is this possible?',
        sender: {
          id: 'user5',
          name: 'Lisa Anderson',
          email: 'lisa.anderson@email.com',
          avatar: '/avatars/lisa.jpg'
        },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        status: 'replied',
        priority: 'medium',
        tags: ['scheduling', 'rescheduling'],
        threadId: 'thread5',
        messageCount: 4
      }
    ];

    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'ticket':
        return <Phone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !message.subject?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && message.type !== filterType) return false;
    if (filterStatus !== 'all' && message.status !== filterStatus) return false;
    if (filterPriority !== 'all' && message.priority !== filterPriority) return false;
    return true;
  });

  const sortedMessages = filteredMessages.sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'sender':
        return a.sender.name.localeCompare(b.sender.name);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
      {/* Message List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Recent</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="sender">Sender</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Message List */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-500px)]">
          {sortedMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
              } ${message.status === 'unread' ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedMessage(message)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>
                      {message.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(message.type)}
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.sender.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                        {message.messageCount && message.messageCount > 1 && (
                          <Badge variant="outline">{message.messageCount}</Badge>
                        )}
                      </div>
                    </div>

                    {message.subject && (
                      <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                        {message.subject}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {message.content}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <Badge className={getStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                      </div>

                      {message.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {message.tags.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Message Detail */}
      <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMessage.sender.avatar} />
                    <AvatarFallback>
                      {selectedMessage.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(selectedMessage.type)}
                      <h3 className="text-lg font-semibold">{selectedMessage.sender.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{selectedMessage.sender.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedMessage.subject && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium">{selectedMessage.subject}</h4>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatDistanceToNow(selectedMessage.timestamp, { addSuffix: true })}</span>
                <Badge className={getStatusColor(selectedMessage.status)}>
                  {selectedMessage.status}
                </Badge>
                <Badge className={getPriorityColor(selectedMessage.priority)}>
                  {selectedMessage.priority}
                </Badge>
              </div>

              {selectedMessage.tags.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {selectedMessage.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h5>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">Mark as Resolved</Button>
                  <Button variant="outline" size="sm">Assign to Team</Button>
                  <Button variant="outline" size="sm">Set Reminder</Button>
                  <Button variant="outline" size="sm">Add Note</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent>
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Message</h3>
                <p className="text-gray-600">Choose a message from the list to view its details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}