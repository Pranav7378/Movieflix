import requests
from typing import Optional
from ..config import settings

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3/search"

def search_movie_trailer(movie_title: str, year: str = "") -> Optional[str]:
    """Search for movie trailer on YouTube and return video URL"""
    try:
        if not settings.YOUTUBE_API_KEY:
            print("⚠️ YouTube API key not configured")
            return None
        
        # Build search query
        query = f"{movie_title} official trailer"
        if year:
            query += f" {year}"
        
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 1,
            "key": settings.YOUTUBE_API_KEY
        }
        
        response = requests.get(YOUTUBE_API_BASE, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("items") and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"
        
        return None
        
    except Exception as e:
        print(f"❌ Error fetching YouTube trailer: {str(e)}")
        return None
