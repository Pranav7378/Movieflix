import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { searchMovies, clearSearchResults } from '../features/movies/moviesSlice';

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const dispatch = useAppDispatch();
    const { searchResults, loading } = useAppSelector((state) => state.movies);

    useEffect(() => {
        if (query) {
            dispatch(searchMovies(query));
        }

        return () => {
            dispatch(clearSearchResults());
        };
    }, [query, dispatch]);

    return (
        <div className="min-h-screen bg-netflix-black">
            <Navbar />

            <div className="pt-24 px-4 md:px-16">
                <h1 className="text-3xl font-bold mb-6">
                    Search Results for "{query}"
                </h1>

                {loading === 'loading' ? (
                    <p className="text-gray-400">Searching...</p>
                ) : searchResults.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl">No movies found</p>
                        <p className="text-gray-500 mt-2">Try a different search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {searchResults.map((movie) => (
                            <MovieCard key={movie.imdbID} movie={movie} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
