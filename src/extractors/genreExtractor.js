/**
 * src/extractors/genreExtractor.js
 *
 * Scrapes the drama listing page for a specific genre.
 *
 * URL pattern  →  https://asianctv.net/genre/<genre-slug>
 * Examples:
 *   /genre/romance
 *   /genre/action
 *   /genre/comedy
 *
 * Supports pagination via the optional "page" parameter.
 */

import axios from 'axios';          // HTTP client for fetching the page HTML
import * as cheerio from 'cheerio'; // HTML parser with jQuery-style selectors
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId } from '../configs/constants.js';

/**
 * scrapeGenre(genre, page)
 *
 * Fetches and parses a genre listing page and returns matching dramas.
 *
 * @param {string} genre  The genre slug, e.g. "romance", "action", "comedy".
 * @param {number} [page=1]  The page number for paginated results.
 * @returns {Object}  { genre, page, hasNextPage, results[] }
 */
export const scrapeGenre = async (genre, page = 1) => {
  try {
    // Build the URL — only include ?page=N for pages beyond the first
    const url = `${BASE_URL}genre/${encodeURIComponent(genre)}${page > 1 ? `?page=${page}` : ''}`;

    // Fetch the HTML of the genre listing page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio for querying
    const $ = cheerio.load(data);

    const results = [];

    // Genre result cards are inside <li> elements within ".block" containers.
    // Each card has an <a class="img"> anchor with the thumbnail and title.
    $('.block li').each((i, el) => {
      const a = $(el).find('a.img');

      // Skip rows without a card anchor
      if (!a.length) return;

      const href = a.attr('href') || '';

      results.push({
        // Drama title from the inner <h3 class="title"> or anchor's title attribute
        title: a.find('h3.title').text().trim() || a.attr('title') || '',

        // Lazy-loaded thumbnail URL (converted to https:// if needed)
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),

        // Drama slug for use with /api/drama/:id
        id: extractDramaId(href),

        // Type or rank badge on the card
        type: a.find('.type').text().trim() || '',

        // Release year displayed on the card
        year: a.find('.time').text().trim() || ''
      });
    });

    // -----------------------------------------------------------------------
    // Pagination check
    // -----------------------------------------------------------------------

    // Look for a "next page" link — if it exists we know there are more results
    const hasNextPage = $('a.next, .pagination .next, a[rel="next"]').length > 0;

    return { genre, page, hasNextPage, results };

  } catch (error) {
    throw new Error(`Failed to scrape genre "${genre}": ${error.message}`);
  }
};
