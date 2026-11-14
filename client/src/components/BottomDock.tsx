import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCompass, FaMagic, FaSearch, FaBookmark, FaUser } from 'react-icons/fa';
import { RootState } from '../app/store';

const BottomDock: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { items: watchlistItems } = useSelector((state: RootState) => state.watchlist);
    const location = useLocation();

    // Do not show bottom dock on full landing or auth pages if desired, or show it everywhere
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    if (isAuthPage) return null;

    return (
        <nav 
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-3 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl backdrop-blur-2xl bg-[#07080B]/80 dark:bg-[#07080B]/80 light:bg-white/85 border border-white/15 dark:border-white/15 light:border-black/10 shadow-[0_10px_35px_rgba(0,0,0,0.5)] p-1.5 transition-all"
        >
            <div className="flex items-center justify-around">
                {/* Discover */}
                <NavLink
                    to={isAuthenticated ? "/home" : "/"}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                            isActive
                                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                                : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    <FaCompass className="text-lg mb-0.5" />
                    <span className="text-[10px] tracking-tight">Discover</span>
                </NavLink>

                {/* AI Synapse */}
                <NavLink
                    to="/ai-discovery"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                            isActive
                                ? 'text-violet-400 bg-violet-500/15 font-semibold'
                                : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    <span className="relative">
                        <FaMagic className="text-lg mb-0.5 text-violet-400" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    </span>
                    <span className="text-[10px] tracking-tight">AI Match</span>
                </NavLink>

                {/* Search */}
                <NavLink
                    to="/search"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                            isActive
                                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                                : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    <FaSearch className="text-lg mb-0.5" />
                    <span className="text-[10px] tracking-tight">Search</span>
                </NavLink>

                {/* Watchlist */}
                <NavLink
                    to={isAuthenticated ? "/watchlist" : "/login"}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                            isActive
                                ? 'text-amber-400 bg-amber-500/15 font-semibold'
                                : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    <div className="relative">
                        <FaBookmark className="text-lg mb-0.5" />
                        {watchlistItems.length > 0 && (
                            <span className="absolute -top-1.5 -right-2 bg-cyan-500 text-[#07080B] text-[9px] font-bold px-1 rounded-full">
                                {watchlistItems.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] tracking-tight">List</span>
                </NavLink>

                {/* Profile */}
                <NavLink
                    to={isAuthenticated ? "/profile" : "/login"}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                            isActive
                                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                                : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    <FaUser className="text-lg mb-0.5" />
                    <span className="text-[10px] tracking-tight">Profile</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default BottomDock;

