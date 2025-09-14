import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FilterState } from '../types/admin';

// Mock Next.js router
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/admin/users',
  query: {},
  isReady: true
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
});

// Helper functions extracted from the hooks for testing
function validateFilterState(state: FilterState): FilterState {
  const validatedState: FilterState = {
    query: '',
    filters: {},
    sorting: { field: 'createdAt', direction: 'desc' },
    pagination: { page: 1, limit: 50 }
  };

  // Validate query
  if (typeof state.query === 'string' && state.query.length <= 1000) {
    validatedState.query = state.query;
  }

  // Validate filters
  if (state.filters && typeof state.filters === 'object') {
    const validatedFilters: Record<string, any> = {};
    
    Object.entries(state.filters).forEach(([key, value]) => {
      if (typeof key === 'string' && key.length <= 100 && value) {
        if (typeof value === 'object' && value.operator && 
            (value.value !== undefined || value.values !== undefined)) {
          validatedFilters[key] = value;
        }
      }
    });
    
    validatedState.filters = validatedFilters;
  }

  // Validate sorting
  if (state.sorting && typeof state.sorting === 'object') {
    if (typeof state.sorting.field === 'string' && state.sorting.field.length <= 100) {
      validatedState.sorting.field = state.sorting.field;
    }
    if (state.sorting.direction === 'asc' || state.sorting.direction === 'desc') {
      validatedState.sorting.direction = state.sorting.direction;
    }
  }

  // Validate pagination
  if (state.pagination && typeof state.pagination === 'object') {
    if (typeof state.pagination.page === 'number' && 
        state.pagination.page > 0 && state.pagination.page <= 10000) {
      validatedState.pagination.page = state.pagination.page;
    }
    if (typeof state.pagination.limit === 'number' && 
        state.pagination.limit > 0 && state.pagination.limit <= 1000) {
      validatedState.pagination.limit = state.pagination.limit;
    }
  }

  return validatedState;
}

function sanitizeFilterState(state: FilterState): FilterState {
  const sanitizedState = { ...state };
  
  // Sanitize query
  sanitizedState.query = sanitizedState.query
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();

  // Sanitize filter values
  Object.keys(sanitizedState.filters).forEach(key => {
    const filter = sanitizedState.filters[key];
    if (typeof filter.value === 'string') {
      filter.value = filter.value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');
    }
    if (Array.isArray(filter.values)) {
      filter.values = filter.values.map(v => 
        typeof v === 'string' 
          ? v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/javascript:/gi, '')
          : v
      );
    }
  });

  return sanitizedState;
}

describe('Filter State Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFilterState', () => {
    it('should validate a valid filter state', () => {
      const validState: FilterState = {
        query: 'test query',
        filters: {
          role: { operator: 'equals', value: 'ADMIN' },
          isActive: { operator: 'equals', value: true }
        },
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: 1, limit: 50 }
      };

      const validated = validateFilterState(validState);
      
      expect(validated.query).toBe('test query');
      expect(validated.filters.role).toEqual({ operator: 'equals', value: 'ADMIN' });
      expect(validated.sorting.field).toBe('createdAt');
      expect(validated.pagination.page).toBe(1);
    });

    it('should reject invalid query length', () => {
      const invalidState: FilterState = {
        query: 'a'.repeat(1001), // Too long
        filters: {},
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: 1, limit: 50 }
      };

      const validated = validateFilterState(invalidState);
      
      expect(validated.query).toBe(''); // Should be reset to empty
    });

    it('should reject invalid pagination values', () => {
      const invalidState: FilterState = {
        query: 'test',
        filters: {},
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: -1, limit: 2000 } // Invalid values
      };

      const validated = validateFilterState(invalidState);
      
      expect(validated.pagination.page).toBe(1); // Should be reset to default
      expect(validated.pagination.limit).toBe(50); // Should be reset to default
    });

    it('should validate sorting direction', () => {
      const invalidState: FilterState = {
        query: 'test',
        filters: {},
        sorting: { field: 'createdAt', direction: 'invalid' as any },
        pagination: { page: 1, limit: 50 }
      };

      const validated = validateFilterState(invalidState);
      
      expect(validated.sorting.direction).toBe('desc'); // Should be reset to default
    });
  });

  describe('sanitizeFilterState', () => {
    it('should remove script tags from query', () => {
      const maliciousState: FilterState = {
        query: 'test<script>alert("xss")</script>query',
        filters: {},
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: 1, limit: 50 }
      };

      const sanitized = sanitizeFilterState(maliciousState);
      
      expect(sanitized.query).toBe('testquery');
    });

    it('should remove javascript: protocols', () => {
      const maliciousState: FilterState = {
        query: 'javascript:alert("xss")',
        filters: {},
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: 1, limit: 50 }
      };

      const sanitized = sanitizeFilterState(maliciousState);
      
      expect(sanitized.query).toBe('alert("xss")');
    });

    it('should sanitize filter values', () => {
      const maliciousState: FilterState = {
        query: 'test',
        filters: {
          name: { 
            operator: 'contains', 
            value: 'test<script>alert("xss")</script>' 
          },
          tags: {
            operator: 'in',
            value: undefined,
            values: ['tag1', 'javascript:alert("xss")', 'tag2']
          }
        },
        sorting: { field: 'createdAt', direction: 'desc' },
        pagination: { page: 1, limit: 50 }
      };

      const sanitized = sanitizeFilterState(maliciousState);
      
      expect(sanitized.filters.name.value).toBe('test');
      expect(sanitized.filters.tags.values).toEqual(['tag1', 'alert("xss")', 'tag2']);
    });
  });
});

