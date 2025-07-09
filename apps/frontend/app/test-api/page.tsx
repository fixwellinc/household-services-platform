'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TestApiPage() {
  const [status, setStatus] = useState<string>('Loading...');
  const [error, setError] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // Log the API URL being used
    const currentApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    setApiUrl(currentApiUrl);
    
    // Test the health endpoint
    api.healthCheck()
      .then((response: { status: string; timestamp: string }) => {
        setStatus(`API is working! Response: ${JSON.stringify(response)}`);
      })
      .catch((err: Error) => {
        setError(`API Error: ${err.message}`);
        setStatus('API test failed');
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set (using /api)'}</p>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">API Configuration:</h2>
          <p>API URL being used: {apiUrl}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">API Test Result:</h2>
          <p className="text-green-600">{status}</p>
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
} 