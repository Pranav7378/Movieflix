import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    FaSearch, 
    FaUser, 
    FaSignOutAlt, 
    FaBookmark, 
    FaCheckCircle, 
    FaCompass, 
    FaBars, 
    FaTimes,
    FaMagic
} from 'react-icons/fa';
import { RootState, AppDispatch } from '../app/store';
import { logoutUser } from '../features/auth/authSlice';

const Navbar: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
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
        <header className="sticky top-0 w-full z-50 bg-[#101114]/90 backdrop-blur-md border-b border-cinecue-border/60 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <div className="flex items-center space-x-8">
                        <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2.5 group">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cinecue-amber via-cinecue-amber to-amber-200 flex items-center justify-center text-[#101114] shadow-sm shadow-cinecue-amber/30 group-hover:scale-105 transition-transform">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                                </svg>
                            </span>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1 font-sans">
                                    CINE<span className="text-cinecue-amber">CUE</span>
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        {isAuthenticated ? (
                            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm">
                                <Link 
                                    to="/home" 
                                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                                        isActive('/home')
                                            ? 'text-cinecue-amber bg-cinecue-amber/10 font-semibold'
                                            : 'text-cinecue-muted hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Discover
                                </Link>
                                <Link 
                                    to="/ai-discovery" 
                                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                                        isActive('/ai-discovery')
                                            ? 'text-cinecue-amber bg-cinecue-amber/10 font-semibold'
                                            : 'text-cinecue-muted hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <FaMagic className="text-xs text-cinecue-amber" />
                                    AI Discovery
                                </Link>
                                <Link 
                                    to="/watchlist" 
                                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                                        isActive('/watchlist')
                                            ? 'text-cinecue-amber bg-cinecue-amber/10 font-semibold'
                                            : 'text-cinecue-muted hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    My List
                                </Link>
                                <Link 
                                    to="/watched" 
                                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                                        isActive('/watched')
                                            ? 'text-cinecue-amber bg-cinecue-amber/10 font-semibold'
                                            : 'text-cinecue-muted hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Watched
                                </Link>
                            </nav>
                        ) : (
                            <nav className="hidden md:flex items-center space-x-6 text-sm">
                                <Link to="/" className="text-cinecue-text hover:text-cinecue-amber transition">
                                    Discover
                                </Link>
                                <a href="#features" className="text-cinecue-muted hover:text-white transition">
                                    How It Works
                                </a>
                                <Link to="/ai-discovery" className="text-cinecue-muted hover:text-white transition flex items-center gap-1.5">
                                    <FaMagic className="text-xs text-cinecue-amber" />
                                    AI Taste Engine
                                </Link>
                            </nav>
                        )}
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center space-x-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="relative hidden sm:block">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search title, genre, actor..."
                                className="bg-cinecue-surface text-cinecue-text placeholder:text-cinecue-muted-dark text-xs sm:text-sm pl-9 pr-4 py-2 rounded-lg border border-cinecue-border focus:border-cinecue-amber/80 focus:ring-1 focus:ring-cinecue-amber/80 focus:outline-none w-44 lg:w-64 transition-all"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cinecue-muted-dark text-xs" />
                        </form>

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 p-1 rounded-full border border-cinecue-border hover:border-cinecue-amber/60 transition focus:outline-none"
                                    aria-label="User menu"
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-cinecue-surface-light border border-cinecue-border flex items-center justify-center text-cinecue-amber">
                                            <FaUser className="text-xs" />
                                        </div>
                                    )}
                                </button>

                                {showUserMenu && (
                                    <div 
                                        className="absolute right-0 mt-2 w-56 bg-cinecue-surface border border-cinecue-border rounded-xl shadow-card py-2 text-sm z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                        onMouseLeave={() => setShowUserMenu(false)}
                                    >
                                        <div className="px-4 py-2 border-b border-cinecue-border/60">
                                            <p className="font-semibold text-white truncate">{user?.displayName || 'Film Explorer'}</p>
                                            <p className="text-xs text-cinecue-muted truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-cinecue-muted hover:text-white hover:bg-white/5 transition"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FaUser className="text-cinecue-amber text-xs" />
                                            Taste Profile & Stats
                                        </Link>
                                        <Link
                                            to="/watchlist"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-cinecue-muted hover:text-white hover:bg-white/5 transition"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FaBookmark className="text-cinecue-amber text-xs" />
                                            My Watchlist
                                        </Link>
                                        <Link
                                            to="/watched"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-cinecue-muted hover:text-white hover:bg-white/5 transition"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FaCheckCircle className="text-cinecue-amber text-xs" />
                                            Cinema Diary
                                        </Link>
                                        <div className="border-t border-cinecue-border/60 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-cinecue-crimson hover:bg-cinecue-crimson/10 transition text-left"
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
                                <Link to="/login" className="btn btn-ghost text-xs sm:text-sm px-3.5 py-2">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="btn btn-primary text-xs sm:text-sm px-4 py-2">
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-cinecue-muted hover:text-white p-2 rounded-lg"
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-cinecue-border py-4 space-y-3 bg-cinecue-bg">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative px-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search movies, genres..."
                                className="w-full bg-cinecue-surface text-cinecue-text text-sm pl-9 pr-4 py-2 rounded-lg border border-cinecue-border focus:border-cinecue-amber focus:outline-none"
                            />
                            <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-cinecue-muted text-xs" />
                        </form>

                        <div className="flex flex-col space-y-1 px-2 pt-2">
                            {isAuthenticated ? (
                                <>
                                    <Link 
                                        to="/home" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaCompass className="text-cinecue-amber text-xs" />
                                        Discover
                                    </Link>
                                    <Link 
                                        to="/ai-discovery" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaMagic className="text-cinecue-amber text-xs" />
                                        AI Discovery
                                    </Link>
                                    <Link 
                                        to="/watchlist" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaBookmark className="text-cinecue-amber text-xs" />
                                        My List
                                    </Link>
                                    <Link 
                                        to="/watched" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaCheckCircle className="text-cinecue-amber text-xs" />
                                        Watched Diary
                                    </Link>
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaUser className="text-cinecue-amber text-xs" />
                                        Taste Profile
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        to="/" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface"
                                    >
                                        Discover
                                    </Link>
                                    <Link 
                                        to="/ai-discovery" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-3 py-2 rounded-md text-cinecue-text hover:bg-cinecue-surface flex items-center gap-2"
                                    >
                                        <FaMagic className="text-cinecue-amber text-xs" />
                                        AI Taste Engine
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
