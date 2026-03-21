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
