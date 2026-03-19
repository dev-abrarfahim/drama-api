/**
 * src/extractors/dramaExtractor.js
 * 
 * This file contains the logic to scrape the details page of a specific drama.
 * It extracts the title, synopsis, poster image, genres, and the list of available episodes.
 * 
 * External Modules Used:
 * - axios: Used to make the HTTP GET request to fetch the HTML of the drama page.
 * - cheerio: Used to parse the fetched HTML and extract data using jQuery-like selectors.
 * 
 * Local Modules Used:
 * - constants: Imports the BASE_URL and HEADERS for the request.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS } from '../configs/constants.js';

/**
 * Scrapes the details and episode list for a specific drama.
 * 
 * @param {string} id - The unique identifier of the drama (e.g., 'turbulent-love-2026').
 * @returns {Object} An object containing the drama's title, description, image, genres, and episodes.
 */
export const scrapeDrama = async (id) => {
  try {
    // 1. Construct the full URL for the drama's detail page
    const url = `${BASE_URL}${id}`;
    
    // 2. Fetch the HTML content
    const { data } = await axios.get(url, { headers: HEADERS });
    
    // 3. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // --- Extract Basic Info ---
    // Extract the main title from the <h1> tag
    const title = $('h1').text().trim();
    // Extract the description/synopsis and remove the "Synopsis:" prefix text
    const description = $('.synopsis').text().replace('Synopsis:', '').trim();
    // Extract the poster image URL (checking lazy-loaded 'data-original' first)
    const image = $('.drama-thumbnail img').attr('data-original') || $('.drama-thumbnail img').attr('src');
    
    // --- Extract Genres ---
    const genres = [];
    // Find all links inside elements with the class 'genre' or paragraphs containing "Genre:"
    $('.genre a, p:contains("Genre:") a').each((i, el) => {
      genres.push({
        name: $(el).text().trim(),
        // Extract the genre ID from the URL
        id: $(el).attr('href')?.split('/').pop()
      });
    });

    // --- Extract Episodes ---
    const episodes = [];
    // Find all list items inside the episode list container ('ul.list')
    $('ul.list li').each((i, el) => {
      const a = $(el).find('h3 a');
      const href = a.attr('href');
      
      // If a valid link exists, extract the episode details
      if (href) {
        episodes.push({
          title: a.text().trim(),
          // Extract the episode ID from the URL (e.g., /drama-episode-1.html -> drama-episode-1)
          id: href.split('/').pop()?.replace('.html', ''),
          // Extract the subtitle/episode type (e.g., "SUB" or "DUB")
          episode: $(el).find('.sub').text().trim() || 'EP'
        });
      }
    });

    // Return the structured drama data
    return { title, description, image, genres, episodes };
  } catch (error) {
    throw new Error(`Failed to scrape drama: ${error.message}`);
  }
};
