import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL, HEADERS, normalizeUrl } from '../configs/constants.js';

export const scrapeStream = async (episodeId) => {
  try {
    const url = `${BASE_URL}${episodeId}.html`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const rawIframe = $('iframe').attr('src');
    const iframeUrl = normalizeUrl(rawIframe);

    if (!iframeUrl) throw new Error('No streaming source found for this episode');

    const servers = [];
    $('li[data-video]').each((i, el) => {
      const serverName = $(el).clone().children().remove().end().text().trim()
        || $(el).find('span:not(.type)').text().trim()
        || `Server ${i + 1}`;
      const videoUrl = normalizeUrl($(el).attr('data-video'));
      const isDefault = $(el).hasClass('selected') || $(el).hasClass('active');
      if (videoUrl) {
        servers.push({
          name: serverName.replace(/choose this server/i, '').trim(),
          url: videoUrl,
          isDefault
        });
      }
    });

    const title = $('h1').first().text().trim();

    const metaImage = $('meta[property="og:image"]').attr('content');
    const metaDesc = $('meta[property="og:description"]').attr('content');

    let episodeInfo = {};
    try {
      $('script[type="application/ld+json"]').each((i, el) => {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type'] === 'TVEpisode') {
          episodeInfo = {
            episodeNumber: json.episodeNumber,
            duration: json.duration,
            datePublished: json.datePublished,
            description: json.description,
            image: json.image
          };
        }
      });
    } catch (_) {}

    return {
      title,
      iframeUrl,
      servers,
      defaultServer: servers.find(s => s.isDefault) || servers[0] || null,
      meta: {
        image: metaImage || episodeInfo.image || null,
        description: metaDesc || episodeInfo.description || null,
        episodeNumber: episodeInfo.episodeNumber || null,
        duration: episodeInfo.duration || null,
        datePublished: episodeInfo.datePublished || null
      }
    };
  } catch (error) {
    throw new Error(`Failed to scrape stream: ${error.message}`);
  }
};
