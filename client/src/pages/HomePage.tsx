import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaPlay, 
    FaInfoCircle, 
    FaBookmark, 
    FaCheck, 
    FaMagic, 
    FaStar,
    FaTimes,
    FaBolt
} from 'react-icons/fa';
import ReactPlayer from 'react-player/youtube';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import SkeletonLoader from '../components/SkeletonLoader';
import Toast from '../components/Toast';
import { fetchTrending, fetchTopRated } from '../features/movies/moviesSlice';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { fetchContinueWatching } from '../features/history/historySlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import apiClient from '../api/apiClient';
import { Movie } from '../types';

const HERO_PROMPT_SUGGESTIONS = [
    "Mind-bending psychological thrillers",
    "Underrated science fiction",
    "Atmospheric neo-noir thrillers",
    "Telugu screenplays with deep narrative",
];

const HomePage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { trending, topRated, loading } = useAppSelector((state) => state.movies);
    const { items: watchlist } = useAppSelector((state) => state.watchlist);
    const { continueWatching } = useAppSelector((state) => state.history);
    const { user } = useAppSelector((state) => state.auth);

    const [personalizedMovies, setPersonalizedMovies] = useState<Movie[]>([]);
    const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchTrending());
        dispatch(fetchTopRated());

        if (user) {
            dispatch(fetchWatchlist(user.uid));
            dispatch(fetchContinueWatching(user.uid));

            // Fetch personalized recommendations (non-blocking)
            apiClient.get(`/api/recommendations/personalized/${user.uid}`, { timeout: 60000 })
                .then((res) => setPersonalizedMovies(res.data || []))
                .catch((err) => {
                    console.log('Personalized recommendations note:', err.message);
                    setPersonalizedMovies([]);
                });
        }
    }, [dispatch, user]);

    // Pick top trending movie as featured banner when loaded
    useEffect(() => {
        if (trending && trending.length > 0 && !featuredMovie) {
            setFeaturedMovie(trending[0]);
        }
    }, [trending, featuredMovie]);

    const handleHeroSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (heroSearchQuery.trim()) {
            navigate(`/ai-discovery?q=${encodeURIComponent(heroSearchQuery.trim())}`);
        }
    };

    const handlePromptClick = (prompt: string) => {
        navigate(`/ai-discovery?q=${encodeURIComponent(prompt)}`);
    };

    const isFeaturedInWatchlist = featuredMovie 
        ? watchlist.some((item) => item.imdbID === featuredMovie.imdbID)
        : false;

    const handleFeaturedWatchlistToggle = async () => {
        if (!user || !featuredMovie) return;

        if (isFeaturedInWatchlist) {
            await dispatch(removeFromWatchlist({ userId: user.uid, imdbId: featuredMovie.imdbID }));
            setToastMessage('Removed from My Watchlist');
        } else {
            await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: featuredMovie.imdbID,
                movieTitle: featuredMovie.Title,
            }));
            setToastMessage('Added to My Watchlist');
        }
    };

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Background Glowing Blobs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-64 right-10 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none -z-10" />

            <Navbar />

            {/* Spatial Hero Section */}
            <div className="relative w-full">
                {/* Hero Backdrop Image with Ambient Bloom */}
                <div className="relative h-[520px] sm:h-[580px] md:h-[640px] w-full overflow-hidden">
                    <img
                        src={
                            featuredMovie?.Poster && featuredMovie.Poster !== 'N/A'
                                ? featuredMovie.Poster
                                : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80"
                        }
                        alt={featuredMovie?.Title || "Featured Movie"}
                        className="w-full h-full object-cover object-top filter brightness-[0.38] contrast-125 scale-105"
                    />

                    {/* Gradient Fades for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#07080B] via-[#07080B]/80 to-transparent" />

                    {/* Spatial Glass Metadata Card Overlay */}
                    <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
                        <div className="max-w-2xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                            {/* Meta Badges */}
                            <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                                {/* Glowing Match Dial Capsule */}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-bold shadow-glow-cyan">
                                    <FaBolt className="text-[10px] text-cyan-400" />
                                    <span>98% CineCue Match</span>
                                </div>

                                {featuredMovie?.imdbRating && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-amber-300 text-xs font-semibold">
                                        <FaStar className="text-[10px] text-amber-400" />
                                        {featuredMovie.imdbRating}
                                    </span>
                                )}

                                {featuredMovie?.Year && (
                                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 text-xs">
                                        {featuredMovie.Year}
                                    </span>
                                )}

                                {featuredMovie?.Genre && (
                                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 text-xs">
                                        {featuredMovie.Genre.split(',')[0]}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3 font-display">
                                {featuredMovie?.Title || "Discover Exceptional Cinema"}
                            </h1>

                            {/* Synopsis */}
                            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 mb-6 max-w-xl leading-relaxed">
                                {featuredMovie?.Plot && featuredMovie.Plot !== 'N/A'
                                    ? featuredMovie.Plot
                                    : "Discover your next favourite film with intelligent recommendations tailored to what you love watching."}
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                {featuredMovie?.trailer_url ? (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="btn-gradient px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
                                    >
                                        <FaPlay className="text-xs" />
                                        <span>Watch Trailer</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie?.imdbID}`)}
                                        className="btn-gradient px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
                                    >
                                        <FaPlay className="text-xs" />
                                        <span>Watch Trailer</span>
                                    </button>
                                )}

                                <button
                                    onClick={handleFeaturedWatchlistToggle}
                                    className={`btn-glass px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                                        isFeaturedInWatchlist
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                                            : ''
                                    }`}
                                >
                                    {isFeaturedInWatchlist ? <FaCheck className="text-cyan-400" /> : <FaBookmark />}
                                    <span>{isFeaturedInWatchlist ? 'In Watchlist' : '+ Watchlist'}</span>
                                </button>

                                {featuredMovie && (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie.imdbID}`)}
                                        className="btn-glass px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5"
                                    >
                                        <FaInfoCircle />
                                        <span>Details</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Natural Language AI Prompt Bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
                    <form 
                        onSubmit={handleHeroSearch}
                        className="backdrop-blur-2xl bg-white/[0.05] border border-white/15 focus-within:border-cyan-400/80 p-2 rounded-2xl flex items-center gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all"
                    >
                        <div className="pl-3 text-cyan-400 animate-pulse">
                            <FaMagic />
                        </div>
                        <input
                            type="text"
                            value={heroSearchQuery}
                            onChange={(e) => setHeroSearchQuery(e.target.value)}
                            placeholder="Ask CineCue: 'Mind-bending sci-fi with philosophical questions like Arrival or Blade Runner 2049'..."
                            className="bg-transparent border-none text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none flex-1 py-1.5"
                        />
                        <button
                            type="submit"
                            className="btn-gradient px-5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                        >
                            AI Synapse Search
                        </button>
                    </form>

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <span className="text-slate-400 font-medium">Try asking:</span>
                        {HERO_PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(suggestion)}
                                className="px-3 py-1 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition text-[11px]"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Discovery Carousels Section */}
            <main className="pt-12 pb-16 flex-1">
                {loading === 'loading' && trending.length === 0 ? (
                    <>
                        <SkeletonLoader />
                        <SkeletonLoader />
                        <SkeletonLoader />
                    </>
                ) : (
                    <>
                        {/* 1. Picked for You (Personalized AI) */}
                        {personalizedMovies.length > 0 && (
                            <MovieCarousel 
                                title="AI Taste Synapse" 
                                subtitle="Neural content matching based on your cinema profile"
                                movies={personalizedMovies} 
                                showMatchBadge={true}
                                onActionCompleted={setToastMessage}
                            />
                        )}

                        {/* 2. Continue Watching */}
                        {continueWatching.length > 0 && (
                            <MovieCarousel 
                                title="Continue Watching" 
                                subtitle="Resume films from your recent diary logs"
                                movies={continueWatching}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 3. Trending This Week */}
                        {trending.length > 0 && (
                            <MovieCarousel 
                                title="Trending Masterpieces" 
                                subtitle="High-resonance films captivating the CINECUE community"
                                movies={trending}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 4. Critically Acclaimed / Top Rated */}
                        {topRated.length > 0 && (
                            <MovieCarousel 
                                title="Critically Acclaimed" 
                                subtitle="Masterworks with the highest historical ratings"
                                movies={topRated}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 5. My Watchlist Preview */}
                        {watchlist.length > 0 && (
                            <MovieCarousel 
                                title="My Personal Watchlist" 
                                subtitle="Films queued up in your personal collection"
                                movies={watchlist}
                                onActionCompleted={setToastMessage} 
                            />
                        )}
                    </>
                )}
            </main>

            {/* Embedded Trailer Modal */}
            {showTrailerModal && featuredMovie?.trailer_url && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl backdrop-blur-2xl bg-[#07080B]/95 border border-white/20 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <span className="text-cyan-400">▶</span>
                                {featuredMovie.Title} — Official Trailer
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
                                url={featuredMovie.trailer_url}
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

export default HomePage;
