import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaSearch, 
    FaMagic, 
    FaPlay, 
    FaBookmark, 
    FaArrowRight, 
    FaCompass
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import apiClient from '../api/apiClient';
import { Movie } from '../types';

const EXAMPLE_PROMPTS = [
    "Mind-bending psychological thrillers",
    "Underrated science fiction gems",
    "Emotional storytelling with great endings",
    "Telugu thrillers with exceptional screenplays",
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchPrompt, setSearchPrompt] = useState('');
    const [previewMovies, setPreviewMovies] = useState<Movie[]>([]);

    useEffect(() => {
        // Fetch trending for the public preview showcase
        apiClient.get('/api/trending')
            .then((res) => setPreviewMovies(res.data || []))
            .catch(() => setPreviewMovies([]));
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchPrompt.trim()) {
            navigate(`/ai-discovery?q=${encodeURIComponent(searchPrompt.trim())}`);
        }
    };

    const handlePromptClick = (prompt: string) => {
        navigate(`/ai-discovery?q=${encodeURIComponent(prompt)}`);
    };

    return (
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {/* Background Ambient Glow */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl h-72 bg-gradient-to-tr from-cinecue-amber/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cinecue-surface border border-cinecue-amber/30 text-cinecue-amber text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
                        <FaMagic className="text-xs" />
                        AI-Powered Film Intelligence
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-sans">
                        Stop Scrolling. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cinecue-amber via-amber-300 to-amber-100">
                            Start Discovering.
                        </span>
                    </h1>

                    <p className="text-base sm:text-xl text-cinecue-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                        Discover your next favourite film with intelligent recommendations tailored to what you love watching. Content-based matching, instant trailers, and a personal cinema diary.
                    </p>

                    {/* Natural Language Search Bar */}
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="max-w-2xl mx-auto bg-cinecue-surface/90 border border-cinecue-border hover:border-cinecue-amber/60 focus-within:border-cinecue-amber p-2 rounded-2xl shadow-card backdrop-blur-md transition-all mb-4 flex items-center gap-2"
                    >
                        <div className="pl-3 text-cinecue-amber">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            value={searchPrompt}
                            onChange={(e) => setSearchPrompt(e.target.value)}
                            placeholder="Describe the movie you're in the mood for..."
                            className="bg-transparent border-none text-white placeholder:text-cinecue-muted-dark text-sm sm:text-base focus:outline-none flex-1 py-2 px-1"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaMagic className="text-xs" />
                            Discover
                        </button>
                    </form>

                    {/* Prompt Pill Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-10 text-xs">
                        <span className="text-cinecue-muted-dark font-medium mr-1">Try:</span>
                        {EXAMPLE_PROMPTS.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(prompt)}
                                className="px-3 py-1 rounded-full bg-cinecue-surface/60 border border-cinecue-border text-cinecue-muted hover:text-cinecue-amber hover:border-cinecue-amber/40 transition"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Action CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link 
                            to="/signup" 
                            className="btn btn-primary text-sm sm:text-base px-7 py-3 rounded-xl shadow-amber-glow"
                        >
                            <FaCompass />
                            Explore Movies
                        </Link>
                        <a 
                            href="#features" 
                            className="btn btn-secondary text-sm sm:text-base px-6 py-3 rounded-xl"
                        >
                            How It Works
                        </a>
                    </div>
                </div>
            </section>

            {/* Trending Preview Carousel */}
            {previewMovies.length > 0 && (
                <section className="max-w-7xl mx-auto w-full mb-20">
                    <MovieCarousel 
                        title="Trending This Week" 
                        subtitle="Acclaimed cinema discovered across the platform"
                        movies={previewMovies} 
                    />
                </section>
            )}

            {/* 3 Core Pillars Section */}
            <section id="features" className="py-20 bg-[#14161C] border-y border-cinecue-border/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-cinecue-amber text-xs font-bold uppercase tracking-widest">
                            Built For Film Lovers
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
                            Everything You Need to Find Great Cinema
                        </h2>
                        <p className="text-cinecue-muted text-sm sm:text-base">
                            CINECUE isn't a streaming service with endless catalog bloat. It's an intelligent cinema companion designed to help you decide what to watch in seconds.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-cinecue-surface border border-cinecue-border/80 p-8 rounded-2xl relative overflow-hidden group hover:border-cinecue-amber/50 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-cinecue-amber/15 border border-cinecue-amber/30 flex items-center justify-center text-cinecue-amber mb-6 group-hover:scale-110 transition-transform">
                                <FaMagic size={22} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">AI Taste Engine</h3>
                            <p className="text-cinecue-muted text-sm leading-relaxed mb-4">
                                Our content-based machine learning engine analyzes movie storylines, directorial style, tone, and character arcs to recommend genuine matches — not just whatever is sponsored.
                            </p>
                            <span className="text-xs font-semibold text-cinecue-amber flex items-center gap-1.5">
                                TF-IDF Content Similarity <FaArrowRight size={10} />
                            </span>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-cinecue-surface border border-cinecue-border/80 p-8 rounded-2xl relative overflow-hidden group hover:border-cinecue-amber/50 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-cinecue-amber/15 border border-cinecue-amber/30 flex items-center justify-center text-cinecue-amber mb-6 group-hover:scale-110 transition-transform">
                                <FaBookmark size={22} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Watchlist & Diary</h3>
                            <p className="text-cinecue-muted text-sm leading-relaxed mb-4">
                                Curate movies you want to watch and log what you've seen. Filter by genre, track your progress, and maintain a clean personal cinema diary inspired by Letterboxd.
                            </p>
                            <span className="text-xs font-semibold text-cinecue-amber flex items-center gap-1.5">
                                Cloud Synced with Neon Postgres <FaArrowRight size={10} />
                            </span>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-cinecue-surface border border-cinecue-border/80 p-8 rounded-2xl relative overflow-hidden group hover:border-cinecue-amber/50 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-cinecue-amber/15 border border-cinecue-amber/30 flex items-center justify-center text-cinecue-amber mb-6 group-hover:scale-110 transition-transform">
                                <FaPlay size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Instant 4K Trailers</h3>
                            <p className="text-cinecue-muted text-sm leading-relaxed mb-4">
                                Preview official HD and 4K trailers directly within the app. Zero external redirect hops, zero advertisements, and instant video playback.
                            </p>
                            <span className="text-xs font-semibold text-cinecue-amber flex items-center gap-1.5">
                                YouTube Data API Caching <FaArrowRight size={10} />
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
                <div className="bg-gradient-to-b from-cinecue-surface to-cinecue-bg-secondary border border-cinecue-border p-10 sm:p-14 rounded-3xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                            Ready to discover your next favourite film?
                        </h2>
                        <p className="text-cinecue-muted text-sm sm:text-base mb-8">
                            Join CINECUE for free. Build your personal watchlist and let our AI engine find stories that resonate with you.
                        </p>
                        <Link 
                            to="/signup" 
                            className="btn btn-primary text-base px-8 py-3.5 rounded-xl font-bold shadow-amber-glow"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
