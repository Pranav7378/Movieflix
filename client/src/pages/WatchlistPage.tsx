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
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none -z-10" />
            <div className="absolute top-64 right-10 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                    <div>
                        <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <FaBookmark className="text-[10px]" />
                            <span>Spatial Queue</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                            My Watchlist
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {watchlist.length} {watchlist.length === 1 ? 'film' : 'films'} queued in your personal collection
                        </p>
                    </div>

                    {/* Sorting Controls */}
                    {watchlist.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <FaSortAmountDown className="text-cyan-400 text-xs" /> Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="backdrop-blur-md bg-white/[0.05] text-slate-200 text-xs border border-white/10 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                            >
                                <option value="recent" className="bg-[#07080B]">Recently Added</option>
                                <option value="rating" className="bg-[#07080B]">Highest Rated</option>
                                <option value="year" className="bg-[#07080B]">Release Year</option>
                                <option value="title" className="bg-[#07080B]">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Genre Filter Pills */}
                {availableGenres.length > 2 && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
                            <FaFilter className="text-[10px] text-cyan-400" /> Filter:
                        </span>
                        {availableGenres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    selectedGenre === genre
                                        ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-glow-cyan'
                                        : 'backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                )}

                {/* Watchlist Grid */}
                {loading === 'loading' && watchlist.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                        </div>
                        <p className="text-slate-400 text-sm">Synchronizing your watchlist...</p>
                    </div>
                ) : filteredWatchlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredWatchlist.map((movie, idx) => (
                            <MovieCard 
                                key={`${movie.imdbID}-${idx}`} 
                                movie={movie} 
                                onActionCompleted={setToastMessage}
                            />
                        ))}
                    </div>
                ) : watchlist.length > 0 && filteredWatchlist.length === 0 ? (
                    <div className="text-center py-20 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-md mx-auto">
                        <p className="text-base font-bold text-white mb-2">No films match "{selectedGenre}"</p>
                        <p className="text-xs text-slate-400 mb-4">Try clearing the genre filter to view all saved movies.</p>
                        <button
                            onClick={() => setSelectedGenre('All')}
                            className="btn-glass text-xs"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-24 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-lg mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                            <FaBookmark size={22} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 font-display">Your Watchlist is Empty</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                            Discover films that match your taste and bookmark them here to plan your future viewing sessions.
                        </p>
                        <Link to="/home" className="btn-gradient text-xs sm:text-sm px-6 py-2.5">
                            <FaCompass /> Discover Films
                        </Link>
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
