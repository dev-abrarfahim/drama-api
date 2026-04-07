/**
 * src/utils/cache.js
 * 
 * Simple in-memory cache for API responses.
 * Reduces repeated requests to the target website and improves response times.
 */

const cache = new Map();

/**
 * Cache entry structure:
 * {
 *   data: any,
 *   timestamp: number (Date.now()),
 *   ttl: number (time to live in ms)
 * }
 */

/**
 * Get cached data by key
 * 
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
export const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Entry expired
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

/**
 * Set cache data
 * 
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 30 seconds)
 */
export const setCache = (key, data, ttl = 30000) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Clear cache by key or all cache
 * 
 * @param {string|null} key - If provided, clear only this key. If null, clear all cache.
 */
export const clearCache = (key = null) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Generate cache key for API endpoints with parameters
 * 
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
export const generateCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}:${sortedParams}`;
};

/**
 * Cache middleware for Express routes
 * 
 * @param {number} ttl - Cache TTL in milliseconds
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (ttl = 30000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = generateCacheKey(req.originalUrl, req.query);
    const cachedData = getCache(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to cache response
    res.json = function(data) {
      // Cache the response
      setCache(cacheKey, data, ttl);
      
      // Call original method
      return originalJson.call(this, data);
    };
    
    next();
  };
};