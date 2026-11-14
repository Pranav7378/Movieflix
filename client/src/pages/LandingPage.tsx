import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaSearch, 
    FaMagic, 
    FaPlay, 
    FaBookmark, 
    FaArrowRight, 
    FaCompass,
    FaBolt
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCarousel from '../components/MovieCarousel';
import apiClient from '../api/apiClient';
import { Movie } from '../types';

const EXAMPLE_PROMPTS = [
    "Mind-bending psychological thrillers",
    "Underrated science fiction gems",
    "Atmospheric neo-noir storytelling",
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
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/25 blur-[110px] pointer-events-none -z-10" />
            <div className="absolute top-48 right-1/4 w-[450px] h-[450px] rounded-full bg-violet-600/25 blur-[120px] pointer-events-none -z-10" />

            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl bg-white/[0.04] border border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-glow-cyan">
                        <FaBolt className="text-cyan-400 text-xs" />
                        Spatial Cinema Intelligence
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 font-display">
                        Stop Endless Scrolling. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
                            Discover Pure Cinema.
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                        Discover your next favourite film with intelligent recommendations tailored to what you love watching. Translucent spatial design, content-based matching, and instant trailers.
                    </p>

                    {/* Translucent Glass Natural Language Prompt Bar */}
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="max-w-2xl mx-auto backdrop-blur-2xl bg-white/[0.05] border border-white/15 focus-within:border-cyan-400/80 p-2 sm:p-2.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all mb-4 flex items-center gap-2"
                    >
                        <div className="pl-3 text-cyan-400">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            value={searchPrompt}
                            onChange={(e) => setSearchPrompt(e.target.value)}
                            placeholder="Describe what you want to experience..."
                            className="bg-transparent border-none text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-none flex-1 py-1.5 px-2"
                        />
                        <button
                            type="submit"
                            className="btn-gradient px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5"
                        >
                            <FaMagic className="text-xs" />
                            <span>Discover</span>
                        </button>
                    </form>

                    {/* Prompt Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-10 text-xs">
                        <span className="text-slate-400 font-medium mr-1">Try:</span>
                        {EXAMPLE_PROMPTS.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(prompt)}
                                className="px-3 py-1 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Action CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link 
                            to="/signup" 
                            className="btn-gradient text-sm sm:text-base px-7 py-3 rounded-xl flex items-center gap-2"
                        >
                            <FaCompass />
                            <span>Explore Catalog</span>
                        </Link>
                        <a 
                            href="#features" 
                            className="btn-glass text-sm sm:text-base px-6 py-3 rounded-xl"
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
                        title="Community Masterpieces" 
                        subtitle="Acclaimed cinema trending across the CINECUE community"
                        movies={previewMovies} 
                    />
                </section>
            )}

            {/* 3 Core Pillars Section */}
            <section id="features" className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">
                            Cinema Intelligence
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 font-display">
                            Engineered for True Film Lovers
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base">
                            CINECUE isn't a streaming service with endless catalog clutter. It's a spatial cinema companion designed to help you discover masterpieces in seconds.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-cyan-400/50 hover:shadow-glow-cyan transition-all duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform shadow-glow-cyan">
                                <FaMagic size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-display">AI Taste Synapse</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Content-based vector similarity analyzing narrative arcs, directorial aesthetic, pacing, and emotional tone to match films you will love.
                            </p>
                            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                                Intelligent Narrative Matching <FaArrowRight size={10} />
                            </span>
                        </div>

                        {/* Feature 2 */}
                        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-violet-400/50 hover:shadow-glow-violet transition-all duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform shadow-glow-violet">
                                <FaBookmark size={18} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-display">Watchlist & Cinema Diary</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Keep track of every film on your horizon and record your viewing history with timestamps, completion rates, and genre analytics.
                            </p>
                            <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                                Synced Cinema Cloud Diary <FaArrowRight size={10} />
                            </span>
                        </div>

                        {/* Feature 3 */}
                        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-fuchsia-400/50 transition-all duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/30 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform">
                                <FaPlay size={18} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-display">Instant 4K Trailers</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Experience official trailers directly in spatial frosted glass modals. No annoying advertisement redirects or external hops.
                            </p>
                            <span className="text-xs font-semibold text-fuchsia-400 flex items-center gap-1.5">
                                High-Definition Playback <FaArrowRight size={10} />
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Callout Banner */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
                <div className="backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 p-10 sm:p-14 rounded-3xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 font-display">
                            Ready to discover your next favourite film?
                        </h2>
                        <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
                            Start exploring with CINECUE today. Discover movies that truly resonate with your taste.
                        </p>
                        <Link 
                            to="/signup" 
                            className="btn-gradient text-base px-8 py-3.5 rounded-xl font-bold shadow-glow-cyan"
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