// Integration test for URL parameter parsing
describe('URL parameter integration', () => {
  it('should correctly parse complex filter state from URL', () => {
    const complexFilters = {
      role: { operator: 'in', value: undefined, values: ['ADMIN', 'EMPLOYEE'] },
      isActive: { operator: 'equals', value: true },
      createdAt: { operator: 'between', value: undefined, values: ['2023-01-01', '2023-12-31'] }
    };

    const filterState: FilterState = {
      query: 'john doe',
      filters: complexFilters,
      sorting: { field: 'name', direction: 'asc' },
      pagination: { page: 2, limit: 25 }
    };

    // Simulate URL encoding/decoding
    const encodedFilters = encodeURIComponent(JSON.stringify(complexFilters));
    const urlParams = {
      q: 'john doe',
      filters: encodedFilters,
      sort: 'name',
      sortDir: 'asc',
      page: '2',
      limit: '25'
    };

    // Parse back from URL params (simplified version of actual parsing logic)
    const parsedState: FilterState = {
      query: urlParams.q,
      filters: JSON.parse(decodeURIComponent(urlParams.filters)),
      sorting: { 
        field: urlParams.sort, 
        direction: urlParams.sortDir as 'asc' | 'desc' 
      },
      pagination: { 
        page: parseInt(urlParams.page), 
        limit: parseInt(urlParams.limit) 
      }
    };

    expect(parsedState.query).toBe(filterState.query);
    expect(parsedState.filters).toEqual(filterState.filters);
    expect(parsedState.sorting).toEqual(filterState.sorting);
    expect(parsedState.pagination).toEqual(filterState.pagination);
  });

  it('should handle malformed URL parameters gracefully', () => {
    const malformedParams = {
      q: 'test',
      filters: 'invalid-json',
      sort: 'name',
      sortDir: 'invalid-direction',
      page: 'not-a-number',
      limit: '-1'
    };

    // Validation should handle these gracefully

    
    const defaultState: FilterState = {
      query: '',
      filters: {},
      sorting: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit: 50 }
    };

    // Simulate parsing with error handling
    let parsedState: FilterState;
    try {
      parsedState = {
        query: malformedParams.q,
        filters: JSON.parse(malformedParams.filters),
        sorting: { 
          field: malformedParams.sort, 
          direction: malformedParams.sortDir as 'asc' | 'desc' 
        },
        pagination: { 
          page: parseInt(malformedParams.page), 
          limit: parseInt(malformedParams.limit) 
        }
      };
    } catch (error) {
      parsedState = defaultState;
    }

    const validatedState = validateFilterState(parsedState);
    
    // Should fall back to safe defaults for invalid values
    expect(validatedState.query).toBe(''); // Should fall back to default when parsing fails
    expect(validatedState.filters).toEqual({}); // Invalid filters should be empty
    expect(validatedState.sorting.direction).toBe('desc'); // Invalid direction should use default
    expect(validatedState.pagination.page).toBe(1); // Invalid page should use default
    expect(validatedState.pagination.limit).toBe(50); // Invalid limit should use default
  });
});