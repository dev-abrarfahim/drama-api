/**
 * src/controllers/dramaController.js
 *
 * Controller functions for every API route in this project.
 *
 * A "controller" is the middleman between the router (which receives the HTTP
 * request) and the extractors (which do the actual scraping).  Its job is to:
 *   1. Read any parameters from the request (URL params, query strings).
 *   2. Validate those parameters.
 *   3. Call the right extractor function.
 *   4. Send the result back to the client as a JSON response.
 *   5. Forward any errors to Express's global error handler via next(error).
 */

// Import every extractor function we need
import { scrapeHome }      from '../extractors/homeExtractor.js';
import { scrapeDrama }     from '../extractors/dramaExtractor.js';
import { scrapeSearch }    from '../extractors/searchExtractor.js';
import { scrapeStream }    from '../extractors/streamExtractor.js';
import { scrapeGenre }     from '../extractors/genreExtractor.js';
import { scrapeCountry }   from '../extractors/countryExtractor.js';
import { scrapeDramaList } from '../extractors/dramaListExtractor.js';
import { scrapeRecentCategory } from '../extractors/recentExtractor.js';
import {
  scrapeRecentlyAdded,
  scrapePopularOngoing,
  scrapeMostPopular
} from '../extractors/listingExtractor.js';

// Import response helpers for consistent API responses
import { sendSuccess, sendError, sendPaginated } from '../utils/responseHelper.js';
// Import cache utilities for performance optimization
import { getCache, setCache, generateCacheKey } from '../utils/cache.js';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 seconds for frequently changing data
  MEDIUM: 60 * 1000,     // 1 minute for moderately changing data
  LONG: 5 * 60 * 1000,   // 5 minutes for stable data
  HOME: 2 * 60 * 1000    // 2 minutes for homepage
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Validate required parameters
 */
const validateRequired = (value, paramName) => {
  if (!value || value.trim() === '') {
    const error = new Error(`${paramName} is required`);
    error.status = 400; // Bad Request
    throw error;
  }
};

/**
 * Get page number from query with validation
 */
const getPageNumber = (query) => {
  const page = parseInt(query.page) || 1;
  if (page < 1) {
    const error = new Error('Page number must be at least 1');
    error.status = 400; // Bad Request
    throw error;
  }
  return page;
};

/**
 * Wrap controller function with caching
 */
