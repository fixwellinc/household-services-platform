"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Paperclip,
  Image,
  Smile,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Type,
  X,
  Plus,
  Users,
  Mail,
  MessageSquare,
  Clock,
  Save,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageComposerProps {
  onClose?: () => void;
  replyTo?: {
    id: string;
    sender: string;
    subject?: string;
    content: string;
  };
  threadId?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'employee' | 'admin';
  avatar?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
}

export function MessageComposer({ onClose, replyTo, threadId }: MessageComposerProps) {
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'chat'>('email');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock data for recipients
  const availableRecipients: Recipient[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      type: 'customer',
      avatar: '/avatars/sarah.jpg'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      type: 'customer',
      avatar: '/avatars/mike.jpg'
    },
    {
      id: '3',
      name: 'Team Lead - John Smith',
      email: 'john.smith@company.com',
      type: 'employee',
      avatar: '/avatars/john.jpg'
    }
  ];

  // Mock templates
  const templates: Template[] = [
    {
      id: '1',
      name: 'Welcome Message',
      subject: 'Welcome to Our Service!',
      content: 'Dear {{customerName}},\n\nWelcome to our service! We\'re excited to have you on board.\n\nBest regards,\nThe Team',
      category: 'onboarding',
      variables: ['customerName']
    },
    {
      id: '2',
      name: 'Service Confirmation',
      subject: 'Service Confirmation - {{serviceDate}}',
      content: 'Hi {{customerName}},\n\nThis confirms your {{serviceType}} service scheduled for {{serviceDate}} at {{serviceTime}}.\n\nOur team will arrive within the scheduled time window.\n\nBest regards,\nService Team',
      category: 'confirmation',
      variables: ['customerName', 'serviceType', 'serviceDate', 'serviceTime']
    },
    {
      id: '3',
      name: 'Issue Resolution',
      subject: 'Resolution for Your Recent Inquiry',
      content: 'Dear {{customerName}},\n\nThank you for bringing this matter to our attention. We have reviewed your concern and here\'s how we\'re addressing it:\n\n{{resolutionDetails}}\n\nIf you have any further questions, please don\'t hesitate to reach out.\n\nBest regards,\nCustomer Support',
      category: 'support',
      variables: ['customerName', 'resolutionDetails']
    }
  ];

  const filteredRecipients = availableRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    recipient.email.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleAddRecipient = (recipient: Recipient) => {
    if (!recipients.find(r => r.id === recipient.id)) {
      setRecipients([...recipients, recipient]);
    }
    setRecipientSearch('');
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setRecipients(recipients.filter(r => r.id !== recipientId));
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setContent(template.content);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFormatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const handleSend = () => {
    // Validate required fields
    if (recipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    if (!content.trim()) {
      alert('Please enter a message');
      return;
    }

    // Here you would typically send the message via API
    console.log('Sending message:', {
      type: messageType,
      recipients,
      subject,
      content,
      attachments,
      scheduledTime,
      priority,
      tags,
      threadId
    });

    // Close composer after sending
    if (onClose) {
      onClose();
    }
  };

  const handleSaveDraft = () => {
    setIsDraft(true);
    // Here you would save the draft via API
    console.log('Saving draft:', {
      type: messageType,
      recipients,
      subject,
      content,
      attachments,
      scheduledTime,
      priority,
      tags
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          {messageType === 'email' && <Mail className="h-5 w-5" />}
          {messageType === 'sms' && <MessageSquare className="h-5 w-5" />}
          {messageType === 'chat' && <MessageSquare className="h-5 w-5" />}
          <span>
            {replyTo ? 'Reply to Message' : 'Compose New Message'}
          </span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          {isDraft && <Badge variant="outline">Draft</Badge>}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message Type Selection */}
        <div className="flex items-center space-x-4">
          <Label>Message Type:</Label>
          <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates */}
        <div>
          <Label>Quick Templates</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className={selectedTemplate?.id === template.id ? 'bg-blue-50' : ''}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Recipients */}
        <div>
          <Label>To:</Label>
          <div className="space-y-2 mt-2">
            {/* Selected Recipients */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <Badge
                    key={recipient.id}
                    variant="secondary"
                    className="flex items-center space-x-2 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={recipient.avatar} />
                      <AvatarFallback>
                        {recipient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{recipient.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Recipient Search */}
            <div className="relative">
              <Input
                placeholder="Search recipients..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
              />
              {recipientSearch && filteredRecipients.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddRecipient(recipient)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={recipient.avatar} />
                        <AvatarFallback>
                          {recipient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{recipient.name}</p>
                        <p className="text-xs text-gray-500">{recipient.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {recipient.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject (for email) */}
        {messageType === 'email' && (
          <div>
            <Label htmlFor="subject">Subject:</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
            />
          </div>
        )}

        {/* Message Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="content">Message:</Label>
            {messageType === 'email' && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText('underline')}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText('link')}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            rows={8}
            className="resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Attachments:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Add File
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileAttachment}
          />
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="priority">Priority:</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduled">Schedule Send:</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div>
            <Label>Tags:</Label>
            <div className="flex space-x-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {isDraft && (
              <Button variant="outline" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Draft
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {scheduledTime && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Scheduled</span>
              </div>
            )}
            <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              {scheduledTime ? 'Schedule' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}