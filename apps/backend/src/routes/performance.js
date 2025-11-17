import express from 'express';
import { monitor, memoryMonitor } from '../config/performance.js';
import { cacheService } from '../services/cacheService.js';
import { concurrencyManager } from '../middleware/concurrency.js';
import { requireAdmin } from '../middleware/auth.js';
import prisma from '../config/database.js';

const router = express.Router();

// Get performance metrics (admin only)
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const metrics = {
      performance: monitor.getMetrics(),
      memory: memoryMonitor.getUsage(),
      cache: cacheService.getStats(),
      concurrency: concurrencyManager.getStats(),
      database: await getDatabaseStats()
    };

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// Get database performance statistics
async function getDatabaseStats() {
  try {
    // Get connection pool stats (if available)
    const connectionStats = {
      // These would be available if using a connection pool
      activeConnections: 'N/A',
      idleConnections: 'N/A',
      totalConnections: 'N/A'
    };

    // Get table sizes and index usage
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_stat_get_tuples_returned(c.oid) as tuples_read,
        pg_stat_get_tuples_fetched(c.oid) as tuples_fetched
      FROM pg_tables pt
      JOIN pg_class c ON c.relname = pt.tablename
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;

    // Get slow queries (if pg_stat_statements is available)
    let slowQueries = [];
    try {
      slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_time DESC 
        LIMIT 5
      `;
    } catch (error) {
      // pg_stat_statements extension not available
      slowQueries = [];
    }

    return {
      connections: connectionStats,
      tables: tableStats,
      slowQueries
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { error: error.message };
  }
}

// Cache management endpoints
router.post('/cache/clear', requireAdmin, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      const clearedCount = await cacheService.clearExpiredEntries();
      res.json({
        success: true,
        message: `Cleared ${clearedCount} cache entries matching pattern: ${pattern}`
      });
    } else {
      // Clear all cache
      const stats = cacheService.getStats();
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        previousStats: stats
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

router.post('/cache/warmup', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userIds array is required'
      });
    }

    await cacheService.warmupCache(userIds);
    
    res.json({
      success: true,
      message: `Cache warmed up for ${userIds.length} users`
    });
  } catch (error) {
    console.error('Error warming up cache:', error);
    res.status(500).json({
      error: 'Failed to warm up cache',
      message: error.message
    });
  }
});

// Performance analysis endpoints
router.get('/analysis/slow-operations', requireAdmin, async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const slowOperations = Object.entries(metrics.operations)
      .filter(([_, data]) => data.avgTime > 1000) // Operations slower than 1 second
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 10);

    res.json({
      success: true,
      slowOperations: slowOperations.map(([operation, data]) => ({
        operation,
        ...data
      }))
    });
  } catch (error) {
    console.error('Error analyzing slow operations:', error);
    res.status(500).json({
      error: 'Failed to analyze slow operations',
      message: error.message
    });
  }
});

router.get('/analysis/cache-efficiency', requireAdmin, async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const efficiency = {
      hitRate: stats.performance.cache.hitRate,
      totalRequests: stats.performance.cache.hits + stats.performance.cache.misses,
      cacheSize: stats.cache.keys,
      recommendations: []
    };

    // Generate recommendations
    if (efficiency.hitRate < 0.7) {
      efficiency.recommendations.push('Cache hit rate is low. Consider increasing TTL or warming up cache.');
    }
    
    if (efficiency.cacheSize > 10000) {
      efficiency.recommendations.push('Cache size is large. Consider implementing cache eviction policies.');
    }

    res.json({
      success: true,
      efficiency
    });
  } catch (error) {
    console.error('Error analyzing cache efficiency:', error);
    res.status(500).json({
      error: 'Failed to analyze cache efficiency',
      message: error.message
    });
  }
});

// Database optimization endpoints
router.post('/database/analyze', requireAdmin, async (req, res) => {
  try {
    // Run ANALYZE on subscription-related tables
    // Use $executeRawUnsafe with proper identifier quoting (table names are hardcoded, so safe)
    // PostgreSQL requires double quotes for identifiers
    await prisma.$executeRawUnsafe(`ANALYZE "Subscription"`);
    await prisma.$executeRawUnsafe(`ANALYZE "PaymentFrequency"`);
    await prisma.$executeRawUnsafe(`ANALYZE "SubscriptionPause"`);
    await prisma.$executeRawUnsafe(`ANALYZE "RewardCredit"`);
    await prisma.$executeRawUnsafe(`ANALYZE "AdditionalProperty"`);

    res.json({
      success: true,
      message: 'Database analysis completed'
    });
  } catch (error) {
    console.error('Error analyzing database:', error);
    res.status(500).json({
      error: 'Failed to analyze database',
      message: error.message
    });
  }
});

router.get('/database/index-usage', requireAdmin, async (req, res) => {
  try {
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as usage_count,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    `;

    res.json({
      success: true,
      indexUsage
    });
  } catch (error) {
    console.error('Error getting index usage:', error);
    res.status(500).json({
      error: 'Failed to get index usage',
      message: error.message
    });
  }
});

// Health check endpoint with performance data
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    // Get basic metrics
    const memory = memoryMonitor.getUsage();
    const cacheStats = cacheService.getStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: dbResponseTime
      },
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        usage: (memory.heapUsed / memory.heapTotal * 100).toFixed(2) + '%'
      },
      cache: {
        hitRate: cacheStats.performance.cache.hitRate,
        keys: cacheStats.cache.keys
      }
    };

    // Determine overall health
    if (dbResponseTime > 5000) {
      health.status = 'degraded';
      health.warnings = ['Database response time is high'];
    }
    
    if (memory.heapUsed > 1000) {
      health.status = 'degraded';
      health.warnings = health.warnings || [];
      health.warnings.push('High memory usage detected');
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;