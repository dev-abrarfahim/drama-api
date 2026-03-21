import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId } from '../configs/constants.js';

export const scrapeCountry = async (country, page = 1) => {
  try {
    const url = `${BASE_URL}country/${encodeURIComponent(country)}${page > 1 ? `?page=${page}` : ''}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const results = [];
    $('.block li').each((i, el) => {
      const a = $(el).find('a.img, a');
      if (!a.length) return;
      const href = a.attr('href') || '';
      if (!href.includes('drama-detail') && !href.includes('.html')) return;
      results.push({
        title: a.find('h3.title, h3').text().trim() || a.attr('title') || '',
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        id: extractDramaId(href),
        type: a.find('.type').text().trim() || '',
        year: a.find('.time').text().trim() || ''
      });
    });

    const hasNextPage = $('a.next, .pagination .next, a[rel="next"]').length > 0;

    return { country, page, hasNextPage, results };
  } catch (error) {
    throw new Error(`Failed to scrape country "${country}": ${error.message}`);
  }
};
