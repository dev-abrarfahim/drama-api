/**
 * src/routes/index.js
 *
 * Central router for all /api/* endpoints.
 *
 * Express routes map an HTTP method + URL path to a specific controller
 * function that handles the request.  All routes here are mounted under
 * the "/api" prefix in server.js, so:
 *
 *   router.get('/home', ...)  →  accessible at  GET /api/home
 *   router.get('/drama/:id')  →  accessible at  GET /api/drama/some-slug
 */

import express from 'express'; // Import Express so we can create a Router

// Import every controller function we need to wire up
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

// Create a new Express Router instance.
// A Router is like a mini Express app — it can have its own routes and middleware.
const router = express.Router();

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

// GET /api/home
// Returns the homepage data: recent episodes, popular dramas, genres & countries.
router.get('/home', getHome);

// GET /api/drama/:id
// Returns full details for a drama, including its episode list.
// :id is a dynamic URL parameter, e.g. /api/drama/our-universe-2026
router.get('/drama/:id', getDramaInfo);

// GET /api/episodes/:id
// Returns only the episode list for a drama (lighter than /api/drama/:id).
router.get('/episodes/:id', getEpisodes);

// GET /api/stream/:episodeId
// Returns the streaming iframe URL + all server options for a specific episode.
// :episodeId example: our-universe-2026-episode-12
router.get('/stream/:episodeId', getStreamInfo);

// GET /api/search?q=keyword&type=movies
// Searches for dramas or actors matching the keyword.
// query params: q (required), type (optional, default "movies")
router.get('/search', searchDrama);

// GET /api/genre/:genre?page=1
// Lists dramas in a specific genre, e.g. /api/genre/romance
router.get('/genre/:genre', getGenre);

// GET /api/country/:country?page=1
// Lists dramas from a specific country/type, e.g. /api/country/korean-drama
router.get('/country/:country', getCountry);

// GET /api/list?char=k
// Returns the full alphabetical drama list, optionally filtered by first letter.
router.get('/list', getDramaList);

// Export the router so server.js can mount it under the "/api" prefix
export default router;
