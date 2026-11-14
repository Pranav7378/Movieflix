import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MovieCard from './MovieCard';
import { Movie } from '../types';

interface MovieCarouselProps {
    title: string;
    movies: Movie[];
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ title, movies }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -800 : 800;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className="mb-8 group">
            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 px-4 md:px-8">
                {title}
            </h2>

            <div className="relative px-4 md:px-8">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FaChevronLeft size={24} />
                </button>

                {/* Movies Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-scroll scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie) => (
                        <MovieCard key={movie.imdbID} movie={movie} />
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FaChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

export default MovieCarousel;
