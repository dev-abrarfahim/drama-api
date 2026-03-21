# AsianCTV REST API

A lightweight scraper REST API for Asian dramas, movies & shows powered by [asianctv.net](https://asianctv.net/).

## Stack
- **Runtime**: Node.js 20 (ES modules)
- **Framework**: Express 4
- **Scraping**: Axios + Cheerio
- **Port**: 5000

## Project Structure
```
server.js                        # Entry point, serves UI at /
src/
  configs/constants.js           # BASE_URL, HEADERS, URL helpers
  routes/index.js                # All API routes
  controllers/dramaController.js # Route handlers
  extractors/
    homeExtractor.js             # Homepage scraper
    dramaExtractor.js            # Drama detail page scraper
    searchExtractor.js           # Search results scraper
    streamExtractor.js           # Episode stream scraper
    genreExtractor.js            # Genre browse scraper
    countryExtractor.js          # Country browse scraper
    dramaListExtractor.js        # Full drama list scraper
  utils/errorHandler.js          # Global Express error handler
  ui/index.html                  # Interactive API documentation UI
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Interactive UI / API docs |
| GET | `/api/home` | Recent episodes, popular dramas, genres, countries |
| GET | `/api/drama/:id` | Full drama info + episode list |
| GET | `/api/episodes/:id` | Episode list for a drama |
| GET | `/api/stream/:episodeId` | Streaming iframe URL + server list |
| GET | `/api/search?q=&type=` | Search dramas or stars |
| GET | `/api/genre/:genre` | Browse by genre (+ `?page=`) |
| GET | `/api/country/:country` | Browse by country (+ `?page=`) |
| GET | `/api/list?char=` | Alphabetical drama list |

## Environment Variables
| Key | Value |
|-----|-------|
| `BASE_URL` | `https://asianctv.net/` |
| `PORT` | `5000` |
| `NODE_ENV` | `development` |

## Running
```bash
npm start       # production
npm run dev     # development with nodemon
```
