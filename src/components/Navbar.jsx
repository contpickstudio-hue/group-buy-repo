import React from 'react';
import { useUser, useSignOut, useCurrentScreen, useSetCurrentScreen } from '../stores';

const Navbar = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const handleSignOut = useSignOut();
    const setCurrentScreen = useSetCurrentScreen();

    const handleNavigation = (screen) => {
        setCurrentScreen(screen);
    };

    const handleLogout = async () => {
        const result = await handleSignOut();
        if (result.success) {
            setCurrentScreen('start');
        }
    };

    const navItems = user
        ? [
            { key: 'browse', label: 'Browse', screen: 'browse' },
            { key: 'groupbuys', label: 'Group Buys', screen: 'groupbuys' },
            { key: 'errands', label: 'Errands', screen: 'errands' },
            { key: 'dashboard', label: 'Dashboard', screen: 'dashboard' }
        ]
        : [
            { key: 'start', label: 'Home', screen: 'start' },
            { key: 'groupbuys', label: 'Group Buys', screen: 'groupbuys' },
            { key: 'errands', label: 'Errands', screen: 'errands' }
        ];

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <div className="navbar-container max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* Brand - Mobile optimized */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => handleNavigation('start')}
                            className="navbar-brand text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                            <span className="hidden sm:inline">Korean Community Commerce</span>
                            <span className="sm:hidden">KCC</span>
                        </button>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4" role="menubar">
                            {navItems.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => handleNavigation(item.screen)}
                                    className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        currentScreen === item.screen
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                    role="menuitem"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                {/* User Profile - Mobile optimized */}
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="avatar-circle w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                                        <span className="text-sm sm:text-base font-bold text-white">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {user.roles?.map(role => (
                                                <span
                                                    key={role}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${
                                                        role === 'customer' ? 'bg-blue-600' :
                                                        role === 'vendor' ? 'bg-purple-600' :
                                                        role === 'helper' ? 'bg-green-600' :
                                                        'bg-gray-600'
                                                    }`}
                                                >
                                                    {role.toUpperCase()}
                                                </span>
                                            ))}
                                            {user.helperVerified && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Mobile optimized */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn-reset hidden sm:inline-flex px-3 py-1.5 text-sm"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">Logout</span>
                                        <span className="sm:hidden">Out</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleNavigation('auth')}
                                className="btn-primary px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Login / Sign Up
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu - Hidden by default, shown only when menu is toggled */}
            {/* Note: Mobile navigation is handled by BottomNavigation component */}
        </nav>
    );
};

export default Navbar;
