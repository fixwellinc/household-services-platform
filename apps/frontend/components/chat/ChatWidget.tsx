"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/shared';
import { io as socketIOClient, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'support';
  timestamp: Date;
  readBy?: string[];
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

interface ChatWidgetProps {
  customerName?: string;
  customerEmail?: string;
}

export default function ChatWidget({ customerName, customerEmail }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Count unread admin messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const unread = messages.filter(m => m.sender === 'support').length;
      setUnreadAdminCount(unread);
    }
    if (isOpen && chatId) {
      setUnreadAdminCount(0);
      // Mark as read in backend
      fetch(`/api/chat/${chatId}/customer-read`, { method: 'POST' });
    }
  }, [isOpen, messages, chatId]);

  // Connect to Socket.IO and join chat room when chatId is set
  useEffect(() => {
    if (!chatId) return;
    // Connect only if not already connected
    if (!socket) {
      const newSocket = socketIOClient(
        process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin.replace(/^http/, 'ws'),
        { transports: ['websocket'] }
      );
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
    // Join the chat room
    socket.emit('join-session', chatId);
    // Listen for new messages
    const handleNewMessage = (data: any) => {
      setMessages(prev => [
        ...prev,
        {
          id: data.id || Date.now().toString(),
          content: data.message,
          sender: data.senderType === 'customer' ? 'customer' : 'support',
          timestamp: data.sentAt ? new Date(data.sentAt) : new Date()
        }
      ]);
    };
    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [chatId, socket]);

  // Emit typing events as customer types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (socket && chatId) {
      socket.emit('typing', { chatId, sender: 'customer' });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop-typing', { chatId, sender: 'customer' });
      }, 1200);
    }
  };

  // Listen for typing events from admin
  useEffect(() => {
    if (!socket || !chatId) return;
    const handleTyping = (data: any) => {
      if (data.sender === 'admin') setAdminTyping(true);
    };
    const handleStopTyping = (data: any) => {
      if (data.sender === 'admin') setAdminTyping(false);
    };
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, chatId]);

  const handleOpenChat = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    
    // Create new chat session if not exists
    if (!chatId) {
      try {
        const response = await fetch('/api/chat/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: customerName || 'Anonymous',
            customerEmail: customerEmail || '',
            initialMessage: 'Customer started a chat'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setChatId(data.chatId);
          
          // Add welcome message
          setMessages([
            {
              id: 'welcome',
              content: 'Hello! How can we help you today?',
              sender: 'support',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error starting chat:', error);
        // Add fallback welcome message
        setMessages([
          {
            id: 'welcome',
            content: 'Hello! How can we help you today?',
            sender: 'support',
            timestamp: new Date()
          }
        ]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'customer',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send message to backend
    if (chatId) {
      try {
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message: inputMessage,
            customerName: customerName || 'Anonymous'
          })
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    // Simulate response (in real implementation, this would come from WebSocket)
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. A support agent will respond shortly.',
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported file type.');
      return;
    }
    if (file.size > maxFileSize) {
      setUploadError('File is too large (max 5MB).');
      return;
    }
    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!chatId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.file) {
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            message: '',
            fileName: uploadData.file.fileName,
            fileType: uploadData.file.fileType,
            fileUrl: uploadData.file.fileUrl,
            customerName: customerName || 'Anonymous'
          })
        });
        setSelectedFile(null);
      } else {
        setUploadError('File upload failed.');
      }
    } catch (err) {
      setUploadError('File upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop support
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported file type.');
      return;
    }
    if (file.size > maxFileSize) {
      setUploadError('File is too large (max 5MB).');
      return;
    }
    setSelectedFile(file);
    await uploadFile(file);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const renderFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  const renderMessageContent = (message: Message) => {
    if (message.fileUrl) {
      if (message.fileType?.startsWith('image/')) {
        return (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
            <img src={message.fileUrl} alt={message.fileName || 'attachment'} className="max-w-[120px] max-h-[120px] rounded mb-1" />
          </a>
        );
      } else {
        return (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
            <span>{renderFileIcon(message.fileType || '')}</span>
            <span>{message.fileName || 'Download file'}</span>
          </a>
        );
      }
    }
    return <p className="text-sm">{message.content}</p>;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleOpenChat}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg relative"
          size="lg"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadAdminCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadAdminCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <span className="font-medium">Live Chat</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-gray-200"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto max-h-64">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.sender === 'customer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } relative`}
                    >
                      {renderMessageContent(message)}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {message.sender === 'customer' && (
                          <span className="ml-1">
                            {message.readBy?.includes('admin') ? (
                              <CheckCheck className="w-4 h-4 text-green-400 inline" />
                            ) : (
                              <Check className="w-4 h-4 text-gray-300 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                      <p className="text-sm">Support is typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2" onDrop={handleDrop} onDragOver={handleDragOver}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={uploading}
                  aria-label="Type your message"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                  aria-label="Attach file"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded-md"
                  size="sm"
                  disabled={uploading}
                  title="Attach file"
                  aria-label="Attach file"
                >
                  📎
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
                  size="sm"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-700 bg-gray-100 rounded p-2">
                  <span>{renderFileIcon(selectedFile.type)}</span>
                  <span>{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  {uploading && <span className="ml-2 text-blue-600">Uploading...</span>}
                </div>
              )}
              {uploadError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">{uploadError}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 