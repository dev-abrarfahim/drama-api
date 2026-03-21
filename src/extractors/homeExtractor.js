/**
 * src/extractors/homeExtractor.js
 *
 * Scrapes the homepage of asianctv.net and returns organised sections:
 *   - spotlight  : the first 6 recent episodes (used as a hero/banner)
 *   - recent     : all recently-updated episodes shown in the main grid
 *   - popular    : a curated list of popular dramas
 *   - genres     : every available genre category
 *   - countries  : every available country/type (Korean Drama, Japanese Movie, etc.)
 */

import axios from 'axios';          // HTTP client — used to fetch the raw HTML
import * as cheerio from 'cheerio'; // HTML parser — lets us query the DOM like jQuery
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId, extractEpisodeId } from '../configs/constants.js';

/**
 * scrapeHome()
 *
 * Fetches the homepage and extracts five distinct data sections.
 *
 * @returns {Object}  { spotlight, recent, popular, genres, countries }
 */
export const scrapeHome = async () => {
  try {
    // Fetch the HTML of the homepage
    const { data } = await axios.get(BASE_URL, { headers: HEADERS, timeout: 15000 });

    // Load the HTML string into Cheerio so we can use CSS selectors on it
    const $ = cheerio.load(data);

    // -----------------------------------------------------------------------
    // 1. Recent Episodes  (Block 0 — the main episode grid)
    // -----------------------------------------------------------------------

    const recent = [];

    // The homepage places the most-recently-updated episodes inside the first ".block"
    // section.  Each episode is represented by one <li> element.
    $('.block').first().find('li').each((i, el) => {
      // Every episode item has an <a class="img"> tag that wraps the card
      const a = $(el).find('a.img');

      // Skip items that don't have this anchor (e.g. ads or empty cells)
      if (!a.length) return;

      // The href points to the episode watch page, e.g. "/show-episode-1.html"
      const href = a.attr('href') || '';

      recent.push({
        // Inner <h3 class="title"> holds the drama name
        title: a.find('h3.title').text().trim() || a.attr('title') || '',

        // Images are lazy-loaded — the real URL is in "data-original", not "src"
        // normalizeUrl converts any protocol-relative URL to https://
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),

        // Convert the href to a clean episode slug (strips leading "/" and ".html")
        episodeId: extractEpisodeId(href),

        // Badge showing content type — usually "SUB" (subtitled) or "RAW"
        type: a.find('.type').text().trim() || 'SUB',

        // Episode label, e.g. "EP 9"
        episode: a.find('.ep').text().trim() || '',

        // Relative timestamp, e.g. "just now" or "12 minutes ago"
        time: a.find('.time').text().trim() || ''
      });
    });

    // -----------------------------------------------------------------------
    // 2. Popular Dramas  (Block 1 — the popular sidebar/section)
    // -----------------------------------------------------------------------

    const popular = [];

    // Block at index 1 on the homepage is the "Popular" list
    $('.block').eq(1).find('li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;

      const href = a.attr('href') || '';

      popular.push({
        // "title" attribute gives a cleaner name than the visible link text
        title: a.attr('title') || a.find('h3').text().trim() || a.text().trim(),

        // May or may not have a thumbnail depending on screen layout
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),

        // Drama slug for use in /api/drama/:id
        id: extractDramaId(href)
      });
    });

    // -----------------------------------------------------------------------
    // 3. Genres  (right-side genre list)
    // -----------------------------------------------------------------------

    const genres = [];

    // All genres are listed inside <ul class="right-genre">
    $('ul.right-genre li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;

      genres.push({
        // Strip " Dramas" suffix from the title attribute, e.g. "Romance Dramas" → "Romance"
        name: a.attr('title')?.replace(' Dramas', '') || a.text().trim(),

        // Last path segment of the href, e.g. "/genre/romance" → "romance"
        id: (a.attr('href') || '').split('/').pop()
      });
    });

    // -----------------------------------------------------------------------
    // 4. Countries  (navigation sub-menu — first sub-nav block = dramas by country)
    // -----------------------------------------------------------------------

    const countries = [];

    // The navigation bar has sub-menus; the first one lists dramas by country
    $('ul.sub-nav').first().find('li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;

      countries.push({
        // Visible link text, e.g. "Korean Drama"
        name: a.text().trim(),

        // Last path segment, e.g. "/country/korean-drama" → "korean-drama"
        id: (a.attr('href') || '').split('/').pop()
      });
    });

    // -----------------------------------------------------------------------
    // 5. Spotlight  (hero section — just the first 6 recent items)
    // -----------------------------------------------------------------------

    // We reuse the recent list rather than a dedicated slider because the site
    // doesn't expose slider data in a parseable format
    const spotlight = recent.slice(0, 6);

    // Return all five sections as a single object
    return { spotlight, recent, popular, genres, countries };

  } catch (error) {
    // Wrap the error with context so callers know where it came from
    throw new Error(`Failed to scrape home: ${error.message}`);
  }
};
