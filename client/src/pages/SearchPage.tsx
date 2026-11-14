import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import Toast from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { searchMovies, clearSearchResults } from '../features/movies/moviesSlice';

const POPULAR_SEARCH_TERMS = [
    "Inception", "Interstellar", "Godfather", "Dark Knight", 
    "Matrix", "Pulp Fiction", "Dune", "Oppenheimer"
];

const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const dispatch = useAppDispatch();
    const { searchResults, loading, error } = useAppSelector((state) => state.movies);

    const [searchInput, setSearchInput] = useState(query);
    const [yearFilter, setYearFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (query) {
            setSearchInput(query);
            dispatch(searchMovies(query));
        }

        return () => {
            dispatch(clearSearchResults());
        };
    }, [query, dispatch]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSearchParams({ q: searchInput.trim() });
            dispatch(searchMovies(searchInput.trim()));
        }
    };

    const handleSuggestionClick = (term: string) => {
        setSearchInput(term);
        setSearchParams({ q: term });
        dispatch(searchMovies(term));
    };

    // Filter results locally
    const filteredResults = useMemo(() => {
        let list = [...searchResults];
        if (yearFilter.trim()) {
            list = list.filter((m) => m.Year && m.Year.includes(yearFilter.trim()));
        }
        if (typeFilter !== 'all') {
            list = list.filter((m) => m.Type && m.Type.toLowerCase() === typeFilter.toLowerCase());
        }
        return list;
    }, [searchResults, yearFilter, typeFilter]);

    return (
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col relative overflow-hidden transition-colors">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none -z-10" />
            <div className="absolute top-64 right-10 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Search Bar Header */}
                <div className="max-w-3xl mx-auto mb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-display">
                        Search Cinema Archive
                    </h1>

                    <form 
                        onSubmit={handleSearchSubmit}
                        className="backdrop-blur-2xl bg-white/[0.05] border border-white/15 focus-within:border-cyan-400/80 p-2 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all flex items-center gap-2 mb-4"
                    >
                        <div className="pl-3 text-cyan-400">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title, director, keyword..."
                            className="bg-transparent border-none text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-none flex-1 py-1.5 px-2"
                        />
                        <button
                            type="submit"
                            className="btn-gradient px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm"
                        >
                            Search
                        </button>
                    </form>

                    {/* Popular Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
                        <span className="text-slate-500 font-medium mr-1">Trending:</span>
                        {POPULAR_SEARCH_TERMS.map((term) => (
                            <button
                                key={term}
                                onClick={() => handleSuggestionClick(term)}
                                className="px-2.5 py-0.5 rounded-full backdrop-blur-md bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 transition"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Controls Row */}
                {searchResults.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
                        <p className="text-xs text-slate-400">
                            Showing <span className="font-bold text-white">{filteredResults.length}</span> results for "{query}"
                        </p>

                        <div className="flex items-center gap-3">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="backdrop-blur-md bg-white/[0.05] text-slate-200 text-xs border border-white/10 rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none"
                            >
                                <option value="all" className="bg-[#07080B]">All Types</option>
                                <option value="movie" className="bg-[#07080B]">Movies Only</option>
                                <option value="series" className="bg-[#07080B]">Series Only</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Year (e.g. 2024)"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="backdrop-blur-md bg-white/[0.05] text-slate-200 text-xs border border-white/10 rounded-xl px-3 py-1.5 w-28 focus:border-cyan-400 focus:outline-none placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                )}

                {/* Search Results Display */}
                {loading === 'loading' ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                        </div>
                        <p className="text-slate-400 text-sm">Searching cinema archive...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-md mx-auto">
                        <p className="text-base font-bold text-white mb-2">No Matching Films</p>
                        <p className="text-xs text-slate-400 mb-4">{error}</p>
                        <p className="text-xs text-slate-500">Try searching with a broader title or keyword.</p>
                    </div>
                ) : filteredResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredResults.map((movie, idx) => (
                            <MovieCard 
                                key={`${movie.imdbID}-${idx}`} 
                                movie={movie} 
                                onActionCompleted={setToastMessage}
                            />
                        ))}
                    </div>
                ) : query && filteredResults.length === 0 ? (
                    <div className="text-center py-20 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-md mx-auto">
                        <p className="text-base font-bold text-white mb-2">No results match filters</p>
                        <p className="text-xs text-slate-400 mb-4">Clear your year or type filter to view all results.</p>
                        <button
                            onClick={() => { setYearFilter(''); setTypeFilter('all'); }}
                            className="btn-glass text-xs"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-24 text-slate-500 text-sm">
                        Enter a film title, director, or keyword above to explore the archive.
                    </div>
                )}
            </main>

            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)} 
            />

            <Footer />
        </div>
    );
};

export default SearchPage;
