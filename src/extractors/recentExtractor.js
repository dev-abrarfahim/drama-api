/**
 * src/extractors/recentExtractor.js
 *
 * Scrapes recent episodes for a specific category (drama, movie, kshow) with pagination.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl, extractEpisodeId } from '../configs/constants.js';

/**
 * scrapeRecentCategory(category, page)
 *
 * Fetches recent episodes for a given category.
 * Currently only page=1 is supported because the site does not provide pagination for these categories.
 *
 * @param {string} category  'drama', 'movies', 'kshow'
 * @param {number} [page=1]  Page number (currently only page 1 works)
 * @returns {Object}  { category, page, hasNext, results[] }
 */
export const scrapeRecentCategory = async (category = 'drama', page = 1) => {
  try {
    // Only page 1 is supported for now
    if (page > 1) {
      return {
        category,
        page,
        hasNext: false,
        results: []
      };
    }

    // Fetch the homepage
    const { data } = await axios.get(BASE_URL, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    // Determine which tab index corresponds to category
    const tabIndex = {
      drama: 'left-tab-1',
      movies: 'left-tab-2',
      kshow: 'left-tab-3'
    }[category];

    if (!tabIndex) {
      throw new Error(`Invalid category: ${category}. Must be 'drama', 'movies', or 'kshow'.`);
    }

    const tabContent = $(`.tab-content.${tabIndex}`);
    const results = [];

    // If tab not found (maybe not selected), fallback to first tab
    const targetTab = tabContent.length ? tabContent : $('.tab-content').first();

    targetTab.find('li').each((i, el) => {
      const a = $(el).find('a.img');
      if (!a.length) return;

      const href = a.attr('href') || '';
      results.push({
        title: a.find('h3.title').text().trim() || a.attr('title') || '',
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        episodeId: extractEpisodeId(href),
        type: a.find('.type').text().trim() || 'SUB',
        episode: a.find('.ep').text().trim() || '',
        time: a.find('.time').text().trim() || ''
      });
    });

    // Since we cannot know if there is a next page, set hasNext to false
    const hasNext = false;

    return {
      category,
      page,
      hasNext,
      results
    };

  } catch (error) {
    throw new Error(`Failed to scrape recent ${category}: ${error.message}`);
  }
};