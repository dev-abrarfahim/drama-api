/**
 * src/extractors/countryExtractor.js
 *
 * Scrapes the drama listing page for a specific country/type combination.
 *
 * URL pattern  →  https://asianctv.net/country/<country-slug>
 * Examples:
 *   /country/korean-drama
 *   /country/japanese-drama
 *   /country/korean-movie
 *
 * NOTE on page layout:
 * The country listing page is a plain text list — it does NOT include thumbnail
 * images.  Each list item is structured as:
 *   <li>
 *     <span class="year">2024</span>
 *     <a href="/drama-detail/drama-slug" title="Drama Title">Drama Title</a>
 *   </li>
 * We extract the year from the <span> and the title + id from the <a> tag.
 */

import axios from 'axios';          // Makes HTTP GET requests
import * as cheerio from 'cheerio'; // Parses HTML with jQuery-style selectors
import { BASE_URL, HEADERS, extractDramaId } from '../configs/constants.js'; // Shared helpers

/**
 * scrapeCountry(country, page)
 *
 * Fetches the country listing page and returns all dramas shown on it.
 *
 * @param {string} country  The country slug, e.g. "korean-drama", "japanese-movie".
 * @param {number} [page=1] The page number for paginated results.
 * @returns {Object}  An object containing the country, page number, pagination flag, and results array.
 */
export const scrapeCountry = async (country, page = 1) => {
  try {
    // Build the URL.  Only append ?page=N for pages beyond the first
    // because some sites 404 if you request ?page=1 explicitly.
    const url = `${BASE_URL}country/${encodeURIComponent(country)}${page > 1 ? `?page=${page}` : ''}`;

    // Fetch the HTML of the country listing page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio for querying
    const $ = cheerio.load(data);

    // -----------------------------------------------------------------------
    // Extract drama entries from the list
    // -----------------------------------------------------------------------

    const results = [];

    // The country page renders dramas in the very first ".block" section.
    // We iterate over every <li> inside that block.
    $('.block').first().find('li').each((i, el) => {
      // Find the <a> tag inside this list item — it links to the drama's detail page
      const a = $(el).find('a');

      // Skip items that don't have a link (e.g. blank filler rows)
      if (!a.length) return;

      const href = a.attr('href') || '';

      // Skip any links that don't point to drama detail pages
      // (e.g. genre links, navigation links)
      if (!href.includes('drama-detail')) return;

      // The year is stored in a <span class="year"> sibling element inside the <li>
      // e.g. <span class="year">2024</span>
      const year = $(el).find('span.year').text().trim() || null;

      // The human-readable title is in the "title" attribute of the <a> tag.
      // We fall back to the visible link text if "title" is missing.
      const title = a.attr('title') || a.text().trim();

      // This page type does not include thumbnail images — image is always null here
      const image = null;

      results.push({
        title,              // Drama name, e.g. '"Watashi wo Moratte": Tsuioku Hen'
        image,              // null — no thumbnails on this listing page
        id: extractDramaId(href), // Drama slug for use with /api/drama/:id
        year                // Release year, e.g. "2024"
      });
    });

    // -----------------------------------------------------------------------
    // Pagination detection
    // -----------------------------------------------------------------------

    // Check if there is a "next page" link anywhere on the page
    const hasNextPage = $('a.next, .pagination .next, a[rel="next"]').length > 0;

    // Return the structured result
    return { country, page, hasNextPage, results };

  } catch (error) {
    // Re-throw with a descriptive message for the global error handler
    throw new Error(`Failed to scrape country "${country}": ${error.message}`);
  }
};
