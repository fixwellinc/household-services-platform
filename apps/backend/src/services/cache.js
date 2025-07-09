// Simple in-memory cache implementation
// In production, consider using Redis or Memcached

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for cache entries
  }

  // Set cache entry with optional TTL (in milliseconds)
  set(key, value, ttlMs = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  // Get cache entry
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiry = this.ttl.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Check if key exists
  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      memoryUsage: process.memoryUsage()
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cache middleware for Express routes
export const cacheMiddleware = (ttlMs = 5 * 60 * 1000) => {
  return (req, res, next) => {
    const key = `cache:${req.method}:${req.originalUrl}`;
    
    // Skip cache for non-GET requests or if cache is disabled
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    const cachedResponse = cacheService.get(key);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      cacheService.set(key, data, ttlMs);
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation helpers
export const invalidateCache = (pattern) => {
  const keys = Array.from(cacheService.cache.keys());
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cacheService.delete(key));
  return matchingKeys.length;
};

// Cache keys for different entities
export const cacheKeys = {
  services: 'services',
  service: (id) => `service:${id}`,
  user: (id) => `user:${id}`,
  bookings: (userId) => `bookings:${userId}`,
  booking: (id) => `booking:${id}`,
  quotes: 'quotes',
  quote: (id) => `quote:${id}`,
};

// Scheduled cleanup (run every 10 minutes)
setInterval(() => {
  const cleaned = cacheService.cleanup();
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired entries`);
  }
}, 10 * 60 * 1000);

export default cacheService; 