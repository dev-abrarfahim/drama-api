/**
 * src/extractors/dramaListExtractor.js
 *
 * Scrapes the full alphabetical drama list on asianctv.net.
 *
 * URL patterns:
 *   /drama-list                          — all dramas (A-Z)
 *   /drama-list/char-start-k.html        — dramas starting with "K"
 *   /drama-list/char-start-other.html    — dramas starting with a special character (#, ", etc.)
 *
 * The page presents results as a plain text list — no thumbnails are available.
 * Each entry has a title, a link to the drama detail page, and a release year.
 */

import axios from 'axios';          // HTTP client for fetching the page HTML
import * as cheerio from 'cheerio'; // HTML parser with jQuery-style selectors
import { BASE_URL, HEADERS, extractDramaId } from '../configs/constants.js';

/**
 * scrapeDramaList(char)
 *
 * Fetches the alphabetical drama list and returns all entries on that page.
 *
 * @param {string} [char=""]  A single letter (a-z), "other" for special characters,
 *                            or an empty string for the complete list.
 * @returns {Object}  { char, results[], chars[] }
 *                    results = array of drama entries.
 *                    chars   = the full A-Z navigation links for use in further requests.
 */
export const scrapeDramaList = async (char = '') => {
  try {
    // Build the correct URL based on whether a character filter was requested
    const path = char
      ? `drama-list/char-start-${char.toLowerCase()}.html` // e.g. "drama-list/char-start-k.html"
      : 'drama-list'; // Full list — no filter

    const url = `${BASE_URL}${path}`;

    // Fetch the HTML of the list page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const results = [];

    // The list entries are inside <li> elements within ".block" containers.
    // Each entry looks like:
    //   <li><span class="year">2024</span><a href="/drama-detail/..." title="...">Title</a></li>
    $('.block li').each((i, el) => {
      const a = $(el).find('a');

      // Skip rows without an anchor
      if (!a.length) return;

      const href = a.attr('href') || '';

      // Release year is in a <span class="year"> sibling
      const year = $(el).find('span.year').text().trim() || null;

      results.push({
        // Human-readable title from the "title" attribute or the visible link text
        title: a.attr('title') || a.text().trim(),

        // Drama slug for use with /api/drama/:id
        id: extractDramaId(href),

        year // Release year, e.g. "2024"
      });
    });

    // -----------------------------------------------------------------------
    // A-Z Navigation  (for building pagination UI or further requests)
    // -----------------------------------------------------------------------

    // The page header contains a <ul class="char-list"> with links for each letter
    const chars = [];
    $('ul.char-list li a').each((i, el) => {
      chars.push({
        label: $(el).text().trim(), // Display label, e.g. "A", "B", "#"
        // The character ID extracted from the href, e.g. "char-start-a" → "a"
        id: ($(el).attr('href') || '').split('char-start-').pop().replace('.html', '')
      });
    });

    return {
      char: char || 'all', // Which filter is active ("all", "k", "other", etc.)
      results,             // Array of drama entries
      chars                // Full A-Z navigation data
    };

  } catch (error) {
    throw new Error(`Failed to scrape drama list: ${error.message}`);
  }
};
