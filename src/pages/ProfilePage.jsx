import React, { useEffect } from 'react';
import { useUser, useSignOut, useSetCurrentScreen, useSetUser, useAppStore } from '../stores';
import { 
  useCommunitySavings,
  useUserContribution,
  useLoadCommunityStats,
  useLoadUserContribution,
  useCredits,
  useLoadCredits,
  useReferralStats,
  useLoadReferralStats,
  useGenerateReferralCode
} from '../stores';
import { signOut as supabaseSignOut } from '../services/supabaseService';
import MyOrdersPage from './MyOrdersPage';
import CommunitySavings from '../components/CommunitySavings';
import ReferralShare from '../components/ReferralShare';
import ReferralBadges from '../components/ReferralBadges';
import CreditsDisplay from '../components/CreditsDisplay';

const ProfilePage = () => {
    try {
        const user = useUser();
        const signOutAction = useSignOut();
        const setCurrentScreen = useSetCurrentScreen();
        const setUser = useSetUser();
        const resetStore = useAppStore((state) => state.resetStore);
        const [showOrders, setShowOrders] = React.useState(false);
        
        // Community stats hooks
        const loadCommunityStats = useLoadCommunityStats();
        const loadUserContribution = useLoadUserContribution();
        const userContribution = useUserContribution();
        
        // Credits hooks
        const loadCredits = useLoadCredits();
        
        // Referral hooks
        const loadReferralStats = useLoadReferralStats();
        const generateReferralCode = useGenerateReferralCode();

        // Load data on mount
        useEffect(() => {
            if (user) {
                loadCommunityStats();
                loadUserContribution();
                loadCredits();
                loadReferralStats();
                generateReferralCode();
            }
        }, [user, loadCommunityStats, loadUserContribution, loadCredits, loadReferralStats, generateReferralCode]);

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <p className="text-gray-500">Please sign in to view your profile.</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await supabaseSignOut();
            setUser(null);
            setCurrentScreen('start');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleResetApp = () => {
        if (confirm('Are you sure you want to reset all app data? This cannot be undone.')) {
            resetStore();
            window.location.reload();
        }
    };

    const roles = user.roles || [];

    if (showOrders) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => setShowOrders(false)}
                    className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                    ← Back to Profile
                </button>
                <MyOrdersPage />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h2>
                <p className="text-gray-600">Manage your account and preferences</p>
            </div>

            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-8 text-white">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                        <p className="opacity-90">{user.email}</p>
                        <div className="flex space-x-2 mt-2">
                            {roles.map(role => (
                                <span
                                    key={role}
                                    className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm font-medium"
                                >
                                    {role.toUpperCase()}
                                </span>
                            ))}
                            {user.helperVerified && (
                                <span className="px-2 py-1 bg-green-500 bg-opacity-80 rounded text-sm font-medium">
                                    Verified ✓
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Account Settings</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Display Name</div>
                            <div className="text-gray-500 text-sm">{user.name}</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Edit
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Email Address</div>
                            <div className="text-gray-500 text-sm">{user.email}</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Change
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">User Roles</div>
                            <div className="text-gray-500 text-sm">{roles.join(', ')}</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Manage
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">My Orders</div>
                            <div className="text-gray-500 text-sm">View your order history</div>
                        </div>
                        <button 
                            onClick={() => setShowOrders(true)}
                            className="text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-3"
                        >
                            View Orders
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Settings</div>
                            <div className="text-gray-500 text-sm">Manage your preferences</div>
                        </div>
                        <button 
                            onClick={() => setCurrentScreen('settings')}
                            className="text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-3"
                        >
                            Open Settings
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Language</div>
                            <div className="text-gray-500 text-sm">English</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Switch
                        </button>
                    </div>
                </div>
            </div>

            {/* Community Contribution */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Community Contribution</h3>
                </div>
                <div className="p-6">
                    <CommunitySavings compact={true} />
                </div>
            </div>

            {/* Referral Section */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Referrals</h3>
                </div>
                <div className="p-6">
                    <ReferralShare />
                </div>
            </div>

            {/* Referral Badges */}
            <div className="mb-8">
                <ReferralBadges />
            </div>

            {/* Credits Section */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Credits</h3>
                </div>
                <div className="p-6">
                    <CreditsDisplay showHistory={true} compact={false} />
                </div>
            </div>

            {/* Helper Profile */}
            {roles.includes('helper') && (
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Helper Profile</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                user.helperVerified 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {user.helperVerified ? '✓ Verified' : '⏳ Pending Verification'}
                            </span>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                Update Helper Profile
                            </button>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Complete your helper verification to start accepting errands.
                        </p>
                    </div>
                </div>
            )}

            {/* Privacy & Security */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Privacy & Security</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Password</div>
                            <div className="text-gray-500 text-sm">Change your account password</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Change
                        </button>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <div className="font-medium">Data Export</div>
                            <div className="text-gray-500 text-sm">Download your account data</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Account Actions</h3>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handleResetApp}
                        className="w-full md:w-auto px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                    >
                        Reset App Data
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ml-0 md:ml-4"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
    } catch (error) {
        console.error('ProfilePage error:', error);
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Unable to Load Profile
                    </h3>
                    <p className="text-red-600 mb-4">
                        There was an error loading your profile. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }
};

export default ProfilePage;
