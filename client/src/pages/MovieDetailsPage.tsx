import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube';
import { FaPlay, FaPlus, FaMinus } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import MovieCarousel from '../components/MovieCarousel';
import { fetchMovieDetails, fetchRecommendations } from '../features/movies/moviesSlice';
import { addToWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';

const MovieDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { selectedMovie, recommendations, loading } = useAppSelector((state) => state.movies);
    const { items: watchlist } = useAppSelector((state) => state.watchlist);
    const { user } = useAppSelector((state) => state.auth);
    const [showTrailer, setShowTrailer] = useState(false);

    const isInWatchlist = watchlist.some(item => item.imdbID === id);

    useEffect(() => {
        setShowTrailer(false);
        if (id) {
            dispatch(fetchMovieDetails(id));
            dispatch(fetchRecommendations(id));
        }
    }, [dispatch, id]);

    const handleWatchlistToggle = async () => {
        if (!user || !selectedMovie) return;

        if (isInWatchlist) {
            const result = await dispatch(removeFromWatchlist({ userId: user.uid, imdbId: selectedMovie.imdbID }));
            if (removeFromWatchlist.rejected.match(result)) {
                alert('Could not remove from My List. Please try again.');
            }
        } else {
            const result = await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: selectedMovie.imdbID,
                movieTitle: selectedMovie.Title
            }));
            if (addToWatchlist.rejected.match(result)) {
                alert('Could not add to My List. Please try again.');
            }
        }
    };

    if (loading === 'loading') {
        return (
            <div className="min-h-screen bg-netflix-black flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        );
    }

    if (!selectedMovie) {
        return (
            <div className="min-h-screen bg-netflix-black flex items-center justify-center">
                <div className="text-white text-2xl">Movie not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-netflix-black">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-screen">
                <div className="absolute inset-0">
                    {showTrailer && selectedMovie.trailer_url ? (
                        <ReactPlayer
                            url={selectedMovie.trailer_url}
                            playing={true}
                            controls={true}
                            width="100%"
                            height="100%"
                        />
                    ) : (
                        <>
                            <img
                                src={selectedMovie.Poster !== 'N/A' ? selectedMovie.Poster : 'https://via.placeholder.com/1920x1080'}
                                alt={selectedMovie.Title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />
                        </>
                    )}
                </div>

                <div className="relative z-10 pt-48 px-4 md:px-16 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-bold mb-4">{selectedMovie.Title}</h1>

                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-green-500 text-lg">{selectedMovie.Year}</span>
                        {selectedMovie.Runtime && <span className="text-gray-300">{selectedMovie.Runtime}</span>}
                        {selectedMovie.imdbRating && (
                            <span className="text-yellow-400 text-lg">⭐ {selectedMovie.imdbRating}</span>
                        )}
                    </div>

                    {selectedMovie.Genre && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedMovie.Genre.split(',').map((genre, index) => (
                                <span key={index} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                    {genre.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    <p className="text-lg mb-8 max-w-2xl">{selectedMovie.Plot}</p>

                    <div className="flex gap-4">
                        {selectedMovie.trailer_url && (
                            <button
                                onClick={() => setShowTrailer(!showTrailer)}
                                className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2"
                            >
                                <FaPlay />
                                {showTrailer ? 'Stop Trailer' : 'Play Trailer'}
                            </button>
                        )}

                        {user && (
                            <button
                                onClick={handleWatchlistToggle}
                                className="btn btn-secondary text-lg px-8 py-3 flex items-center gap-2"
                            >
                                {isInWatchlist ? <FaMinus /> : <FaPlus />}
                                {isInWatchlist ? 'Remove from List' : 'Add to My List'}
                            </button>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-12 space-y-2 text-sm">
                        {selectedMovie.Director && (
                            <p><span className="text-gray-400">Director:</span> {selectedMovie.Director}</p>
                        )}
                        {selectedMovie.Actors && (
                            <p><span className="text-gray-400">Cast:</span> {selectedMovie.Actors}</p>
                        )}
                        {selectedMovie.Awards && (
                            <p><span className="text-gray-400">Awards:</span> {selectedMovie.Awards}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="relative z-20 -mt-32 pb-20">
                    <MovieCarousel title="More Like This" movies={recommendations} />
                </div>
            )}
        </div>
    );
};

export default MovieDetailsPage;
