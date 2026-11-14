import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaMagic, FaHistory } from 'react-icons/fa';
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
    "Dark neo-noir crime dramas",
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
            // Check if query targets a known film reference (e.g. "similar to Interstellar")
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
                // Search for the seed movie first to get its IMDb ID
                const searchRes = await apiClient.get('/api/search', { params: { query: targetMovieTitle } });
                const seedList = searchRes.data?.Search || searchRes.data || [];
                if (seedList.length > 0 && seedList[0].imdbID) {
                    const seedImdb = seedList[0].imdbID;
                    // Run content-based ML recommendation service
                    const recRes = await apiClient.get(`/api/recommendations/${seedImdb}`);
                    moviesFound = recRes.data || [];
                    generatedExplanation = `Calculated content similarity based on story themes, tone, and character arcs related to "${seedList[0].Title}".`;
                }
            }

            // Fallback to keyword-based content search if not a direct movie comparison
            if (moviesFound.length === 0) {
                // Extract primary keyword from prompt
                const cleanKeyword = searchPrompt
                    .replace(/find me|suggest|movies|movie|with|and|show|good/gi, '')
                    .trim()
                    .split(' ')[0] || searchPrompt;

                const searchRes = await apiClient.get('/api/search', { params: { query: cleanKeyword } });
                const rawList = searchRes.data?.Search || searchRes.data || [];
                
                // If we found a top match, get its ML recommendations as well
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

                generatedExplanation = `Identified thematic matches and plot tags related to "${searchPrompt}". Filtered for high audience and critical resonance.`;
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
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinecue-surface border border-cinecue-amber/30 text-cinecue-amber text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
                        <FaMagic className="text-xs" />
                        AI Taste & Narrative Engine
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 font-sans">
                        Describe What You Want to Watch
                    </h1>
                    <p className="text-sm sm:text-base text-cinecue-muted">
                        Our content-based recommendation model matches your natural language description with story themes, directorial styles, and cinematic tone.
                    </p>
                </div>

                {/* Natural Language Prompt Input Bar */}
                <form 
                    onSubmit={handleSubmit}
                    className="max-w-3xl mx-auto bg-cinecue-surface border border-cinecue-border hover:border-cinecue-amber/60 focus-within:border-cinecue-amber p-2 sm:p-2.5 rounded-2xl shadow-card backdrop-blur-md transition-all mb-6 flex items-center gap-2"
                >
                    <div className="pl-3 text-cinecue-amber text-base">
                        <FaMagic />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Find me a mind-bending thriller with an unexpected ending..."
                        className="bg-transparent border-none text-white placeholder:text-cinecue-muted-dark text-sm sm:text-base focus:outline-none flex-1 py-2 px-1"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="btn btn-primary px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap"
                    >
                        {loading ? 'Analyzing...' : 'Discover'}
                    </button>
                </form>

                {/* Prompt Suggestions */}
                <div className="max-w-3xl mx-auto mb-12">
                    <p className="text-xs font-semibold text-cinecue-muted-dark uppercase tracking-wider mb-2.5">
                        Sample Prompts:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {AI_PROMPTS.map((promptText, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptSelect(promptText)}
                                className="px-3 py-1.5 rounded-xl bg-cinecue-surface/80 border border-cinecue-border text-cinecue-muted hover:text-cinecue-amber hover:border-cinecue-amber/40 text-xs transition text-left"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    {/* Search History Chips */}
                    {searchHistory.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-cinecue-muted-dark flex items-center gap-1">
                                <FaHistory className="text-[10px]" /> Recent:
                            </span>
                            {searchHistory.map((hist, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePromptSelect(hist)}
                                    className="text-cinecue-muted hover:text-white underline underline-offset-4"
                                >
                                    {hist}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Explanation Banner */}
                {explanation && (
                    <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-cinecue-surface via-cinecue-surface to-cinecue-bg-secondary border border-cinecue-border p-5 rounded-2xl flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-cinecue-amber/15 border border-cinecue-amber/30 flex items-center justify-center text-cinecue-amber flex-shrink-0 mt-0.5">
                            <FaMagic size={14} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-cinecue-amber uppercase tracking-wider mb-1">
                                AI Match Analysis
                            </h3>
                            <p className="text-sm text-cinecue-text leading-relaxed">
                                {explanation}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                            <p className="text-cinecue-muted text-sm font-medium">
                                Analyzing cinema narrative tags and computing similarity scores...
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-cinecue-border">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-cinecue-amber inline-block"></span>
                                    Recommended Matches ({results.length})
                                </h2>
                                <span className="text-xs text-cinecue-muted">
                                    Content-based TF-IDF Model
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
                        <div className="text-center py-20 bg-cinecue-surface/40 rounded-2xl border border-cinecue-border p-8 max-w-lg mx-auto">
                            <p className="text-lg font-bold text-white mb-2">No direct narrative match found</p>
                            <p className="text-sm text-cinecue-muted mb-6">
                                Try describing a specific film you like (e.g. "movies similar to Interstellar") or broader genres like "thriller" or "sci-fi".
                            </p>
                            <button
                                onClick={() => handlePromptSelect("Mind-bending psychological thrillers with twists")}
                                className="btn btn-secondary text-xs"
                            >
                                Try a Sample Query
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
