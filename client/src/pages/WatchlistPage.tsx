import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaBookmark, FaCompass, FaSortAmountDown, FaFilter } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import Toast from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';

const WatchlistPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: watchlist, loading } = useAppSelector((state) => state.watchlist);
    const { user } = useAppSelector((state) => state.auth);

    const [selectedGenre, setSelectedGenre] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'year' | 'title'>('recent');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            dispatch(fetchWatchlist(user.uid));
        }
    }, [dispatch, user]);

    // Extract all unique genres from watchlist
    const availableGenres = useMemo(() => {
        const genreSet = new Set<string>();
        watchlist.forEach((movie) => {
            if (movie.Genre) {
                movie.Genre.split(',').forEach((g) => genreSet.add(g.trim()));
            }
        });
        return ['All', ...Array.from(genreSet)];
    }, [watchlist]);

    // Filter and Sort
    const filteredWatchlist = useMemo(() => {
        let result = [...watchlist];

        if (selectedGenre !== 'All') {
            result = result.filter((m) => m.Genre?.includes(selectedGenre));
        }

        if (sortBy === 'rating') {
            result.sort((a, b) => {
                const rA = parseFloat(a.imdbRating || '0') || 0;
                const rB = parseFloat(b.imdbRating || '0') || 0;
                return rB - rA;
            });
        } else if (sortBy === 'year') {
            result.sort((a, b) => {
                const yA = parseInt(a.Year || '0') || 0;
                const yB = parseInt(b.Year || '0') || 0;
                return yB - yA;
            });
        } else if (sortBy === 'title') {
            result.sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));
        }

        return result;
    }, [watchlist, selectedGenre, sortBy]);

    return (
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-cinecue-border">
                    <div>
                        <div className="inline-flex items-center gap-2 text-cinecue-amber text-xs font-bold uppercase tracking-wider mb-1">
                            <FaBookmark className="text-[10px]" />
                            Personal Cinema Queue
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            My Watchlist
                        </h1>
                        <p className="text-sm text-cinecue-muted mt-1">
                            {watchlist.length} {watchlist.length === 1 ? 'film' : 'films'} queued for your upcoming movie nights
                        </p>
                    </div>

                    {/* Sorting Controls */}
                    {watchlist.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-cinecue-muted flex items-center gap-1">
                                <FaSortAmountDown className="text-cinecue-amber text-xs" /> Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-cinecue-surface text-cinecue-text text-xs border border-cinecue-border rounded-lg px-3 py-2 focus:border-cinecue-amber focus:outline-none"
                            >
                                <option value="recent">Recently Added</option>
                                <option value="rating">Highest Rated</option>
                                <option value="year">Release Year</option>
                                <option value="title">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Genre Filter Chips */}
                {watchlist.length > 0 && availableGenres.length > 2 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs no-scrollbar">
                        <span className="text-cinecue-muted-dark flex items-center gap-1 flex-shrink-0">
                            <FaFilter className="text-[10px]" /> Genre:
                        </span>
                        {availableGenres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    selectedGenre === genre
                                        ? 'bg-cinecue-amber text-[#101114] font-semibold'
                                        : 'bg-cinecue-surface border border-cinecue-border text-cinecue-muted hover:text-white hover:border-cinecue-border-light'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading === 'loading' && watchlist.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                        <p className="text-cinecue-muted text-sm">Loading your watchlist...</p>
                    </div>
                ) : watchlist.length === 0 ? (
                    /* High-Fidelity Empty State */
                    <div className="max-w-md mx-auto text-center py-20 px-6 bg-cinecue-surface/40 border border-cinecue-border/70 rounded-3xl my-8">
                        <div className="w-16 h-16 rounded-2xl bg-cinecue-amber/15 border border-cinecue-amber/30 text-cinecue-amber flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FaBookmark size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Your next movie night starts here.
                        </h2>
                        <p className="text-cinecue-muted text-sm leading-relaxed mb-8">
                            Save films that catch your eye and find them whenever you're ready to watch. Browse our recommendations or search for your favourites.
                        </p>
                        <Link 
                            to="/home" 
                            className="btn btn-primary px-6 py-3 rounded-xl font-semibold text-sm shadow-amber-glow"
                        >
                            <FaCompass />
                            Discover Movies
                        </Link>
                    </div>
                ) : filteredWatchlist.length === 0 ? (
                    <div className="text-center py-16 bg-cinecue-surface/30 rounded-2xl border border-cinecue-border">
                        <p className="text-cinecue-muted text-sm">No movies in your list match the "{selectedGenre}" genre.</p>
                        <button
                            onClick={() => setSelectedGenre('All')}
                            className="btn btn-secondary text-xs mt-3"
                        >
                            Reset Genre Filter
                        </button>
                    </div>
                ) : (
                    /* Movies Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredWatchlist.map((movie) => (
                            <MovieCard 
                                key={movie.imdbID} 
                                movie={movie}
                                onActionCompleted={setToastMessage} 
                            />
                        ))}
                    </div>
                )}
            </main>

            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)} 
            />

            <Footer />
        </div>
    );
};

export default WatchlistPage;
