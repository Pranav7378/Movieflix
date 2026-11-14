import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FaUser, 
    FaBookmark, 
    FaCheckCircle, 
    FaMagic, 
    FaSignOutAlt, 
    FaStar,
    FaSun,
    FaMoon,
    FaBolt
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { logoutUser } from '../features/auth/authSlice';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';
import { fetchHistory } from '../features/history/historySlice';
import { RootState, AppDispatch } from '../app/store';
import { useTheme } from '../context/ThemeContext';

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { items: watchlist } = useSelector((state: RootState) => state.watchlist);
    const { items: historyItems } = useSelector((state: RootState) => state.history);
    const { theme, toggleTheme } = useTheme();

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            dispatch(fetchWatchlist(user.uid));
            dispatch(fetchHistory(user.uid));
        }
    }, [dispatch, user]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/');
    };

    const moviePersonality = useMemo(() => {
        const totalActivity = watchlist.length + historyItems.length;
        if (totalActivity === 0) {
            return {
                title: "The Emerging Cinephile",
                description: "You're at the beginning of your cinema discovery journey. Save films to your watchlist to unlock deeper taste analytics.",
                tag: "Level 1 Explorer"
            };
        }

        const genreCounts: { [key: string]: number } = {};
        watchlist.forEach((m) => {
            if (m.Genre) {
                m.Genre.split(',').forEach((g) => {
                    const clean = g.trim();
                    genreCounts[clean] = (genreCounts[clean] || 0) + 1;
                });
            }
        });

        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

        if (topGenre === 'Sci-Fi') {
            return {
                title: "The Sci-Fi Visionary",
                description: "You are fascinated by cosmic scale, futuristic technologies, speculative concepts, and visual worldbuilding.",
                tag: "Cosmic & High Concept"
            };
        }
        if (topGenre === 'Thriller' || topGenre === 'Mystery') {
            return {
                title: "The Suspense Connoisseur",
                description: "You thrive on narrative suspense, psychological tension, unforeseen plot twists, and intricate mystery.",
                tag: "Suspense & High Stakes"
            };
        }
        if (topGenre === 'Drama') {
            return {
                title: "The Narrative Purist",
                description: "You appreciate character-driven storytelling, deep emotional arcs, authentic human connections, and timeless cinema.",
                tag: "Humanistic & Narrative"
            };
        }

        return {
            title: "The Eclectic Cinephile",
            description: "Your taste spans multiple genres and cinema eras with an open appreciation for all compelling filmmaking styles.",
            tag: "Diverse Taste Profile"
        };
    }, [watchlist, historyItems]);

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none -z-10" />
            <div className="absolute top-64 right-10 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Profile Header Card */}
                <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-3xl shadow-glow-cyan flex-shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <FaUser />
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                                    {user?.displayName || 'Film Connoisseur'}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{user?.email}</p>
                            </div>

                            <div className="flex items-center gap-2 self-center sm:self-auto">
                                <button
                                    onClick={toggleTheme}
                                    className="btn-glass text-xs px-3.5 py-2 flex items-center gap-1.5"
                                    title="Toggle Interface Appearance"
                                >
                                    {theme === 'dark' ? <FaSun className="text-amber-400" /> : <FaMoon className="text-cyan-400" />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="btn-glass text-xs px-3.5 py-2 text-rose-400 hover:border-rose-500/50 flex items-center gap-1.5"
                                >
                                    <FaSignOutAlt className="text-xs" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                            <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 px-4 py-2 rounded-2xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Watchlist</span>
                                <span className="text-lg font-bold text-cyan-400">{watchlist.length}</span>
                            </div>
                            <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 px-4 py-2 rounded-2xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Watched Diary</span>
                                <span className="text-lg font-bold text-emerald-400">{historyItems.length}</span>
                            </div>
                            <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 px-4 py-2 rounded-2xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Taste Synapse</span>
                                <span className="text-xs font-semibold text-white flex items-center gap-1 mt-1">
                                    <FaBolt className="text-[10px] text-cyan-400" /> Active Profile
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movie Personality Spotlight */}
                <div className="backdrop-blur-2xl bg-white/[0.04] border border-cyan-400/30 p-6 sm:p-8 rounded-3xl mb-10 relative overflow-hidden shadow-glow-cyan">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xl shadow-glow-cyan">
                            <FaMagic />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                                    Cinema Personality
                                </span>
                                <span className="text-xs text-slate-400">
                                    {moviePersonality.tag}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                                {moviePersonality.title}
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                                {moviePersonality.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout: Watchlist Preview & Watched History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Watchlist Summary */}
                    <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                            <h3 className="font-bold text-base text-white flex items-center gap-2 font-display">
                                <FaBookmark className="text-cyan-400 text-xs" />
                                Watchlist Preview ({watchlist.length})
                            </h3>
                            <Link to="/watchlist" className="text-xs text-cyan-400 hover:underline font-semibold">
                                View Full List →
                            </Link>
                        </div>

                        {watchlist.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">
                                No movies added to your watchlist yet.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {watchlist.slice(0, 5).map((movie) => (
                                    <div
                                        key={movie.imdbID}
                                        onClick={() => navigate(`/movie/${movie.imdbID}`)}
                                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/10 cursor-pointer transition border border-transparent hover:border-white/10"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <img
                                                src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'}
                                                alt={movie.Title}
                                                className="w-9 h-12 object-cover rounded-xl flex-shrink-0"
                                            />
                                            <div className="truncate">
                                                <h4 className="text-xs font-semibold text-white truncate">{movie.Title}</h4>
                                                <span className="text-[11px] text-slate-400">{movie.Year}</span>
                                            </div>
                                        </div>
                                        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 flex-shrink-0 ml-2">
                                                <FaStar className="text-[10px]" /> {movie.imdbRating}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cinema Diary Summary */}
                    <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                            <h3 className="font-bold text-base text-white flex items-center gap-2 font-display">
                                <FaCheckCircle className="text-emerald-400 text-xs" />
                                Cinema Diary ({historyItems.length})
                            </h3>
                            <Link to="/watched" className="text-xs text-emerald-400 hover:underline font-semibold">
                                View Full Diary →
                            </Link>
                        </div>

                        {historyItems.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">
                                No films marked as watched yet.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {historyItems.slice(0, 5).map((item, idx) => (
                                    <div
                                        key={`${item.imdb_id}-${idx}`}
                                        onClick={() => navigate(`/movie/${item.imdb_id}`)}
                                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/10 cursor-pointer transition border border-transparent hover:border-white/10"
                                    >
                                        <div className="truncate">
                                            <h4 className="text-xs font-semibold text-white truncate">{item.movie_title}</h4>
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(item.last_watched).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-emerald-400">
                                            {item.progress >= 100 ? 'Watched' : `${item.progress}%`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProfilePage;
