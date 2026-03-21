import { scrapeHome } from '../extractors/homeExtractor.js';
import { scrapeDrama } from '../extractors/dramaExtractor.js';
import { scrapeSearch } from '../extractors/searchExtractor.js';
import { scrapeStream } from '../extractors/streamExtractor.js';
import { scrapeGenre } from '../extractors/genreExtractor.js';
import { scrapeCountry } from '../extractors/countryExtractor.js';
import { scrapeDramaList } from '../extractors/dramaListExtractor.js';

export const getHome = async (req, res, next) => {
  try {
    const results = await scrapeHome();
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const getDramaInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Drama ID is required' });
    const results = await scrapeDrama(id);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const getEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Drama ID is required' });
    const drama = await scrapeDrama(id);
    res.json({ success: true, results: drama.episodeList });
  } catch (error) {
    next(error);
  }
};

export const getStreamInfo = async (req, res, next) => {
  try {
    const { episodeId } = req.params;
    if (!episodeId) return res.status(400).json({ success: false, message: 'Episode ID is required' });
    const results = await scrapeStream(episodeId);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const searchDrama = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query (q) is required' });
    const results = await scrapeSearch(q, type || 'movies');
    res.json({ success: true, query: q, total: results.length, results });
  } catch (error) {
    next(error);
  }
};

export const getGenre = async (req, res, next) => {
  try {
    const { genre } = req.params;
    const page = parseInt(req.query.page) || 1;
    if (!genre) return res.status(400).json({ success: false, message: 'Genre is required' });
    const results = await scrapeGenre(genre, page);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const getCountry = async (req, res, next) => {
  try {
    const { country } = req.params;
    const page = parseInt(req.query.page) || 1;
    if (!country) return res.status(400).json({ success: false, message: 'Country is required' });
    const results = await scrapeCountry(country, page);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const getDramaList = async (req, res, next) => {
  try {
    const { char } = req.query;
    const results = await scrapeDramaList(char || '');
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};
