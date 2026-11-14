import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaPlay, 
    FaInfoCircle, 
    FaBookmark, 
    FaCheck, 
    FaMagic, 
    FaStar,
    FaTimes
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
    "Underrated science fiction movies",
    "Emotional movies with powerful storytelling",
    "Telugu movies with exceptional screenplays",
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
            setToastMessage('Removed from My List');
        } else {
            await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: featuredMovie.imdbID,
                movieTitle: featuredMovie.Title,
            }));
            setToastMessage('Added to My List');
        }
    };

    return (
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            {/* Cinematic Featured Hero Billboard */}
            <div className="relative w-full bg-[#101114] border-b border-cinecue-border/60">
                {/* Background Poster/Backdrop Image */}
                <div className="relative h-[480px] sm:h-[540px] md:h-[620px] w-full overflow-hidden">
                    <img
                        src={
                            featuredMovie?.Poster && featuredMovie.Poster !== 'N/A'
                                ? featuredMovie.Poster
                                : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80"
                        }
                        alt={featuredMovie?.Title || "Featured Movie"}
                        className="w-full h-full object-cover object-top filter brightness-[0.4] scale-105"
                    />

                    {/* Gradient Fades: Bottom into page, Left for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-[#101114]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#101114] via-[#101114]/80 to-transparent" />

                    {/* Hero Content Overlay */}
                    <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
                        <div className="max-w-2xl">
                            {/* Meta Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="badge-amber flex items-center gap-1 font-bold">
                                    <FaStar className="text-[10px]" />
                                    {featuredMovie?.imdbRating || '8.9'} IMDb
                                </span>
                                <span className="badge-muted">
                                    {featuredMovie?.Year || '2024'}
                                </span>
                                {featuredMovie?.Genre && (
                                    <span className="badge-muted">
                                        {featuredMovie.Genre.split(',')[0]}
                                    </span>
                                )}
                                <span className="text-xs text-cinecue-muted">
                                    Featured Spotlight
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-3 font-sans">
                                {featuredMovie?.Title || "Discover Exceptional Cinema"}
                            </h1>

                            {/* Synopsis */}
                            <p className="text-sm sm:text-base text-cinecue-muted line-clamp-3 mb-6 max-w-xl leading-relaxed">
                                {featuredMovie?.Plot && featuredMovie.Plot !== 'N/A'
                                    ? featuredMovie.Plot
                                    : "Discover your next favourite film with intelligent recommendations tailored to what you love watching."}
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                {featuredMovie?.trailer_url ? (
                                    <button
                                        onClick={() => setShowTrailerModal(true)}
                                        className="btn btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-amber-glow"
                                    >
                                        <FaPlay className="text-xs" />
                                        Watch Trailer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie?.imdbID}`)}
                                        className="btn btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm shadow-amber-glow"
                                    >
                                        <FaPlay className="text-xs" />
                                        Watch Trailer
                                    </button>
                                )}

                                <button
                                    onClick={handleFeaturedWatchlistToggle}
                                    className={`btn px-5 py-2.5 rounded-xl text-sm transition-all ${
                                        isFeaturedInWatchlist
                                            ? 'bg-cinecue-amber/20 text-cinecue-amber border border-cinecue-amber/50'
                                            : 'btn-secondary'
                                    }`}
                                >
                                    {isFeaturedInWatchlist ? <FaCheck /> : <FaBookmark />}
                                    {isFeaturedInWatchlist ? 'In My List' : 'Add to My List'}
                                </button>

                                {featuredMovie && (
                                    <button
                                        onClick={() => navigate(`/movie/${featuredMovie.imdbID}`)}
                                        className="btn btn-secondary px-5 py-2.5 rounded-xl text-sm"
                                    >
                                        <FaInfoCircle />
                                        More Details
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Natural Language Search Box (Hero Banner Sub-Bar) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <form 
                        onSubmit={handleHeroSearch}
                        className="bg-cinecue-surface border border-cinecue-border hover:border-cinecue-amber/50 focus-within:border-cinecue-amber p-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                        <div className="pl-3 text-cinecue-amber">
                            <FaMagic />
                        </div>
                        <input
                            type="text"
                            value={heroSearchQuery}
                            onChange={(e) => setHeroSearchQuery(e.target.value)}
                            placeholder="Describe the movie you're in the mood for... (e.g. mind-bending psychological thrillers)"
                            className="bg-transparent border-none text-white placeholder:text-cinecue-muted-dark text-xs sm:text-sm focus:outline-none flex-1 py-1.5"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                        >
                            AI Search
                        </button>
                    </form>

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <span className="text-cinecue-muted-dark font-medium">Quick suggestions:</span>
                        {HERO_PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(suggestion)}
                                className="px-2.5 py-0.5 rounded-full bg-cinecue-surface-light border border-cinecue-border text-cinecue-muted hover:text-cinecue-amber hover:border-cinecue-amber/40 transition text-[11px]"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Discovery Carousels Section */}
            <main className="pt-8 pb-16 flex-1">
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
                                title="Picked for You" 
                                subtitle="Curated by our content engine based on your cinema profile"
                                movies={personalizedMovies} 
                                showMatchBadge={true}
                                onActionCompleted={setToastMessage}
                            />
                        )}

                        {/* 2. Continue Watching */}
                        {continueWatching.length > 0 && (
                            <MovieCarousel 
                                title="Continue Watching" 
                                subtitle="Jump back into films you recently started"
                                movies={continueWatching}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 3. Trending This Week */}
                        {trending.length > 0 && (
                            <MovieCarousel 
                                title="Trending This Week" 
                                subtitle="The most discovered films across the CINECUE community"
                                movies={trending}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 4. Critically Acclaimed / Top Rated */}
                        {topRated.length > 0 && (
                            <MovieCarousel 
                                title="Critically Acclaimed" 
                                subtitle="Masterpieces holding the highest community and critic marks"
                                movies={topRated}
                                onActionCompleted={setToastMessage} 
                            />
                        )}

                        {/* 5. My Watchlist Preview */}
                        {watchlist.length > 0 && (
                            <MovieCarousel 
                                title="My List" 
                                subtitle="Films waiting on your personal queue"
                                movies={watchlist}
                                onActionCompleted={setToastMessage} 
                            />
                        )}
                    </>
                )}
            </main>

            {/* Embedded Trailer Modal */}
            {showTrailerModal && featuredMovie?.trailer_url && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl bg-cinecue-surface border border-cinecue-border rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-cinecue-border/60 bg-[#14161C]">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <span className="text-cinecue-amber">▶</span>
                                {featuredMovie.Title} — Official Trailer
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
