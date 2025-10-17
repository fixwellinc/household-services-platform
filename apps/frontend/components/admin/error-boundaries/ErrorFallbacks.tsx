"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Database, FileX, Bug, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

// Network Error Fallback
export function NetworkErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Wifi className="h-6 w-6 text-orange-600" />
          <CardTitle className="text-orange-900 text-lg">
            Connection Error
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-orange-800 mb-4">
          Unable to connect to the server. Please check your internet connection and try again.
        </p>
        {context && (
          <p className="text-sm text-orange-700 mb-4">
            Context: {context}
          </p>
        )}
        <div className="flex space-x-3">
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="flex items-center border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Data Error Fallback
export function DataErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-red-600" />
          <CardTitle className="text-red-900 text-lg">
            Data Loading Error
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-red-800 mb-4">
          There was a problem loading the data. The server may be temporarily unavailable.
        </p>
        {context && (
          <p className="text-sm text-red-700 mb-4">
            Data source: {context}
          </p>
        )}
        <div className="flex space-x-3">
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="flex items-center border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button
            onClick={() => window.location.href = '/admin'}
            variant="outline"
            size="sm"
            className="flex items-center border-red-300 text-red-700 hover:bg-red-100"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Permission Error Fallback
export function PermissionErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <FileX className="h-6 w-6 text-yellow-600" />
          <CardTitle className="text-yellow-900 text-lg">
            Access Denied
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-800 mb-4">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
        {context && (
          <p className="text-sm text-yellow-700 mb-4">
            Resource: {context}
          </p>
        )}
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.href = '/admin'}
            variant="outline"
            size="sm"
            className="flex items-center border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => window.location.href = 'mailto:support@example.com'}
            variant="outline"
            size="sm"
            className="flex items-center border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component Error Fallback
export function ComponentErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <Bug className="h-4 w-4" />
      <div className="font-medium text-sm mb-1">Component Error</div>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          A component failed to render properly. This may be a temporary issue.
        </p>
        {context && (
          <p className="text-sm mb-3">
            Component: {context}
          </p>
        )}
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Generic Error Fallback
export function GenericErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-gray-600" />
          <CardTitle className="text-gray-900 text-lg">
            Something went wrong
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-800 mb-4">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        {context && (
          <p className="text-sm text-gray-700 mb-4">
            Context: {context}
          </p>
        )}
        <div className="flex space-x-3">
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          <Button
            onClick={() => window.location.href = '/admin'}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline Error Fallback (for smaller components)
export function InlineErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-2" />
        <p className="text-sm text-red-800 mb-2">
          Error loading {context || 'component'}
        </p>
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Error Recovery Helper
export function createErrorFallback(errorType: 'network' | 'data' | 'permission' | 'component' | 'generic' = 'generic') {
  return function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
    const context = error.message;
    
    switch (errorType) {
      case 'network':
        return <NetworkErrorFallback error={error} resetError={resetError} context={context} />;
      case 'data':
        return <DataErrorFallback error={error} resetError={resetError} context={context} />;
      case 'permission':
        return <PermissionErrorFallback error={error} resetError={resetError} context={context} />;
      case 'component':
        return <ComponentErrorFallback error={error} resetError={resetError} context={context} />;
      default:
        return <GenericErrorFallback error={error} resetError={resetError} context={context} />;
    }
  };
}