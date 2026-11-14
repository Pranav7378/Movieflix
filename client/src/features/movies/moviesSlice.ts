import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { Movie, MovieDetails, LoadingState } from '../../types';

interface MoviesState {
    trending: Movie[];
    topRated: Movie[];
    searchResults: Movie[];
    selectedMovie: MovieDetails | null;
    recommendations: Movie[];
    loading: LoadingState;
    error: string | null;
}

const initialState: MoviesState = {
    trending: [],
    topRated: [],
    searchResults: [],
    selectedMovie: null,
    recommendations: [],
    loading: 'idle',
    error: null,
};

// Async thunks
export const fetchTrending = createAsyncThunk(
    'movies/fetchTrending',
    async () => {
        const response = await apiClient.get('/api/trending');
        return response.data;
    }
);

export const fetchTopRated = createAsyncThunk(
    'movies/fetchTopRated',
    async () => {
        const response = await apiClient.get('/api/top-rated');
        return response.data;
    }
);

export const searchMovies = createAsyncThunk(
    'movies/search',
    async (query: string) => {
        const response = await apiClient.get(`/api/search`, { params: { query } });
        return response.data;
    }
);

export const fetchMovieDetails = createAsyncThunk(
    'movies/fetchDetails',
    async (imdbId: string) => {
        const response = await apiClient.get(`/api/movies/${imdbId}`);
        return response.data;
    }
);

export const fetchRecommendations = createAsyncThunk(
    'movies/fetchRecommendations',
    async (imdbId: string) => {
        const response = await apiClient.get(`/api/recommendations/${imdbId}`);
        return response.data;
    }
);

const moviesSlice = createSlice({
    name: 'movies',
    initialState,
    reducers: {
        clearSearchResults: (state) => {
            state.searchResults = [];
        },
        clearSelectedMovie: (state) => {
            state.selectedMovie = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Trending
            .addCase(fetchTrending.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(fetchTrending.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.trending = action.payload;
            })
            .addCase(fetchTrending.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message || 'Failed to fetch trending movies';
            })
            // Top Rated
            .addCase(fetchTopRated.fulfilled, (state, action) => {
                state.topRated = action.payload;
            })
            // Search
            .addCase(searchMovies.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(searchMovies.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.searchResults = action.payload;
            })
            .addCase(searchMovies.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message || 'Failed to search movies';
            })
            // Movie Details
            .addCase(fetchMovieDetails.pending, (state) => {
                state.loading = 'loading';
                state.recommendations = [];
            })
            .addCase(fetchMovieDetails.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.selectedMovie = action.payload;
            })
            .addCase(fetchMovieDetails.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message || 'Failed to fetch movie details';
            })
            // Recommendations
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.recommendations = action.payload;
            })
            .addCase(fetchRecommendations.rejected, (state) => {
                state.recommendations = [];
            });
    },
});

export const { clearSearchResults, clearSelectedMovie } = moviesSlice.actions;
export default moviesSlice.reducer;
