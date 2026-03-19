/**
 * src/extractors/searchExtractor.js
 * 
 * This file contains the logic to scrape the search results page.
 * It takes a user's search query, fetches the results from the target website,
 * and extracts the matching dramas.
 * 
 * External Modules Used:
 * - axios: Used to make the HTTP GET request to fetch the HTML of the search page.
 * - cheerio: Used to parse the fetched HTML and extract data using jQuery-like selectors.
 * 
 * Local Modules Used:
 * - constants: Imports the BASE_URL and HEADERS for the request.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS } from '../configs/constants.js';

/**
 * Scrapes the search results for a given keyword.
 * 
 * @param {string} keyword - The search term provided by the user.
 * @returns {Array} An array of drama objects matching the search query.
 */
export const scrapeSearch = async (keyword) => {
  try {
    // 1. Construct the search URL. encodeURIComponent ensures special characters (like spaces) are safely formatted for the URL.
    const url = `${BASE_URL}?s=${encodeURIComponent(keyword)}`;
    
    // 2. Fetch the HTML content of the search results page
    const { data } = await axios.get(url, { headers: HEADERS });
    
    // 3. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const results = [];
    
    // --- Extract Search Results ---
    // The search results are usually contained in the first '.block' element
    $('.block').first().find('li').each((i, el) => {
      const a = $(el).find('a.mask');
      
      // If a valid link exists, extract the drama details
      if (a.length) {
        results.push({
          // Extract title from the <h3> tag or the 'title' attribute
          title: a.find('h3').text().trim() || a.attr('title'),
          // Extract image URL (checking lazy-loaded 'data-original' first)
          image: a.find('img').attr('data-original') || a.find('img').attr('src'),
          // Extract the unique ID from the href URL
          id: a.attr('href')?.split('/').pop()?.replace('.html', ''),
          // Extract the episode number (if it's an episode result)
          episode: $(el).find('.ep').text().trim() || 'N/A'
        });
      }
    });

    // Return the array of search results
    return results;
  } catch (error) {
    throw new Error(`Failed to scrape search: ${error.message}`);
  }
};
