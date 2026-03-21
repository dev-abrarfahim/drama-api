import express from 'express';
import {
  getHome,
  getDramaInfo,
  getEpisodes,
  getStreamInfo,
  searchDrama,
  getGenre,
  getCountry,
  getDramaList
} from '../controllers/dramaController.js';

const router = express.Router();

router.get('/home', getHome);
router.get('/drama/:id', getDramaInfo);
router.get('/episodes/:id', getEpisodes);
router.get('/stream/:episodeId', getStreamInfo);
router.get('/search', searchDrama);
router.get('/genre/:genre', getGenre);
router.get('/country/:country', getCountry);
router.get('/list', getDramaList);

export default router;
