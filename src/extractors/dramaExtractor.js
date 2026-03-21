/**
 * src/extractors/dramaExtractor.js
 *
 * Scrapes the detail page of a specific drama.
 *
 * URL pattern  →  https://asianctv.net/drama-detail/<drama-slug>
 * Example      →  https://asianctv.net/drama-detail/our-universe-2026
 *
 * Returns all available metadata plus the full episode list for that drama.
 */

import axios from 'axios';          // HTTP client for fetching the page
import * as cheerio from 'cheerio'; // HTML parser with jQuery-style selectors
import { BASE_URL, HEADERS, normalizeUrl, extractEpisodeId } from '../configs/constants.js';

/**
 * scrapeDrama(id)
 *
 * Fetches the drama detail page and extracts every piece of metadata
 * plus the complete episode list.
 *
 * @param {string} id  The drama slug, e.g. "our-universe-2026".
 * @returns {Object}   Full drama info and episode list.
 */
export const scrapeDrama = async (id) => {
  try {
    // Build the full URL to the drama's detail page
    const url = `${BASE_URL}drama-detail/${id}`;

    // Fetch the HTML of the drama page
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // The main info block on the page has the CSS class "details".
    // Most of what we need lives inside it.
    const details = $('div.details');

    // -----------------------------------------------------------------------
    // 1. Title
    // -----------------------------------------------------------------------

    // Primary title is inside an <h1> within the details block.
    // We fall back to the page's first <h1> if the details block is missing.
    const title = details.find('h1').first().text().trim() || $('h1').first().text().trim();

    // -----------------------------------------------------------------------
    // 2. Poster Image
    // -----------------------------------------------------------------------

    // The poster image is inside a <div class="img"> → <img src="...">
    const image = normalizeUrl(
      details.find('div.img img').attr('src') ||
      details.find('img').first().attr('src')
    );

    // -----------------------------------------------------------------------
    // 3. Alternative / Native Title
    // -----------------------------------------------------------------------

    // The "other name" paragraph contains the original-language title
    // e.g. "Ujureul Julge , I'll Give You the Universe"
    const otherName = details.find('p.other_name a').text().trim();

    // -----------------------------------------------------------------------
    // 4. Description / Synopsis
    // -----------------------------------------------------------------------

    // On the page the description text sits in a plain <p> that immediately
    // follows a <p><span>Description:</span></p> label paragraph.
    // We loop through all <p> elements and grab the one after the label.
    let description = '';
    details.find('p').each((i, el) => {
      // Look at the previous sibling paragraph
      const prev = $(el).prev('p');

      // If that sibling's <span> says "Description:", this <p> is the synopsis
      if (prev.find('span').text().trim() === 'Description:') {
        description = $(el).text().trim();
      }
    });

    // -----------------------------------------------------------------------
    // 5. Metadata Key-Value Pairs
    // -----------------------------------------------------------------------

    // The remaining metadata (Episodes, Duration, Country, etc.) lives in a
    // series of <p> tags where each one looks like:
    //   <p><span>Label:</span> Value text</p>
    // We iterate and build a plain object from those label → value pairs.
    const meta = {};
    details.find('p').each((i, el) => {
      const span = $(el).find('span').first();    // The label span, e.g. "Episodes:"
      const label = span.text().replace(':', '').trim(); // Strip colon → "Episodes"
      if (label) {
        // Remove the span text from the full paragraph text to get just the value
        const value = $(el).text().replace(span.text(), '').trim();
        if (value) meta[label] = value;
      }
    });

    // -----------------------------------------------------------------------
    // 6. Genres
    // -----------------------------------------------------------------------

    // The "Genre" meta value is a semicolon-separated string, e.g.
    // "Comedy; Drama; Family; Romance"
    const genres = [];
    const genreText = meta['Genre'] || '';
    genreText.split(';').forEach(g => {
      const name = g.trim();
      if (name) {
        genres.push({
          name,
          // Convert name to a URL-safe slug for use with /api/genre/:genre
          id: name.toLowerCase().replace(/\s+/g, '-')
        });
      }
    });

    // -----------------------------------------------------------------------
    // 7. Country
    // -----------------------------------------------------------------------

    // The country is linked, e.g. <a href="/country/korean-drama">Korean</a>
    const countryAnchor = details.find('p a[href*="/country/"]').first();
    const country   = countryAnchor.text().trim() || meta['Country'] || '';
    const countryId = (countryAnchor.attr('href') || '').split('/').pop();

    // -----------------------------------------------------------------------
    // 8. Episode List
    // -----------------------------------------------------------------------

    // Episodes are inside <ul class="list-episode-item-2 all-episode">
    // Each <li> contains an <a class="img"> link with the episode info.
    const episodes = [];
    $('ul.list-episode-item-2 li').each((i, el) => {
      const a = $(el).find('a.img');
      if (!a.length) return; // Skip non-episode rows

      const href = a.attr('href') || '';

      episodes.push({
        // Episode title, e.g. "Our Universe (2026) Episode 12"
        title: a.find('h3.title').text().trim(),

        // Episode slug for use with /api/stream/:episodeId
        episodeId: extractEpisodeId(href),

        // Content type badge — "SUB" (subtitled), "RAW", etc.
        type: a.find('.type').text().trim() || 'SUB',

        // Release date timestamp, e.g. "2026-03-12 23:32:13"
        date: a.find('span:not(.type):not(.title)').last().text().trim()
      });
    });

    // -----------------------------------------------------------------------
    // 9. Return the complete drama object
    // -----------------------------------------------------------------------

    return {
      title,
      otherName,       // Original-language title
      description,     // Synopsis / plot summary
      image,           // Poster image URL
      genres,          // Array of { name, id } genre objects
      country,         // Country name, e.g. "Korean"
      countryId,       // Country slug, e.g. "korean-drama"
      episodes:        meta['Episodes'] || String(episodes.length), // Total episode count
      duration:        meta['Duration'] || '',
      contentRating:   meta['Content Rating'] || '',
      airsOn:          meta['Airs On'] || '',
      producer:        meta['Producer'] || '',
      director:        meta['Director'] || '',
      status:          meta['Status'] || '',
      released:        meta['Released'] || '',
      episodeList:     episodes           // Full array of episode objects
    };

  } catch (error) {
    throw new Error(`Failed to scrape drama: ${error.message}`);
  }
};
