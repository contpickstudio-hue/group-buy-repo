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
        <nav className="navbar bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
            <div className="navbar-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => handleNavigation('start')}
                            className="navbar-brand text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Korean Community Commerce
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
                                {/* User Profile */}
                                <div className="flex items-center space-x-3">
                                    <div className="avatar-circle w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="flex space-x-1">
                                            {user.roles?.map(role => (
                                                <span
                                                    key={role}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        role === 'customer' ? 'bg-green-100 text-green-800' :
                                                        role === 'vendor' ? 'bg-yellow-100 text-yellow-800' :
                                                        role === 'helper' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {role.toUpperCase()}
                                                </span>
                                            ))}
                                            {user.helperVerified && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Verified ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn-reset px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Reset App
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-primary px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Logout
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

            {/* Mobile Navigation Menu */}
            <div className="md:hidden border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.screen)}
                            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                                currentScreen === item.screen
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
