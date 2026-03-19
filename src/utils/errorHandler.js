/**
 * src/utils/errorHandler.js
 * 
 * This file contains the global error handling middleware for the Express application.
 * Instead of crashing the server when an error occurs, this middleware catches the error,
 * logs it, and sends a structured JSON response back to the client.
 * 
 * Modules Used: None (Standard Express middleware signature)
 */

/**
 * Global error handler middleware.
 * 
 * @param {Error} err - The error object that was thrown.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the stack.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error stack trace to the console for debugging purposes
  console.error(err.stack);

  // Send a JSON response with the error details.
  // Uses the error's status code if provided, otherwise defaults to 500 (Internal Server Error).
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose the full stack trace if the application is running in development mode.
    // This prevents leaking sensitive internal paths/logic in production.
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
