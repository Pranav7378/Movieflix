import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaBookmark, FaCheck, FaCheckCircle } from 'react-icons/fa';
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

    // Calculate a dynamic display match score if not passed
    const calculatedScore = matchScore || Math.min(99, Math.max(76, Math.round(((parseFloat(movie.imdbRating || '7.5') * 10) + 12))));

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
            className="group relative flex-shrink-0 w-44 sm:w-48 md:w-52 cursor-pointer select-none transition-all duration-300"
        >
            {/* Ambient Bloom Glowing Backlight */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-violet-500/35 to-fuchsia-500/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none" />

            {/* Poster Card Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#0D1017] border border-white/15 dark:border-white/15 group-hover:border-cyan-400/70 group-hover:shadow-glow-cyan-sm shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300">
                {/* Poster Image */}
                <img
                    src={posterUrl}
                    alt={movie.Title}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Glass Vignette & Highlight */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-transparent to-black/30 opacity-70 group-hover:opacity-85 transition-opacity" />

                {/* Top-Left: Radial Match Dial or Glowing AI Capsule */}
                {(showMatchBadge || matchScore) && (
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-[#07080B]/85 border border-cyan-400/50 shadow-glow-pill">
                        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold text-cyan-300 tracking-tight">
                            {calculatedScore}% Match
                        </span>
                    </div>
                )}

                {/* Top-Right: Quick Action Buttons */}
                <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleWatchlistToggle}
                        aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-xs transition-transform hover:scale-110 shadow-lg ${
                            isInWatchlist
                                ? 'bg-amber-500 text-[#07080B] shadow-glow-amber'
                                : 'bg-[#07080B]/80 text-white border border-white/20 hover:border-amber-400 hover:text-amber-400'
                        }`}
                    >
                        {isInWatchlist ? <FaCheck /> : <FaBookmark />}
                    </button>

                    <button
                        onClick={handleMarkWatched}
                        aria-label={isWatched ? 'Watched' : 'Mark as Watched'}
                        className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-xs transition-transform hover:scale-110 shadow-lg ${
                            isWatched
                                ? 'bg-emerald-500 text-white shadow-glow-emerald'
                                : 'bg-[#07080B]/80 text-white border border-white/20 hover:border-emerald-400 hover:text-emerald-400'
                        }`}
                    >
                        {isWatched ? <FaCheckCircle /> : <FaCheck />}
                    </button>
                </div>

                {/* Bottom Overlay Info on Poster */}
                <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                <FaStar className="text-[10px]" />
                                {movie.imdbRating}
                            </span>
                        )}
                        {movie.Year && (
                            <span className="text-slate-400 text-[11px] before:content-['•'] before:mr-1">
                                {movie.Year}
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {movie.Title}
                    </h3>
                </div>
            </div>

            {/* Sub-card details */}
            <div className="mt-2 px-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[130px] text-[11px] text-slate-400">
                        {movie.Genre ? movie.Genre.split(',')[0] : 'Feature Film'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                        {movie.Runtime && movie.Runtime !== 'N/A' ? movie.Runtime : '2h'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
