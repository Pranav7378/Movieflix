import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/auth/authSlice';
import { AppDispatch, RootState } from '../app/store';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="min-h-screen flex items-center justify-center bg-netflix-black">
            <div className="bg-black/75 p-16 rounded-md w-full max-w-md">
                <h1 className="text-white text-3xl font-semibold mb-8">Sign In</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="w-full px-4 py-3 bg-netflix-gray-dark text-white rounded focus:outline-none focus:ring-2 focus:ring-netflix-red"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full px-4 py-3 bg-netflix-gray-dark text-white rounded focus:outline-none focus:ring-2 focus:ring-netflix-red"
                        />
                    </div>

                    {error && (
                        <p className="text-netflix-red text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading === 'loading'}
                        className="w-full btn btn-primary py-3 text-lg"
                    >
                        {loading === 'loading' ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-gray-400">
                    <p>
                        New to MovieFlix?{' '}
                        <Link to="/signup" className="text-white hover:underline">
                            Sign up now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
