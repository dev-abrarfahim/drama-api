/**
 * src/utils/responseHelper.js
 * 
 * Helper functions for sending consistent API responses.
 * Ensures all endpoints follow the same response format.
 */

/**
 * Send a successful response with data
 *
 * @param {Object} res - Express response object
 * @param {any} data - The data to send
 * @param {string} message - Optional success message
 * @param {Object} pagination - Optional pagination metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} metadata - Optional additional metadata
 */
export const sendSuccess = (res, data, message = 'Success', pagination = null, statusCode = 200, metadata = null) => {
  const response = {
    success: true,
    message,
    statusCode,
    data
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  if (metadata) {
    response.metadata = metadata;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Send an error response
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {any} error - Optional error object for debugging
 */
export const sendError = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    statusCode,
    error: error?.message || null
  };
  
  // Log error for server-side debugging
  if (error) {
    console.error(`API Error (${statusCode}):`, error);
  }
  
  res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * 
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Optional message
 * @param {Object} metadata - Optional additional metadata
 */
export const sendPaginated = (res, items, pagination, message = 'Success', metadata = null) => {
  sendSuccess(res, items, message, pagination, 200, metadata);
};