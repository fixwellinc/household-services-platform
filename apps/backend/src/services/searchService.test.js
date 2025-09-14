import { describe, it, expect, beforeEach, vi } from 'vitest';
import searchService from './searchService.js';

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    subscription: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    serviceRequest: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    booking: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }))
}));

// Mock search index service
vi.mock('./searchIndexService.js', () => ({
  default: {
    buildOptimizedSearchConditions: vi.fn(() => ({
      conditions: {
        searchConditions: null,
        filterConditions: null,
        orderBy: null,
        indexHints: []
      },
      optimization: {
        suggestions: []
      }
    })),
    recordSearchStats: vi.fn(),
    generateHistoricalSuggestions: vi.fn(() => [])
  }
}));

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSearchConfig', () => {
    it('should return search configuration for valid entity', () => {
      const config = searchService.getSearchConfig('users');
      
      expect(config).toBeDefined();
      expect(config.entity).toBe('users');
      expect(config.table).toBe('User');
      expect(config.fields).toBeInstanceOf(Array);
      expect(config.searchFields).toBeInstanceOf(Array);
    });

    it('should return undefined for invalid entity', () => {
      const config = searchService.getSearchConfig('invalid');
      expect(config).toBeUndefined();
    });
  });

  describe('getAllSearchConfigs', () => {
    it('should return all search configurations', () => {
      const configs = searchService.getAllSearchConfigs();
      
      expect(configs).toBeDefined();
      expect(typeof configs).toBe('object');
      expect(configs.users).toBeDefined();
      expect(configs.subscriptions).toBeDefined();
      expect(configs.serviceRequests).toBeDefined();
      expect(configs.bookings).toBeDefined();
      expect(configs.auditLogs).toBeDefined();
    });
  });

  describe('buildSearchConditions', () => {
    it('should return null for empty query', () => {
      const config = searchService.getSearchConfig('users');
      const conditions = searchService.buildSearchConditions(config, '');
      
      expect(conditions).toBeNull();
    });

    it('should build OR conditions for search terms', () => {
      const config = searchService.getSearchConfig('users');
      const conditions = searchService.buildSearchConditions(config, 'john doe');
      
      expect(conditions).toBeDefined();
      expect(conditions.OR).toBeInstanceOf(Array);
      expect(conditions.OR.length).toBeGreaterThan(0);
    });

    it('should handle nested field search', () => {
      const config = searchService.getSearchConfig('subscriptions');
      const conditions = searchService.buildSearchConditions(config, 'test');
      
      expect(conditions).toBeDefined();
      expect(conditions.OR).toBeInstanceOf(Array);
    });
  });

  describe('buildFilterConditions', () => {
    it('should return null for empty filters', () => {
      const config = searchService.getSearchConfig('users');
      const conditions = searchService.buildFilterConditions(config, {});
      
      expect(conditions).toBeNull();
    });

    it('should build AND conditions for filters', () => {
      const config = searchService.getSearchConfig('users');
      const filters = {
        role: { operator: 'equals', value: 'ADMIN' },
        isActive: { operator: 'equals', value: true }
      };
      const conditions = searchService.buildFilterConditions(config, filters);
      
      expect(conditions).toBeDefined();
      expect(conditions.AND).toBeInstanceOf(Array);
      expect(conditions.AND.length).toBe(2);
    });
  });

  describe('buildFieldCondition', () => {
    it('should build equals condition', () => {
      const condition = searchService.buildFieldCondition('role', {
        operator: 'equals',
        value: 'ADMIN'
      });
      
      expect(condition).toEqual({ role: 'ADMIN' });
    });

    it('should build contains condition', () => {
      const condition = searchService.buildFieldCondition('name', {
        operator: 'contains',
        value: 'john'
      });
      
      expect(condition).toEqual({
        name: { contains: 'john', mode: 'insensitive' }
      });
    });

    it('should build between condition', () => {
      const condition = searchService.buildFieldCondition('createdAt', {
        operator: 'between',
        values: ['2023-01-01', '2023-12-31']
      });
      
      expect(condition).toEqual({
        createdAt: { gte: '2023-01-01', lte: '2023-12-31' }
      });
    });

    it('should build in condition', () => {
      const condition = searchService.buildFieldCondition('status', {
        operator: 'in',
        values: ['ACTIVE', 'PENDING']
      });
      
      expect(condition).toEqual({
        status: { in: ['ACTIVE', 'PENDING'] }
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should return 0 for empty query', () => {
      const config = searchService.getSearchConfig('users');
      const item = { name: 'John Doe', email: 'john@example.com' };
      const score = searchService.calculateRelevanceScore(config, item, '');
      
      expect(score).toBe(0);
    });

    it('should give high score for exact match', () => {
      const config = searchService.getSearchConfig('users');
      const item = { name: 'John Doe', email: 'john@example.com' };
      const score = searchService.calculateRelevanceScore(config, item, 'john doe');
      
      expect(score).toBeGreaterThan(0);
    });

    it('should give higher score for exact match than partial match', () => {
      const config = searchService.getSearchConfig('users');
      const item = { name: 'John Doe', email: 'john@example.com' };
      const exactScore = searchService.calculateRelevanceScore(config, item, 'john doe');
      const partialScore = searchService.calculateRelevanceScore(config, item, 'doe');
      
      expect(exactScore).toBeGreaterThan(partialScore);
    });
  });

  describe('generateResultTitle', () => {
    it('should generate title for users', () => {
      const config = searchService.getSearchConfig('users');
      const item = { name: 'John Doe', email: 'john@example.com' };
      const title = searchService.generateResultTitle(config, item);
      
      expect(title).toBe('John Doe');
    });

    it('should fallback to email if no name for users', () => {
      const config = searchService.getSearchConfig('users');
      const item = { email: 'john@example.com' };
      const title = searchService.generateResultTitle(config, item);
      
      expect(title).toBe('john@example.com');
    });

    it('should generate title for subscriptions', () => {
      const config = searchService.getSearchConfig('subscriptions');
      const item = { 
        tier: 'PRIORITY', 
        user: { name: 'John Doe', email: 'john@example.com' }
      };
      const title = searchService.generateResultTitle(config, item);
      
      expect(title).toBe('PRIORITY Subscription - John Doe');
    });
  });

  describe('generateResultUrl', () => {
    it('should generate URL for users', () => {
      const config = searchService.getSearchConfig('users');
      const item = { id: 'user123' };
      const url = searchService.generateResultUrl(config, item);
      
      expect(url).toBe('/admin/users/user123');
    });

    it('should generate URL for subscriptions', () => {
      const config = searchService.getSearchConfig('subscriptions');
      const item = { id: 'sub123' };
      const url = searchService.generateResultUrl(config, item);
      
      expect(url).toBe('/admin/subscriptions/sub123');
    });
  });

  describe('getNestedValue', () => {
    it('should get simple property value', () => {
      const obj = { name: 'John Doe' };
      const value = searchService.getNestedValue(obj, 'name');
      
      expect(value).toBe('John Doe');
    });

    it('should get nested property value', () => {
      const obj = { user: { name: 'John Doe' } };
      const value = searchService.getNestedValue(obj, 'user.name');
      
      expect(value).toBe('John Doe');
    });

    it('should return undefined for non-existent property', () => {
      const obj = { name: 'John Doe' };
      const value = searchService.getNestedValue(obj, 'user.name');
      
      expect(value).toBeUndefined();
    });
  });

  describe('generateFacets', () => {
    it('should generate type facets from results', () => {
      const results = [
        { type: 'users', id: '1' },
        { type: 'users', id: '2' },
        { type: 'subscriptions', id: '3' }
      ];
      const facets = searchService.generateFacets(results);
      
      expect(facets.type).toBeDefined();
      expect(facets.type).toHaveLength(2);
      expect(facets.type.find(f => f.value === 'users').count).toBe(2);
      expect(facets.type.find(f => f.value === 'subscriptions').count).toBe(1);
    });
  });

  describe('getEntitySuggestions', () => {
    it('should return entity-specific suggestions', () => {
      const suggestions = searchService.getEntitySuggestions('users', 'active');
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('active'))).toBe(true);
    });

    it('should filter suggestions by query', () => {
      const allSuggestions = searchService.getEntitySuggestions('users', '');
      const filteredSuggestions = searchService.getEntitySuggestions('users', 'admin');
      
      expect(filteredSuggestions.length).toBeLessThanOrEqual(allSuggestions.length);
    });
  });
});