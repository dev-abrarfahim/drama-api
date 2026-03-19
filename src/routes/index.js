/**
 * src/routes/index.js
 * 
 * This file defines all the API routes for the application. It maps specific HTTP endpoints
 * (like /home or /search) to their corresponding controller functions.
 * 
 * External Modules Used:
 * - express: Used to create a Router instance.
 * 
 * Local Modules Used:
 * - dramaController: Contains the logic (controller functions) for handling each route.
 */

import express from 'express';
import { 
  getHome, 
  getDramaInfo, 
  getEpisodes, 
  getStreamInfo, 
  searchDrama 
} from '../controllers/dramaController.js';

// Create a new Express Router instance
const router = express.Router();

// Route: GET /api/home
// Purpose: Fetches data for the homepage (spotlight, trending, popular, latest, genres).
router.get('/home', getHome);

// Route: GET /api/drama/:id
// Purpose: Fetches detailed information about a specific drama, including its episode list.
// The ':id' is a dynamic parameter representing the drama's unique identifier.
router.get('/drama/:id', getDramaInfo);

// Route: GET /api/episodes/:id
// Purpose: Fetches only the episode list for a specific drama.
router.get('/episodes/:id', getEpisodes);

// Route: GET /api/stream/:episodeId
// Purpose: Fetches the streaming iframe URL and alternative server links for a specific episode.
router.get('/stream/:episodeId', getStreamInfo);

// Route: GET /api/search?q=keyword
// Purpose: Searches for dramas based on a provided keyword query.
router.get('/search', searchDrama);

// Export the router so it can be mounted in server.js
export default router;
