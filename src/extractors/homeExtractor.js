/**
 * src/extractors/homeExtractor.js
 * 
 * This file contains the logic to scrape the homepage of the target website.
 * It extracts various categories of dramas such as latest releases, popular, trending, and genres.
 * 
 * External Modules Used:
 * - axios: Used to make the HTTP GET request to fetch the HTML of the homepage.
 * - cheerio: Used to parse the fetched HTML and extract data using jQuery-like selectors.
 * 
 * Local Modules Used:
 * - constants: Imports the BASE_URL and HEADERS for the request.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS } from '../configs/constants.js';

/**
 * Scrapes the homepage and returns categorized lists of dramas.
 * 
 * @returns {Object} An object containing arrays for spotlight, trending, popular, latest, and genres.
 */
export const scrapeHome = async () => {
  try {
    // 1. Fetch the HTML content of the homepage
    const { data } = await axios.get(BASE_URL, { headers: HEADERS });
    
    // 2. Load the HTML into Cheerio for parsing
    const $ = cheerio.load(data);
    
    // --- Extract Latest Releases ---
    const latest = [];
    // Find the first block of items on the page (usually the latest updates)
    $('.block').first().find('li').each((i, el) => {
      const a = $(el).find('a.mask');
      if (a.length) {
        latest.push({
          // Extract title from the <h3> tag or the 'title' attribute
          title: a.find('h3').text().trim() || a.attr('title'),
          // Extract image URL. Try 'data-original' first (for lazy-loaded images), then fallback to 'src'
          image: a.find('img').attr('data-original') || a.find('img').attr('src'),
          // Extract the unique ID from the href URL (e.g., /drama-name.html -> drama-name)
          id: a.attr('href')?.split('/').pop()?.replace('.html', ''),
          // Extract the episode number
          episode: $(el).find('.ep').text().trim() || 'N/A'
        });
      }
    });

    // --- Extract Popular Dramas ---
    const popular = [];
    // Find the block with the class 'list-popular'
    $('.block.list-popular').find('li').each((i, el) => {
      const a = $(el).find('a');
      if (a.length) {
        popular.push({
          title: a.attr('title') || a.text().trim(),
          image: a.find('img').attr('data-original') || a.find('img').attr('src'),
          id: a.attr('href')?.split('/').pop()?.replace('.html', '')
        });
      }
    });

    // --- Extract Trending Dramas ---
    const trending = [];
    // Find the 6th block on the page (index 5) which usually contains trending items
    $('.block').eq(5).find('li').each((i, el) => {
      const a = $(el).find('a');
      if (a.length) {
        trending.push({
          title: a.attr('title') || a.text().trim(),
          image: a.find('img').attr('data-original') || a.find('img').attr('src'),
          id: a.attr('href')?.split('/').pop()?.replace('.html', '')
        });
      }
    });

    // --- Extract Genres ---
    const genres = [];
    // Find the 3rd block on the page (index 2) which usually contains genre links
    $('.block').eq(2).find('li').each((i, el) => {
      const a = $(el).find('a');
      if (a.length) {
        genres.push({
          name: a.attr('title') || a.text().trim(),
          id: a.attr('href')?.split('/').pop()
        });
      }
    });

    // --- Create Spotlight ---
    // Since the site doesn't have a dedicated slider/spotlight, we just take the top 5 latest items
    const spotlight = latest.slice(0, 5);

    // Return all the extracted data as a structured object
    return { spotlight, trending, popular, latest, genres };
  } catch (error) {
    // If anything fails, throw a descriptive error
    throw new Error(`Failed to scrape home: ${error.message}`);
  }
};
