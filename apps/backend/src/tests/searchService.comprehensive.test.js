import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchService } from '../services/searchService.js';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  user: {
    findMany: vi.fn()
  },
  subscription: {
    findMany: vi.fn()
  },
  serviceRequest: {
    findMany: vi.fn()
  },
  $queryRaw: vi.fn()
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

describe('SearchService', () => {
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('globalSearch', () => {
    it('should search across multiple entities', async () => {
      const query = 'john';
      
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' }
      ];
      
      const mockSubscriptions = [
        { id: 'sub-1', user: { name: 'John Smith', email: 'john.smith@example.com' } }
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);
      mockPrisma.serviceRequest.findMany.mockResolvedValue([]);

      const result = await searchService.globalSearch(query);

      expect(result).toEqual({
        users: [
          {
            id: 'user-1',
            type: 'user',
            title: 'John Doe',
            subtitle: 'john@example.com',
            metadata: expect.any(Object)
          }
        ],
        subscriptions: [
          {
            id: 'sub-1',
            type: 'subscription',
            title: 'John Smith',
            subtitle: 'john.smith@example.com',
            metadata: expect.any(Object)
          }
        ],
        serviceRequests: []
      });
    });

    it('should handle empty search query', async () => {
      const result = await searchService.globalSearch('');

      expect(result).toEqual({
        users: [],
        subscriptions: [],
        serviceRequests: []
      });
    });

    it('should limit search results', async () => {
      const query = 'test';
      const manyUsers = Array.from({ length: 20 }, (_, i) => ({
        id: `user-${i}`,
        name: `Test User ${i}`,
        email: `test${i}@example.com`
      }));

      mockPrisma.user.findMany.mockResolvedValue(manyUsers);
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      mockPrisma.serviceRequest.findMany.mockResolvedValue([]);

      const result = await searchService.globalSearch(query, { limit: 5 });

      expect(result.users).toHaveLength(5);
    });

    it('should support entity-specific search', async () => {
      const query = 'john';
      const entityTypes = ['users'];

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' }
      ]);

      const result = await searchService.globalSearch(query, { entityTypes });

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.subscription.findMany).not.toHaveBeenCalled();
      expect(result.users).toHaveLength(1);
      expect(result.subscriptions).toHaveLength(0);
    });
  });

  describe('searchUsers', () => {
    it('should search users by name and email', async () => {
      const query = 'john';
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER' }
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await searchService.searchUsers(query);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(mockUsers);
    });

    it('should support advanced user filters', async () => {
      const query = 'john';
      const filters = {
        role: 'CUSTOMER',
        status: 'ACTIVE',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      await searchService.searchUsers(query, filters);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ],
          role: 'CUSTOMER',
          status: 'ACTIVE',
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should handle user search with sorting', async () => {
      const query = 'john';
      const options = {
        sortBy: 'name',
        sortOrder: 'asc'
      };

      await searchService.searchUsers(query, {}, options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' }
        })
      );
    });
  });

  describe('searchSubscriptions', () => {
    it('should search subscriptions by user details', async () => {
      const query = 'premium';
      const mockSubscriptions = [
        {
          id: 'sub-1',
          plan: { name: 'Premium Plan' },
          user: { name: 'John Doe', email: 'john@example.com' }
        }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await searchService.searchSubscriptions(query);

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            { plan: { name: { contains: query, mode: 'insensitive' } } }
          ]
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(mockSubscriptions);
    });

    it('should filter subscriptions by status', async () => {
      const query = 'john';
      const filters = { status: 'ACTIVE' };

      await searchService.searchSubscriptions(query, filters);

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE'
          })
        })
      );
    });
  });

  describe('getSuggestions', () => {
    it('should provide search suggestions', async () => {
      const query = 'joh';
      
      mockPrisma.$queryRaw.mockResolvedValue([
        { suggestion: 'john doe' },
        { suggestion: 'john smith' }
      ]);

      const result = await searchService.getSuggestions(query);

      expect(result).toEqual(['john doe', 'john smith']);
    });

    it('should limit suggestion count', async () => {
      const query = 'test';
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
        suggestion: `test suggestion ${i}`
      }));

      mockPrisma.$queryRaw.mockResolvedValue(manySuggestions);

      const result = await searchService.getSuggestions(query, 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('buildSearchQuery', () => {
    it('should build complex search queries', () => {
      const terms = ['john', 'doe'];
      const fields = ['name', 'email'];

      const result = searchService.buildSearchQuery(terms, fields);

      expect(result).toEqual({
        OR: [
          {
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { name: { contains: 'doe', mode: 'insensitive' } },
              { email: { contains: 'doe', mode: 'insensitive' } }
            ]
          }
        ]
      });
    });

    it('should handle quoted phrases', () => {
      const terms = ['"john doe"'];
      const fields = ['name'];

      const result = searchService.buildSearchQuery(terms, fields);

      expect(result).toEqual({
        OR: [
          {
            OR: [
              { name: { contains: 'john doe', mode: 'insensitive' } }
            ]
          }
        ]
      });
    });
  });

  describe('indexContent', () => {
    it('should index searchable content', async () => {
      const entity = {
        id: 'user-1',
        type: 'user',
        content: {
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Software developer'
        }
      };

      const result = await searchService.indexContent(entity);

      expect(result).toEqual({
        entityId: 'user-1',
        entityType: 'user',
        searchableText: 'john doe john@example.com software developer',
        keywords: ['john', 'doe', 'software', 'developer'],
        indexed: true
      });
    });

    it('should handle content with special characters', async () => {
      const entity = {
        id: 'user-1',
        type: 'user',
        content: {
          name: 'John O\'Connor',
          email: 'john.oconnor@example.com'
        }
      };

      const result = await searchService.indexContent(entity);

      expect(result.searchableText).toContain('john oconnor');
      expect(result.keywords).toContain('oconnor');
    });
  });

  describe('performFullTextSearch', () => {
    it('should perform full-text search with ranking', async () => {
      const query = 'john developer';
      
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'user-1',
          type: 'user',
          rank: 0.8,
          snippet: 'John Doe is a software developer...'
        }
      ]);

      const result = await searchService.performFullTextSearch(query);

      expect(result).toEqual([
        {
          id: 'user-1',
          type: 'user',
          rank: 0.8,
          snippet: 'John Doe is a software developer...'
        }
      ]);
    });
  });

  describe('getSearchAnalytics', () => {
    it('should return search analytics', async () => {
      const mockAnalytics = {
        totalSearches: 1000,
        topQueries: [
          { query: 'john', count: 50 },
          { query: 'premium', count: 30 }
        ],
        averageResultsPerQuery: 5.2,
        noResultQueries: 15
      };

      mockPrisma.$queryRaw.mockResolvedValue([mockAnalytics]);

      const result = await searchService.getSearchAnalytics();

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('saveSearchQuery', () => {
    it('should save search query for analytics', async () => {
      const query = 'john doe';
      const userId = 'admin-1';
      const resultCount = 5;

      mockPrisma.searchQuery = {
        create: vi.fn().mockResolvedValue({
          id: 'search-1',
          query,
          userId,
          resultCount,
          timestamp: new Date()
        })
      };

      const result = await searchService.saveSearchQuery(query, userId, resultCount);

      expect(mockPrisma.searchQuery.create).toHaveBeenCalledWith({
        data: {
          query,
          userId,
          resultCount,
          timestamp: expect.any(Date)
        }
      });

      expect(result.query).toBe(query);
    });
  });
});