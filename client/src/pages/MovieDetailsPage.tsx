import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube';
import { 
    FaPlay, 
    FaBookmark, 
    FaCheck, 
    FaStar, 
    FaArrowLeft, 
    FaTimes, 
    FaAward, 
    FaCheckCircle,
    FaBolt
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import Toast from '../components/Toast';
import { fetchMovieDetails, fetchRecommendations } from '../features/movies/moviesSlice';
import { addToWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { addToHistory } from '../features/history/historySlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';

const MovieDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { selectedMovie, recommendations, loading } = useAppSelector((state) => state.movies);
    const { items: watchlist } = useAppSelector((state) => state.watchlist);
    const { items: historyItems } = useAppSelector((state) => state.history);
    const { user } = useAppSelector((state) => state.auth);

    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [personalRating, setPersonalRating] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const isInWatchlist = watchlist.some((item) => item.imdbID === id);
    const isWatched = historyItems.some((item) => item.imdb_id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
        setShowTrailerModal(false);
        if (id) {
            dispatch(fetchMovieDetails(id));
            dispatch(fetchRecommendations(id));
        }
    }, [dispatch, id]);

    const handleWatchlistToggle = async () => {
        if (!user || !selectedMovie) {
            navigate('/login');
            return;
        }

        if (isInWatchlist) {
            await dispatch(removeFromWatchlist({ userId: user.uid, imdbId: selectedMovie.imdbID }));
            setToastMessage('Removed from Watchlist');
        } else {
            await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: selectedMovie.imdbID,
                movieTitle: selectedMovie.Title,
            }));
            setToastMessage('Added to Watchlist');
        }
    };

    const handleMarkWatched = async () => {
        if (!user || !selectedMovie) {
            navigate('/login');
            return;
        }

        await dispatch(addToHistory({
            userId: user.uid,
            imdbId: selectedMovie.imdbID,
            movieTitle: selectedMovie.Title,
            progress: 100,
        }));
        setToastMessage('Marked as Watched in Cinema Diary');
    };

    const handleRatingClick = (stars: number) => {
        setPersonalRating(stars);
        setToastMessage(`Rated ${stars} / 5 stars`);
    };

    if (loading === 'loading') {
        return (
            <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Extracting film metadata and neural affinities...</p>
                </div>
            </div>
        );
    }

    if (!selectedMovie) {
        return (
            <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2 font-display">Film Not Found</h2>
                    <p className="text-slate-400 text-sm mb-6">Could not retrieve information for this title.</p>
                    <button onClick={() => navigate('/home')} className="btn-gradient">
                        Return to Discover
                    </button>
                </div>
            </div>
        );
    }

    const posterUrl = selectedMovie.Poster && selectedMovie.Poster !== 'N/A'
        ? selectedMovie.Poster
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-10 left-1/3 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none -z-10" />
            <div className="absolute top-80 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            {/* Backdrop Hero Header */}
            <div className="relative w-full border-b border-white/10 overflow-hidden">
                {/* Ambient Blurred Backdrop from Poster */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={posterUrl}
                        alt=""
                        className="w-full h-full object-cover filter blur-3xl opacity-25 scale-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/80 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
                    {/* Back Link */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-6 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Catalog</span>
                    </button>

                    {/* Movie Spotlight Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        {/* Poster Card (3 cols) */}
                        <div className="md:col-span-4 lg:col-span-3">
                            <div className="relative aspect-[2/3] w-full max-w-[280px] mx-auto md:max-w-none rounded-3xl overflow-hidden backdrop-blur-2xl bg-[#0D1017] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                                <img
                                    src={posterUrl}
                                    alt={selectedMovie.Title}
                                    className="w-full h-full object-cover"
                                />
                                {selectedMovie.imdbRating && selectedMovie.imdbRating !== 'N/A' && (
                                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl backdrop-blur-md bg-[#07080B]/85 text-amber-300 text-xs font-bold border border-white/15 flex items-center gap-1.5 shadow-lg">
                                        <FaStar className="text-[10px] text-amber-400" />
                                        <span>{selectedMovie.imdbRating} IMDb</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Panel (9 cols) */}
                        <div className="md:col-span-8 lg:col-span-9 backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-5">
                            {/* Metadata Badges */}
                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan">
                                    <FaBolt className="text-[10px] text-cyan-400" />
                                    <span>96% CineCue Match</span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 font-semibold">{selectedMovie.Year}</span>
                                {selectedMovie.Runtime && (
                                    <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">{selectedMovie.Runtime}</span>
                                )}
                                {selectedMovie.Metascore && selectedMovie.Metascore !== 'N/A' && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        {selectedMovie.Metascore} Metascore
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
                                {selectedMovie.Title}
                            </h1>

                            {/* Genre Chips */}
                            {selectedMovie.Genre && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedMovie.Genre.split(',').map((genre, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium"
                                        >
                                            {genre.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Overview */}
                            <div className="space-y-1.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                                    Synopsis & Themes
                                </h3>
                                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                                    {selectedMovie.Plot || 'No plot summary available.'}
                                </p>
                            </div>

                            {/* Cast & Director */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs border-t border-white/10">
                                {selectedMovie.Director && selectedMovie.Director !== 'N/A' && (
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Director</span>
                                        <span className="font-semibold text-white text-sm">{selectedMovie.Director}</span>
                                    </div>
                                )}
                                {selectedMovie.Actors && selectedMovie.Actors !== 'N/A' && (
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Starring</span>
                                        <span className="font-semibold text-white text-sm">{selectedMovie.Actors}</span>
                                    </div>
                                )}
                                {selectedMovie.Awards && selectedMovie.Awards !== 'N/A' && (
                                    <div className="sm:col-span-2 flex items-center gap-2 text-amber-300/90 pt-1">
                                        <FaAward className="flex-shrink-0 text-amber-400" />
                                        <span>{selectedMovie.Awards}</span>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Action Bar */}
                            <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-white/10">
                                {selectedMovie.trailer_url && (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="btn-gradient px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        <FaPlay className="text-xs" />
                                        <span>Play Official Trailer</span>
                                    </button>
                                )}

                                <button
                                    onClick={handleWatchlistToggle}
                                    className={`btn-glass px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                                        isInWatchlist
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                                            : ''
                                    }`}
                                >
                                    {isInWatchlist ? <FaCheck className="text-cyan-400" /> : <FaBookmark />}
                                    <span>{isInWatchlist ? 'In Watchlist' : '+ Watchlist'}</span>
                                </button>

                                <button
                                    onClick={handleMarkWatched}
                                    className={`btn-glass px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                                        isWatched
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                                            : ''
                                    }`}
                                >
                                    {isWatched ? <FaCheckCircle className="text-emerald-400" /> : <FaCheck />}
                                    <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
                                </button>
                            </div>

                            {/* User 5-Star Rating Feedback */}
                            <div className="pt-2 flex items-center gap-3">
                                <span className="text-xs text-slate-400">Log Personal Rating:</span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRatingClick(star)}
                                            className={`p-1 text-sm transition-transform hover:scale-125 ${
                                                star <= personalRating
                                                    ? 'text-amber-400 drop-shadow-sm'
                                                    : 'text-slate-600 hover:text-amber-300'
                                            }`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendations Matrix Section */}
            {recommendations && recommendations.length > 0 && (
                <section className="max-w-7xl mx-auto w-full pt-12 pb-20 px-4 sm:px-6 lg:px-8">
                    <MovieCarousel 
                        title={`If You Loved "${selectedMovie.Title}"`}
                        subtitle="Curated film recommendations based on tone, narrative depth, and theme"
                        movies={recommendations}
                        showMatchBadge={true}
                        onActionCompleted={setToastMessage}
                    />
                </section>
            )}

            {/* Embedded Trailer Modal */}
            {showTrailerModal && selectedMovie.trailer_url && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl backdrop-blur-2xl bg-[#07080B]/95 border border-white/20 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <span className="text-cyan-400">▶</span>
                                {selectedMovie.Title} — Official 4K Trailer
                            </h3>
                            <button
                                onClick={() => setShowTrailerModal(false)}
                                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="aspect-video w-full bg-black">
                            <ReactPlayer
                                url={selectedMovie.trailer_url}
                                playing={true}
                                controls={true}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    </div>
                </div>
            )}

            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)} 
            />

            <Footer />
        </div>
    );
};

export default MovieDetailsPage;
