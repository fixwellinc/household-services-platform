import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      buildId: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
      checks: {
        database: 'ok', // Add actual DB check if needed
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warning'
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  // Simple health check for load balancers
  return new Response(null, { status: 200 });
}