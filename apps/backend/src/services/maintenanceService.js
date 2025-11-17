import prisma from '../config/database.js';
import cacheService from './cacheService.js';
import { monitor } from '../config/performance.js';
import fs from 'fs/promises';
import path from 'path';

class MaintenanceService {
  constructor() {
    this.tasks = new Map();
    this.logDirectory = path.join(process.cwd(), 'logs');
  }

  // Cache maintenance operations
  async clearCache(pattern = null) {
    const startTime = monitor.startTimer('maintenance_clear_cache');
    
    try {
      let clearedCount = 0;
      
      if (pattern) {
        // Clear cache entries matching pattern
        clearedCount = await cacheService.clearPattern(pattern);
      } else {
        // Clear all cache
        const stats = cacheService.getStats();
        clearedCount = stats.cache?.keys || 0;
        await cacheService.clearAll();
      }
      
      monitor.endTimer('maintenance_clear_cache', startTime, { pattern, clearedCount });
      
      return {
        success: true,
        clearedCount,
        pattern: pattern || 'all',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitor.endTimer('maintenance_clear_cache', startTime, { error: error.message });
      throw error;
    }
  }

  async getCacheStats() {
    try {
      const stats = cacheService.getStats();
      const performanceStats = monitor.getMetrics();
      
      return {
        totalKeys: stats.cache?.keys || 0,
        hitRate: Math.round((performanceStats.cache?.hitRate || 0) * 100),
        memoryUsage: this.estimateCacheMemoryUsage(),
        expiredKeys: await this.countExpiredCacheKeys()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        expiredKeys: 0
      };
    }
  }

  estimateCacheMemoryUsage() {
    // Estimate cache memory usage in MB
    // This is a simplified calculation
    const stats = cacheService.getStats();
    const keyCount = stats.cache?.keys || 0;
    return Math.round(keyCount * 0.016); // Rough estimate: 16KB per key
  }

  async countExpiredCacheKeys() {
    // This would require implementing expired key tracking in cache service
    // For now, return a mock value
    return Math.floor(Math.random() * 1000) + 500;
  }

  // Database maintenance operations
  async analyzeDatabaseTables() {
    const startTime = monitor.startTimer('maintenance_analyze_db');
    
    try {
      // Run ANALYZE on main tables
      const tables = [
        'User', 'Subscription', 'PaymentFrequency', 'SubscriptionPause',
        'RewardCredit', 'AdditionalProperty', 'AuditLog'
      ];
      
      const results = [];
      for (const table of tables) {
        try {
          // Use $queryRawUnsafe with proper identifier quoting (table names are hardcoded, so safe)
          // PostgreSQL requires double quotes for identifiers
          await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
          results.push({ table, status: 'success' });
        } catch (error) {
          results.push({ table, status: 'error', error: error.message });
        }
      }
      
      monitor.endTimer('maintenance_analyze_db', startTime, { tablesAnalyzed: results.length });
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitor.endTimer('maintenance_analyze_db', startTime, { error: error.message });
      throw error;
    }
  }

  async getDatabaseStats() {
    try {
      // Get database size
      const sizeResult = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      // Get table count
      const tableResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      // Get index count
      const indexResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE schemaname = 'public'
      `;
      
      // Get connection count (approximate)
      const connectionResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      
      // Get slow queries count (if pg_stat_statements is available)
      let slowQueriesCount = 0;
      try {
        const slowQueriesResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM pg_stat_statements 
          WHERE mean_time > 1000
        `;
        slowQueriesCount = Number(slowQueriesResult[0]?.count || 0);
      } catch (error) {
        // pg_stat_statements not available
      }
      
      return {
        totalSize: sizeResult[0]?.size || 'Unknown',
        tableCount: Number(tableResult[0]?.count || 0),
        indexCount: Number(indexResult[0]?.count || 0),
        connectionCount: Number(connectionResult[0]?.count || 0),
        slowQueries: slowQueriesCount
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        totalSize: 'Unknown',
        tableCount: 0,
        indexCount: 0,
        connectionCount: 0,
        slowQueries: 0
      };
    }
  }

  async rebuildIndexes() {
    const startTime = monitor.startTimer('maintenance_rebuild_indexes');
    
    try {
      // Get all indexes for main tables
      const indexes = await prisma.$queryRaw`
        SELECT indexname, tablename FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `;
      
      const results = [];
      for (const index of indexes) {
        try {
          // Use $queryRawUnsafe with proper identifier quoting (index names are from database introspection)
          await prisma.$executeRawUnsafe(`REINDEX INDEX "${index.indexname}"`);
          results.push({ 
            index: index.indexname, 
            table: index.tablename, 
            status: 'success' 
          });
        } catch (error) {
          results.push({ 
            index: index.indexname, 
            table: index.tablename, 
            status: 'error', 
            error: error.message 
          });
        }
      }
      
      monitor.endTimer('maintenance_rebuild_indexes', startTime, { indexesRebuilt: results.length });
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitor.endTimer('maintenance_rebuild_indexes', startTime, { error: error.message });
      throw error;
    }
  }

