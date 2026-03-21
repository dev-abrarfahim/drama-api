/**
 * server.js
 *
 * Main entry point of the AsianCTV REST API.
 *
 * This file:
 *   1. Loads environment variables from the .env file (if present).
 *   2. Creates and configures the Express application.
 *   3. Registers global middleware (CORS, JSON body parsing).
 *   4. Mounts the API router under the "/api" prefix.
 *   5. Serves the interactive HTML documentation page at the root "/".
 *   6. Registers the global error handler.
 *   7. Starts listening for incoming HTTP connections.
 */

import express from 'express'; // The web framework — handles routing and middleware
import cors from 'cors';       // Middleware that allows cross-origin requests (from browsers on other domains)
import dotenv from 'dotenv';   // Loads variables from a ".env" file into process.env
import { readFileSync } from 'fs';               // Node built-in — reads a file synchronously
import { fileURLToPath } from 'url';             // Converts an ESM import.meta.url to a file path
import { dirname, join } from 'path';            // Node built-in — safely combines directory and file paths
import routes from './src/routes/index.js';      // All /api/* routes
import errorHandler from './src/utils/errorHandler.js'; // Global error handler

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------

// Read the .env file (if it exists) and add its key=value pairs to process.env.
// This must be called before we use any process.env.* variables.
dotenv.config();

// ---------------------------------------------------------------------------
// App Initialisation
// ---------------------------------------------------------------------------

// Create the Express application instance
const app = express();

// Determine the port to listen on.
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Static UI — read the HTML file once at startup
// ---------------------------------------------------------------------------

// __dirname is not available in ES modules by default.
// We reconstruct it from import.meta.url so we can build reliable file paths.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the interactive API documentation HTML from disk once at startup.
// readFileSync is fine here because it runs only once when the server starts,
// not on every request.  Storing it in a variable is more efficient than
// reading the file on every GET / request.
const uiHtml = readFileSync(join(__dirname, 'src/ui/index.html'), 'utf8');

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Enable CORS — allows browsers on other domains (e.g. your frontend app)
// to make requests to this API without being blocked by the browser's
// Same-Origin Policy.
app.use(cors());

// Parse incoming requests with a JSON body (e.g. POST requests).
// After this middleware, the parsed data is available as req.body.
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Mount all /api/* routes.
// Any request to /api/home, /api/drama/:id, etc. will be handled by the router.
app.use('/api', routes);

// Root route — serve the interactive HTML documentation page
app.get('/', (req, res) => {
  // Tell the browser this response is HTML, not JSON
  res.setHeader('Content-Type', 'text/html');

  // Send the pre-loaded HTML string
  res.send(uiHtml);
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

// This MUST be registered after all routes.
// Any error passed via next(error) in a route will be caught here.
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

// Begin listening for incoming connections.
// '0.0.0.0' means "accept connections from any network interface",
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AsianCTV API running on http://localhost:${PORT}`);
});
