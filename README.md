# Drama API 🎬

An unofficial, open-source REST API for scraping and serving Asian drama content, episodes, and streaming links. Built with Node.js, Express, Axios, and Cheerio.

**Repository:** [https://github.com/dev-abrarfahim/drama-api.git](https://github.com/dev-abrarfahim/drama-api.git)

---

## 🌟 Features

- **Home Page Data:** Retrieve spotlight, trending, popular, latest releases, and genres.
- **Search:** Search for specific dramas or movies by keyword.
- **Drama Details:** Fetch synopsis, poster image, genres, and a complete list of available episodes.
- **Streaming Links:** Extract video iframe URLs and alternative streaming servers for specific episodes.
- **Fast & Lightweight:** Uses `cheerio` for rapid HTML parsing without the overhead of a headless browser.

---

## 🛠️ Tech Stack

- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment.
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated, minimalist web framework.
- **[Axios](https://axios-http.com/)** - Promise-based HTTP client for fetching HTML pages.
- **[Cheerio](https://cheerio.js.org/)** - Fast, flexible, and lean implementation of core jQuery for server-side HTML parsing.

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/dev-abrarfahim/drama-api.git
cd drama-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
# or
npm start
```
The server will start on `http://localhost:3000` (or your configured `PORT`).

---

## 📖 API Documentation

Base URL: `http://localhost:3000/api` (Adjust based on your deployment)

### 1. Get Home Page Data
Retrieves categorized lists of dramas currently featured on the homepage.
- **Endpoint:** `/home`
- **Method:** `GET`
- **Response:**
```json
{
  "success": true,
  "results": {
    "spotlight": [...],
    "trending": [...],
    "popular": [...],
    "latest": [
      {
        "title": "Drama Title",
        "image": "https://example.com/image.jpg",
        "id": "drama-title-episode-1",
        "episode": "EP 1"
      }
    ],
    "genres": [...]
  }
}
```

### 2. Search Dramas
Search for a drama by its title.
- **Endpoint:** `/search?q={keyword}`
- **Method:** `GET`
- **Query Parameters:**
  - `q` (required): The search keyword.
- **Response:**
```json
{
  "success": true,
  "results": [
    {
      "title": "Search Result Title",
      "image": "https://example.com/image.jpg",
      "id": "search-result-id",
      "episode": "EP 16"
    }
  ]
}
```

### 3. Get Drama Details
Get full details of a specific drama, including its episode list.
- **Endpoint:** `/drama/:id`
- **Method:** `GET`
- **Path Parameters:**
  - `id` (required): The unique identifier of the drama (e.g., `turbulent-love-2026`).
- **Response:**
```json
{
  "success": true,
  "results": {
    "title": "Turbulent Love (2026)",
    "description": "A romantic drama...",
    "image": "https://example.com/poster.jpg",
    "genres": [
      { "name": "Romance", "id": "romance" }
    ],
    "episodes": [
      {
        "title": "Episode 1",
        "id": "turbulent-love-2026-episode-1",
        "episode": "SUB"
      }
    ]
  }
}
```

### 4. Get Episodes Only
A lightweight endpoint to fetch just the episodes of a specific drama.
- **Endpoint:** `/episodes/:id`
- **Method:** `GET`
- **Path Parameters:**
  - `id` (required): The unique identifier of the drama.
- **Response:**
```json
{
  "success": true,
  "results": [
    {
      "title": "Episode 1",
      "id": "turbulent-love-2026-episode-1",
      "episode": "SUB"
    }
  ]
}
```

### 5. Get Streaming Links
Extract the video iframe URL and alternative server links for a specific episode.
- **Endpoint:** `/stream/:episodeId`
- **Method:** `GET`
- **Path Parameters:**
  - `episodeId` (required): The unique identifier of the episode (e.g., `turbulent-love-2026-episode-1`).
- **Response:**
```json
{
  "success": true,
  "results": {
    "iframeUrl": "https://vidbasic.top/embed/...",
    "servers": [
      {
        "name": "Fast Server",
        "url": "https://vidbasic.top/embed/..."
      }
    ]
  }
}
```

---

## 📂 Project Structure

```text
drama-api/
├── src/
│   ├── configs/
│   │   └── constants.js       # Base URLs and HTTP Headers
│   ├── controllers/
│   │   └── dramaController.js # Express route handlers
│   ├── extractors/
│   │   ├── dramaExtractor.js  # Scrapes drama details & episodes
│   │   ├── homeExtractor.js   # Scrapes homepage categories
│   │   ├── searchExtractor.js # Scrapes search results
│   │   └── streamExtractor.js # Scrapes video iframes & servers
│   ├── routes/
│   │   └── index.js           # API route definitions
│   └── index.js               # Express app entry point
├── package.json
└── README.md
```

---

## ⚠️ Disclaimer

This API is developed for **educational and research purposes only**. 
- It scrapes publicly available data from third-party websites.
- The developer of this API does not host, upload, or manage any of the video content or media returned by this API.
- This project is not affiliated with, endorsed by, or connected to Dramacool or any of its partners.
- Use this API responsibly and respect the terms of service of the scraped websites.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/dev-abrarfahim/drama-api/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
