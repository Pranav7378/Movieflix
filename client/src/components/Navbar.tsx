import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    FaSearch, 
    FaUser, 
    FaSignOutAlt, 
    FaBookmark, 
    FaCheckCircle, 
    FaBars, 
    FaTimes,
    FaMagic,
    FaSun,
    FaMoon,
    FaSlidersH
} from 'react-icons/fa';
import { RootState, AppDispatch } from '../app/store';
import { logoutUser } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { items: watchlistItems } = useSelector((state: RootState) => state.watchlist);
    const { theme, toggleTheme } = useTheme();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch: AppDispatch = useDispatch();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setMobileMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        setShowUserMenu(false);
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 w-full z-40 px-3 sm:px-6 lg:px-8 pt-3 pb-2 transition-all">
            <div className="max-w-7xl mx-auto rounded-2xl backdrop-blur-2xl bg-[#07080B]/70 dark:bg-[#07080B]/70 border border-white/10 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] px-4 sm:px-6 h-16 flex items-center justify-between transition-all">
                {/* Brand Logo */}
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2.5 group">
                        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-violet-600 to-fuchsia-500 p-[1.5px] shadow-glow-cyan group-hover:shadow-glow-cyan transition-shadow">
                            <div className="w-full h-full bg-[#07080B] rounded-[10px] flex items-center justify-center">
                                <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-violet-400 font-black text-sm">
                                    C
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1 font-display">
                                CINE<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">CUE</span>
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    {isAuthenticated ? (
                        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
                            <Link 
                                to="/home" 
                                className={`px-3 py-1.5 rounded-xl transition-all ${
                                    isActive('/home')
                                        ? 'text-white bg-white/10 shadow-sm border border-white/15'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Discover
                            </Link>
                            <Link 
                                to="/ai-discovery" 
                                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all relative group ${
                                    isActive('/ai-discovery')
                                        ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 shadow-glow-cyan'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <FaMagic className="text-xs text-cyan-400 animate-pulse" />
                                <span>AI Synapse</span>
                            </Link>
                            <Link 
                                to="/watchlist" 
                                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                                    isActive('/watchlist')
                                        ? 'text-white bg-white/10 shadow-sm border border-white/15'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span>Watchlist</span>
                                {watchlistItems.length > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                        {watchlistItems.length}
                                    </span>
                                )}
                            </Link>
                            <Link 
                                to="/watched" 
                                className={`px-3 py-1.5 rounded-xl transition-all ${
                                    isActive('/watched')
                                        ? 'text-white bg-white/10 shadow-sm border border-white/15'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Watched
                            </Link>
                        </nav>
                    ) : (
                        <nav className="hidden md:flex items-center space-x-6 text-sm">
                            <Link to="/" className="text-slate-300 hover:text-white transition">
                                Discover
                            </Link>
                            <a href="#features" className="text-slate-400 hover:text-white transition">
                                Features
                            </a>
                            <Link to="/ai-discovery" className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5">
                                <FaMagic className="text-xs" />
                                AI Synapse
                            </Link>
                        </nav>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="relative hidden sm:block">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search title, genre, director..."
                            className="bg-white/[0.05] text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/80 focus:outline-none w-44 lg:w-64 transition-all backdrop-blur-md"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                    </form>

                    {/* Light / Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme mode"
                        className="p-2.5 rounded-xl border border-white/10 hover:border-cyan-500/40 bg-white/[0.04] text-slate-300 hover:text-white transition-all backdrop-blur-md hover:shadow-glow-cyan"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <FaSun className="text-amber-400 text-sm hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <FaMoon className="text-cyan-400 text-sm hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-1 rounded-xl border border-white/10 hover:border-cyan-400/60 bg-white/[0.04] transition-all backdrop-blur-md focus:outline-none"
                                aria-label="User profile menu"
                            >
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                        <FaUser className="text-xs" />
                                    </div>
                                )}
                            </button>

                            {showUserMenu && (
                                <div 
                                    className="absolute right-0 mt-2.5 w-60 rounded-2xl backdrop-blur-2xl bg-[#07080B]/95 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)] py-2 text-sm z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onMouseLeave={() => setShowUserMenu(false)}
                                >
                                    <div className="px-4 py-2.5 border-b border-white/10">
                                        <p className="font-semibold text-white truncate">{user?.displayName || 'Film Connoisseur'}</p>
                                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <FaSlidersH className="text-cyan-400 text-xs" />
                                        Taste Profile & Stats
                                    </Link>
                                    <Link
                                        to="/watchlist"
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <FaBookmark className="text-amber-400 text-xs" />
                                        My Watchlist
                                    </Link>
                                    <Link
                                        to="/watched"
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <FaCheckCircle className="text-emerald-400 text-xs" />
                                        Cinema Diary
                                    </Link>
                                    <div className="border-t border-white/10 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition text-left"
                                        >
                                            <FaSignOutAlt className="text-xs" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="btn-glass text-xs sm:text-sm px-3.5 py-1.5">
                                Sign In
                            </Link>
                            <Link to="/signup" className="btn-gradient text-xs sm:text-sm px-4 py-1.5">
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* Mobile Hamburger toggle for secondary menu */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
                        aria-label="Toggle navigation"
                    >
                        {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
                    </button>
                </div>
            </div>

            {/* Mobile Expandable Header Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-2 max-w-7xl mx-auto rounded-2xl backdrop-blur-2xl bg-[#07080B]/95 border border-white/15 p-4 space-y-3">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search films, directors, genres..."
                            className="w-full bg-white/[0.06] text-white placeholder:text-slate-400 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-cyan-400 focus:outline-none"
                        />
                        <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                    </form>

                    <div className="flex flex-col space-y-1 pt-1">
                        <Link 
                            to="/home" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center justify-between"
                        >
                            <span>Discover</span>
                        </Link>
                        <Link 
                            to="/ai-discovery" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2"
                        >
                            <FaMagic className="text-xs" />
                            <span>AI Synapse Discovery</span>
                        </Link>
                        <Link 
                            to="/watchlist" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center justify-between"
                        >
                            <span>Watchlist</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-cyan-400">
                                {watchlistItems.length}
                            </span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
