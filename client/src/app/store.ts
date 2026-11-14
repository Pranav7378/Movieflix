import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import moviesReducer from '../features/movies/moviesSlice';
import watchlistReducer from '../features/watchlist/watchlistSlice';
import historyReducer from '../features/history/historySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        movies: moviesReducer,
        watchlist: watchlistReducer,
        history: historyReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore Firebase user object in auth state
                ignoredActions: ['auth/setUser'],
                ignoredPaths: ['auth.user'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
