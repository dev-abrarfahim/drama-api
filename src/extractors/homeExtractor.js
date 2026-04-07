/**
 * src/extractors/homeExtractor.js
 *
 * Scrapes the homepage of asianctv.net and returns organised sections:
 *   - spotlight  : the first 6 recent episodes (used as a hero/banner)
 *   - recent     : all recently-updated episodes shown in the main grid
 *   - popular    : a curated list of popular dramas
 *   - genres     : every available genre category
 *   - countries  : every available country/type (Korean Drama, Japanese Movie, etc.)
 *   - recent_categorized : recent episodes split into drama, movies, kshow
 *   - coming_episodes : upcoming episodes (if available)
 *   - recently_added : recently added dramas
 *   - popular_ongoing_drama : popular ongoing dramas from right sidebar
 *   - ongoing    : ongoing series from /popular-ongoing-series
 */

import * as cheerio from 'cheerio'; // HTML parser — lets us query the DOM like jQuery
import axios from 'axios'; // HTTP client for making requests
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId, extractEpisodeId, fetchWithRetry, safeExtract } from '../configs/constants.js';

/**
 * scrapeHome()
 *
 * Fetches the homepage and extracts five distinct data sections.
 *
 * @returns {Object}  { spotlight, recent, recent_categorized, popular, genres, countries, coming_episodes, recently_added, popular_ongoing_drama, ongoing }
 */
export const scrapeHome = async () => {
  try {
    // Fetch the HTML of the homepage with retry logic
    const { data } = await fetchWithRetry(BASE_URL, { timeout: 15000 });

    // Load the HTML string into Cheerio so we can use CSS selectors on it
    const $ = cheerio.load(data);

    // -----------------------------------------------------------------------
    // 1. Recent Episodes (split by categories)
    // -----------------------------------------------------------------------

    const recentAll = [];
    const recentDrama = [];
    const recentMovies = [];
    const recentKshow = [];

    // Find the tab container
    const tabContainer = $('.block.tab-container');
    if (tabContainer.length) {
      // There are three tabs: left-tab-1 (Drama), left-tab-2 (Movie), left-tab-3 (Kshow)
      ['left-tab-1', 'left-tab-2', 'left-tab-3'].forEach((tabClass, index) => {
        const tabContent = $(`.tab-content.${tabClass}`);
        const items = tabContent.find('li');
        items.each((i, el) => {
          const a = $(el).find('a.img');
          if (!a.length) return;

          const href = a.attr('href') || '';
          const item = {
            title: a.find('h3.title').text().trim() || a.attr('title') || '',
            image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
            episodeId: extractEpisodeId(href),
            type: a.find('.type').text().trim() || 'SUB',
            episode: a.find('.ep').text().trim() || '',
            time: a.find('.time').text().trim() || ''
          };

          recentAll.push(item);
          if (index === 0) recentDrama.push(item);
          else if (index === 1) recentMovies.push(item);
          else if (index === 2) recentKshow.push(item);
        });
      });
    } else {
      // Fallback to original logic (first .block)
      $('.block').first().find('li').each((i, el) => {
        const a = $(el).find('a.img');
        if (!a.length) return;

        const href = a.attr('href') || '';
        const item = {
          title: a.find('h3.title').text().trim() || a.attr('title') || '',
          image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
          episodeId: extractEpisodeId(href),
          type: a.find('.type').text().trim() || 'SUB',
          episode: a.find('.ep').text().trim() || '',
          time: a.find('.time').text().trim() || ''
        };
        recentAll.push(item);
        recentDrama.push(item); // assume all are drama
      });
    }

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
    const spotlight = recentAll.slice(0, 6);

    // -----------------------------------------------------------------------
    // 6. Coming Episodes (from right sidebar)
    // -----------------------------------------------------------------------
    const coming_episodes = scrapeRightSidebarSection($, 'Coming Episode');

    // -----------------------------------------------------------------------
    // 7. Recently Added (from right sidebar or fallback to recent)
    // -----------------------------------------------------------------------
    const recently_added = await scrapeRecentlyAdded($);

    // -----------------------------------------------------------------------
    // 8. Popular Ongoing Drama (from right sidebar)
    // -----------------------------------------------------------------------
    const popular_ongoing_drama = scrapeRightSidebarSection($, 'Popular Ongoing');

    // -----------------------------------------------------------------------
    // 9. Ongoing Series (scrape from /popular-ongoing-series)
    // -----------------------------------------------------------------------
    const ongoing = await scrapeOngoing();

    // -----------------------------------------------------------------------
    // 10. Pagination metadata
    // -----------------------------------------------------------------------
    const pagination = {
      recently_added: {
        current_page: 1,
        total_pages: 0,
        has_next: false
      },
      popular_ongoing_drama: {
        current_page: 1,
        total_pages: 0,
        has_next: false
      }
    };

    // Try to get pagination info for recently added
    try {
      const recentlyAddedPagination = await getPaginationInfo('/recently-added');
      pagination.recently_added = recentlyAddedPagination;
    } catch (err) {
      console.error('Failed to get recently added pagination:', err.message);
    }

    // Try to get pagination info for popular ongoing
    try {
      const popularOngoingPagination = await getPaginationInfo('/popular-ongoing-series');
      pagination.popular_ongoing_drama = popularOngoingPagination;
    } catch (err) {
      console.error('Failed to get popular ongoing pagination:', err.message);
    }

    // Return all sections as a single object
    return {
      spotlight,
      recent: recentAll, // backward compatibility
      recent_categorized: {
        drama: recentDrama,
        movies: recentMovies,
        kshow: recentKshow
      },
      popular,
      genres,
      countries,
      coming_episodes,
      recently_added,
      popular_ongoing_drama,
      ongoing,
      pagination
    };

  } catch (error) {
    // Wrap the error with context so callers know where it came from
    throw new Error(`Failed to scrape home: ${error.message}`);
  }
};

