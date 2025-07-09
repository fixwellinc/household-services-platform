export default function HealthPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Health Check</h1>
      
      <div className="space-y-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>✅ Frontend is working!</strong>
          <p className="mt-2">The Next.js application is running successfully.</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Environment Information:</h2>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>NODE_ENV: {process.env.NODE_ENV}</li>
            <li>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set (using /api)'}</li>
            <li>NEXT_PUBLIC_APP_NAME: {process.env.NEXT_PUBLIC_APP_NAME || 'Not set'}</li>
            <li>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</li>
          </ul>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Check if environment variables are set in Vercel dashboard</li>
            <li>Visit <a href="/test-api" className="text-blue-600 hover:underline">/test-api</a> to test API connection</li>
            <li>Visit <a href="/" className="text-blue-600 hover:underline">home page</a> to see the full application</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 