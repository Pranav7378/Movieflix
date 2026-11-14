import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCompass, FaSortAmountDown, FaStar, FaCalendarAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchHistory } from '../features/history/historySlice';
import apiClient from '../api/apiClient';

interface MovieMeta {
    Poster?: string;
    Year?: string;
    Genre?: string;
    imdbRating?: string;
}

const WatchedPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items: historyItems, loading } = useAppSelector((state) => state.history);
    const { user } = useAppSelector((state) => state.auth);

    const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
    const [toastMessage] = useState<string | null>(null);
    const [metaCache, setMetaCache] = useState<Record<string, MovieMeta>>({});
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) {
            dispatch(fetchHistory(user.uid));
        }
    }, [dispatch, user]);

    // Fetch poster & details for any history item that doesn't have it yet
    useEffect(() => {
        if (!historyItems || historyItems.length === 0) return;

        const missingIds = historyItems
            .filter((item) => !item.Poster && !metaCache[item.imdb_id])
            .map((item) => item.imdb_id);

        if (missingIds.length === 0) return;

        missingIds.forEach((imdbId) => {
            apiClient.get(`/api/movies/${imdbId}`, { timeout: 15000 })
                .then((res) => {
                    if (res.data) {
                        setMetaCache((prev) => ({
                            ...prev,
                            [imdbId]: {
                                Poster: res.data.Poster,
                                Year: res.data.Year,
                                Genre: res.data.Genre,
                                imdbRating: res.data.imdbRating,
                            }
                        }));
                    }
                })
                .catch(() => {
                    // Silently ignore individual missing metadata
                });
        });
    }, [historyItems, metaCache]);

    const sortedHistory = useMemo(() => {
        const list = [...historyItems];
        if (sortBy === 'title') {
            list.sort((a, b) => a.movie_title.localeCompare(b.movie_title));
        } else {
            list.sort((a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime());
        }
        return list;
    }, [historyItems, sortBy]);

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
                        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <FaCheckCircle className="text-[10px]" />
                            <span>Cinema Diary</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                            Watched Films
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {historyItems.length} {historyItems.length === 1 ? 'film' : 'films'} recorded in your personal viewing history
                        </p>
                    </div>

                    {historyItems.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <FaSortAmountDown className="text-cyan-400 text-xs" /> Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="backdrop-blur-md bg-white/[0.05] text-slate-200 text-xs border border-white/10 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none cursor-pointer"
                            >
                                <option value="recent" className="bg-[#07080B]">Most Recently Watched</option>
                                <option value="title" className="bg-[#07080B]">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading === 'loading' && historyItems.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                        </div>
                        <p className="text-slate-400 text-sm">Opening cinema diary logs...</p>
                    </div>
                ) : historyItems.length === 0 ? (
                    <div className="max-w-md mx-auto text-center py-20 px-6 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl my-8">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                            <FaCheckCircle size={22} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 font-display">No Logged Films Yet</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                            Mark movies as watched to build your personal cinema log and calibrate your AI recommendation profile.
                        </p>
                        <Link to="/home" className="btn-gradient text-xs sm:text-sm px-6 py-2.5 inline-flex items-center gap-2">
                            <FaCompass /> Discover Films to Log
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {sortedHistory.map((item, idx) => {
                            const meta = metaCache[item.imdb_id];
                            const rawPoster = item.Poster || meta?.Poster;
                            const hasValidPoster = rawPoster && rawPoster !== 'N/A' && !failedImages[item.imdb_id];
                            const posterUrl = hasValidPoster
                                ? rawPoster!
                                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
                            const year = item.Year || meta?.Year;
                            const rating = item.imdbRating || meta?.imdbRating;

                            return (
                                <div
                                    key={`${item.imdb_id}-${idx}`}
                                    onClick={() => navigate(`/movie/${item.imdb_id}`)}
                                    className="group relative flex flex-col cursor-pointer select-none transition-all duration-300"
                                >
                                    {/* Ambient Glow */}
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500/30 via-cyan-500/25 to-violet-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none" />

                                    {/* Poster Container */}
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#0D1017] border border-white/15 group-hover:border-emerald-400/70 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.25)] shadow-[0_10px_25px_rgba(0,0,0,0.5)] transform group-hover:-translate-y-1.5 transition-all duration-300 ease-out">
                                        <img
                                            src={posterUrl}
                                            alt={item.movie_title}
                                            loading="lazy"
                                            onError={() => setFailedImages((prev) => ({ ...prev, [item.imdb_id]: true }))}
                                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />

                                        {/* Cinematic Gradient Vignette */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-transparent to-black/40 opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                                        {/* Top-Right: Watched Status Pill Badge */}
                                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold shadow-glow-pill">
                                            <FaCheckCircle className="text-[10px] text-emerald-400" />
                                            <span>Watched</span>
                                        </div>

                                        {/* Bottom Details Overlay on Poster */}
                                        <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col">
                                            <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors drop-shadow">
                                                {item.movie_title}
                                            </h3>

                                            <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                                                <div className="flex items-center gap-1.5">
                                                    {year && <span>{year}</span>}
                                                    {rating && rating !== 'N/A' && (
                                                        <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                                                            <FaStar className="text-[9px] text-amber-400" />
                                                            {rating}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 border-t border-white/10 pt-1">
                                                <FaCalendarAlt className="text-[9px] text-cyan-400" />
                                                <span>
                                                    {new Date(item.last_watched).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Toast 
                message={toastMessage} 
                onClose={() => {}} 
            />

            <Footer />
        </div>
    );
};

export default WatchedPage;
