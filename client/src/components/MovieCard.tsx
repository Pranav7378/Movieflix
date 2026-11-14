import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube';
import { Movie } from '../types';

interface MovieCardProps {
    movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/movie/${movie.imdbID}`);
    };

    return (
        <div
            className="relative flex-shrink-0 w-48 lg:w-56 cursor-pointer transition-all duration-300 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <div className={`relative ${isHovered ? 'scale-110 z-10' : 'scale-100'} transition-transform duration-300`}>
                {!isHovered || !movie.trailer_url ? (
                    <img
                        src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
                        alt={movie.Title}
                        className="w-full h-72 object-cover rounded-md"
                    />
                ) : (
                    <div className="w-full h-72 rounded-md overflow-hidden">
                        <ReactPlayer
                            url={movie.trailer_url}
                            playing={true}
                            muted={true}
                            loop={true}
                            width="100%"
                            height="100%"
                            config={{
                                playerVars: { showinfo: 0, controls: 0 }
                            }}
                        />
                    </div>
                )}

                {/* Overlay on hover */}
                {isHovered && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 rounded-b-md">
                        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{movie.Title}</h3>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-green-500">{movie.Year}</span>
                            {movie.imdbRating && (
                                <span className="text-yellow-400">⭐ {movie.imdbRating}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieCard;
