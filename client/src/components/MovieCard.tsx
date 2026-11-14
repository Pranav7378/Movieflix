import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaBookmark, FaCheck, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { Movie } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addToWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { addToHistory } from '../features/history/historySlice';

interface MovieCardProps {
    movie: Movie;
    matchScore?: number;
    showMatchBadge?: boolean;
    onActionCompleted?: (action: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ 
    movie, 
    matchScore,
    showMatchBadge = false,
    onActionCompleted 
}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { items: watchlist } = useAppSelector((state) => state.watchlist);
    const { items: historyItems } = useAppSelector((state) => state.history);

    const [imageError, setImageError] = useState(false);

    const isInWatchlist = watchlist.some((item) => item.imdbID === movie.imdbID);
    const isWatched = historyItems.some((item) => item.imdb_id === movie.imdbID);

    const handleCardClick = () => {
        navigate(`/movie/${movie.imdbID}`);
    };

    const handleWatchlistToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        if (isInWatchlist) {
            await dispatch(removeFromWatchlist({ userId: user.uid, imdbId: movie.imdbID }));
            onActionCompleted?.('Removed from Watchlist');
        } else {
            await dispatch(addToWatchlist({
                userId: user.uid,
                imdbId: movie.imdbID,
                movieTitle: movie.Title,
            }));
            onActionCompleted?.('Added to Watchlist');
        }
    };

    const handleMarkWatched = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        await dispatch(addToHistory({
            userId: user.uid,
            imdbId: movie.imdbID,
            movieTitle: movie.Title,
            progress: 100,
        }));
        onActionCompleted?.('Marked as Watched');
    };

    const posterUrl = !imageError && movie.Poster && movie.Poster !== 'N/A'
        ? movie.Poster
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

    return (
        <div 
            onClick={handleCardClick}
            className="group relative flex-shrink-0 w-44 sm:w-48 md:w-52 cursor-pointer select-none"
        >
            {/* Card Body */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-cinecue-surface border border-cinecue-border/70 group-hover:border-cinecue-amber/70 group-hover:shadow-amber-glow transition-all duration-300">
                {/* Poster Image */}
                <img
                    src={posterUrl}
                    alt={movie.Title}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Match Score Badge (Optional AI Badge) */}
                {showMatchBadge && matchScore && (
                    <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#101114]/90 text-cinecue-amber border border-cinecue-amber/40 shadow-sm backdrop-blur-sm">
                        {matchScore}% Match
                    </div>
                )}

                {/* Quick Action Buttons (Top Right) */}
                <div className="absolute top-2.5 right-2.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleWatchlistToggle}
                        title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs backdrop-blur-md transition-all shadow-md ${
                            isInWatchlist
                                ? 'bg-cinecue-amber text-[#101114]'
                                : 'bg-black/70 text-white hover:bg-cinecue-amber hover:text-[#101114]'
                        }`}
                    >
                        {isInWatchlist ? <FaCheck /> : <FaBookmark />}
                    </button>
                    <button
                        onClick={handleMarkWatched}
                        title={isWatched ? "Watched" : "Mark as Watched"}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs backdrop-blur-md transition-all shadow-md ${
                            isWatched
                                ? 'bg-emerald-500 text-white'
                                : 'bg-black/70 text-white hover:bg-emerald-500'
                        }`}
                    >
                        <FaCheckCircle />
                    </button>
                </div>

                {/* Dark Vignette Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-[#101114]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2 mb-1">
                        {movie.Title}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-cinecue-muted mb-2">
                        <span>{movie.Year}</span>
                        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                            <span className="flex items-center gap-1 text-cinecue-amber font-medium">
                                <FaStar className="text-[10px]" />
                                {movie.imdbRating}
                            </span>
                        )}
                    </div>

                    {movie.Genre && (
                        <p className="text-[10px] text-cinecue-muted-dark line-clamp-1 mb-2">
                            {movie.Genre}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-cinecue-border/60">
                        <span className="text-[11px] font-medium text-cinecue-amber flex items-center gap-1 group-hover:underline">
                            <FaInfoCircle className="text-[10px]" />
                            View Details
                        </span>
                    </div>
                </div>
            </div>

            {/* Static Title & Subtitle Below Poster (Visible always) */}
            <div className="mt-2.5 px-0.5">
                <h3 className="text-sm font-medium text-cinecue-text truncate group-hover:text-cinecue-amber transition-colors">
                    {movie.Title}
                </h3>
                <div className="flex items-center justify-between text-xs text-cinecue-muted mt-0.5">
                    <span>{movie.Year || 'Film'}</span>
                    {movie.imdbRating && movie.imdbRating !== 'N/A' ? (
                        <span className="flex items-center gap-1 text-cinecue-amber text-xs font-semibold">
                            <FaStar className="text-[10px]" />
                            {movie.imdbRating}
                        </span>
                    ) : (
                        <span className="text-[11px] text-cinecue-muted-dark">CINECUE</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
