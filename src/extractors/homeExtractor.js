import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl, extractDramaId, extractEpisodeId } from '../configs/constants.js';

export const scrapeHome = async () => {
  try {
    const { data } = await axios.get(BASE_URL, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const recent = [];
    $('.block').first().find('li').each((i, el) => {
      const a = $(el).find('a.img');
      if (!a.length) return;
      const href = a.attr('href') || '';
      recent.push({
        title: a.find('h3.title').text().trim() || a.attr('title') || '',
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        episodeId: extractEpisodeId(href),
        type: a.find('.type').text().trim() || 'SUB',
        episode: a.find('.ep').text().trim() || '',
        time: a.find('.time').text().trim() || ''
      });
    });

    const popular = [];
    $('.block').eq(1).find('li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;
      const href = a.attr('href') || '';
      popular.push({
        title: a.attr('title') || a.find('h3').text().trim() || a.text().trim(),
        image: normalizeUrl(a.find('img').attr('data-original') || a.find('img').attr('src')),
        id: extractDramaId(href)
      });
    });

    const genres = [];
    $('ul.right-genre li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;
      genres.push({
        name: a.attr('title')?.replace(' Dramas', '') || a.text().trim(),
        id: (a.attr('href') || '').split('/').pop()
      });
    });

    const countries = [];
    $('ul.sub-nav').first().find('li').each((i, el) => {
      const a = $(el).find('a');
      if (!a.length) return;
      countries.push({
        name: a.text().trim(),
        id: (a.attr('href') || '').split('/').pop()
      });
    });

    const spotlight = recent.slice(0, 6);

    return { spotlight, recent, popular, genres, countries };
  } catch (error) {
    throw new Error(`Failed to scrape home: ${error.message}`);
  }
};
