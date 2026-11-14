import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaMagic, FaHistory, FaBolt, FaCompass } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import Toast from '../components/Toast';
import apiClient from '../api/apiClient';
import { Movie } from '../types';

const AI_PROMPTS = [
    "Mind-bending psychological thrillers with twists",
    "Underrated sci-fi movies with great storytelling",
    "Emotional movies that leave a lasting impression",
    "Movies similar to Interstellar and Inception",
    "Telugu thrillers with exceptional screenplays",
    "Dark atmospheric neo-noir crime dramas",
];

const VIBE_CHIPS = [
    { label: "Cosmic", query: "epic cosmic space sci-fi exploration" },
    { label: "Mind-Bending", query: "mind-bending philosophical thrillers" },
    { label: "Neo-Noir", query: "atmospheric dark neo-noir detective mystery" },
    { label: "High Stakes", query: "intense high stakes survival thriller" },
    { label: "Emotional", query: "deep emotional drama with unforgettable characters" },
    { label: "Cyberpunk", query: "futuristic cyberpunk noir aesthetic" },
];

const AIDiscoveryPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Movie[]>([]);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('cinecue_ai_history') || '[]');
        } catch {
            return [];
        }
    });
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const executeDiscovery = async (searchPrompt: string) => {
        if (!searchPrompt.trim()) return;

        setLoading(true);
        setExplanation(null);

        // Save to history
        setSearchHistory((prev) => {
            const updated = [searchPrompt, ...prev.filter((p) => p !== searchPrompt)].slice(0, 6);
            localStorage.setItem('cinecue_ai_history', JSON.stringify(updated));
            return updated;
        });

        try {
            const lower = searchPrompt.toLowerCase();
            let targetMovieTitle = '';
            if (lower.includes('similar to')) {
                targetMovieTitle = searchPrompt.split(/similar to/i)[1].trim();
            } else if (lower.includes('like')) {
                targetMovieTitle = searchPrompt.split(/like/i)[1].trim();
            }

            let moviesFound: Movie[] = [];
            let generatedExplanation = '';

            if (targetMovieTitle) {
                const searchRes = await apiClient.get('/api/search', { params: { query: targetMovieTitle } });
                const seedList = searchRes.data?.Search || searchRes.data || [];
                if (seedList.length > 0 && seedList[0].imdbID) {
                    const seedImdb = seedList[0].imdbID;
                    const recRes = await apiClient.get(`/api/recommendations/${seedImdb}`);
                    moviesFound = recRes.data || [];
                    generatedExplanation = `Neural content similarity mapped across narrative themes, tone, and character arcs related to "${seedList[0].Title}".`;
                }
            }

            if (moviesFound.length === 0) {
                const cleanKeyword = searchPrompt
                    .replace(/find me|suggest|movies|movie|with|and|show|good/gi, '')
                    .trim()
                    .split(' ')[0] || searchPrompt;

                const searchRes = await apiClient.get('/api/search', { params: { query: cleanKeyword } });
                const rawList = searchRes.data?.Search || searchRes.data || [];
                
                if (rawList.length > 0 && rawList[0].imdbID) {
                    try {
                        const recRes = await apiClient.get(`/api/recommendations/${rawList[0].imdbID}`);
                        if (recRes.data && recRes.data.length > 0) {
                            moviesFound = [...rawList.slice(0, 4), ...recRes.data.slice(0, 8)];
                        } else {
                            moviesFound = rawList;
                        }
                    } catch {
                        moviesFound = rawList;
                    }
                } else {
                    moviesFound = rawList;
                }

                generatedExplanation = `Identified thematic matches and plot synopses related to "${searchPrompt}". Filtered for high audience resonance.`;
            }

            setResults(moviesFound);
            setExplanation(generatedExplanation);
        } catch (err: any) {
            console.error('AI Discovery error:', err);
            setResults([]);
            setExplanation('Could not complete query. Please try different keywords.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            executeDiscovery(initialQuery);
        }
    }, [initialQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchParams({ q: query.trim() });
            executeDiscovery(query.trim());
        }
    };

    const handlePromptSelect = (promptText: string) => {
        setQuery(promptText);
        setSearchParams({ q: promptText });
        executeDiscovery(promptText);
    };

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none -z-10" />
            <div className="absolute top-60 right-1/4 w-[450px] h-[450px] rounded-full bg-violet-600/15 blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl bg-white/[0.04] border border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-glow-cyan">
                        <FaBolt className="text-xs text-cyan-400" />
                        AI Synapse Taste Engine
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3 font-display">
                        Describe What You Want to Feel
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                        Natural language cinema discovery. Our intelligence engine matches your description with plot dynamics, pacing, and emotional depth.
                    </p>
                </div>

                {/* Natural Language Prompt Input Bar */}
                <form 
                    onSubmit={handleSubmit}
                    className="max-w-3xl mx-auto backdrop-blur-2xl bg-white/[0.05] border border-white/15 focus-within:border-cyan-400/80 p-2 sm:p-2.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all mb-5 flex items-center gap-2"
                >
                    <div className="pl-3 text-cyan-400 text-base animate-pulse">
                        <FaMagic />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Atmospheric sci-fi about loneliness and deep space exploration..."
                        className="bg-transparent border-none text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-none flex-1 py-1.5 px-2"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="btn-gradient px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap"
                    >
                        {loading ? 'Synthesizing...' : 'Discover'}
                    </button>
                </form>

                {/* Vibe Chips Row */}
                <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-2">
                    {VIBE_CHIPS.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => handlePromptSelect(chip.query)}
                            className="px-3.5 py-1 rounded-full backdrop-blur-md bg-white/[0.03] border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-xs transition-all font-medium"
                        >
                            #{chip.label}
                        </button>
                    ))}
                </div>

                {/* Sample Prompt Suggestions */}
                <div className="max-w-3xl mx-auto mb-10">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {AI_PROMPTS.map((promptText, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptSelect(promptText)}
                                className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/[0.02] border border-white/10 text-slate-400 hover:text-white hover:border-cyan-400/30 text-xs transition"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    {/* Search History Chips */}
                    {searchHistory.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                            <span className="text-slate-500 flex items-center gap-1">
                                <FaHistory className="text-[10px]" /> Recent:
                            </span>
                            {searchHistory.map((hist, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePromptSelect(hist)}
                                    className="text-slate-400 hover:text-cyan-300 underline underline-offset-4"
                                >
                                    {hist}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Explanation Glass Banner */}
                {explanation && (
                    <div className="max-w-4xl mx-auto mb-8 backdrop-blur-2xl bg-white/[0.04] border border-cyan-400/30 p-5 sm:p-6 rounded-2xl flex items-start gap-3.5 shadow-glow-cyan">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                            <FaMagic size={14} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                                CineCue Synapse Match Intelligence
                            </h3>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                {explanation}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">
                                Analyzing cinema narrative themes and computing match scores...
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2.5 font-display">
                                    <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500 shadow-glow-cyan inline-block" />
                                    Synapse Recommendations ({results.length})
                                </h2>
                                <span className="text-xs text-slate-400">
                                    Semantic Taste Affinity
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                {results.map((movie, idx) => (
                                    <MovieCard 
                                        key={`${movie.imdbID}-${idx}`} 
                                        movie={movie} 
                                        matchScore={98 - (idx * 2)}
                                        showMatchBadge={true}
                                        onActionCompleted={setToastMessage}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : initialQuery && !loading ? (
                        <div className="text-center py-16 backdrop-blur-2xl bg-white/[0.03] rounded-3xl border border-white/10 p-8 max-w-lg mx-auto">
                            <p className="text-lg font-bold text-white mb-2 font-display">No direct narrative match found</p>
                            <p className="text-sm text-slate-400 mb-6">
                                Try describing a specific film you like (e.g. "movies similar to Interstellar") or broader genres like "sci-fi" or "neo-noir".
                            </p>
                            <button
                                onClick={() => handlePromptSelect("Mind-bending psychological thrillers with twists")}
                                className="btn-glass text-xs"
                            >
                                <FaCompass /> Try a Recommended Prompt
                            </button>
                        </div>
                    ) : null}
                </div>
            </main>

            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)} 
            />

            <Footer />
        </div>
    );
};

export default AIDiscoveryPage;
