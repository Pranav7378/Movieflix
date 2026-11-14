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
    FaMagic
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
            setToastMessage('Removed from My Watchlist');
        } else {
            await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: selectedMovie.imdbID,
                movieTitle: selectedMovie.Title,
            }));
            setToastMessage('Added to My Watchlist');
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
            <div className="min-h-screen bg-[#101114] text-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-12 h-12 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                    <p className="text-cinecue-muted text-sm font-medium">Loading film details from archive...</p>
                </div>
            </div>
        );
    }

    if (!selectedMovie) {
        return (
            <div className="min-h-screen bg-[#101114] text-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Film Not Found</h2>
                    <p className="text-cinecue-muted text-sm mb-6">Could not retrieve information for this title.</p>
                    <button onClick={() => navigate('/home')} className="btn btn-primary">
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
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            {/* Backdrop Hero Header */}
            <div className="relative w-full border-b border-cinecue-border/60 bg-[#14161C] overflow-hidden">
                {/* Ambient Blurred Backdrop */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={posterUrl}
                        alt=""
                        className="w-full h-full object-cover filter blur-3xl opacity-20 scale-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-[#101114]/80 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
                    {/* Back Link */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-cinecue-muted hover:text-cinecue-amber transition-colors mb-6 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        Back to Explore
                    </button>

                    {/* Movie Spotlight Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        {/* Poster Card (4 cols) */}
                        <div className="md:col-span-4 lg:col-span-3">
                            <div className="relative aspect-[2/3] w-full max-w-[280px] mx-auto md:max-w-none rounded-2xl overflow-hidden bg-cinecue-surface border border-cinecue-border shadow-card">
                                <img
                                    src={posterUrl}
                                    alt={selectedMovie.Title}
                                    className="w-full h-full object-cover"
                                />
                                {selectedMovie.imdbRating && selectedMovie.imdbRating !== 'N/A' && (
                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#101114]/90 text-cinecue-amber text-xs font-bold border border-cinecue-amber/30 flex items-center gap-1 shadow-md">
                                        <FaStar className="text-[10px]" />
                                        {selectedMovie.imdbRating} IMDb
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details (8 cols) */}
                        <div className="md:col-span-8 lg:col-span-9 space-y-5">
                            {/* Metadata Badges */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="badge-amber font-semibold">{selectedMovie.Year}</span>
                                {selectedMovie.Runtime && (
                                    <span className="badge-muted">{selectedMovie.Runtime}</span>
                                )}
                                {selectedMovie.Type && (
                                    <span className="badge-muted uppercase">{selectedMovie.Type}</span>
                                )}
                                {selectedMovie.Metascore && selectedMovie.Metascore !== 'N/A' && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        {selectedMovie.Metascore} Metascore
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                {selectedMovie.Title}
                            </h1>

                            {/* Genres */}
                            {selectedMovie.Genre && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedMovie.Genre.split(',').map((genre, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full bg-cinecue-surface border border-cinecue-border text-cinecue-muted text-xs font-medium"
                                        >
                                            {genre.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Overview */}
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-cinecue-muted">
                                    Overview
                                </h3>
                                <p className="text-cinecue-text text-sm sm:text-base leading-relaxed">
                                    {selectedMovie.Plot || 'No plot summary available.'}
                                </p>
                            </div>

                            {/* Crew info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                                {selectedMovie.Director && selectedMovie.Director !== 'N/A' && (
                                    <div>
                                        <span className="text-cinecue-muted block">Director:</span>
                                        <span className="font-semibold text-white">{selectedMovie.Director}</span>
                                    </div>
                                )}
                                {selectedMovie.Actors && selectedMovie.Actors !== 'N/A' && (
                                    <div>
                                        <span className="text-cinecue-muted block">Starring:</span>
                                        <span className="font-semibold text-white">{selectedMovie.Actors}</span>
                                    </div>
                                )}
                                {selectedMovie.Awards && selectedMovie.Awards !== 'N/A' && (
                                    <div className="sm:col-span-2 flex items-center gap-2 text-cinecue-amber/90">
                                        <FaAward className="flex-shrink-0" />
                                        <span>{selectedMovie.Awards}</span>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Action Bar */}
                            <div className="pt-4 flex flex-wrap items-center gap-3">
                                {selectedMovie.trailer_url && (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="btn btn-primary px-6 py-2.5 rounded-xl font-semibold shadow-amber-glow"
                                    >
                                        <FaPlay className="text-xs" />
                                        Play Official Trailer
                                    </button>
                                )}

                                <button
                                    onClick={handleWatchlistToggle}
                                    className={`btn px-5 py-2.5 rounded-xl text-sm transition-all ${
                                        isInWatchlist
                                            ? 'bg-cinecue-amber/20 text-cinecue-amber border border-cinecue-amber/50'
                                            : 'btn-secondary'
                                    }`}
                                >
                                    {isInWatchlist ? <FaCheck /> : <FaBookmark />}
                                    {isInWatchlist ? 'In My Watchlist' : 'Add to Watchlist'}
                                </button>

                                <button
                                    onClick={handleMarkWatched}
                                    className={`btn px-5 py-2.5 rounded-xl text-sm transition-all ${
                                        isWatched
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                            : 'btn-secondary'
                                    }`}
                                >
                                    <FaCheckCircle />
                                    {isWatched ? 'Watched' : 'Mark as Watched'}
                                </button>
                            </div>

                            {/* Letterboxd-Style Personal 5-Star Rating Widget */}
                            <div className="pt-3 flex items-center gap-3 bg-cinecue-surface/60 border border-cinecue-border/60 p-3.5 rounded-xl max-w-md">
                                <span className="text-xs font-semibold text-cinecue-muted">
                                    Your Rating:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRatingClick(star)}
                                            className="p-1 hover:scale-125 transition-transform focus:outline-none"
                                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        >
                                            <FaStar 
                                                className={`text-base transition-colors ${
                                                    star <= personalRating 
                                                        ? 'text-cinecue-amber drop-shadow-[0_0_8px_rgba(229,164,92,0.6)]' 
                                                        : 'text-cinecue-border hover:text-cinecue-amber/50'
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                                {personalRating > 0 && (
                                    <span className="text-xs text-cinecue-amber font-bold ml-auto">
                                        {personalRating} / 5
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why You'll Like This Movie (AI Content Analysis Box) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <div className="bg-gradient-to-r from-cinecue-surface via-cinecue-surface to-cinecue-bg-secondary border border-cinecue-border p-6 sm:p-8 rounded-2xl relative overflow-hidden">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cinecue-amber/15 border border-cinecue-amber/30 flex items-center justify-center text-cinecue-amber flex-shrink-0 mt-0.5">
                            <FaMagic size={18} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                Why You'll Like This Movie
                                <span className="badge-amber text-[10px]">AI Insight</span>
                            </h3>
                            <p className="text-sm text-cinecue-muted leading-relaxed">
                                {selectedMovie.Genre 
                                    ? `Matches your taste for ${selectedMovie.Genre.toLowerCase()} cinema with strong narrative pacing. Recommended for viewers who appreciate immersive visual direction from ${selectedMovie.Director || 'acclaimed filmmakers'} and high critical acclaim.`
                                    : "Matches your cinema profile with compelling thematic storylines and strong visual worldbuilding."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Similar Movies / More Like This (Backend TF-IDF ML Engine) */}
            {recommendations && recommendations.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                    <MovieCarousel 
                        title="More Like This" 
                        subtitle="Content-based recommendations generated from plot themes and style similarity"
                        movies={recommendations}
                        showMatchBadge={true}
                        onActionCompleted={setToastMessage}
                    />
                </section>
            )}

            {/* Embedded YouTube Trailer Modal */}
            {showTrailerModal && selectedMovie.trailer_url && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl bg-cinecue-surface border border-cinecue-border rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-cinecue-border/60 bg-[#14161C]">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <span className="text-cinecue-amber">▶</span>
                                {selectedMovie.Title} — Official Trailer
                            </h3>
                            <button
                                onClick={() => setShowTrailerModal(false)}
                                className="text-cinecue-muted hover:text-white p-1 rounded-lg"
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
