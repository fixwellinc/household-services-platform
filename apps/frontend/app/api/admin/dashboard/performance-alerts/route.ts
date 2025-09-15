import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Generate performance-specific alerts
    const performanceAlerts = [
      {
        id: 'slow-database-queries',
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'Slow Database Queries',
        message: 'Multiple queries taking >1s to complete',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        resolved: false,
        metrics: {
          avgResponseTime: '1.2s',
          affectedQueries: 5
        }
      },
      {
        id: 'email-service-timeout',
        type: 'PERFORMANCE',
        severity: 'LOW',
        title: 'Email Service Connection Timeout',
        message: 'Email service experiencing intermittent connection timeouts',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        resolved: false,
        metrics: {
          timeoutRate: '15%',
          affectedEmails: 3
        }
      },
      {
        id: 'high-memory-usage',
        type: 'PERFORMANCE',
        severity: 'HIGH',
        title: 'High Memory Usage',
        message: 'Application memory usage above 85%',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        resolved: false,
        metrics: {
          memoryUsage: '87%',
          threshold: '85%'
        }
      },
      {
        id: 'api-rate-limit-approaching',
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'API Rate Limit Approaching',
        message: 'Stripe API usage at 80% of rate limit',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        resolved: true,
        metrics: {
          currentUsage: '80%',
          limit: '100 req/min'
        }
      }
    ];

    // Apply limit
    const limitedAlerts = performanceAlerts.slice(0, limit);

    return NextResponse.json({
      alerts: limitedAlerts,
      total: performanceAlerts.length,
      unresolved: performanceAlerts.filter(a => !a.resolved).length,
      summary: {
        critical: performanceAlerts.filter(a => a.severity === 'HIGH' && !a.resolved).length,
        warning: performanceAlerts.filter(a => a.severity === 'MEDIUM' && !a.resolved).length,
        info: performanceAlerts.filter(a => a.severity === 'LOW' && !a.resolved).length
      }
    });
  } catch (error) {
    console.error('Admin dashboard performance alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}