import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { Movie, LoadingState } from '../../types';

interface WatchlistState {
    items: Movie[];
    loading: LoadingState;
    error: string | null;
}

const initialState: WatchlistState = {
    items: [],
    loading: 'idle',
    error: null,
};

// Async thunks
export const fetchWatchlist = createAsyncThunk(
    'watchlist/fetch',
    async (userId: string) => {
        const response = await apiClient.get<Movie[]>(`/api/watchlist/${userId}`);
        return response.data;
    }
);

export const addToWatchlist = createAsyncThunk(
    'watchlist/add',
    async ({ userId, imdbId, movieTitle }: { userId: string; imdbId: string; movieTitle: string }) => {
        const response = await apiClient.post<Movie>('/api/watchlist', {
            user_id: userId,
            imdb_id: imdbId,
            movie_title: movieTitle,
        });
        return response.data;
    }
);

export const removeFromWatchlist = createAsyncThunk(
    'watchlist/remove',
    async ({ userId, imdbId }: { userId: string; imdbId: string }) => {
        await apiClient.delete(`/api/watchlist/${userId}/${imdbId}`);
        return imdbId;
    }
);

const watchlistSlice = createSlice({
    name: 'watchlist',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWatchlist.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(fetchWatchlist.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchWatchlist.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message || 'Failed to fetch watchlist';
            })
            .addCase(addToWatchlist.fulfilled, (state, action) => {
                const exists = state.items.some((item) => item.imdbID === action.payload.imdbID);
                if (!exists) {
                    state.items.unshift(action.payload);
                }
            })
            .addCase(removeFromWatchlist.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => item.imdbID !== action.payload);
            });
    },
});

export default watchlistSlice.reducer;
