import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MovieCard from './MovieCard';
import { Movie } from '../types';

interface MovieCarouselProps {
    title: string;
    subtitle?: string;
    movies: Movie[];
    showMatchBadge?: boolean;
    onActionCompleted?: (msg: string) => void;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ 
    title, 
    subtitle, 
    movies,
    showMatchBadge = false,
    onActionCompleted
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <section className="mb-12 group/carousel relative">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-4 px-4 sm:px-6 lg:px-8">
                <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 font-display">
                        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500 shadow-glow-cyan inline-block" />
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 ml-4">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left Navigation Arrow */}
                <button
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                    className="absolute left-2 sm:left-4 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#07080B]/80 text-white border border-white/20 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-glow-cyan flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-md"
                >
                    <FaChevronLeft className="text-xs" />
                </button>

                {/* Items Row */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth px-4 sm:px-6 lg:px-8 py-3 no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie, index) => {
                        const pseudoMatch = showMatchBadge ? 98 - (index * 2) : undefined;
                        return (
                            <MovieCard 
                                key={`${movie.imdbID}-${index}`} 
                                movie={movie} 
                                matchScore={pseudoMatch}
                                showMatchBadge={showMatchBadge}
                                onActionCompleted={onActionCompleted}
                            />
                        );
                    })}
                </div>

                {/* Right Navigation Arrow */}
                <button
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                    className="absolute right-2 sm:right-4 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#07080B]/80 text-white border border-white/20 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-glow-cyan flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-md"
                >
                    <FaChevronRight className="text-xs" />
                </button>
            </div>
        </section>
    );
};

export default MovieCarousel;
