import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Search indexing service for optimizing search performance
 * Manages search indexes and provides optimization utilities
 */
class SearchIndexService {
  constructor() {
    this.indexedFields = new Map();
    this.searchStats = new Map();
    this.initializeIndexes();
  }

  /**
   * Initialize search indexes for better performance
   */
  async initializeIndexes() {
    try {
      // Note: In a real implementation, these would be database indexes
      // For now, we'll track which fields are commonly searched
      this.indexedFields.set('users', [
        'name', 'email', 'phone', 'role', 'isActive', 'createdAt'
      ]);
      
      this.indexedFields.set('subscriptions', [
        'tier', 'status', 'createdAt', 'userId'
      ]);
      
      this.indexedFields.set('serviceRequests', [
        'category', 'urgency', 'status', 'customerId', 'createdAt'
      ]);
      
      this.indexedFields.set('bookings', [
        'status', 'customerId', 'serviceId', 'scheduledDate', 'createdAt'
      ]);
      
      this.indexedFields.set('auditLogs', [
        'action', 'entityType', 'severity', 'adminId', 'createdAt'
      ]);

      console.log('Search indexes initialized');
    } catch (error) {
      console.error('Error initializing search indexes:', error);
    }
  }

  /**
   * Record search statistics for optimization
   */
  recordSearchStats(entity, query, resultCount, executionTime) {
    const key = `${entity}:${query.toLowerCase()}`;
    const existing = this.searchStats.get(key) || {
      count: 0,
      totalTime: 0,
      avgResultCount: 0,
      lastSearched: null
    };

    existing.count += 1;
    existing.totalTime += executionTime;
    existing.avgResultCount = (existing.avgResultCount + resultCount) / 2;
    existing.lastSearched = new Date();

    this.searchStats.set(key, existing);

    // Clean up old stats (keep only last 1000 entries)
    if (this.searchStats.size > 1000) {
      const entries = Array.from(this.searchStats.entries());
      entries.sort((a, b) => b[1].lastSearched - a[1].lastSearched);
      
      this.searchStats.clear();
      entries.slice(0, 1000).forEach(([key, value]) => {
        this.searchStats.set(key, value);
      });
    }
  }

