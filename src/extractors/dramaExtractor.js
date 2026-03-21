import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl, extractEpisodeId } from '../configs/constants.js';

export const scrapeDrama = async (id) => {
  try {
    const url = `${BASE_URL}drama-detail/${id}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const details = $('div.details');
    const title = details.find('h1').first().text().trim() || $('h1').first().text().trim();
    const image = normalizeUrl(details.find('div.img img').attr('src') || details.find('img').first().attr('src'));
    const otherName = details.find('p.other_name a').text().trim();

    let description = '';
    details.find('p').each((i, el) => {
      const prev = $(el).prev('p');
      if (prev.find('span').text().trim() === 'Description:') {
        description = $(el).text().trim();
      }
    });

    const meta = {};
    details.find('p').each((i, el) => {
      const span = $(el).find('span').first();
      const label = span.text().replace(':', '').trim();
      if (label) {
        const value = $(el).text().replace(span.text(), '').trim();
        if (value) meta[label] = value;
      }
    });

    const genres = [];
    const genreText = meta['Genre'] || '';
    genreText.split(';').forEach(g => {
      const name = g.trim();
      if (name) genres.push({ name, id: name.toLowerCase().replace(/\s+/g, '-') });
    });

    const country = details.find('p a[href*="/country/"]').first().text().trim() || meta['Country'] || '';
    const countryId = (details.find('p a[href*="/country/"]').first().attr('href') || '').split('/').pop();

    const episodes = [];
    $('ul.list-episode-item-2 li').each((i, el) => {
      const a = $(el).find('a.img');
      if (!a.length) return;
      const href = a.attr('href') || '';
      const epTitle = a.find('h3.title').text().trim();
      const type = a.find('.type').text().trim() || 'SUB';
      const date = a.find('span:not(.type):not(.title)').last().text().trim();
      episodes.push({
        title: epTitle,
        episodeId: extractEpisodeId(href),
        type,
        date
      });
    });

    return {
      title,
      otherName,
      description,
      image,
      genres,
      country,
      countryId,
      episodes: meta['Episodes'] || String(episodes.length),
      duration: meta['Duration'] || '',
      contentRating: meta['Content Rating'] || '',
      airsOn: meta['Airs On'] || '',
      producer: meta['Producer'] || '',
      director: meta['Director'] || '',
      status: meta['Status'] || '',
      released: meta['Released'] || '',
      episodeList: episodes
    };
  } catch (error) {
    throw new Error(`Failed to scrape drama: ${error.message}`);
  }
};
