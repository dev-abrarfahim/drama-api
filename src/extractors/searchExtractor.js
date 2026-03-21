/**
 * src/extractors/searchExtractor.js
 *
 * Scrapes the search results page on asianctv.net.
 *
 * URL pattern  →  https://asianctv.net/search?type=movies&keyword=<query>
 *
 * The "type" query parameter controls what kind of results are returned:
 *   "movies"  — drama/movie titles  (default)
 *   "stars"   — actor/actress names
 */

import axios from 'axios';          // HTTP client for fetching the page HTML
import * as cheerio from 'cheerio'; // HTML parser with CSS-selector querying
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId } from '../configs/constants.js';

/**
 * scrapeSearch(keyword, type)
 *
 * Fetches and parses the search results page for a given keyword.
 *
 * @param {string} keyword  The user's search term, e.g. "love".
 * @param {string} [type="movies"]  Result type: "movies" or "stars".
 * @returns {Array}  Array of matching drama/actor objects.
 */
export const scrapeSearch = async (keyword, type = 'movies') => {
  try {
    // Build the search URL.
    // encodeURIComponent turns spaces and special characters into safe URL sequences
    // e.g. "my love" → "my%20love"
    const url = `${BASE_URL}search?type=${encodeURIComponent(type)}&keyword=${encodeURIComponent(keyword)}`;

    // Fetch the HTML of the search results page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const results = [];

    // Search results appear as <li> items inside ".block" containers.
    // Each result card has an <a class="img"> anchor wrapping the thumbnail and title.
    $('.block li').each((i, el) => {
      const a = $(el).find('a.img');

      // Skip rows that don't have the card anchor (e.g. filler or heading rows)
      if (!a.length) return;

      const href = a.attr('href') || '';

      results.push({
        // Inner <h3 class="title"> or the anchor's "title" attribute
        title: a.find('h3.title').text().trim() || a.attr('title') || '',

        // Lazy-loaded thumbnail — real URL is in "data-original"
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),

        // Drama slug extracted from the href, e.g. "love-you-teacher-2026"
        id: extractDramaId(href),

        // Type/rank badge shown on the card (may be a number for search rank)
        type: a.find('.type').text().trim() || '',

        // Release year or timestamp shown on the card
        year: a.find('.time').text().trim() || ''
      });
    });

    // Return the array of results (empty array if nothing found)
    return results;

  } catch (error) {
    throw new Error(`Failed to scrape search: ${error.message}`);
  }
};
