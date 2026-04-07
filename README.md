# Drama Scraper API 🎬

A production-ready REST API for scraping Asian dramas, movies, and shows with intelligent caching, comprehensive error handling, and consistent response formats. Built with Express.js, Cheerio, and modern JavaScript.

## ✨ Features

- **Complete Coverage**: 12 endpoints covering home, recent, popular, genres, countries, search, and drama details
- **Performance Optimized**: Intelligent caching with configurable TTLs reduces repeated requests
- **Production Ready**: Comprehensive error handling, validation, and retry logic
- **Consistent Responses**: Standardized JSON format across all endpoints
- **Clean Architecture**: Modular structure with controllers, extractors, and utilities
- **Built-in Documentation**: Interactive API playground at the root endpoint
- **Scalable**: Easy to deploy on Vercel, Render, Railway, or any Node.js hosting

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **Axios** - Promise-based HTTP client with retry logic
- **Cheerio** - Fast HTML parsing for server-side scraping
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dev-abrarfahim/drama-api.git
cd drama-api

# Install dependencies
npm install

# Start the development server
npm run dev
```

The server will start on `http://localhost:3000`. Visit the root URL for interactive API documentation.

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

### Production Deployment

```bash
# Build and start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name drama-api
```

## 📚 API Documentation

Base URL: `http://localhost:3000/api` (or your deployment URL)

