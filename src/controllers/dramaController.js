/**
 * src/controllers/dramaController.js
 * 
 * This file contains the controller functions for the API routes. Controllers act as the 
 * "middlemen" between the incoming HTTP requests (routes) and the data extraction logic (extractors).
 * They handle extracting parameters from the request, calling the appropriate scraper, 
 * and sending the formatted JSON response back to the client.
 * 
 * Local Modules Used:
 * - homeExtractor: Scrapes homepage data.
 * - dramaExtractor: Scrapes drama details and episodes.
 * - searchExtractor: Scrapes search results.
 * - streamExtractor: Scrapes video streaming links.
 */

import { scrapeHome } from '../extractors/homeExtractor.js';
import { scrapeDrama } from '../extractors/dramaExtractor.js';
import { scrapeSearch } from '../extractors/searchExtractor.js';
import { scrapeStream } from '../extractors/streamExtractor.js';

/**
 * Controller for GET /api/home
 * Fetches and returns the homepage data.
 */
export const getHome = async (req, res, next) => {
  try {
    // Call the extractor to scrape the homepage
    const results = await scrapeHome();
    // Send a successful JSON response with the scraped data
    res.json({ success: true, results });
  } catch (error) {
    // If an error occurs, pass it to the global error handler middleware
    next(error);
  }
};

/**
 * Controller for GET /api/drama/:id
 * Fetches and returns detailed information about a specific drama.
 */
export const getDramaInfo = async (req, res, next) => {
  try {
    // Extract the drama ID from the URL parameters (e.g., /api/drama/my-drama-id)
    const { id } = req.params;
    // Call the extractor to scrape the drama details
    const results = await scrapeDrama(id);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for GET /api/episodes/:id
 * Fetches and returns only the episodes for a specific drama.
 */
export const getEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Scrape the drama details, but only return the 'episodes' array from the result
    const results = await scrapeDrama(id);
    res.json({ success: true, results: results.episodes });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for GET /api/stream/:episodeId
 * Fetches and returns the streaming iframe and server links for a specific episode.
 */
export const getStreamInfo = async (req, res, next) => {
  try {
    // Extract the episode ID from the URL parameters
    const { episodeId } = req.params;
    // Call the extractor to scrape the streaming page
    const results = await scrapeStream(episodeId);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for GET /api/search?q=keyword
 * Searches for dramas based on a keyword.
 */
export const searchDrama = async (req, res, next) => {
  try {
    // Extract the search keyword 'q' from the query string (e.g., /api/search?q=love)
    const { q } = req.query;
    
    // Validate that a search query was actually provided
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Call the extractor to scrape the search results page
    const results = await scrapeSearch(q);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};
