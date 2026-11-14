import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCompass, FaSortAmountDown } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchHistory } from '../features/history/historySlice';

const WatchedPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items: historyItems, loading } = useAppSelector((state) => state.history);
    const { user } = useAppSelector((state) => state.auth);

    const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            dispatch(fetchHistory(user.uid));
        }
    }, [dispatch, user]);

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
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-cinecue-border">
                    <div>
                        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <FaCheckCircle className="text-[10px]" />
                            Letterboxd-Style Log
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Cinema Diary
                        </h1>
                        <p className="text-sm text-cinecue-muted mt-1">
                            {historyItems.length} {historyItems.length === 1 ? 'film' : 'films'} recorded in your personal viewing history
                        </p>
                    </div>

                    {historyItems.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-cinecue-muted flex items-center gap-1">
                                <FaSortAmountDown className="text-cinecue-amber text-xs" /> Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-cinecue-surface text-cinecue-text text-xs border border-cinecue-border rounded-lg px-3 py-2 focus:border-cinecue-amber focus:outline-none"
                            >
                                <option value="recent">Most Recently Watched</option>
                                <option value="title">Alphabetical (A-Z)</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading === 'loading' && historyItems.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                        <p className="text-cinecue-muted text-sm">Opening cinema diary...</p>
                    </div>
                ) : historyItems.length === 0 ? (
                    /* Empty state */
                    <div className="max-w-md mx-auto text-center py-20 px-6 bg-cinecue-surface/40 border border-cinecue-border/70 rounded-3xl my-8">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FaCheckCircle size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            No films logged yet.
                        </h2>
                        <p className="text-cinecue-muted text-sm leading-relaxed mb-8">
                            Keep track of every masterpiece you experience. When you watch a movie, tap "Mark as Watched" on any movie card or details page.
                        </p>
                        <Link 
                            to="/home" 
                            className="btn btn-primary px-6 py-3 rounded-xl font-semibold text-sm shadow-amber-glow"
                        >
                            <FaCompass />
                            Discover Cinema
                        </Link>
                    </div>
                ) : (
                    /* Diary List / Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sortedHistory.map((item, idx) => (
                            <div
                                key={`${item.imdb_id}-${idx}`}
                                onClick={() => navigate(`/movie/${item.imdb_id}`)}
                                className="bg-cinecue-surface border border-cinecue-border hover:border-cinecue-amber/60 p-5 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between text-xs text-cinecue-muted mb-2">
                                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                            <FaCheckCircle className="text-[11px]" />
                                            {item.progress >= 100 ? 'Completed' : `${item.progress}% Watched`}
                                        </span>
                                        <span className="text-[11px] text-cinecue-muted-dark">
                                            {new Date(item.last_watched).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-base text-white group-hover:text-cinecue-amber transition-colors line-clamp-2">
                                        {item.movie_title}
                                    </h3>
                                </div>

                                <div className="mt-4 pt-3 border-t border-cinecue-border/60 flex items-center justify-between text-xs">
                                    <span className="text-cinecue-muted-dark font-mono text-[10px]">
                                        {item.imdb_id}
                                    </span>
                                    <span className="text-cinecue-amber font-semibold group-hover:underline">
                                        View Details →
                                    </span>
                                </div>
                            </div>
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

export default WatchedPage;
