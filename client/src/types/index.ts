// Movie types
export interface Movie {
    imdbID: string;
    Title: string;
    Year: string;
    Poster: string;
    Type: string;
    Plot?: string;
    Runtime?: string;
    Genre?: string;
    Director?: string;
    Actors?: string;
    imdbRating?: string;
    Metascore?: string;
    Awards?: string;
    trailer_url?: string;
    progress?: number;
}

export interface MovieDetails extends Movie {
    Plot: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Actors: string;
    imdbRating: string;
    Metascore: string;
    Awards: string;
}

// User types
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

// History entries are raw log rows (not OMDB movie objects)
export interface HistoryItem {
    imdb_id: string;
    movie_title: string;
    progress: number;
    last_watched: string;
    Poster?: string;
    Year?: string;
    Genre?: string;
    imdbRating?: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// Universal Catalogue types (Milestone 2)
export interface CatalogueItem {
    id: string;
    content_type: 'movie' | 'series';
    visual_format: 'live_action' | 'animation';
    is_anime: boolean;
    title: string;
    original_title?: string;
    original_language?: string;
    release_year?: number;
    release_date?: string;
    runtime_minutes?: number;
    total_seasons?: number;
    total_episodes?: number;
    status?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    popularity_score?: number;
    tmdb_vote_average?: number;
    imdb_rating?: number;
    imdb_id?: string;
    genres: string[];
}

export interface CatalogueSeason {
    id: string;
    season_number: number;
    title?: string;
    overview?: string;
    air_date?: string;
    episode_count: number;
    poster_path?: string;
}

export interface CatalogueEpisode {
    id: string;
    episode_number: number;
    title: string;
    overview?: string;
    air_date?: string;
    runtime_minutes?: number;
    still_path?: string;
}

export interface CataloguePaginated<T = CatalogueItem> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