/**
 * Scrape a section from the right sidebar by title
 */
function scrapeRightSidebarSection($, sectionTitle) {
  const items = [];
  
  // Find the h4 with the section title
  const titleElement = $(`h4.content-right-title:contains("${sectionTitle}")`);
  if (!titleElement.length) {
    // Try alternative selectors
    const alternative = $(`*:contains("${sectionTitle}")`).filter((i, el) => {
      return $(el).text().trim() === sectionTitle && $(el).prop('tagName').match(/^H[1-6]$/);
    }).first();
    
    if (!alternative.length) {
      return items; // empty array
    }
  }
  
  const targetElement = titleElement.length ? titleElement : alternative;
  
  // Find the next UL element
  let list = targetElement.next('ul');
  if (!list.length) {
    // Try to find UL in parent or next siblings
    list = targetElement.parent().find('ul').first();
  }
  
  if (list.length) {
    list.find('li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;
      
      const href = a.attr('href') || '';
      const text = a.text().trim();
      
      // Extract image if available (some right sidebar items might have thumbnails)
      const img = a.find('img');
      const image = img.length ? normalizeUrl(img.attr('data-original') || img.attr('src')) : null;
      
      items.push({
        title: text,
        image: image,
        link: href.startsWith('http') ? href : `${BASE_URL.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`,
        // For coming episodes, try to extract episode info from title
        episode: extractEpisodeFromTitle(text),
        type: '', // Right sidebar doesn't show type
        genre: '' // Would need to be populated from drama detail page
      });
    });
  }
  
  return items;
}

/**
 * Extract episode number from title if present
 */
function extractEpisodeFromTitle(title) {
  const episodeMatch = title.match(/EP\s*(\d+)/i) || title.match(/Episode\s*(\d+)/i);
  return episodeMatch ? `EP ${episodeMatch[1]}` : '';
}

/**
 * Scrape recently added items
 * First try right sidebar, then fallback to /recently-added page
 */
async function scrapeRecentlyAdded($) {
  // First try right sidebar
  const rightSidebarItems = scrapeRightSidebarSection($, 'Recently Added');
  if (rightSidebarItems.length > 0) {
    return rightSidebarItems;
  }
  
  // Fallback: scrape first page of /recently-added
  try {
    const url = `${BASE_URL}recently-added`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $recent = cheerio.load(data);
    
    const items = [];
    $recent('.block li').each((i, el) => {
      const a = $recent(el).find('a.img');
      if (!a.length) return;
      
      const href = a.attr('href') || '';
      items.push({
        title: a.find('h3.title').text().trim() || a.attr('title') || '',
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        link: href.startsWith('http') ? href : `${BASE_URL.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`,
        episode: a.find('.ep').text().trim() || '',
        type: a.find('.type').text().trim() || 'SUB',
        genre: '' // Would need to be populated from drama detail
      });
    });
    
    return items.slice(0, 20); // Limit to first 20 items
  } catch (error) {
    console.error('Failed to scrape recently added page:', error.message);
    return [];
  }
}

/**
 * Scrape ongoing series from /popular-ongoing-series
 */
async function scrapeOngoing() {
  try {
    const url = `${BASE_URL}popular-ongoing-series`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const ongoing = [];
    $('.block li').each((i, el) => {
      const a = $(el).find('a.img');
      if (!a.length) return;

      const href = a.attr('href') || '';
      ongoing.push({
        title: a.find('h3.title').text().trim() || a.attr('title') || '',
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        id: extractDramaId(href),
        type: a.find('.type').text().trim(),
        episode: a.find('.ep').text().trim(),
        time: a.find('.time').text().trim()
      });
    });

    return ongoing;
  } catch (error) {
    console.error('Failed to scrape ongoing series:', error.message);
    return [];
  }
}

/**
 * Get pagination info for a listing page
 */
async function getPaginationInfo(path) {
  try {
    const url = `${BASE_URL}${path.replace(/^\//, '')}`;
    const { data } = await fetchWithRetry(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    
    const pagination = {
      current_page: 1,
      total_pages: 1,
      has_next: false,
      has_prev: false,
      next_page: null,
      prev_page: null
    };
    
    // Find pagination element
    const paginationEl = $('.pagination, .page-nav, .pager');
    if (paginationEl.length) {
      // Find current page
      const currentPageLink = paginationEl.find('li.selected a, .current a, .active a');
      if (currentPageLink.length) {
        const pageText = currentPageLink.text().trim();
        const pageNum = parseInt(pageText);
        if (!isNaN(pageNum)) pagination.current_page = pageNum;
      }
      
      // Find all page links to determine total
      const pageLinks = paginationEl.find('a');
      let maxPage = 1;
      pageLinks.each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        
        // Extract page number from href or text
        let pageNum = parseInt(text);
        if (isNaN(pageNum)) {
          const match = href.match(/[?&]page=(\d+)/);
          if (match) pageNum = parseInt(match[1]);
        }
        
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
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
      });
      
      pagination.total_pages = maxPage;
      pagination.has_next = pagination.current_page < maxPage;
      pagination.has_prev = pagination.current_page > 1;
      pagination.next_page = pagination.has_next ? pagination.current_page + 1 : null;
      pagination.prev_page = pagination.has_prev ? pagination.current_page - 1 : null;
    }
    
    return pagination;
  } catch (error) {
    console.error(`Failed to get pagination info for ${path}:`, error.message);
    return {
      current_page: 1,
      total_pages: 0,
      has_next: false,
      has_prev: false,
      next_page: null,
      prev_page: null
    };
  }
}
