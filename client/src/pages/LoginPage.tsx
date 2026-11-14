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
        <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden transition-colors selection:bg-cyan-500/30 selection:text-white">
            {/* Ambient Background Glow Orbs */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/15 blur-[140px] pointer-events-none rounded-full" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-violet-600/15 blur-[150px] pointer-events-none rounded-full" />

            {/* Brand Logo Header */}
            <Link to="/" className="flex items-center gap-2.5 mb-8 group z-10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-[1.5px] shadow-glow-cyan/50 group-hover:shadow-glow-cyan transition-shadow">
                    <div className="w-full h-full bg-[#07080B] rounded-[14px] flex items-center justify-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 to-violet-300 font-black text-base">
                            C
                        </span>
                    </div>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white font-display">
                    CINE<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">CUE</span>
                </span>
            </Link>

            {/* Frosted Glass Auth Box */}
            <div className="w-full max-w-md backdrop-blur-2xl bg-white/[0.04] border border-white/15 p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative z-10">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                        Welcome Back
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        Sign in to access your personalized recommendations and cinema diary.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all"
                            />
                            <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-11 py-3 backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all"
                            />
                            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs focus:outline-none"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading === 'loading'}
                        className="btn-gradient w-full py-3 rounded-xl font-bold text-sm shadow-glow-cyan/50 mt-2"
                    >
                        {loading === 'loading' ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer link */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-slate-400">
                        Don't have an account yet?{' '}
                        <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 ml-1">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
