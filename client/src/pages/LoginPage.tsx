import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from 'react-icons/fa';
import { loginUser } from '../features/auth/authSlice';
import { AppDispatch, RootState } from '../app/store';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await dispatch(loginUser({ email, password }));
        if (loginUser.fulfilled.match(result)) {
            navigate('/home');
        }
    };

    return (
        <div className="min-h-screen bg-[#101114] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden selection:bg-cinecue-amber/30 selection:text-white">
            {/* Ambient Background Blur */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cinecue-amber/10 blur-3xl pointer-events-none rounded-full" />

            {/* Brand Logo Header */}
            <Link to="/" className="flex items-center gap-2.5 mb-8 group z-10">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinecue-amber to-amber-200 flex items-center justify-center text-[#101114] shadow-amber-glow group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                    </svg>
                </span>
                <span className="font-extrabold text-2xl tracking-tight text-white">
                    CINE<span className="text-cinecue-amber">CUE</span>
                </span>
            </Link>

            {/* Auth Box */}
            <div className="w-full max-w-md bg-cinecue-surface border border-cinecue-border p-8 sm:p-10 rounded-3xl shadow-card relative z-10 backdrop-blur-md">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-cinecue-muted text-xs sm:text-sm mt-1">
                        Sign in to access your personal recommendations and cinema diary.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-cinecue-muted uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-cinecue-bg border border-cinecue-border rounded-xl text-white placeholder:text-cinecue-muted-dark text-sm focus:border-cinecue-amber focus:ring-1 focus:ring-cinecue-amber focus:outline-none transition-all"
                            />
                            <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cinecue-muted-dark text-xs" />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-semibold text-cinecue-muted uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-11 py-3 bg-cinecue-bg border border-cinecue-border rounded-xl text-white placeholder:text-cinecue-muted-dark text-sm focus:border-cinecue-amber focus:ring-1 focus:ring-cinecue-amber focus:outline-none transition-all"
                            />
                            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cinecue-muted-dark text-xs" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cinecue-muted hover:text-white text-xs focus:outline-none"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-xl bg-cinecue-crimson/15 border border-cinecue-crimson/30 text-cinecue-crimson text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading === 'loading'}
                        className="w-full btn btn-primary py-3 rounded-xl font-bold text-sm shadow-amber-glow mt-2"
                    >
                        {loading === 'loading' ? 'Authenticating...' : 'Sign In to CINECUE'}
                    </button>
                </form>

                {/* Footer Switch */}
                <div className="mt-8 pt-6 border-t border-cinecue-border/60 text-center text-xs text-cinecue-muted">
                    <p>
                        New to CINECUE?{' '}
                        <Link to="/signup" className="text-cinecue-amber font-semibold hover:underline">
                            Create a free account
                        </Link>
                    </p>
                </div>
            </div>

            {/* Tagline */}
            <p className="mt-8 text-xs text-cinecue-muted-dark z-10">
                CINECUE • Discover your next favourite film.
            </p>
        </div>
    );
};

export default LoginPage;
