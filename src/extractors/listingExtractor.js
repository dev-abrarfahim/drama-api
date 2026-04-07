/**
 * src/extractors/listingExtractor.js
 *
 * Extracts paginated data for listing pages like:
 * - /recently-added
 * - /popular-ongoing-series
 * - /most-popular-drama
 */

import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId, extractEpisodeId, fetchWithRetry, safeExtract } from '../configs/constants.js';

/**
 * Scrape a paginated listing page
 * 
 * @param {string} path - The path without leading slash, e.g. 'recently-added'
 * @param {number} page - Page number (default: 1)
 * @returns {Object} { items, pagination }
 */
export const scrapeListing = async (path, page = 1) => {
  try {
    // Build URL with page parameter
    let url = `${BASE_URL}${path}`;
    if (page > 1) {
      // Check if path already has query params
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}page=${page}`;
    }

    const { data } = await fetchWithRetry(url, { timeout: 15000 });
    const $ = cheerio.load(data);

    // Extract items
    const items = [];
    
    // Different listing pages might have different structures
    // Try common selectors
    const selectors = [
      '.block li',
      '.list-episode-item li',
      '.movie-list li',
      '.drama-list li',
      'li'
    ];
    
    let itemsFound = false;
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 10) { // Likely the correct selector
        elements.each((i, el) => {
          const a = $(el).find('a.img');
          if (!a.length) return;
          
          const href = a.attr('href') || '';
          const isEpisode = href.includes('-episode-');
          
          const item = {
            title: a.find('h3.title').text().trim() || a.attr('title') || '',
            image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
            link: href.startsWith('http') ? href : `${BASE_URL.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`,
            episode: a.find('.ep').text().trim() || '',
            type: a.find('.type').text().trim() || 'SUB',
            time: a.find('.time').text().trim() || ''
          };
          
          // Add ID based on whether it's a drama or episode
          if (isEpisode) {
            item.episodeId = extractEpisodeId(href);
          } else {
            item.id = extractDramaId(href);
          }
          
          items.push(item);
        });
        
        itemsFound = true;
        break;
      }
    }
    
    // If no items found with common selectors, try a different approach
    if (!itemsFound) {
      console.warn(`No items found for ${path} with common selectors, trying alternative approach`);
      
      // Look for any anchor with title and image
      $('a').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const title = $el.attr('title') || $el.find('h3').text().trim();
        const img = $el.find('img');
        
        if (title && href && (href.includes('/drama-detail/') || href.includes('-episode-'))) {
          items.push({
            title: title,
            image: normalizeUrl(img.attr('data-original') || img.attr('src')),
            link: href.startsWith('http') ? href : `${BASE_URL.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`,
            episode: '',
            type: '',
            time: ''
          });
        }
      });
    }

    // Extract pagination info
    const pagination = extractPaginationInfo($, page);

    return {
      items,
      pagination,
      path,
      page
    };
  } catch (error) {
    console.error(`Failed to scrape listing ${path}:`, error.message);
    throw new Error(`Failed to scrape ${path}: ${error.message}`);
  }
};

/**
 * Extract pagination information from the page
 */
function extractPaginationInfo($, currentPage = 1) {
  const pagination = {
    current_page: currentPage,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    next_page: null,
    prev_page: null,
    pages: []
  };
  
  // Find pagination element
  const paginationEl = $('.pagination, .page-nav, .pager');
  if (!paginationEl.length) {
    return pagination;
  }
  
  // Find current page
  const currentPageEl = paginationEl.find('li.selected, .current, .active');
  if (currentPageEl.length) {
    const pageText = currentPageEl.find('a').text().trim() || currentPageEl.text().trim();
    const pageNum = parseInt(pageText);
    if (!isNaN(pageNum)) {
      pagination.current_page = pageNum;
    }
  }
  
  // Find all page links
  const pageLinks = paginationEl.find('a');
  let maxPage = 1;
  const pages = [];
  
  pageLinks.each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const text = $el.text().trim();
    
    // Extract page number
    let pageNum = parseInt(text);
    if (isNaN(pageNum)) {
      // Try to extract from href
      const match = href.match(/[?&]page=(\d+)/);
      if (match) {
        pageNum = parseInt(match[1]);
      } else if (href.match(/\/page-\d+/)) {
        const pageMatch = href.match(/\/page-(\d+)/);
        if (pageMatch) pageNum = parseInt(pageMatch[1]);
      }
    }
    
    if (!isNaN(pageNum)) {
      pages.push({
        number: pageNum,
        text: text,
        url: href
      });
      
      if (pageNum > maxPage) {
        maxPage = pageNum;
      }
    }
    
    // Check for "Last >>" link
    if (text.includes('Last') || text.includes('>>')) {
      const lastMatch = href.match(/[?&]page=(\d+)/);
      if (lastMatch) {
        const lastPage = parseInt(lastMatch[1]);
        if (!isNaN(lastPage) && lastPage > maxPage) {
          maxPage = lastPage;
        }
      }
    }
    
    // Check for "Next >" link
    if (text.includes('Next') || text.includes('>') && !text.includes('>>')) {
      const nextMatch = href.match(/[?&]page=(\d+)/);
      if (nextMatch) {
        pagination.next_page = parseInt(nextMatch[1]);
      }
    }
    
    // Check for "Prev <" link
    if (text.includes('Prev') || text.includes('<') && !text.includes('<<')) {
      const prevMatch = href.match(/[?&]page=(\d+)/);
      if (prevMatch) {
        pagination.prev_page = parseInt(prevMatch[1]);
      }
    }
  });
  
  pagination.total_pages = maxPage;
  pagination.has_next = pagination.current_page < maxPage;
  pagination.has_prev = pagination.current_page > 1;
  pagination.pages = pages;
  
  // Set next/prev if not already set
  if (!pagination.next_page && pagination.has_next) {
    pagination.next_page = pagination.current_page + 1;
  }
  if (!pagination.prev_page && pagination.has_prev) {
    pagination.prev_page = pagination.current_page - 1;
  }
  
  return pagination;
}

/**
 * Scrape recently added with pagination
 */
export const scrapeRecentlyAdded = async (page = 1) => {
  return scrapeListing('recently-added', page);
};

/**
 * Scrape popular ongoing series with pagination
 */
export const scrapePopularOngoing = async (page = 1) => {
  return scrapeListing('popular-ongoing-series', page);
};

/**
 * Scrape coming episodes (if the page exists)
 */
export const scrapeComingEpisodes = async (page = 1) => {
  try {
    return await scrapeListing('coming-episodes', page);
  } catch (error) {
    // If page doesn't exist, return empty
    console.warn('Coming episodes page not found, returning empty');
    return {
      items: [],
      pagination: {
        current_page: 1,
        total_pages: 0,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null,
        pages: []
      },
      path: 'coming-episodes',
      page: 1
    };
  }
};

/**
 * Scrape most popular dramas
 */
export const scrapeMostPopular = async (page = 1) => {
  return scrapeListing('most-popular-drama', page);
};