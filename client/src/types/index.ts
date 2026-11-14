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
