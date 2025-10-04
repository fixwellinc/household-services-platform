"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected'
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  url?: string;
  options?: any;
}

export function SocketProvider({ 
  children, 
  url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  options = {}
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SocketContextType['connectionStatus']>('disconnected');

  useEffect(() => {
    // Only connect on client side
    if (typeof window === 'undefined') return;

    console.log('Socket URL:', url, 'NODE_ENV:', process.env.NODE_ENV);

    // Skip WebSocket connection in production if no proper URL is configured
    if (process.env.NODE_ENV === 'production' && (!url || url.includes('localhost') || url === 'http://localhost:3001')) {
      console.warn('WebSocket disabled: No production URL configured. URL:', url);
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      timeout: 10000,
      ...options
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Don't retry indefinitely in production
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
          socketInstance.disconnect();
          setConnectionStatus('disconnected');
        }, 5000);
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setConnectionStatus('error');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed - disabling WebSocket features');
      setConnectionStatus('disconnected');
      setSocket(null);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [url, options]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}