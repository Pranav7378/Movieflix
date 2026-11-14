import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';

const LandingPage: React.FC = () => {
    return (
        <div className="relative h-screen">
            {/* Background Image/Video */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920"
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                    Unlimited movies, TV shows, and more
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8">
                    Watch anywhere. Cancel anytime.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/signup" className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2">
                        <FaPlay />
                        Get Started
                    </Link>
                    <Link to="/login" className="btn btn-secondary text-lg px-8 py-3 flex items-center gap-2">
                        <FaInfoCircle />
                        Sign In
                    </Link>
                </div>

                {/* Features */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                        <h3 className="text-2xl font-semibold mb-2">Personalized Recommendations</h3>
                        <p className="text-gray-300">AI-powered suggestions based on your watching history</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                        <h3 className="text-2xl font-semibold mb-2">Preview Trailers</h3>
                        <p className="text-gray-300">Hover over movies to instantly watch trailers</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                        <h3 className="text-2xl font-semibold mb-2">Smart Watchlist</h3>
                        <p className="text-gray-300">Save and organize movies you want to watch later</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
