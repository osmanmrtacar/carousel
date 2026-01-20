# Movie Card Generator API

A backend service that generates movie card images from text input.

## Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Download a font file (Inter Bold recommended):
   - Go to https://fonts.google.com/specimen/Inter
   - Download and extract
   - Copy `Inter-Bold.ttf` to `server/fonts/Inter-Bold.ttf`

3. Start the server:

```bash
npm run dev
```

## API Endpoints

### Generate Movie Card

**POST** `/api/generate-card`

Request body:

```json
{
    "title": "Inception",
    "image": "https://example.com/movie-poster.jpg",
    "rating": 5,
    "year": 2026,
    "genre": "Sci-Fi",
    "description": "A mind-bending thriller about dreams within dreams.",
    "width": 1080,
    "height": 1350
}
```

Response: PNG image file

### Health Check

**GET** `/api/health`

### Example Request

**GET** `/api/example`

## Usage Example (cURL)

```bash
curl -X POST http://localhost:3001/api/generate-card \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "image": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1080",
    "rating": 5,
    "year": 2026,
    "genre": "Sci-Fi",
    "description": "A computer hacker learns about the true nature of reality."
  }' \
  --output matrix-card.png
```

## Usage Example (JavaScript/Fetch)

```javascript
const response = await fetch("http://localhost:3001/api/generate-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        title: "The Matrix",
        image:
            "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1080",
        rating: 5,
        year: 2026,
        genre: "Sci-Fi",
        description:
            "A computer hacker learns about the true nature of reality.",
    }),
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Use the URL to display or download the image
```

## Tech Stack

- **Express.js** - Web server
- **Satori** - JSX to SVG conversion (by Vercel)
- **@resvg/resvg-js** - SVG to PNG conversion
- **CORS** - Cross-origin support
