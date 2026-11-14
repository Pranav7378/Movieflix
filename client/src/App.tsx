import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { setUser, setInitialized } from './features/auth/authSlice';
import { RootState, AppDispatch } from './app/store';
import { ThemeProvider } from './context/ThemeContext';
import BottomDock from './components/BottomDock';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import ProfilePage from './pages/ProfilePage';
import WatchlistPage from './pages/WatchlistPage';
import WatchedPage from './pages/WatchedPage';
import SearchPage from './pages/SearchPage';
import AIDiscoveryPage from './pages/AIDiscoveryPage';

// Protected Route Component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, initialized } = useSelector((state: RootState) => state.auth);

    if (!initialized) {
        return (
            <div className="min-h-screen bg-[#07080B] flex flex-col items-center justify-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow-cyan animate-pulse" />
                </div>
                <div className="text-slate-400 text-xs font-semibold tracking-widest uppercase font-display mt-4">
                    CINECUE
                </div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                dispatch(setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                }));
            } else {
                dispatch(setUser(null));
            }
            dispatch(setInitialized(true));
        });

        return () => unsubscribe();
    }, [dispatch]);

    return (
        <ThemeProvider>
            <Router>
                <div className="App min-h-screen bg-[#07080B] dark:bg-[#07080B] text-slate-100 selection:bg-cyan-500/30 selection:text-white transition-colors duration-200">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/ai-discovery" element={<AIDiscoveryPage />} />

                        {/* Protected Routes */}
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <HomePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/movie/:id"
                            element={
                                <ProtectedRoute>
                                    <MovieDetailsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/watchlist"
                            element={
                                <ProtectedRoute>
                                    <WatchlistPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/watched"
                            element={
                                <ProtectedRoute>
                                    <WatchedPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/search"
                            element={
                                <ProtectedRoute>
                                    <SearchPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    {/* Mobile Floating Glass Navigation Dock */}
                    <BottomDock />
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
