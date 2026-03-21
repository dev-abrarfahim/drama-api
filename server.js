/**
 * server.js
 * 
 * This is the main entry point of the application. It sets up the Express server,
 * configures middleware, defines the base routes, and starts listening for incoming requests.
 * 
 * External Modules Used:
 * - express: A fast, unopinionated, minimalist web framework for Node.js. Used to create the server and handle routing.
 * - cors: Middleware to enable Cross-Origin Resource Sharing. Allows frontend applications on different domains to access this API.
 * - dotenv: Loads environment variables from a .env file into process.env.
 * 
 * Local Modules Used:
 * - routes: The main router containing all the API endpoints (from src/routes/index.js).
 * - errorHandler: A custom middleware function to catch and format errors (from src/utils/errorHandler.js).
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';
import errorHandler from './src/utils/errorHandler.js';

// Load environment variables from the .env file (if it exists)
dotenv.config();

// Initialize the Express application
const app = express();

// Define the port the server will run on. Defaults to 5000 for Replit compatibility.
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---

// Enable CORS for all routes so external clients can make requests to this API
app.use(cors());

// Parse incoming JSON payloads in the request body
app.use(express.json());

// --- Route Setup ---

// Mount the API routes under the '/api' prefix. 
// For example, the /home route in routes/index.js will be accessible at /api/home
app.use('/api', routes);

// --- Health Check Route ---

// A simple route to verify that the server is up and running
app.get('/', (req, res) => {
  res.json({ message: 'DramaCool Scraper API is running' });
});

// --- Error Handling ---

// Mount the global error handler. This must be the last middleware added.
// Any errors thrown in the routes will be caught and processed here.
app.use(errorHandler);

// --- Start Server ---

// Start listening for incoming connections on the specified port and host
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
