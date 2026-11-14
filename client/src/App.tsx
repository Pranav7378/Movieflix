import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { setUser, setInitialized } from './features/auth/authSlice';
import { RootState, AppDispatch } from './app/store';

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
            <div className="min-h-screen bg-[#101114] flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-cinecue-amber/20 border-t-cinecue-amber animate-spin mb-4" />
                <div className="text-cinecue-muted text-sm font-semibold tracking-wider uppercase font-sans">
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
        <Router>
            <div className="App min-h-screen bg-[#101114] text-white">
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
            </div>
        </Router>
    );
}

export default App;
