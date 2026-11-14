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
        <div className="min-h-screen bg-[#101114] text-white flex flex-col selection:bg-cinecue-amber/30 selection:text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Search Bar Header */}
                <div className="max-w-3xl mx-auto mb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                        Search Cinema Archive
                    </h1>

                    <form 
                        onSubmit={handleSearchSubmit}
                        className="bg-cinecue-surface border border-cinecue-border hover:border-cinecue-amber/60 focus-within:border-cinecue-amber p-2 rounded-2xl shadow-card backdrop-blur-md transition-all flex items-center gap-2 mb-4"
                    >
                        <div className="pl-3 text-cinecue-amber">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title, director, keyword..."
                            className="bg-transparent border-none text-white placeholder:text-cinecue-muted-dark text-sm sm:text-base focus:outline-none flex-1 py-2 px-1"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm"
                        >
                            Search
                        </button>
                    </form>

                    {/* Popular Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-cinecue-muted">
                        <span className="text-cinecue-muted-dark font-medium mr-1">Trending queries:</span>
                        {POPULAR_SEARCH_TERMS.map((term) => (
                            <button
                                key={term}
                                onClick={() => handleSuggestionClick(term)}
                                className="px-2.5 py-0.5 rounded-full bg-cinecue-surface border border-cinecue-border text-cinecue-muted hover:text-cinecue-amber transition text-[11px]"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Sub-bar */}
                {searchResults.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-cinecue-border text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                                Results for "{query}":
                            </span>
                            <span className="text-cinecue-muted">
                                ({filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'})
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Type Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-cinecue-muted">Type:</span>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="bg-cinecue-surface text-cinecue-text text-xs border border-cinecue-border rounded-lg px-2.5 py-1.5 focus:border-cinecue-amber focus:outline-none"
                                >
                                    <option value="all">All Types</option>
                                    <option value="movie">Movies</option>
                                    <option value="series">Series</option>
                                </select>
                            </div>

                            {/* Year Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-cinecue-muted">Year:</span>
                                <input
                                    type="text"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    placeholder="e.g. 2024"
                                    className="bg-cinecue-surface text-cinecue-text text-xs border border-cinecue-border rounded-lg px-2.5 py-1.5 w-24 focus:border-cinecue-amber focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Content States */}
                {loading === 'loading' ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                        <p className="text-cinecue-muted text-sm font-medium">Scanning movie database...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 max-w-md mx-auto">
                        <p className="text-cinecue-crimson font-bold mb-2">Search Error</p>
                        <p className="text-cinecue-muted text-sm">{error}</p>
                    </div>
                ) : searchResults.length === 0 && query ? (
                    <div className="text-center py-20 bg-cinecue-surface/40 border border-cinecue-border rounded-3xl max-w-lg mx-auto p-8">
                        <div className="w-14 h-14 rounded-2xl bg-cinecue-surface-light text-cinecue-muted flex items-center justify-center mx-auto mb-4">
                            <FaSearch size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No films found for "{query}"</h2>
                        <p className="text-cinecue-muted text-sm mb-6">
                            Check for typos or try broader keywords like a specific actor or genre.
                        </p>
                        <button
                            onClick={() => handleSuggestionClick("Inception")}
                            className="btn btn-secondary text-xs"
                        >
                            Try searching "Inception"
                        </button>
                    </div>
                ) : !query ? (
                    <div className="text-center py-16 text-cinecue-muted text-sm">
                        Enter a movie title or prompt above to begin discovering films.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredResults.map((movie) => (
                            <MovieCard 
                                key={movie.imdbID} 
                                movie={movie}
                                onActionCompleted={setToastMessage} 
                            />
                        ))}
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
