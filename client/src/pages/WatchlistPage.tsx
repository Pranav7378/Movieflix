import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieCarousel from '../components/MovieCarousel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';

const WatchlistPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: watchlist, loading } = useAppSelector((state) => state.watchlist);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            dispatch(fetchWatchlist(user.uid));
        }
    }, [dispatch, user]);

    return (
        <div className="min-h-screen bg-netflix-black">
            <Navbar />

            <div className="pt-24 px-4 md:px-16">
                <h1 className="text-4xl font-bold mb-8">My List</h1>

                {loading === 'loading' ? (
                    <p className="text-gray-400">Loading...</p>
                ) : watchlist.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl">Your watchlist is empty</p>
                        <p className="text-gray-500 mt-2">Add movies to your list to see them here</p>
                    </div>
                ) : (
                    <MovieCarousel title="" movies={watchlist} />
                )}
            </div>
        </div>
    );
};

export default WatchlistPage;
