# Universal Media Downloader API

A production-ready REST API that extracts high-quality downloadable media links from YouTube, Instagram, Facebook, and TikTok using **yt-dlp** under the hood.

---

## Features

- 🎯 **Auto platform detection** — YouTube, Instagram, Facebook, TikTok
- 📹 **High-quality video** — 4K, 2K, 1080p, 720p, and lower
- 🎵 **Audio extraction** — Best available audio track (MP3-compatible)
- 📋 **Playlist support** — Bulk extract entire YouTube playlists
- 🖼️ **Thumbnail endpoint** — Fetch media thumbnails on demand
- 🔒 **API key auth** + **rate limiting**
- 🌐 **Optional proxy** — For region-locked or restricted content
- 🐳 **Docker-ready** — One-command deploy to Render.com or any container host

---

## Quick Start (Local)

```bash
# 1. Clone & install
git clone <repo-url>
cd universal-media-downloader-api
npm install

# 2. Install yt-dlp and ffmpeg (macOS example)
brew install yt-dlp ffmpeg
# Or via pip:
pip install yt-dlp

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (API_KEY, PORT, etc.)

# 4. Start the server
node server.js
# → Server running on http://localhost:3000
```

---

## API Reference

All endpoints require the `x-api-key` header.

### `POST /api/extract`

Extract media details and direct download links.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "playlist": false
}
```

**Response (single video):**
```json
{
  "success": true,
  "platform": "youtube",
  "title": "Never Gonna Give You Up",
  "thumbnail": "https://...",
  "duration": "00:03:33",
  "uploader": "Rick Astley",
  "formats": [
    { "quality": "1080p", "type": "video", "ext": "mp4", "url": "https://..." },
    { "quality": "720p",  "type": "video", "ext": "mp4", "url": "https://..." },
    { "quality": "audio", "type": "audio", "ext": "mp3", "url": "https://..." }
  ]
}
```

**Response (playlist):**
```json
{
  "success": true,
  "platform": "youtube",
  "type": "playlist",
  "count": 12,
  "mediaItems": [ { ... }, { ... } ]
}
```

---

### `GET /api/thumbnail?url=<encoded-url>`

Fetch the thumbnail for a media URL.

```bash
curl "http://localhost:3000/api/thumbnail?url=https%3A%2F%2Fyoutu.be%2FdQw4w9WgXcQ" \
  -H "x-api-key: maim12345"
```

**Response:**
```json
{
  "success": true,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "title": "Never Gonna Give You Up"
}
```

---

### `GET /api/health`

Health check (no auth required).

```json
{ "success": true, "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

## curl Examples

```bash
# YouTube video
curl -X POST http://localhost:3000/api/extract \
  -H "x-api-key: maim12345" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# YouTube playlist
curl -X POST http://localhost:3000/api/extract \
  -H "x-api-key: maim12345" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/playlist?list=PLxxxxxx", "playlist": true}'

# Instagram reel
curl -X POST http://localhost:3000/api/extract \
  -H "x-api-key: maim12345" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/"}'

# TikTok video
curl -X POST http://localhost:3000/api/extract \
  -H "x-api-key: maim12345" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@user/video/123456789"}'

# Thumbnail only
curl "http://localhost:3000/api/thumbnail?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ" \
  -H "x-api-key: maim12345"
```

---

## Environment Variables

| Variable          | Default      | Description                                    |
|-------------------|--------------|------------------------------------------------|
| `API_KEY`         | `maim12345`  | Secret key for `x-api-key` header             |
| `PORT`            | `3000`       | HTTP port to listen on                         |
| `RATE_WINDOW_MS`  | `60000`      | Rate limit window in milliseconds              |
| `RATE_LIMIT`      | `30`         | Max requests per window per IP                 |
| `PROXY_URL`       | *(disabled)* | Proxy URL (e.g. `http://user:pass@host:8080`)  |
| `REQUEST_TIMEOUT` | `60000`      | yt-dlp timeout in milliseconds                 |
| `ALLOWED_ORIGINS` | *(empty)*    | Extra CORS origins (comma-separated)           |

---

## Docker

```bash
# Build
docker build -t media-downloader-api .

# Run
docker run -p 3000:3000 \
  -e API_KEY=your-secret-key \
  -e PROXY_URL=http://proxy:8080 \
  media-downloader-api
```

---

## Deploy to Render.com

1. Push this repo to GitHub.
2. Create a new **Web Service** on Render, select your repo.
3. Choose **Docker** as the environment.
4. Set environment variables in the Render dashboard:
   - `API_KEY` → your secret key
   - `PORT` → `3000`
   - `PROXY_URL` → *(optional)*
5. Deploy — Render will build the Docker image and start the service.

**Alternative (without Docker):**
- Build command: `npm install && pip install yt-dlp`
- Start command: `node server.js`
- Environment: Node 20+, Python 3

---

## Running Tests

```bash
# Start the server first
node server.js &

# Run tests
node test/test.js
```

---

## Supported Platforms & URL Types

| Platform  | Video | Playlist | Reel | Story | Shorts |
|-----------|:-----:|:--------:|:----:|:-----:|:------:|
| YouTube   | ✅    | ✅       | —    | —     | ✅     |
| Instagram | ✅    | —        | ✅   | ✅    | —      |
| Facebook  | ✅    | —        | ✅   | —     | —      |
| TikTok    | ✅    | —        | —    | —     | —      |

---

## Error Responses

All errors return:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| Status | Meaning                              |
|--------|--------------------------------------|
| `400`  | Bad request (invalid URL, platform)  |
| `401`  | Missing or wrong API key             |
| `429`  | Rate limit exceeded                  |
| `502`  | yt-dlp extraction failed             |
| `500`  | Unexpected server error              |
