/**
 * src/utils/errorHandler.js
 *
 * Global error-handling middleware for the Express application.
 *
 * In Express, a middleware function with FOUR parameters (err, req, res, next)
 * is treated as an error handler.  When any route calls next(error), Express
 * skips all normal middleware and jumps straight to this function.
 *
 * This prevents the server from crashing on unhandled errors and ensures
 * every error is returned to the client as a consistent, structured JSON object.
 */

/**
 * errorHandler(err, req, res, next)
 *
 * Catches any error that was passed via next(error) from a route or middleware,
 * logs it to the console for debugging, and sends a JSON error response.
 *
 * @param {Error}    err   The error object that was thrown or passed to next().
 * @param {Object}   req   The Express request object (contains URL, headers, body, etc.).
 * @param {Object}   res   The Express response object (used to send the reply).
 * @param {Function} next  The next middleware function — not used here but required
 *                         by Express to recognise this as an error handler.
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error stack trace to the server console.
  // This is essential for developers debugging issues — the stack shows
  // exactly which file and line number caused the error.
  console.error(err.stack);

  // Send a structured JSON response back to the API client.
  // Use the error's status code if it has one (e.g. 404, 403), or default to 500.
  // HTTP 500 means "Internal Server Error" — something went wrong on the server.
  res.status(err.status || 500).json({
    success: false, // Always false for errors — tells the client the request failed

    // Human-readable error message.  If no message was set, use a generic fallback.
    message: err.message || 'Internal Server Error',

    // Only include the full stack trace in development mode.
    // In production we hide it because it can expose internal file paths and logic,
    // which would be a security risk.
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Export the function so it can be imported and used in server.js
export default errorHandler;
