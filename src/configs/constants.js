/**
 * src/configs/constants.js
 * 
 * This file stores global configuration constants used throughout the application.
 * Centralizing these values makes it easy to update the target website URL or headers
 * in one place if the source website changes its domain or blocks our requests.
 */

// The base URL of the target website we are scraping.
// If the website changes its domain (e.g., to dramacool.city), update it here.
export const BASE_URL = 'https://dramacool9.com.ro/';

// HTTP Headers used for making requests via Axios.
// These headers mimic a real web browser (Chrome) to prevent the target website
// from blocking our scraper (anti-bot protection).
export const HEADERS = {
  // User-Agent tells the server what browser/device is making the request
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Referer tells the server where the request is coming from
  'Referer': BASE_URL,
  // Accept-Language indicates the preferred language for the response
  'Accept-Language': 'en-US,en;q=0.9',
  // Accept indicates the types of content the client can understand
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
};