All endpoints return a consistent JSON response format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "cached": false,
    "timestamp": "2026-04-06T14:20:22.462Z"
  }
}
```

### Endpoints Overview

| Category | Endpoint | Method | Description | Cache TTL |
|----------|----------|--------|-------------|-----------|
| Home | `/api/home` | GET | Homepage data with recent episodes, popular dramas, genres, countries | 2 minutes |
| Recent | `/api/recent/:category` | GET | Recent episodes by category (drama, movies, kshow) | 30 seconds |
| Recently Added | `/api/recently-added` | GET | Paginated list of recently added dramas | 1 minute |
| Popular Ongoing | `/api/popular-ongoing-drama` | GET | Paginated list of popular ongoing dramas | 1 minute |
| Most Popular | `/api/most-popular` | GET | Paginated list of most popular dramas | 5 minutes |
| Genres | `/api/genre/:genre` | GET | Browse dramas by genre | 1 minute |
| Countries | `/api/country/:country` | GET | Browse dramas by country/type | 1 minute |
| Search | `/api/search` | GET | Search for dramas or stars by keyword | 30 seconds |
| Drama Info | `/api/drama/:id` | GET | Full drama details with episode list | 5 minutes |
| Episodes Only | `/api/episodes/:id` | GET | Episode list only for a drama | 5 minutes |
| Streaming | `/api/stream/:episodeId` | GET | Streaming links for an episode | 30 seconds |
| Alphabetical List | `/api/list` | GET | Full alphabetical drama list | 5 minutes |
| Generic Section | `/api/section/:name` | GET | Generic endpoint for any section | 1 minute |

### Detailed Endpoint Documentation

#### 1. Home Page Data
**GET** `/api/home`

Returns categorized homepage data including recent episodes, popular dramas, genres, and countries.

**Example Response:**
```json
{
  "success": true,
  "message": "Home data retrieved successfully",
  "data": {
    "recent_categorized": {
      "drama": [...],
      "movies": [...],
      "kshow": [...]
    },
    "popular_ongoing_drama": [...],
    "genres": [...],
    "countries": [...]
  },
  "metadata": {
    "cached": false,
    "timestamp": "2026-04-06T14:20:22.462Z"
  }
}
```

#### 2. Search Dramas
**GET** `/api/search?q=keyword&type=movies`

Search for dramas or stars by keyword.

**Query Parameters:**
- `q` (required): Search keyword
- `type` (optional): `movies` or `stars` (default: `movies`)

**Example:**
```bash
GET /api/search?q=love&type=movies
```

#### 3. Drama Details
**GET** `/api/drama/:id`

Get full details of a specific drama including title, description, cast, metadata, and episode list.

**Path Parameters:**
- `:id` (required): Drama slug (e.g., `our-universe-2026`)

#### 4. Streaming Links
**GET** `/api/stream/:episodeId`

Extract video iframe URL and alternative server links for a specific episode.

**Path Parameters:**
- `:episodeId` (required): Episode slug (e.g., `our-universe-2026-episode-12`)

### Pagination

Most listing endpoints support pagination via the `page` query parameter:

```bash
GET /api/recently-added?page=2
GET /api/genre/romance?page=3
```

Pagination response includes:
```json
"pagination": {
  "currentPage": 2,
  "totalPages": 10,
  "hasNext": true,
  "hasPrev": true
}
```

## 🏗️ Project Architecture

```
drama-api/
├── src/
│   ├── configs/
│   │   └── constants.js          # Base URLs, headers, utility functions
│   ├── controllers/
│   │   └── dramaController.js    # Route handlers with caching and error handling
│   ├── extractors/
│   │   ├── homeExtractor.js      # Homepage scraping
│   │   ├── listingExtractor.js   # Generic listing scraping
│   │   ├── dramaExtractor.js     # Drama details scraping
│   │   ├── streamExtractor.js    # Streaming links scraping
│   │   ├── searchExtractor.js    # Search functionality
│   │   ├── genreExtractor.js     # Genre-based listings
│   │   ├── countryExtractor.js   # Country-based listings
│   │   ├── recentExtractor.js    # Recent episodes
│   │   └── dramaListExtractor.js # Alphabetical drama list
│   ├── routes/
│   │   └── index.js              # API route definitions (12 endpoints)
│   ├── utils/
│   │   ├── responseHelper.js     # Standardized response formatting
│   │   ├── cache.js              # In-memory caching implementation
│   │   └── errorHandler.js       # Error handling utilities
│   └── ui/
│       └── index.html            # Interactive API documentation
├── server.js                     # Express server entry point
├── package.json                  # Dependencies and scripts
├── README.md                     # This file
└── .env.example                  # Environment variables template
```

### Key Design Decisions

1. **Modular Architecture**: Separated concerns with controllers, extractors, and utilities
2. **Caching Layer**: In-memory cache with TTLs to reduce external requests
3. **Error Handling**: Comprehensive error catching and user-friendly messages
4. **Response Consistency**: All endpoints use `responseHelper.js` for uniform responses
5. **Validation**: Input validation for required parameters

## 🔧 Performance Optimizations

- **Intelligent Caching**: Different TTLs based on endpoint volatility
- **Request Deduplication**: Cache prevents duplicate requests during TTL window
- **Efficient Parsing**: Cheerio selectors optimized for performance
- **Async/Await**: Proper async handling to prevent blocking
- **Memory Management**: Cache cleanup and size limits

## 🐛 Error Handling

The API provides consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 404
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error
- `503`: Service Unavailable (scraping failed)

## 🚢 Deployment

### Vercel
The project includes `vercel.json` for zero-config deployment to Vercel.

### Render
Use the included `render.yaml` for deployment to Render.

### Docker
```bash
# Build the Docker image
docker build -t drama-api .

# Run the container
docker run -p 3000:3000 drama-api
```

Docker Compose is also supported:
```bash
docker-compose up
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and architecture
- Add comments for complex logic
- Update documentation for new features
- Write tests when possible
- Ensure all endpoints maintain consistent response format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This API is developed for **educational and research purposes only**.

- It scrapes publicly available data from third-party websites
- The developer does not host, upload, or manage any video content
- This project is not affiliated with or endorsed by any streaming service
- Use responsibly and respect the terms of service of scraped websites
- Consider implementing rate limiting in production deployments

## 🙏 Acknowledgments

- Built with Express.js and Cheerio
- Inspired by the need for a reliable drama API
- Thanks to all contributors and users

---

**Made with ❤️ for the drama community**

For questions or support, please open an issue on GitHub.