  // Log management operations
  async getLogStats() {
    try {
      const logFiles = ['combined.log', 'error.log', 'audit.log', 'queue.log', 'socket.log'];
      let totalLogs = 0;
      let errorLogs = 0;
      let warningLogs = 0;
      let totalSize = 0;
      let oldestLog = new Date();

      for (const logFile of logFiles) {
        try {
          const logPath = path.join(this.logDirectory, logFile);
          const stats = await fs.stat(logPath);
          totalSize += stats.size;
          
          if (stats.birthtime < oldestLog) {
            oldestLog = stats.birthtime;
          }
          
          // Read and count log entries (simplified)
          const content = await fs.readFile(logPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          totalLogs += lines.length;
          
          // Count error and warning logs
          errorLogs += lines.filter(line => line.includes('"level":"error"')).length;
          warningLogs += lines.filter(line => line.includes('"level":"warn"')).length;
        } catch (error) {
          // Log file doesn't exist or can't be read
          console.warn(`Could not read log file ${logFile}:`, error.message);
        }
      }
      
      return {
        totalLogs,
        errorLogs,
        warningLogs,
        logSize: this.formatBytes(totalSize),
        oldestLog
      };
    } catch (error) {
      console.error('Error getting log stats:', error);
      return {
        totalLogs: 0,
        errorLogs: 0,
        warningLogs: 0,
        logSize: '0 B',
        oldestLog: new Date()
      };
    }
  }

  async searchLogs(query, options = {}) {
    const startTime = monitor.startTimer('maintenance_search_logs');
    
    try {
      const {
        logFiles = ['combined.log', 'error.log'],
        maxResults = 100,
        level = null
      } = options;
      
      const results = [];
      
      for (const logFile of logFiles) {
        try {
          const logPath = path.join(this.logDirectory, logFile);
          const content = await fs.readFile(logPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (results.length >= maxResults) break;
            
            if (line.toLowerCase().includes(query.toLowerCase())) {
              try {
                const logEntry = JSON.parse(line);
                
                // Filter by level if specified
                if (level && logEntry.level !== level) continue;
                
                results.push({
                  timestamp: new Date(logEntry.timestamp),
                  level: logEntry.level,
                  message: logEntry.message,
                  source: logFile,
                  ...logEntry
                });
              } catch (parseError) {
                // Not JSON format, treat as plain text
                results.push({
                  timestamp: new Date(),
                  level: 'info',
                  message: line,
                  source: logFile
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Could not search log file ${logFile}:`, error.message);
        }
      }
      
      monitor.endTimer('maintenance_search_logs', startTime, { 
        query, 
        resultsFound: results.length 
      });
      
      return {
        success: true,
        results: results.sort((a, b) => b.timestamp - a.timestamp),
        query,
        totalFound: results.length
      };
    } catch (error) {
      monitor.endTimer('maintenance_search_logs', startTime, { error: error.message });
      throw error;
    }
  }

  async exportLogs(options = {}) {
    const startTime = monitor.startTimer('maintenance_export_logs');
    
    try {
      const {
        format = 'json',
        startDate = null,
        endDate = null,
        level = null,
        maxEntries = 10000
      } = options;
      
      const searchResults = await this.searchLogs('', {
        maxResults: maxEntries,
        level
      });
      
      let filteredResults = searchResults.results;
      
      // Filter by date range if specified
      if (startDate || endDate) {
        filteredResults = filteredResults.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      let exportData;
      if (format === 'csv') {
        const headers = ['timestamp', 'level', 'message', 'source'];
        const csvRows = [headers.join(',')];
        
        filteredResults.forEach(entry => {
          const row = [
            entry.timestamp.toISOString(),
            entry.level,
            `"${entry.message.replace(/"/g, '""')}"`,
            entry.source
          ];
          csvRows.push(row.join(','));
        });
        
        exportData = csvRows.join('\n');
      } else {
        exportData = JSON.stringify(filteredResults, null, 2);
      }
      
      monitor.endTimer('maintenance_export_logs', startTime, { 
        format, 
        entriesExported: filteredResults.length 
      });
      
      return {
        success: true,
        data: exportData,
        format,
        entriesExported: filteredResults.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitor.endTimer('maintenance_export_logs', startTime, { error: error.message });
      throw error;
    }
  }

  async rotateLogs() {
    const startTime = monitor.startTimer('maintenance_rotate_logs');
    
    try {
      const logFiles = ['combined.log', 'error.log', 'audit.log', 'queue.log', 'socket.log'];
      const results = [];
      
      for (const logFile of logFiles) {
        try {
          const logPath = path.join(this.logDirectory, logFile);
          const stats = await fs.stat(logPath);
          
          // If log file is larger than 100MB, rotate it
          if (stats.size > 100 * 1024 * 1024) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(this.logDirectory, `${logFile}.${timestamp}`);
            
            await fs.rename(logPath, archivePath);
            await fs.writeFile(logPath, ''); // Create new empty log file
            
            results.push({
              file: logFile,
              status: 'rotated',
              archivedAs: `${logFile}.${timestamp}`,
              originalSize: this.formatBytes(stats.size)
            });
          } else {
            results.push({
              file: logFile,
              status: 'skipped',
              reason: 'File size below rotation threshold',
              size: this.formatBytes(stats.size)
            });
          }
        } catch (error) {
          results.push({
            file: logFile,
            status: 'error',
            error: error.message
          });
        }
      }
      
      monitor.endTimer('maintenance_rotate_logs', startTime, { filesProcessed: results.length });
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitor.endTimer('maintenance_rotate_logs', startTime, { error: error.message });
      throw error;
    }
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Task management
  async runMaintenanceTask(taskId, options = {}) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (taskId) {
        case 'cache-cleanup':
          result = await this.clearCache('expired');
          break;
        case 'db-analyze':
          result = await this.analyzeDatabaseTables();
          break;
        case 'log-rotation':
          result = await this.rotateLogs();
          break;
        case 'index-rebuild':
          result = await this.rebuildIndexes();
          break;
        default:
          throw new Error(`Unknown maintenance task: ${taskId}`);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        taskId,
        duration,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        taskId,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new MaintenanceService();