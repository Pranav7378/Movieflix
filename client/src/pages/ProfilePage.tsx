import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { logoutUser } from '../features/auth/authSlice';
import { RootState, AppDispatch } from '../app/store';

const ProfilePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/');
    };

    const avatarOptions = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    ];

    return (
        <div className="min-h-screen bg-netflix-black">
            <Navbar />

            <div className="pt-24 px-4 md:px-16 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Account Settings</h1>

                <div className="bg-netflix-gray-dark rounded-lg p-8">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-netflix-gray-medium">
                        <div className="w-24 h-24 bg-netflix-red rounded flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded" />
                            ) : (
                                <FaUser size={48} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">{user?.displayName || 'User'}</h2>
                            <p className="text-gray-400">{user?.email}</p>
                        </div>
                    </div>

                    {/* Avatar Selection */}
                    {isEditing && (
                        <div className="mb-8 pb-8 border-b border-netflix-gray-medium">
                            <h3 className="text-xl font-semibold mb-4">Choose Avatar</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {avatarOptions.map((avatar, index) => (
                                    <img
                                        key={index}
                                        src={avatar}
                                        alt={`Avatar ${index + 1}`}
                                        className="w-20 h-20 rounded cursor-pointer hover:ring-2 hover:ring-netflix-red transition"
                                        onClick={() => {
                                            // Update avatar logic here
                                            console.log('Avatar selected:', avatar);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Account Info */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-gray-400 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={user?.displayName || ''}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 bg-netflix-gray-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-netflix-gray-medium text-white rounded opacity-50 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-primary"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-secondary"
                            >
                                Edit Profile
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="btn bg-gray-600 hover:bg-gray-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
