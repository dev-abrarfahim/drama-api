/**
 * src/configs/constants.js
 *
 * This file holds shared configuration values and small helper functions used
 * throughout the entire project.  Centralising them here means you only need
 * to update one place if, for example, the target website changes its domain.
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

/**
 * BASE_URL — the root address of the website we are scraping.
 *
 * We first check whether the environment variable BASE_URL has been set
 * (e.g., via a .env file or the Replit Secrets panel).  If not, we fall back
 * to the hard-coded default.  This makes the app easy to reconfigure without
 * touching source code.
 */
export const BASE_URL = process.env.BASE_URL || 'https://asianctv.net/';

// ---------------------------------------------------------------------------
// HTTP Headers
// ---------------------------------------------------------------------------

/**
 * HEADERS — the HTTP request headers we send with every Axios request.
 *
 * Websites often block automated requests that look "bot-like".  By mimicking
 * the headers a real Chrome browser would send, we greatly reduce the chance
 * of being blocked.
 *
 * - User-Agent   : tells the server what browser/device is making the request.
 * - Referer      : tells the server which page we "came from" (looks natural).
 * - Accept-Language : the preferred language for the response content.
 * - Accept       : the content types our client can handle.
 */
export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': BASE_URL,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * normalizeUrl(url)
 *
 * Converts any partial/relative URL into a full absolute HTTPS URL.
 *
 * The site sometimes returns URLs in these forms:
 *   "//vidbasic.top/embed/abc"  → protocol-relative (no "https:")
 *   "/template/images/logo.jpg" → root-relative (no domain)
 *   "https://..."               → already absolute, leave as-is
 *
 * @param {string|null|undefined} url  The raw URL string to normalise.
 * @returns {string|null}  A fully-qualified "https://" URL, or null if the
 *                         input was empty / falsy.
 */
export const normalizeUrl = (url) => {
  // Return null immediately for empty, null, or undefined values
  if (!url) return null;

  // Protocol-relative URL — just prepend "https:"
  if (url.startsWith('//')) return `https:${url}`;

  // Root-relative URL — prepend the base domain (strip trailing slash first)
  if (url.startsWith('/')) return `${BASE_URL.replace(/\/$/, '')}${url}`;

  // Already a full URL — return unchanged
  return url;
};

/**
 * extractDramaId(href)
 *
 * Pulls the drama's unique slug out of a full href string.
 *
 * Example inputs  →  output
 *   "/drama-detail/our-universe-2026"  →  "our-universe-2026"
 *   "/drama-detail/show.html"          →  "show"
 *
 * @param {string|null|undefined} href  The href attribute from an <a> tag.
 * @returns {string|null}  The drama slug, or null if href was empty.
 */
export const extractDramaId = (href) => {
  if (!href) return null;

  // Remove the leading "/drama-detail/" prefix
  // then remove a trailing ".html" extension
  // then grab only the last path segment (in case deeper paths exist)
  return href
    .replace(/^\/drama-detail\//, '')
    .replace(/\.html$/, '')
    .split('/')
    .pop();
};

/**
 * extractEpisodeId(href)
 *
 * Pulls the episode's unique slug out of an href string.
 *
 * Example inputs  →  output
 *   "/our-universe-2026-episode-12.html"  →  "our-universe-2026-episode-12"
 *
 * @param {string|null|undefined} href  The href attribute from an <a> tag.
 * @returns {string|null}  The episode slug, or null if href was empty.
 */
export const extractEpisodeId = (href) => {
  if (!href) return null;

  // Remove the leading "/" and the trailing ".html"
  return href
    .replace(/^\//, '')
    .replace(/\.html$/, '');
};

// ---------------------------------------------------------------------------
// Robustness Helper Functions
// ---------------------------------------------------------------------------

import axios from 'axios';

/**
 * fetchWithRetry()
 *
 * Wrapper around axios.get with retry logic and better error handling.
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Axios options
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise} Axios response
 */
export const fetchWithRetry = async (url, options = {}, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        ...options,
        timeout: options.timeout || 15000,
        headers: { ...HEADERS, ...options.headers }
      });
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry on 404 or 403 (permission denied)
      if (error.response) {
        const status = error.response.status;
        if (status === 404 || status === 403 || status === 401) {
          throw error;
        }
      }
      
      // Don't retry on timeout if we're out of attempts
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw lastError;
};

/**
 * safeExtract()
 *
 * Safely extracts data from cheerio element with fallback values.
 *
 * @param {Function} $ - Cheerio function
 * @param {Object} element - Cheerio element
 * @param {string} selector - CSS selector
 * @param {string} attr - Attribute to extract (optional)
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Extracted value or default
 */
export const safeExtract = ($, element, selector, attr = null, defaultValue = '') => {
  const target = selector ? $(element).find(selector).first() : $(element);
  if (!target.length) return defaultValue;
  
  if (attr) {
    return target.attr(attr) || defaultValue;
  }
  return target.text().trim() || defaultValue;
};
