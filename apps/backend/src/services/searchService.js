import { PrismaClient } from '@prisma/client';
import searchIndexService from './searchIndexService.js';

const prisma = new PrismaClient();

/**
 * Global search service for dashboard
 * Provides entity-specific search capabilities with indexing and suggestions
 */
class SearchService {
  constructor() {
    this.searchConfigs = this.initializeSearchConfigs();
  }

  /**
   * Initialize search configurations for different entities
   */
  initializeSearchConfigs() {
    return {
      users: {
        entity: 'users',
        table: 'User',
        fields: [
          { key: 'name', label: 'Name', type: 'text', searchable: true, filterable: true },
          { key: 'email', label: 'Email', type: 'text', searchable: true, filterable: true },
          { key: 'phone', label: 'Phone', type: 'text', searchable: true, filterable: true },
          { key: 'role', label: 'Role', type: 'select', searchable: false, filterable: true, 
            options: [
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'EMPLOYEE', label: 'Employee' },
              { value: 'ADMIN', label: 'Admin' }
            ]
          },
          { key: 'isActive', label: 'Active', type: 'boolean', searchable: false, filterable: true },
          { key: 'createdAt', label: 'Created Date', type: 'date', searchable: false, filterable: true }
        ],
        searchFields: ['name', 'email', 'phone'],
        displayFields: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
      },
      subscriptions: {
        entity: 'subscriptions',
        table: 'Subscription',
        fields: [
          { key: 'tier', label: 'Tier', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'STARTER', label: 'Starter' },
              { value: 'HOMECARE', label: 'Homecare' },
              { value: 'PRIORITY', label: 'Priority' }
            ]
          },
          { key: 'status', label: 'Status', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'PAUSED', label: 'Paused' }
            ]
          },
          { key: 'createdAt', label: 'Created Date', type: 'date', searchable: false, filterable: true },
          { key: 'currentPeriodEnd', label: 'Period End', type: 'date', searchable: false, filterable: true }
        ],
        searchFields: ['user.name', 'user.email'],
        displayFields: ['id', 'tier', 'status', 'createdAt', 'user'],
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      serviceRequests: {
        entity: 'serviceRequests',
        table: 'ServiceRequest',
        fields: [
          { key: 'category', label: 'Category', type: 'text', searchable: true, filterable: true },
          { key: 'description', label: 'Description', type: 'text', searchable: true, filterable: false },
          { key: 'urgency', label: 'Urgency', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'LOW', label: 'Low' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'HIGH', label: 'High' },
              { value: 'EMERGENCY', label: 'Emergency' }
            ]
          },
          { key: 'status', label: 'Status', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]
          },
          { key: 'createdAt', label: 'Created Date', type: 'date', searchable: false, filterable: true }
        ],
        searchFields: ['category', 'description', 'customer.name', 'customer.email'],
        displayFields: ['id', 'category', 'urgency', 'status', 'createdAt', 'customer'],
        include: { 
          customer: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true } }
        }
      },
      bookings: {
        entity: 'bookings',
        table: 'Booking',
        fields: [
          { key: 'status', label: 'Status', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]
          },
          { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', searchable: false, filterable: true },
          { key: 'totalAmount', label: 'Total Amount', type: 'number', searchable: false, filterable: true },
          { key: 'createdAt', label: 'Created Date', type: 'date', searchable: false, filterable: true }
        ],
        searchFields: ['customerId', 'serviceId', 'notes'],
        displayFields: ['id', 'status', 'scheduledDate', 'totalAmount', 'createdAt']
      },
      auditLogs: {
        entity: 'auditLogs',
        table: 'AuditLog',
        fields: [
          { key: 'action', label: 'Action', type: 'text', searchable: true, filterable: true },
          { key: 'entityType', label: 'Entity Type', type: 'text', searchable: true, filterable: true },
          { key: 'severity', label: 'Severity', type: 'select', searchable: false, filterable: true,
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' }
            ]
          },
          { key: 'createdAt', label: 'Created Date', type: 'date', searchable: false, filterable: true }
        ],
        searchFields: ['action', 'entityType', 'admin.name', 'admin.email'],
        displayFields: ['id', 'action', 'entityType', 'severity', 'createdAt', 'admin'],
        include: { admin: { select: { id: true, name: true, email: true } } }
      }
    };
  }

  /**
   * Perform global search across all entities
   */
  async globalSearch(query, options = {}) {
    const {
      entities = Object.keys(this.searchConfigs),
      limit = 10,
      includeMetadata = false
    } = options;

    const results = [];
    const suggestions = new Set();

    for (const entityName of entities) {
      try {
        const entityResults = await this.searchEntity(entityName, query, { 
          limit: Math.ceil(limit / entities.length),
          includeMetadata 
        });
        
        results.push(...entityResults.results);
        entityResults.suggestions.forEach(s => suggestions.add(s));
      } catch (error) {
        console.error(`Error searching ${entityName}:`, error);
      }
    }

    // Sort results by relevance score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      results: results.slice(0, limit),
      suggestions: Array.from(suggestions).slice(0, 10),
      totalCount: results.length,
      facets: this.generateFacets(results),
      pagination: {
        page: 1,
        limit,
        totalPages: Math.ceil(results.length / limit)
      }
    };
  }

  /**
   * Search within a specific entity
   */
  async searchEntity(entityName, query, options = {}) {
    const startTime = Date.now();
    const config = this.searchConfigs[entityName];
    if (!config) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const {
      filters = {},
      sorting = { field: 'createdAt', direction: 'desc' },
      pagination = { page: 1, limit: 50 },
      includeMetadata = false
    } = options;

    // Use optimized search conditions from indexing service
    const { conditions, optimization } = searchIndexService.buildOptimizedSearchConditions(
      entityName, 
      query, 
      filters
    );
    
    // Combine conditions
    const whereClause = {
      AND: [
        conditions.searchConditions,
        conditions.filterConditions
      ].filter(Boolean)
    };

    // Build query options with optimization hints
    const queryOptions = {
      where: whereClause,
      orderBy: conditions.orderBy || { [sorting.field]: sorting.direction },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    };

    if (config.include) {
      queryOptions.include = config.include;
    }

    // Execute search
    const [results, totalCount] = await Promise.all([
      prisma[config.table.toLowerCase()].findMany(queryOptions),
      prisma[config.table.toLowerCase()].count({ where: whereClause })
    ]);

    // Record search statistics for optimization
    const executionTime = Date.now() - startTime;
    searchIndexService.recordSearchStats(entityName, query, results.length, executionTime);

    // Transform results
    const transformedResults = results.map(item => 
      this.transformSearchResult(config, item, query, includeMetadata)
    );

    // Generate suggestions (combine algorithmic and historical)
    const algorithmicSuggestions = await this.generateSuggestions(config, query);
    const historicalSuggestions = searchIndexService.generateHistoricalSuggestions(entityName, query, 3);
    const allSuggestions = [...new Set([...algorithmicSuggestions, ...historicalSuggestions])];

    return {
      results: transformedResults,
      suggestions: allSuggestions.slice(0, 8),
      totalCount,
      facets: this.generateEntityFacets(config, results),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalCount / pagination.limit)
      },
      optimization: {
        executionTime,
        indexHints: conditions.indexHints,
        suggestions: optimization.suggestions
      }
    };
  }

  /**
   * Build search conditions for text search
   */
  buildSearchConditions(config, query) {
    if (!query || !query.trim()) {
      return null;
    }

    const searchTerms = query.trim().split(/\s+/);
    const conditions = [];

    for (const field of config.searchFields) {
      for (const term of searchTerms) {
        if (field.includes('.')) {
          // Handle nested field search
          const [relation, nestedField] = field.split('.');
          conditions.push({
            [relation]: {
              [nestedField]: {
                contains: term,
                mode: 'insensitive'
              }
            }
          });
        } else {
          conditions.push({
            [field]: {
              contains: term,
              mode: 'insensitive'
            }
          });
        }
      }
    }

    return conditions.length > 0 ? { OR: conditions } : null;
  }

  /**
   * Build filter conditions
   */
  buildFilterConditions(config, filters) {
    const conditions = [];

    for (const [key, filterValue] of Object.entries(filters)) {
      if (!filterValue || filterValue.value === undefined) continue;

      const field = config.fields.find(f => f.key === key);
      if (!field) continue;

      const condition = this.buildFieldCondition(key, filterValue, field);
      if (condition) {
        conditions.push(condition);
      }
    }

    return conditions.length > 0 ? { AND: conditions } : null;
  }

  /**
   * Build condition for a specific field
   */
  buildFieldCondition(fieldKey, filterValue, fieldConfig) {
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
   * Transform database result to search result format
   */
  transformSearchResult(config, item, query, includeMetadata) {
    const result = {
      id: item.id,
      type: config.entity,
      title: this.generateResultTitle(config, item),
      subtitle: this.generateResultSubtitle(config, item),
      description: this.generateResultDescription(config, item),
      url: this.generateResultUrl(config, item),
      score: this.calculateRelevanceScore(config, item, query)
    };

    if (includeMetadata) {
      result.metadata = this.extractMetadata(config, item);
    }

    return result;
  }

  /**
   * Generate title for search result
   */
  generateResultTitle(config, item) {
    switch (config.entity) {
      case 'users':
        return item.name || item.email;
      case 'subscriptions':
        return `${item.tier} Subscription - ${item.user?.name || item.user?.email}`;
      case 'serviceRequests':
        return `${item.category} - ${item.customer?.name || 'Unknown Customer'}`;
      case 'bookings':
        return `Booking #${item.id.slice(-8)}`;
      case 'auditLogs':
        return `${item.action} - ${item.entityType}`;
      default:
        return `${config.entity} #${item.id.slice(-8)}`;
    }
  }

  /**
   * Generate subtitle for search result
   */
  generateResultSubtitle(config, item) {
    switch (config.entity) {
      case 'users':
        return `${item.role} • ${item.isActive ? 'Active' : 'Inactive'}`;
      case 'subscriptions':
        return `${item.status} • Created ${new Date(item.createdAt).toLocaleDateString()}`;
      case 'serviceRequests':
        return `${item.urgency} Priority • ${item.status}`;
      case 'bookings':
        return `${item.status} • ${new Date(item.scheduledDate).toLocaleDateString()}`;
      case 'auditLogs':
        return `${item.severity} • ${item.admin?.name || 'Unknown Admin'}`;
      default:
        return null;
    }
  }

  /**
   * Generate description for search result
   */
  generateResultDescription(config, item) {
    switch (config.entity) {
      case 'serviceRequests':
        return item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : '');
      case 'bookings':
        return item.notes?.substring(0, 100) + (item.notes?.length > 100 ? '...' : '');
      default:
        return null;
    }
  }

  /**
   * Generate URL for search result
   */
  generateResultUrl(config, item) {
    const baseUrl = '/admin';
    switch (config.entity) {
      case 'users':
        return `${baseUrl}/users/${item.id}`;
      case 'subscriptions':
        return `${baseUrl}/subscriptions/${item.id}`;
      case 'serviceRequests':
        return `${baseUrl}/service-requests/${item.id}`;
      case 'bookings':
        return `${baseUrl}/bookings/${item.id}`;
      case 'auditLogs':
        return `${baseUrl}/audit-logs?id=${item.id}`;
      default:
        return `${baseUrl}/${config.entity}/${item.id}`;
    }
  }

  /**
   * Calculate relevance score for search result
   */
  calculateRelevanceScore(config, item, query) {
    if (!query) return 0;

    let score = 0;
    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/);

    // Check each searchable field
    for (const fieldPath of config.searchFields) {
      const fieldValue = this.getNestedValue(item, fieldPath);
      if (!fieldValue) continue;

      const fieldValueLower = String(fieldValue).toLowerCase();
      
      // Exact match gets highest score
      if (fieldValueLower === queryLower) {
        score += 100;
      }
      // Starts with query gets high score
      else if (fieldValueLower.startsWith(queryLower)) {
        score += 80;
      }
      // Contains all terms gets medium score
      else if (searchTerms.every(term => fieldValueLower.includes(term))) {
        score += 60;
      }
      // Contains some terms gets lower score
      else {
        const matchingTerms = searchTerms.filter(term => fieldValueLower.includes(term));
        score += (matchingTerms.length / searchTerms.length) * 40;
      }
    }

    return score;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract metadata from item
   */
  extractMetadata(config, item) {
    const metadata = {};
    
    for (const field of config.displayFields) {
      if (field !== 'id') {
        metadata[field] = this.getNestedValue(item, field);
      }
    }

    return metadata;
  }

  /**
   * Generate search suggestions
   */
  async generateSuggestions(config, query) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    
    // Get field-specific suggestions
    for (const field of config.fields) {
      if (field.type === 'select' && field.options) {
        const matchingOptions = field.options.filter(option =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );
        suggestions.push(...matchingOptions.map(option => option.label));
      }
    }

    // Get recent search terms (would be stored in database in real implementation)
    // For now, return static suggestions based on entity type
    const entitySuggestions = this.getEntitySuggestions(config.entity, query);
    suggestions.push(...entitySuggestions);

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Get entity-specific suggestions
   */
  getEntitySuggestions(entityType, query) {
    const suggestions = {
      users: ['active users', 'admin users', 'customer users', 'recent signups'],
      subscriptions: ['active subscriptions', 'cancelled subscriptions', 'priority tier', 'starter tier'],
      serviceRequests: ['pending requests', 'emergency requests', 'completed requests', 'high priority'],
      bookings: ['pending bookings', 'confirmed bookings', 'today bookings', 'this week'],
      auditLogs: ['user actions', 'admin actions', 'critical events', 'recent changes']
    };

    const entitySuggestions = suggestions[entityType] || [];
    return entitySuggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Generate facets for search results
   */
  generateFacets(results) {
    const facets = {};
    
    // Group by entity type
    const typeGroups = results.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {});

    facets.type = Object.entries(typeGroups).map(([value, count]) => ({
      value,
      count
    }));

    return facets;
  }

  /**
   * Generate entity-specific facets
   */
  generateEntityFacets(config, results) {
    const facets = {};

    // Generate facets for filterable fields
    for (const field of config.fields) {
      if (field.filterable && field.type === 'select') {
        const fieldGroups = results.reduce((acc, result) => {
          const value = this.getNestedValue(result, field.key);
          if (value) {
            acc[value] = (acc[value] || 0) + 1;
          }
          return acc;
        }, {});

        facets[field.key] = Object.entries(fieldGroups).map(([value, count]) => ({
          value,
          count
        }));
      }
    }

    return facets;
  }

  /**
   * Get search configuration for entity
   */
  getSearchConfig(entityName) {
    return this.searchConfigs[entityName];
  }

  /**
   * Get all available search configurations
   */
  getAllSearchConfigs() {
    return this.searchConfigs;
  }
}

export default new SearchService();