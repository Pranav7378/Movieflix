import requests
from typing import Optional, Dict, Any
from ..config import settings

OMDB_BASE_URL = "http://www.omdbapi.com/"

def fetch_movie_by_imdb(imdb_id: str) -> Optional[Dict[str, Any]]:
    """Fetch movie details from OMDB by IMDb ID"""
    try:
        params = {
            "apikey": settings.OMDB_API_KEY,
            "i": imdb_id,
            "plot": "full"
        }
        response = requests.get(OMDB_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data.get("Response") == "True":
            return data
        else:
            print(f"❌ OMDB Error: {data.get('Error')}")
            return None
    except Exception as e:
        print(f"❌ Error fetching movie {imdb_id}: {str(e)}")
        return None

def search_movies(query: str, page: int = 1) -> Optional[Dict[str, Any]]:
    """Search movies on OMDB"""
    try:
        params = {
            "apikey": settings.OMDB_API_KEY,
            "s": query,
            "page": page
        }
        response = requests.get(OMDB_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data.get("Response") == "True":
            return data
        else:
            return {"Search": [], "totalResults": "0"}
    except Exception as e:
        print(f"❌ Error searching movies: {str(e)}")
        return {"Search": [], "totalResults": "0"}
