import React from 'react';
import { useUser, useSignOut, useCurrentScreen, useSetCurrentScreen, useAuthStore } from '../stores';
import NotificationIcon from './NotificationIcon';
import ChatIcon from './ChatIcon';
import LanguageDropdown from './LanguageDropdown';
import { useTranslation } from '../contexts/TranslationProvider';
import { isAdmin, getUserDisplayName, isGuestUser } from '../utils/authUtils';

const Navbar = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const handleSignOut = useSignOut();
    const setCurrentScreen = useSetCurrentScreen();
    const { t } = useTranslation();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const isDevelopment = import.meta.env.DEV;
    const displayName = getUserDisplayName(user, loginMethod);

    // Safety wrapper for translation function
    const safeTranslate = (key, fallback) => {
        try {
            return t && typeof t === 'function' ? t(key) || fallback : fallback;
        } catch (error) {
            console.warn('Translation error:', error);
            return fallback;
        }
    };

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
            { key: 'browse', label: safeTranslate('common.browse', 'Browse'), screen: 'browse' },
            { key: 'groupbuys', label: safeTranslate('common.groupBuys', 'Group Buys'), screen: 'groupbuys' },
            { key: 'errands', label: safeTranslate('common.errands', 'Errands'), screen: 'errands' },
            { key: 'dashboard', label: safeTranslate('common.dashboard', 'Dashboard'), screen: 'dashboard' },
            ...(isAdmin(user, loginMethod) ? [{ key: 'moderation', label: 'Moderation', screen: 'moderation' }] : [])
        ]
        : [
            { key: 'start', label: safeTranslate('common.home', 'Home'), screen: 'start' },
            { key: 'groupbuys', label: safeTranslate('common.groupBuys', 'Group Buys'), screen: 'groupbuys' },
            { key: 'errands', label: safeTranslate('common.errands', 'Errands'), screen: 'errands' }
        ];

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <div className="navbar-container max-w-7xl mx-auto px-2 sm:px-3 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16 gap-1">
                    {/* Brand - Mobile optimized */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => handleNavigation('start')}
                            className="navbar-brand text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                            <span className="hidden sm:inline">{safeTranslate('common.appName', 'Korean Community Commerce')}</span>
                            <span className="sm:hidden">{safeTranslate('common.appNameShort', 'KCC')}</span>
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

                    {/* User Actions - Fixed alignment with consistent spacing */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Language Dropdown */}
                        <LanguageDropdown />
                        
                        {user ? (
                            <>
                                {/* Chat Icon - Consistent tap target */}
                                <div className="flex items-center justify-center">
                                    <ChatIcon />
                                </div>
                                
                                {/* Notification Icon - Consistent tap target */}
                                <div className="flex items-center justify-center">
                                    <NotificationIcon />
                                </div>
                                
                                {/* User Profile - Mobile optimized with consistent spacing */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="avatar-circle w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px]">
                                        <span className="text-sm sm:text-base font-bold text-white">
                                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {/* Only show roles for registered users, not guests */}
                                            {!isGuestUser(user, loginMethod) && user.roles?.map(role => (
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
                                            {/* Only show verified status for registered users, not guests */}
                                            {!isGuestUser(user, loginMethod) && user.helperVerified && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Mobile optimized with consistent spacing */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {isDevelopment && (
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="btn-reset hidden sm:inline-flex px-3 py-2 text-sm min-h-[44px] min-w-[44px]"
                                        >
                                            {safeTranslate('common.reset', 'Reset')}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="btn-primary px-3 sm:px-4 py-2 text-xs sm:text-sm min-h-[44px] min-w-[44px]"
                                    >
                                        <span className="hidden sm:inline">{safeTranslate('common.logout', 'Logout')}</span>
                                        <span className="sm:hidden">{safeTranslate('common.logoutShort', 'Out')}</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => handleNavigation('auth')}
                                className="btn-primary px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors min-h-[44px] min-w-[44px] text-sm sm:text-base"
                            >
                                <span className="hidden sm:inline">{safeTranslate('common.loginSignUp', 'Login / Sign Up')}</span>
                                <span className="sm:hidden">{safeTranslate('common.login', 'Login')}</span>
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
