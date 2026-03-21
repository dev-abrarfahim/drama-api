import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, extractDramaId } from '../configs/constants.js';

export const scrapeDramaList = async (char = '') => {
  try {
    const path = char ? `drama-list/char-start-${char.toLowerCase()}.html` : 'drama-list';
    const url = `${BASE_URL}${path}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const results = [];
    $('.block li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;
      const href = a.attr('href') || '';
      const year = $(el).find('.year').text().trim();
      results.push({
        title: a.attr('title') || a.text().trim(),
        id: extractDramaId(href),
        year
      });
    });

    const chars = [];
    $('ul.char-list li a').each((i, el) => {
      chars.push({
        label: $(el).text().trim(),
        id: ($(el).attr('href') || '').split('char-start-').pop().replace('.html', '')
      });
    });

    return { char: char || 'all', results, chars };
  } catch (error) {
    throw new Error(`Failed to scrape drama list: ${error.message}`);
  }
};
