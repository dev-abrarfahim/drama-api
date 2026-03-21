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

// ---------------------------------------------------------------------------
// GET /api/home
// ---------------------------------------------------------------------------

/**
 * getHome
 *
 * Returns homepage data: recent episodes, popular dramas, genres, and countries.
 * No parameters are required.
 */
export const getHome = async (req, res, next) => {
  try {
    // Call the home scraper and await the result
    const results = await scrapeHome();

    // Send a successful JSON response — HTTP 200 is the default status
    res.json({ success: true, results });
  } catch (error) {
    // Pass the error to the global error handler (see src/utils/errorHandler.js)
    next(error);
  }
};

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
export const getDramaInfo = async (req, res, next) => {
  try {
    // req.params contains the dynamic segments from the URL pattern
    const { id } = req.params;

    // Reject the request early if no ID was provided
    if (!id) return res.status(400).json({ success: false, message: 'Drama ID is required' });

    const results = await scrapeDrama(id);

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

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
export const getEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ success: false, message: 'Drama ID is required' });

    // Reuse the full drama scraper but return only the episodeList array
    const drama = await scrapeDrama(id);

    res.json({ success: true, results: drama.episodeList });
  } catch (error) {
    next(error);
  }
};

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
export const getStreamInfo = async (req, res, next) => {
  try {
    const { episodeId } = req.params;

    if (!episodeId) return res.status(400).json({ success: false, message: 'Episode ID is required' });

    const results = await scrapeStream(episodeId);

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

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
export const searchDrama = async (req, res, next) => {
  try {
    // Query parameters come from req.query (the ?key=value part of the URL)
    const { q, type } = req.query;

    // The search keyword is mandatory — reject if missing
    if (!q) return res.status(400).json({ success: false, message: 'Search query (q) is required' });

    const results = await scrapeSearch(q, type || 'movies');

    // Include the original query and result count in the response for convenience
    res.json({ success: true, query: q, total: results.length, results });
  } catch (error) {
    next(error);
  }
};

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
export const getGenre = async (req, res, next) => {
  try {
    const { genre } = req.params;

    // parseInt converts the string "2" to the number 2; fallback to 1 if missing
    const page = parseInt(req.query.page) || 1;

    if (!genre) return res.status(400).json({ success: false, message: 'Genre is required' });

    const results = await scrapeGenre(genre, page);

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

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
export const getCountry = async (req, res, next) => {
  try {
    const { country } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (!country) return res.status(400).json({ success: false, message: 'Country is required' });

    const results = await scrapeCountry(country, page);

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/list?char=k
// ---------------------------------------------------------------------------

/**
 * getDramaList
 *
 * Returns the full alphabetical drama list, optionally filtered by first letter.
 *
 * Query param:
 *   char — a single letter (a-z), "other" for special characters, or omit for all.
 */
export const getDramaList = async (req, res, next) => {
  try {
    // Default to empty string which means "return all"
    const { char } = req.query;

    const results = await scrapeDramaList(char || '');

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};
