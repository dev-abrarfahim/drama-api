/**
 * src/extractors/streamExtractor.js
 * 
 * This file contains the logic to scrape the video streaming page for a specific episode.
 * It extracts the main video player iframe URL and a list of alternative streaming servers.
 * 
 * External Modules Used:
 * - axios: Used to make the HTTP GET request to fetch the HTML of the streaming page.
 * - cheerio: Used to parse the fetched HTML and extract data using jQuery-like selectors.
 * 
 * Local Modules Used:
 * - constants: Imports the BASE_URL and HEADERS for the request.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS } from '../configs/constants.js';

/**
 * Scrapes the streaming iframe and alternative servers for a specific episode.
 * 
 * @param {string} episodeId - The unique identifier of the episode (e.g., 'drama-name-episode-1').
 * @returns {Object} An object containing the main iframeUrl and an array of alternative servers.
 */
export const scrapeStream = async (episodeId) => {
  try {
    // 1. Construct the full URL for the episode's streaming page
    const url = `${BASE_URL}${episodeId}.html`;
    
    // 2. Fetch the HTML content
    const { data } = await axios.get(url, { headers: HEADERS });
    
    // 3. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // --- Extract Main Video Player ---
    // Find the <iframe> tag and get its 'src' attribute, which contains the video player URL
    const iframeUrl = $('iframe').attr('src');
    
    // If no iframe is found, throw an error because the video cannot be played
    if (!iframeUrl) throw new Error('Iframe URL not found');

    // --- Extract Alternative Servers ---
    const servers = [];
    // Find all buttons with the class 'server-btn' which represent different video hosts
    $('button.server-btn').each((i, el) => {
      servers.push({
        // Extract the server name and remove the play icon (▶) if it exists
        name: $(el).text().replace('▶', '').trim(),
        // Extract the video URL for this specific server from the 'data-src' attribute
        url: $(el).attr('data-src')
      });
    });

    // Return the main iframe URL and the list of alternative servers
    return { iframeUrl, servers };
  } catch (error) {
    throw new Error(`Failed to scrape stream: ${error.message}`);
  }
};
