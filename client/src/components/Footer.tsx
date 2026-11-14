import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-white/10 dark:border-white/10 bg-[#07080B]/90 backdrop-blur-xl text-slate-400 text-sm mt-20 pb-28 md:pb-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    <div className="md:col-span-2 space-y-3">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-500 p-[1px] shadow-glow-cyan">
                                <div className="w-full h-full bg-[#07080B] rounded-[7px] flex items-center justify-center">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 to-violet-300 font-black text-xs">
                                        C
                                    </span>
                                </div>
                            </div>
                            <span className="font-extrabold text-lg text-white font-display">
                                CINE<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">CUE</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">
                            Discover your next favourite film. Spatial cinema discovery powered by intelligent narrative matching, ambient taste profiles, and personalized diary tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-cyan-400">
                            Explore
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/home" className="hover:text-white transition">Personalized Feed</Link></li>
                            <li><Link to="/ai-discovery" className="hover:text-cyan-400 transition">AI Synapse</Link></li>
                            <li><Link to="/search" className="hover:text-white transition">Search Catalog</Link></li>
                            <li><Link to="/watchlist" className="hover:text-white transition">My Watchlist</Link></li>
                            <li><Link to="/watched" className="hover:text-white transition">Cinema Diary</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 text-violet-400">
                            Platform
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li className="text-slate-400">Intelligent Taste Matching</li>
                            <li className="text-slate-400">Curated Film Collections</li>
                            <li className="text-slate-400">Personal Cinema Diary</li>
                            <li className="text-slate-400">High-Definition Previews</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} CINECUE. Discover your next favourite film.</p>
                    <p className="flex items-center gap-1.5">
                        Crafted for cinema lovers with <FaHeart className="text-rose-500 text-[10px]" />
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