const withCache = (ttl = CACHE_TTL.MEDIUM) => {
  return (handler) => async (req, res, next) => {
    try {
      // Generate cache key based on request
      const cacheKey = generateCacheKey(req.originalUrl, req.query);
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cachedData);
      }
      
      // Store original res.json to intercept and cache
      const originalJson = res.json;
      res.json = function(data) {
        setCache(cacheKey, data, ttl);
        return originalJson.call(this, data);
      };
      
      // Call the handler
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// ---------------------------------------------------------------------------
// GET /api/home
// ---------------------------------------------------------------------------

/**
 * getHome
 *
 * Returns homepage data: recent episodes, popular dramas, genres, and countries.
 * No parameters are required.
 */
export const getHome = withCache(CACHE_TTL.HOME)(async (req, res, next) => {
  try {
    const results = await scrapeHome();
    sendSuccess(res, results, 'Homepage data retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/drama/:id
// ---------------------------------------------------------------------------

/**
 * getDramaInfo
 *
 * Returns complete details for a single drama including its full episode list.
 *
 * URL param:
 *   :id — the drama slug, e.g. "our-universe-2026"
 */
export const getDramaInfo = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { id } = req.params;
    validateRequired(id, 'Drama ID');
    
    const drama = await scrapeDrama(id);
    sendSuccess(res, drama, 'Drama details retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/episodes/:id
// ---------------------------------------------------------------------------

/**
 * getEpisodes
 *
 * Returns only the episode list for a drama (a subset of getDramaInfo).
 * Useful when you already have the drama details and only need the episodes.
 *
 * URL param:
 *   :id — the drama slug, e.g. "our-universe-2026"
 */
export const getEpisodes = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { id } = req.params;
    validateRequired(id, 'Drama ID');
    
    const drama = await scrapeDrama(id);
    sendSuccess(res, drama.episodeList, 'Episode list retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/stream/:episodeId
// ---------------------------------------------------------------------------

/**
 * getStreamInfo
 *
 * Returns the streaming embed URL and all available server options for a
 * specific episode, plus rich metadata (episode number, duration, etc.).
 *
 * URL param:
 *   :episodeId — the episode slug, e.g. "our-universe-2026-episode-12"
 */
export const getStreamInfo = withCache(CACHE_TTL.SHORT)(async (req, res, next) => {
  try {
    const { episodeId } = req.params;
    validateRequired(episodeId, 'Episode ID');
    
    const streamInfo = await scrapeStream(episodeId);
    sendSuccess(res, streamInfo, 'Stream information retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/search?q=keyword&type=movies
// ---------------------------------------------------------------------------

/**
 * searchDrama
 *
 * Searches for dramas or actors matching the provided keyword.
 *
 * Query params:
 *   q    — (required) the search keyword, e.g. "love"
 *   type — (optional) "movies" (default) or "stars"
 */
export const searchDrama = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { q, type = 'movies' } = req.query;
    validateRequired(q, 'Search query');
    
    const results = await scrapeSearch(q, type);
    sendSuccess(res, results, 'Search results retrieved successfully', null, 200, {
      query: q,
      type,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/genre/:genre?page=1
// ---------------------------------------------------------------------------

/**
 * getGenre
 *
 * Returns dramas belonging to a specific genre, with optional pagination.
 *
 * URL param:
 *   :genre — genre slug, e.g. "romance", "action", "comedy"
 * Query param:
 *   page   — page number (default: 1)
 */
export const getGenre = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { genre } = req.params;
    validateRequired(genre, 'Genre');
    
    const page = getPageNumber(req.query);
    const results = await scrapeGenre(genre, page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNextPage || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.results || results, pagination, 'Genre results retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/country/:country?page=1
// ---------------------------------------------------------------------------

/**
 * getCountry
 *
 * Returns dramas from a specific country/type, with optional pagination.
 *
 * URL param:
 *   :country — country slug, e.g. "korean-drama", "japanese-movie"
 * Query param:
 *   page     — page number (default: 1)
 */
export const getCountry = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { country } = req.params;
    validateRequired(country, 'Country');
    
    const page = getPageNumber(req.query);
    const results = await scrapeCountry(country, page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNextPage || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.results || results, pagination, 'Country results retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/list?char=k&page=1
// ---------------------------------------------------------------------------

/**
 * getDramaList
 *
 * Returns the full alphabetical drama list, optionally filtered by first letter.
 *
 * Query params:
 *   char — a single letter (a-z), "other" for special characters, or omit for all.
 *   page — page number for pagination (default: 1)
 */
export const getDramaList = withCache(CACHE_TTL.LONG)(async (req, res, next) => {
  try {
    const { char = '' } = req.query;
    const page = getPageNumber(req.query);
    
    const results = await scrapeDramaList(char, page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.results || results, pagination, 'Drama list retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/recent/:category?page=1
// ---------------------------------------------------------------------------

/**
 * getRecentCategory
 *
 * Returns recent episodes for a specific category (drama, movies, kshow).
 *
 * URL param:
 *   :category — category slug, one of "drama", "movies", "kshow"
 * Query param:
 *   page      — page number (default: 1)
 */
export const getRecentCategory = withCache(CACHE_TTL.SHORT)(async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = getPageNumber(req.query);
    
    // Validate category
    const validCategories = ['drama', 'movies', 'kshow'];
    if (!validCategories.includes(category)) {
      return sendError(res, `Invalid category. Must be one of: ${validCategories.join(', ')}`, 400);
    }
    
    const results = await scrapeRecentCategory(category, page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.results || results, pagination, 'Recent episodes retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/recently-added?page=1
// ---------------------------------------------------------------------------

/**
 * getRecentlyAdded
 *
 * Returns recently added dramas with pagination.
 *
 * Query param:
 *   page — page number (default: 1)
 */
export const getRecentlyAdded = withCache(CACHE_TTL.SHORT)(async (req, res, next) => {
  try {
    const page = getPageNumber(req.query);
    const results = await scrapeRecentlyAdded(page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.items || results.results || results, pagination, 'Recently added dramas retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/popular-ongoing-drama?page=1
// ---------------------------------------------------------------------------

/**
 * getPopularOngoingDrama
 *
 * Returns popular ongoing dramas with pagination.
 *
 * Query param:
 *   page — page number (default: 1)
 */
export const getPopularOngoingDrama = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const page = getPageNumber(req.query);
    const results = await scrapePopularOngoing(page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.items || results.results || results, pagination, 'Popular ongoing dramas retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/most-popular?page=1
// ---------------------------------------------------------------------------

/**
 * getMostPopular
 *
 * Returns most popular dramas with pagination.
 *
 * Query param:
 *   page — page number (default: 1)
 */
export const getMostPopular = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const page = getPageNumber(req.query);
    const results = await scrapeMostPopular(page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.items || results.results || results, pagination, 'Most popular dramas retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/section/:name?page=1
// ---------------------------------------------------------------------------

/**
 * getSection
 *
 * Returns data for a specific section by name.
 * Supports: recently-added, popular-ongoing-drama, most-popular
 *
 * URL param:
 *   :name — section name
 * Query param:
 *   page  — page number (default: 1)
 */
export const getSection = withCache(CACHE_TTL.MEDIUM)(async (req, res, next) => {
  try {
    const { name } = req.params;
    const page = getPageNumber(req.query);
    
    // Map section names to extractor functions
    const sectionMap = {
      'recently-added': scrapeRecentlyAdded,
      'popular-ongoing-drama': scrapePopularOngoing,
      'most-popular': scrapeMostPopular
    };
    
    const extractor = sectionMap[name];
    if (!extractor) {
      return sendError(res, `Invalid section name. Must be one of: ${Object.keys(sectionMap).join(', ')}`, 400);
    }
    
    const results = await extractor(page);
    
    // Extract pagination from results if available
    const pagination = results.pagination || {
      current_page: page,
      has_next: results.hasNext || false,
      has_prev: page > 1,
      total_pages: null
    };
    
    sendPaginated(res, results.items || results.results || results, pagination, `${name} section retrieved successfully`);
  } catch (error) {
    next(error);
  }
});
