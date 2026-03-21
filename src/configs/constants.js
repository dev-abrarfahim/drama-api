export const BASE_URL = process.env.BASE_URL || 'https://asianctv.net/';

export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': BASE_URL,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
};

export const normalizeUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${BASE_URL.replace(/\/$/, '')}${url}`;
  return url;
};

export const extractDramaId = (href) => {
  if (!href) return null;
  return href.replace(/^\/drama-detail\//, '').replace(/\.html$/, '').split('/').pop();
};

export const extractEpisodeId = (href) => {
  if (!href) return null;
  return href.replace(/^\//, '').replace(/\.html$/, '');
};
