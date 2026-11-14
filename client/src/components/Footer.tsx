import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-cinecue-border/60 bg-[#0d0e11] text-cinecue-muted text-sm mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    <div className="md:col-span-2 space-y-3">
                        <Link to="/" className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-cinecue-amber flex items-center justify-center text-[#101114]">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                                </svg>
                            </span>
                            <span className="font-extrabold text-lg text-white">
                                CINE<span className="text-cinecue-amber">CUE</span>
                            </span>
                        </Link>
                        <p className="text-cinecue-muted text-xs sm:text-sm max-w-sm leading-relaxed">
                            Discover your next favourite film. Intelligent, content-based movie recommendations, trailer previews, and Letterboxd-style personal watchlist tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-cinecue-amber">
                            Explore
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/home" className="hover:text-white transition">Personalized Feed</Link></li>
                            <li><Link to="/ai-discovery" className="hover:text-white transition">AI Taste Engine</Link></li>
                            <li><Link to="/search" className="hover:text-white transition">Search Movies</Link></li>
                            <li><Link to="/watchlist" className="hover:text-white transition">My Watchlist</Link></li>
                            <li><Link to="/watched" className="hover:text-white transition">Cinema Diary</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-cinecue-amber">
                            Platform
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li className="text-cinecue-muted">TF-IDF Content Similarity</li>
                            <li className="text-cinecue-muted">OMDB & YouTube APIs</li>
                            <li className="text-cinecue-muted">Neon PostgreSQL Database</li>
                            <li className="text-cinecue-muted">100% Free Tier Hosted</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-cinecue-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cinecue-muted-dark">
                    <p>© {new Date().getFullYear()} CINECUE. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Crafted for movie lovers with <FaHeart className="text-cinecue-crimson text-[10px]" />
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
