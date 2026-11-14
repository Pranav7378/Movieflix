import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { HistoryItem, Movie, LoadingState } from '../../types';

interface HistoryState {
    items: HistoryItem[];
    continueWatching: Movie[];
    loading: LoadingState;
    error: string | null;
}

const initialState: HistoryState = {
    items: [],
    continueWatching: [],
    loading: 'idle',
    error: null,
};

// Async thunks
export const fetchHistory = createAsyncThunk(
    'history/fetch',
    async (userId: string) => {
        const response = await apiClient.get<HistoryItem[]>(`/api/history/${userId}`);
        return response.data;
    }
);

export const fetchContinueWatching = createAsyncThunk(
    'history/fetchContinueWatching',
    async (userId: string) => {
        const response = await apiClient.get<Movie[]>(`/api/continue-watching/${userId}`);
        return response.data;
    }
);

export const addToHistory = createAsyncThunk(
    'history/add',
    async ({ userId, imdbId, movieTitle, progress }: { userId: string; imdbId: string; movieTitle: string; progress: number }) => {
        const response = await apiClient.post('/api/history', {
            user_id: userId,
            imdb_id: imdbId,
            movie_title: movieTitle,
            progress: progress
        });
        return response.data;
    }
);

const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchHistory.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(fetchHistory.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchHistory.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message || 'Failed to fetch history';
            })
            .addCase(fetchContinueWatching.fulfilled, (state, action) => {
                state.continueWatching = action.payload;
            })
            .addCase(addToHistory.fulfilled, (state) => {
                state.loading = 'succeeded';
            });
    },
});

export default historySlice.reducer;
