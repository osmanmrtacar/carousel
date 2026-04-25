# Generate Reel API Example

```bash
curl -X POST http://localhost:45444/api/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "hookText": "Top 5 Movies You Must Watch",
    "movies": [
      {"title": "Inception", "poster": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", "rating": 8.8, "year": 2010, "genre": "Sci-Fi"},
      {"title": "Interstellar", "poster": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "rating": 8.7, "year": 2014, "genre": "Sci-Fi"},
      {"title": "The Dark Knight", "poster": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "rating": 9.0, "year": 2008, "genre": "Action"},
      {"title": "Pulp Fiction", "poster": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "rating": 8.9, "year": 1994, "genre": "Crime"},
      {"title": "The Shawshank Redemption", "poster": "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", "rating": 9.3, "year": 1994, "genre": "Drama"}
    ],
    "ctaText": "Follow @wattawatch",
    "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  }' --output reel.mp4
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `hookText` | Yes | Text for the hook slide |
| `movies` | Yes | Array of 2-6 movie objects |
| `ctaText` | Yes | Call-to-action text for final slide |
| `audioUrl` | No | URL to background music (MP3/AAC) |

## Movie Object

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Movie title |
| `poster` | Yes | URL to movie poster image |
| `rating` | Yes | IMDb rating |
| `year` | No | Release year |
| `genre` | No | Movie genre |

## Output

- Resolution: 1080x1920 (9:16 vertical)
- Duration: 6-9 seconds (depending on movie count)
- Format: H.264 MP4 with AAC audio
