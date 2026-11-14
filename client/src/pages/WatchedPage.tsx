import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCompass, FaSortAmountDown, FaCalendarAlt } from 'react-icons/fa';
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
    const [toastMessage] = useState<string | null>(null);

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
                            <span>Spatial Diary</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                            Cinema Diary
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
                                className="backdrop-blur-md bg-white/[0.05] text-slate-200 text-xs border border-white/10 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
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
                        <Link to="/home" className="btn-gradient text-xs sm:text-sm px-6 py-2.5">
                            <FaCompass /> Discover Films to Log
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sortedHistory.map((item, idx) => (
                            <div
                                key={`${item.imdb_id}-${idx}`}
                                onClick={() => navigate(`/movie/${item.imdb_id}`)}
                                className="group backdrop-blur-2xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/50 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-1">
                                        {item.movie_title}
                                    </h3>
                                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 text-[10px]">
                                        <FaCheckCircle />
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <FaCalendarAlt className="text-[10px] text-cyan-400" />
                                    <span>{new Date(item.last_watched).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</span>
                                </div>
                            </div>
                        ))}
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
