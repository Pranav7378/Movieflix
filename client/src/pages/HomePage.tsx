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

        try {
            if (isFeaturedInWatchlist) {
                await dispatch(removeFromWatchlist({ userId: user.uid, imdbId: featuredMovie.imdbID })).unwrap();
                setToastMessage('Removed from My Watchlist');
            } else {
                await dispatch(addToWatchlist({
                    userId: user.uid,
                    imdbId: featuredMovie.imdbID,
                    movieTitle: featuredMovie.Title,
                })).unwrap();
                setToastMessage('Added to My Watchlist');
            }
        } catch {
            setToastMessage('Failed to update Watchlist. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Background Glowing Blobs */}
            <div className="absolute top-12 left-1/4 w-[420px] h-[420px] rounded-full bg-cyan-500/25 blur-[100px] pointer-events-none -z-10" />
            <div className="absolute top-80 right-10 w-[520px] h-[520px] rounded-full bg-violet-600/25 blur-[120px] pointer-events-none -z-10" />

            <Navbar />

            {/* Cinematic Framed Billboard (Netflix Style) */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">
                <div className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] lg:h-[680px] rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] group">
                    {/* Ambient Aura behind the framed billboard */}
                    <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-r from-cyan-500/20 via-violet-600/15 to-transparent blur-2xl opacity-60 pointer-events-none -z-10" />

                    {/* Hero Backdrop Image with Scale on Hover */}
                    <img
                        src={
                            featuredMovie?.Poster && featuredMovie.Poster !== 'N/A'
                                ? featuredMovie.Poster
                                : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80"
                        }
                        alt={featuredMovie?.Title || "Featured Movie"}
                        className="w-full h-full object-cover object-center sm:object-top filter brightness-[0.85] contrast-[1.08] transition-transform duration-1000 ease-out group-hover:scale-105"
                    />

                    {/* Atmospheric Vignette Gradients (Cinematic Scene Integration) */}
                    {/* Left horizontal vignette for crisp text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#07080B] via-[#07080B]/80 sm:via-[#07080B]/60 to-transparent w-full md:w-[75%]" />
                    {/* Bottom vertical vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/40 to-transparent" />
                    {/* Top subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#07080B]/60 via-transparent to-transparent" />

                    {/* Content Overlay directly integrated into the cinematic scene */}
                    <div className="absolute inset-0 p-6 sm:p-10 md:p-14 flex flex-col justify-end z-10">
                        <div className="max-w-2xl">
                            {/* Stylized Movie Title */}
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08] mb-3.5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] font-display">
                                {featuredMovie?.Title || "Discover Exceptional Cinema"}
                            </h1>

                            {/* Clean Inline Metadata Line (Netflix Style) */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-slate-300 drop-shadow mb-3.5">
                                <span className="capitalize">{featuredMovie?.Type || 'Film'}</span>
                                <span className="text-slate-500">•</span>
                                <span>{featuredMovie?.Genre?.split(',')[0] || 'Action'}</span>
                                <span className="text-slate-500">•</span>
                                <span>{featuredMovie?.Year || '2024'}</span>
                                {featuredMovie?.Runtime && (
                                    <>
                                        <span className="text-slate-500">•</span>
                                        <span>{featuredMovie.Runtime}</span>
                                    </>
                                )}
                                {featuredMovie?.imdbRating && (
                                    <>
                                        <span className="text-slate-500">•</span>
                                        <span className="flex items-center gap-1 text-amber-300 font-semibold">
                                            <FaStar className="text-[11px] text-amber-400" />
                                            {featuredMovie.imdbRating}
                                        </span>
                                    </>
                                )}
                                <span className="text-slate-500">•</span>
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-400/40 shadow-glow-pill">
                                    <FaBolt className="text-[10px] text-cyan-400 animate-pulse" />
                                    <span>98% CineCue Match</span>
                                </span>
                            </div>

                            {/* Synopsis / Overview */}
                            <p className="text-xs sm:text-sm md:text-base text-slate-200/95 line-clamp-3 leading-relaxed mb-6 sm:mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-xl">
                                {featuredMovie?.Plot && featuredMovie.Plot !== 'N/A'
                                    ? featuredMovie.Plot
                                    : "Discover your next favourite film with intelligent recommendations tailored to what you love watching."}
                            </p>

                            {/* Action Buttons (Netflix Style Pills) */}
                            <div className="flex flex-wrap items-center gap-3">
                                {featuredMovie?.trailer_url ? (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-7 py-3 rounded-full flex items-center gap-2.5 shadow-[0_4px_25px_rgba(255,255,255,0.3)] active:scale-95 transition-all text-sm sm:text-base group/btn cursor-pointer"
                                    >
                                        <FaPlay className="text-xs text-slate-900 transition-transform group-hover/btn:scale-110" />
                                        <span>Watch Trailer</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie?.imdbID}`)}
                                        className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-7 py-3 rounded-full flex items-center gap-2.5 shadow-[0_4px_25px_rgba(255,255,255,0.3)] active:scale-95 transition-all text-sm sm:text-base group/btn cursor-pointer"
                                    >
                                        <FaPlay className="text-xs text-slate-900 transition-transform group-hover/btn:scale-110" />
                                        <span>Watch Trailer</span>
                                    </button>
                                )}

                                {featuredMovie && (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie.imdbID}`)}
                                        className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-full backdrop-blur-md border border-white/25 flex items-center gap-2 active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
                                    >
                                        <FaInfoCircle className="text-sm" />
                                        <span>More Info</span>
                                    </button>
                                )}

                                <button
                                    onClick={handleFeaturedWatchlistToggle}
                                    className={`px-5 py-3 rounded-full backdrop-blur-md border transition-all text-sm sm:text-base flex items-center gap-2 active:scale-95 cursor-pointer ${
                                        isFeaturedInWatchlist
                                            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-glow-pill'
                                            : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                                    }`}
                                >
                                    {isFeaturedInWatchlist ? <FaCheck className="text-cyan-400 text-xs" /> : <FaBookmark className="text-xs" />}
                                    <span>{isFeaturedInWatchlist ? 'In Watchlist' : '+ Watchlist'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Right-aligned Ranking Badge */}
                        <div className="hidden md:flex items-center gap-2.5 absolute bottom-8 sm:bottom-10 right-6 sm:right-10 z-10 pointer-events-none">
                            <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-600/90 to-blue-700/90 text-white text-xs font-black tracking-wider flex items-center gap-1.5 shadow-xl border border-cyan-400/30">
                                <span className="text-[9px] bg-white text-cyan-800 px-1.5 py-0.5 rounded font-black tracking-normal">FEATURED</span>
                                <span>#1 in CineCue</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Natural Language AI Prompt Bar */}
                <div className="relative z-20 mt-6 sm:mt-8">
                    <div className="relative">
                        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-violet-500/20 to-fuchsia-500/10 blur-lg opacity-60 pointer-events-none" />
                        <form 
                            onSubmit={handleHeroSearch}
                            className="relative backdrop-blur-2xl bg-[#090D15]/85 border border-white/15 focus-within:border-cyan-400/90 focus-within:shadow-glow-cyan-sm p-1.5 sm:p-2 rounded-2xl shadow-xl transition-all flex items-center gap-3"
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
                                className="btn-gradient px-5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                            >
                                AI Search
                            </button>
                        </form>
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <span className="text-slate-400 font-medium">Try asking:</span>
                        {HERO_PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(suggestion)}
                                className="px-3 py-1 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition text-[11px] cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-300">
                    {/* Ambient Glow behind modal */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[550px] h-[350px] bg-gradient-to-r from-cyan-500/25 via-violet-600/25 to-fuchsia-600/20 blur-[100px] rounded-full" />
                    </div>
                    <div className="relative w-full max-w-4xl backdrop-blur-2xl bg-[#080B12]/95 border border-white/20 rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.2)] transform transition-all duration-300 animate-in zoom-in-95">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <span className="text-cyan-400">▶</span>
                                {featuredMovie.Title} — Official 4K Trailer
                            </h3>
                            <button
                                onClick={() => setShowTrailerModal(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <FaTimes size={16} />
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