  /**
   * Get search performance statistics
   */
  getSearchStats() {
    const stats = Array.from(this.searchStats.entries()).map(([key, value]) => {
      const [entity, query] = key.split(':');
      return {
        entity,
        query,
        searchCount: value.count,
        avgExecutionTime: value.totalTime / value.count,
        avgResultCount: value.avgResultCount,
        lastSearched: value.lastSearched
      };
    });

    return {
      totalSearches: stats.reduce((sum, stat) => sum + stat.searchCount, 0),
      uniqueQueries: stats.length,
      topQueries: stats
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, 10),
      slowestQueries: stats
        .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
        .slice(0, 10),
      recentQueries: stats
        .sort((a, b) => new Date(b.lastSearched) - new Date(a.lastSearched))
        .slice(0, 10)
    };
  }

  /**
   * Optimize search query based on patterns
   */
  optimizeSearchQuery(entity, query, filters = {}) {
    const optimizations = {
      originalQuery: query,
      optimizedQuery: query,
      suggestions: [],
      indexHints: []
    };

    // Trim and normalize query
    optimizations.optimizedQuery = query.trim().toLowerCase();

    // Add suggestions based on common patterns
    const entityStats = Array.from(this.searchStats.entries())
      .filter(([key]) => key.startsWith(`${entity}:`))
      .map(([key, value]) => ({
        query: key.split(':')[1],
        count: value.count,
        avgResultCount: value.avgResultCount
      }))
      .sort((a, b) => b.count - a.count);

    // Suggest similar queries that returned good results
    const similarQueries = entityStats.filter(stat => 
      stat.query.includes(optimizations.optimizedQuery) && 
      stat.avgResultCount > 0
    ).slice(0, 3);

    optimizations.suggestions = similarQueries.map(stat => stat.query);

    // Add index hints for better performance
    const indexedFields = this.indexedFields.get(entity) || [];
    optimizations.indexHints = indexedFields.filter(field => 
      Object.keys(filters).includes(field)
    );

    return optimizations;
  }

  /**
   * Build optimized search conditions with performance hints
   */
  buildOptimizedSearchConditions(entity, query, filters = {}) {
    const startTime = Date.now();
    
    // Get optimization suggestions
    const optimization = this.optimizeSearchQuery(entity, query, filters);
    
    // Use optimized query
    const optimizedQuery = optimization.optimizedQuery;
    
    // Build conditions with index hints
    const conditions = {
      searchConditions: null,
      filterConditions: null,
      orderBy: null,
      indexHints: optimization.indexHints
    };

    // Build search conditions for text search
    if (optimizedQuery && optimizedQuery.length >= 2) {
      const searchTerms = optimizedQuery.split(/\s+/);
      const searchConditions = [];

      // Prioritize indexed fields
      const indexedFields = this.indexedFields.get(entity) || [];
      const searchFields = this.getSearchFieldsForEntity(entity);
      
      // Search indexed fields first for better performance
      const prioritizedFields = [
        ...searchFields.filter(field => indexedFields.includes(field.split('.')[0])),
        ...searchFields.filter(field => !indexedFields.includes(field.split('.')[0]))
      ];

      for (const field of prioritizedFields) {
        for (const term of searchTerms) {
          if (field.includes('.')) {
            // Handle nested field search
            const [relation, nestedField] = field.split('.');
            searchConditions.push({
              [relation]: {
                [nestedField]: {
                  contains: term,
                  mode: 'insensitive'
                }
              }
            });
          } else {
            searchConditions.push({
              [field]: {
                contains: term,
                mode: 'insensitive'
              }
            });
          }
        }
      }

      conditions.searchConditions = searchConditions.length > 0 ? { OR: searchConditions } : null;
    }

    // Build filter conditions with index optimization
    if (Object.keys(filters).length > 0) {
      const filterConditions = [];
      
      // Process indexed filters first
      const indexedFilters = Object.entries(filters).filter(([key]) => 
        optimization.indexHints.includes(key)
      );
      
      const nonIndexedFilters = Object.entries(filters).filter(([key]) => 
        !optimization.indexHints.includes(key)
      );

      // Process all filters
      [...indexedFilters, ...nonIndexedFilters].forEach(([key, filterValue]) => {
        if (!filterValue || filterValue.value === undefined) return;

        const condition = this.buildFieldCondition(key, filterValue);
        if (condition) {
          filterConditions.push(condition);
        }
      });

      conditions.filterConditions = filterConditions.length > 0 ? { AND: filterConditions } : null;
    }

    // Optimize ordering based on indexes
    const defaultSort = { field: 'createdAt', direction: 'desc' };
    if (optimization.indexHints.includes(defaultSort.field)) {
      conditions.orderBy = { [defaultSort.field]: defaultSort.direction };
    }

    const executionTime = Date.now() - startTime;
    
    return {
      conditions,
      optimization,
      executionTime
    };
  }

  /**
   * Get search fields for entity
   */
  getSearchFieldsForEntity(entity) {
    const searchFields = {
      users: ['name', 'email', 'phone'],
      subscriptions: ['user.name', 'user.email'],
      serviceRequests: ['category', 'description', 'customer.name', 'customer.email'],
      bookings: ['customerId', 'serviceId', 'notes'],
      auditLogs: ['action', 'entityType', 'admin.name', 'admin.email']
    };

    return searchFields[entity] || [];
  }

  /**
   * Build field condition with optimization
   */
  buildFieldCondition(fieldKey, filterValue) {
    const { operator, value, values } = filterValue;

    switch (operator) {
      case 'equals':
        return { [fieldKey]: value };
      case 'contains':
        return { [fieldKey]: { contains: value, mode: 'insensitive' } };
      case 'startsWith':
        return { [fieldKey]: { startsWith: value, mode: 'insensitive' } };
      case 'endsWith':
        return { [fieldKey]: { endsWith: value, mode: 'insensitive' } };
      case 'greater':
        return { [fieldKey]: { gt: value } };
      case 'less':
        return { [fieldKey]: { lt: value } };
      case 'between':
        return { [fieldKey]: { gte: values[0], lte: values[1] } };
      case 'in':
        return { [fieldKey]: { in: values } };
      case 'notIn':
        return { [fieldKey]: { notIn: values } };
      default:
        return { [fieldKey]: value };
    }
  }

  /**
   * Generate search suggestions based on historical data
   */
  generateHistoricalSuggestions(entity, query, limit = 5) {
    const entityStats = Array.from(this.searchStats.entries())
      .filter(([key]) => key.startsWith(`${entity}:`))
      .map(([key, value]) => ({
        query: key.split(':')[1],
        count: value.count,
        avgResultCount: value.avgResultCount,
        lastSearched: value.lastSearched
      }));

    // Find similar queries
    const similarQueries = entityStats
      .filter(stat => 
        stat.query.includes(query.toLowerCase()) || 
        query.toLowerCase().includes(stat.query)
      )
      .filter(stat => stat.avgResultCount > 0)
      .sort((a, b) => {
        // Sort by relevance (combination of frequency and recency)
        const aScore = stat.count * 0.7 + (Date.now() - new Date(stat.lastSearched)) * 0.3;
        const bScore = stat.count * 0.7 + (Date.now() - new Date(stat.lastSearched)) * 0.3;
        return bScore - aScore;
      })
      .slice(0, limit);

    return similarQueries.map(stat => stat.query);
  }

  /**
   * Clear search statistics
   */
  clearSearchStats() {
    this.searchStats.clear();
  }

  /**
   * Export search statistics for analysis
   */
  exportSearchStats() {
    return {
      stats: Object.fromEntries(this.searchStats),
      summary: this.getSearchStats(),
      exportedAt: new Date().toISOString()
    };
  }
}

export default new SearchIndexService();