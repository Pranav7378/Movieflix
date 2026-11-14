import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { RootState, AppDispatch } from '../app/store';
import { logoutUser } from '../features/auth/authSlice';

const Navbar: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/');
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-netflix-red text-3xl font-bold">
                            MOVIEFLIX
                        </Link>

                        {isAuthenticated && (
                            <div className="hidden md:flex ml-10 space-x-6">
                                <Link to="/home" className="text-white hover:text-gray-300 transition">
                                    Home
                                </Link>
                                <Link to="/watchlist" className="text-white hover:text-gray-300 transition">
                                    My List
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Search & User */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated && (
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search movies..."
                                    className="bg-netflix-gray-dark text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-netflix-red w-48 lg:w-64"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <FaSearch className="text-gray-400" />
                                </button>
                            </form>
                        )}

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 text-white hover:text-gray-300"
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded" />
                                    ) : (
                                        <div className="w-8 h-8 bg-netflix-red rounded flex items-center justify-center">
                                            <FaUser />
                                        </div>
                                    )}
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-netflix-gray-dark rounded-md shadow-lg py-2">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-white hover:bg-netflix-gray-medium"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FaUser className="inline mr-2" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-white hover:bg-netflix-gray-medium"
                                        >
                                            <FaSignOutAlt className="inline mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
