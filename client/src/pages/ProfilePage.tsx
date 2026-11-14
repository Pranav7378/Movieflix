import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FaUser, 
    FaBookmark, 
    FaCheckCircle, 
    FaMagic, 
    FaSignOutAlt, 
    FaStar
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { logoutUser } from '../features/auth/authSlice';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';
import { fetchHistory } from '../features/history/historySlice';
import { RootState, AppDispatch } from '../app/store';

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { items: watchlist } = useSelector((state: RootState) => state.watchlist);
    const { items: historyItems } = useSelector((state: RootState) => state.history);

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

    // Calculate Movie Personality based on user activity
    const moviePersonality = useMemo(() => {
        const totalActivity = watchlist.length + historyItems.length;
        if (totalActivity === 0) {
            return {
                title: "The Emerging Cinephile",
                description: "You're at the beginning of your cinema discovery journey. Save films to your watchlist to unlock deeper taste analytics.",
                tag: "Level 1 Explorer"
            };
        }

        // Check genre occurrences in watchlist
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
                title: "The Sci-Fi Explorer",
                description: "You are fascinated by cosmic scale, futuristic technologies, speculative concepts, and visual worldbuilding.",
                tag: "Cosmic & High Concept"
            };
        }
        if (topGenre === 'Thriller' || topGenre === 'Mystery') {
            return {
                title: "The Thriller Addict",
                description: "You thrive on narrative suspense, psychological tension, unforeseen plot twists, and intricate mystery.",
                tag: "Suspense & High Stakes"
            };
        }
        if (topGenre === 'Drama') {
            return {
                title: "The Storytelling Enthusiast",
                description: "You appreciate character-driven narratives, deep emotional arcs, authentic human connections, and timeless storytelling.",
                tag: "Humanistic & Narrative"
            };
        }

        return {
            title: "The Diverse Connoisseur",
            description: "Your taste spans multiple genres and cinema eras with an open appreciation for all compelling filmmaking styles.",
            tag: "Eclectic Film Lover"
        };
    }, [watchlist, historyItems]);

    return (
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Profile Header Card */}
                <div className="bg-cinecue-surface border border-cinecue-border p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cinecue-surface-light border-2 border-cinecue-amber/40 flex items-center justify-center text-cinecue-amber text-3xl shadow-amber-glow flex-shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <FaUser />
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                                    {user?.displayName || 'Film Connoisseur'}
                                </h1>
                                <p className="text-xs sm:text-sm text-cinecue-muted mt-0.5">{user?.email}</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary text-xs sm:text-sm px-4 py-2 text-cinecue-crimson hover:bg-cinecue-crimson/10 border-cinecue-crimson/30 self-center sm:self-auto"
                            >
                                <FaSignOutAlt className="text-xs" />
                                Sign Out
                            </button>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                            <div className="bg-cinecue-bg-secondary border border-cinecue-border/80 px-4 py-2 rounded-xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-cinecue-muted block">Watchlist</span>
                                <span className="text-lg font-bold text-cinecue-amber">{watchlist.length}</span>
                            </div>
                            <div className="bg-cinecue-bg-secondary border border-cinecue-border/80 px-4 py-2 rounded-xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-cinecue-muted block">Watched Diary</span>
                                <span className="text-lg font-bold text-emerald-400">{historyItems.length}</span>
                            </div>
                            <div className="bg-cinecue-bg-secondary border border-cinecue-border/80 px-4 py-2 rounded-xl text-center sm:text-left">
                                <span className="text-[11px] uppercase tracking-wider text-cinecue-muted block">AI Model</span>
                                <span className="text-xs font-semibold text-white">TF-IDF Synced</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movie Personality Spotlight */}
                <div className="bg-gradient-to-r from-cinecue-surface via-cinecue-surface to-cinecue-bg-secondary border border-cinecue-border p-6 sm:p-8 rounded-3xl mb-10 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cinecue-amber/15 border border-cinecue-amber/30 text-cinecue-amber flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
                            <FaMagic />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="badge-amber font-bold text-[11px] uppercase tracking-wider">
                                    Your Cinema Personality
                                </span>
                                <span className="text-xs text-cinecue-muted">
                                    {moviePersonality.tag}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                                {moviePersonality.title}
                            </h2>
                            <p className="text-sm text-cinecue-muted leading-relaxed max-w-3xl">
                                {moviePersonality.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout: Watchlist Preview & Watched History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Watchlist Summary */}
                    <div className="bg-cinecue-surface border border-cinecue-border p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cinecue-border">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <FaBookmark className="text-cinecue-amber text-xs" />
                                Watchlist Preview ({watchlist.length})
                            </h3>
                            <Link to="/watchlist" className="text-xs text-cinecue-amber hover:underline font-semibold">
                                View Full List →
                            </Link>
                        </div>

                        {watchlist.length === 0 ? (
                            <p className="text-xs text-cinecue-muted py-6 text-center">
                                No movies added to your watchlist yet.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {watchlist.slice(0, 5).map((movie) => (
                                    <div
                                        key={movie.imdbID}
                                        onClick={() => navigate(`/movie/${movie.imdbID}`)}
                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <img
                                                src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75'}
                                                alt={movie.Title}
                                                className="w-9 h-13 object-cover rounded-md flex-shrink-0"
                                            />
                                            <div className="truncate">
                                                <h4 className="text-xs font-semibold text-white truncate">{movie.Title}</h4>
                                                <span className="text-[11px] text-cinecue-muted">{movie.Year}</span>
                                            </div>
                                        </div>
                                        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                                            <span className="text-xs font-bold text-cinecue-amber flex items-center gap-1 flex-shrink-0 ml-2">
                                                <FaStar className="text-[10px]" /> {movie.imdbRating}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cinema Diary Summary */}
                    <div className="bg-cinecue-surface border border-cinecue-border p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cinecue-border">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-400 text-xs" />
                                Cinema Diary ({historyItems.length})
                            </h3>
                            <Link to="/watched" className="text-xs text-cinecue-amber hover:underline font-semibold">
                                View Full Diary →
                            </Link>
                        </div>

                        {historyItems.length === 0 ? (
                            <p className="text-xs text-cinecue-muted py-6 text-center">
                                No films marked as watched yet.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {historyItems.slice(0, 5).map((item, idx) => (
                                    <div
                                        key={`${item.imdb_id}-${idx}`}
                                        onClick={() => navigate(`/movie/${item.imdb_id}`)}
                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition"
                                    >
                                        <div className="truncate">
                                            <h4 className="text-xs font-semibold text-white truncate">{item.movie_title}</h4>
                                            <span className="text-[11px] text-cinecue-muted">
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
