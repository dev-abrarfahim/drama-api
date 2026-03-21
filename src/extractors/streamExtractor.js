/**
 * src/extractors/streamExtractor.js
 *
 * Scrapes the video streaming page for a specific episode.
 * Returns the embeddable player URL, a list of all available servers,
 * and rich metadata about the episode (number, duration, publish date, etc.).
 */

import axios from 'axios';          // Makes HTTP GET requests
import * as cheerio from 'cheerio'; // Parses raw HTML like a jQuery-style selector engine
import { BASE_URL, HEADERS, normalizeUrl } from '../configs/constants.js'; // Shared config & helpers

/**
 * scrapeStream(episodeId)
 *
 * Fetches the watch page for a given episode and extracts:
 *   - The primary iframe/embed URL for the video player
 *   - All available streaming server options
 *   - Structured metadata (episode number, duration, date, thumbnail, description)
 *
 * @param {string} episodeId  The episode slug, e.g. "our-universe-2026-episode-12"
 * @returns {Object}  All streaming and metadata info for the episode.
 */
export const scrapeStream = async (episodeId) => {
  try {
    // Build the full URL of the episode watch page
    // e.g. "https://asianctv.net/our-universe-2026-episode-12.html"
    const url = `${BASE_URL}${episodeId}.html`;

    // Fetch the HTML of the episode page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio so we can query it with CSS selectors
    const $ = cheerio.load(data);

    // -----------------------------------------------------------------------
    // 1. Primary Iframe URL
    // -----------------------------------------------------------------------

    // Find the <iframe> tag — its "src" attribute holds the video embed URL.
    // The site sometimes returns protocol-relative URLs like "//vidbasic.top/...",
    // so we pass the raw value through normalizeUrl() to make it a proper https:// URL.
    const rawIframe = $('iframe').attr('src');
    const iframeUrl = normalizeUrl(rawIframe);

    // If there is no iframe at all, the episode is unavailable — throw a clear error
    if (!iframeUrl) throw new Error('No streaming source found for this episode');

    // -----------------------------------------------------------------------
    // 2. Server List  (alternative video hosts)
    // -----------------------------------------------------------------------

    const servers = [];

    // The page lists available servers as <li data-video="..."> elements.
    // Each one stores the embed URL in its "data-video" attribute.
    $('li[data-video]').each((i, el) => {
      // Clone the element and strip all child tags so we are left with
      // only the direct text node — that text is the server's display name.
      const serverName = $(el).clone().children().remove().end().text().trim()
        // Fallback: grab any <span> that isn't the "type" badge
        || $(el).find('span:not(.type)').text().trim()
        // Last resort: generic numbered label
        || `Server ${i + 1}`;

      // Normalise the video URL (protocol-relative → https)
      const videoUrl = normalizeUrl($(el).attr('data-video'));

      // The currently active / default server has the CSS class "selected" or "active"
      const isDefault = $(el).hasClass('selected') || $(el).hasClass('active');

      // Only add this server if it actually has a usable URL
      if (videoUrl) {
        servers.push({
          name: serverName.replace(/choose this server/i, '').trim(), // Clean up the label
          url: videoUrl,      // The embed URL for this server
          isDefault           // True if this is the server the page loads by default
        });
      }
    });

    // -----------------------------------------------------------------------
    // 3. Episode Title
    // -----------------------------------------------------------------------

    // The page title is inside the first <h1> tag
    const title = $('h1').first().text().trim();

    // -----------------------------------------------------------------------
    // 4. Open Graph Meta Tags  (image & description)
    // -----------------------------------------------------------------------

    // OG tags give us a thumbnail image and a human-readable description
    const metaImage = $('meta[property="og:image"]').attr('content') || null;
    const metaDesc  = $('meta[property="og:description"]').attr('content') || null;

    // -----------------------------------------------------------------------
    // 5. Structured Metadata  (JSON-LD)
    // -----------------------------------------------------------------------

    // Many pages embed structured data in a <script type="application/ld+json"> tag.
    // This is a machine-readable block of JSON following the Schema.org vocabulary,
    // and it contains rich info like episodeNumber, duration, and datePublished.
    //
    // IMPORTANT BUG NOTE:
    // The site wraps the JSON-LD object inside an ARRAY: [ { "@type": "TVEpisode", ... } ]
    // If we just do JSON.parse() and check json['@type'], we get undefined because json
    // is an array, not an object.  We must check for this case and unwrap the array.
    let episodeInfo = {};

    try {
      // Loop through every <script type="application/ld+json"> block on the page
      $('script[type="application/ld+json"]').each((i, el) => {
        // Parse the raw text content of the script tag into a JavaScript value
        let json = JSON.parse($(el).html() || 'null');

        // If the site wrapped the data in an array (e.g. [{...}, {...}]),
        // search the array for the first entry whose @type is "TVEpisode"
        if (Array.isArray(json)) {
          json = json.find(item => item && item['@type'] === 'TVEpisode') || null;
        }

        // Now check if this block describes a TV episode
        if (json && json['@type'] === 'TVEpisode') {
          episodeInfo = {
            episodeNumber: json.episodeNumber  || null, // e.g. "8"
            duration:      json.duration       || null, // ISO 8601, e.g. "PT49M"
            datePublished: json.datePublished  || null, // e.g. "2026-03-21T23:39:31+08:00"
            description:   json.description   || null, // Short synopsis
            image:         json.image         || null  // Thumbnail URL
          };
        }
      });
    } catch (_) {
      // If JSON parsing fails for any reason, silently continue.
      // We will still return the iframe URL and server list.
    }

    // -----------------------------------------------------------------------
    // 6. Return the combined result
    // -----------------------------------------------------------------------

    return {
      title,        // Episode page title, e.g. "Duang with You (2026) Episode 8"
      iframeUrl,    // The primary https:// embed URL ready to drop into an <iframe>
      servers,      // All available server options (each has name, url, isDefault)
      defaultServer: servers.find(s => s.isDefault) || servers[0] || null, // Convenience: the default server object
      meta: {
        image:         metaImage              || episodeInfo.image         || null,
        description:   metaDesc              || episodeInfo.description   || null,
        episodeNumber: episodeInfo.episodeNumber                           || null,
        duration:      episodeInfo.duration                                || null,
        datePublished: episodeInfo.datePublished                           || null
      }
    };

  } catch (error) {
    // Re-throw with a descriptive message so the error handler can log it clearly
    throw new Error(`Failed to scrape stream: ${error.message}`);
  }
};
