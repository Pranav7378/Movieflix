import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import MovieCarousel from '../components/MovieCarousel';
import SkeletonLoader from '../components/SkeletonLoader';
import { fetchTrending, fetchTopRated } from '../features/movies/moviesSlice';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';
import { fetchContinueWatching } from '../features/history/historySlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import apiClient from '../api/apiClient';
import { Movie } from '../types';

const HomePage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { trending, topRated, loading } = useAppSelector((state) => state.movies);
    const { items: watchlist } = useAppSelector((state) => state.watchlist);
    const { continueWatching } = useAppSelector((state) => state.history);
    const { user } = useAppSelector((state) => state.auth);
    const [personalizedMovies, setPersonalizedMovies] = useState<Movie[]>([]);

    useEffect(() => {
        dispatch(fetchTrending());
        dispatch(fetchTopRated());

        if (user) {
            dispatch(fetchWatchlist(user.uid));
            dispatch(fetchContinueWatching(user.uid));

            // Fetch personalized recommendations (non-blocking, 60s timeout for cold starts)
            apiClient.get(`/api/recommendations/personalized/${user.uid}`, { timeout: 60000 })
                .then(res => setPersonalizedMovies(res.data))
                .catch(err => {
                    console.log('Could not fetch personalized recommendations:', err.message);
                    setPersonalizedMovies([]); // Just set empty, don't break the UI
                });
        }
    }, [dispatch, user]);

    return (
        <div className="min-h-screen bg-netflix-black">
            <Navbar />

            {/* Hero Section with Featured Movie */}
            <div className="relative h-screen">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=1920"
                        alt="Featured"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />
                </div>

                <div className="relative z-10 pt-48 px-4 md:px-16 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-bold mb-4">
                        Discover Amazing Movies
                    </h1>
                    <p className="text-lg md:text-xl mb-8 text-gray-200">
                        Explore personalized recommendations powered by AI
                    </p>
                    <div className="flex gap-4">
                        <button className="btn btn-primary text-lg px-8 py-3">
                            ▶ Play
                        </button>
                        <button className="btn btn-secondary text-lg px-8 py-3">
                            ℹ More Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Movie Carousels */}
            <div className="relative z-20 -mt-32 pb-20">
                {loading === 'loading' ? (
                    <>
                        <SkeletonLoader />
                        <SkeletonLoader />
                        <SkeletonLoader />
                    </>
                ) : (
                    <>
                        {continueWatching.length > 0 && (
                            <MovieCarousel title="Continue Watching" movies={continueWatching} />
                        )}
                        <MovieCarousel title="Trending Now" movies={trending} />
                        {personalizedMovies.length > 0 && (
                            <MovieCarousel title="Recommended For You" movies={personalizedMovies} />
                        )}
                        <MovieCarousel title="Top Rated" movies={topRated} />
                        {watchlist.length > 0 && (
                            <MovieCarousel title="My List" movies={watchlist} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;
