import React from 'react';
import { useUser, useCurrentScreen, useSetCurrentScreen, useAuthStore } from '../stores';
import { Home, ShoppingCart, Package, LayoutDashboard, User } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationProvider';
import { isGuestUser } from '../utils/authUtils';

const BottomNavigation = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const setCurrentScreen = useSetCurrentScreen();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const { t } = useTranslation();
    const isGuest = user ? isGuestUser(user, loginMethod) : false;

    const handleNavigation = (screen) => {
        setCurrentScreen(screen);
        // Scroll to top when navigating
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Enhanced translation wrapper with guaranteed fallback
    const safeTranslate = (key, fallback) => {
        try {
            if (!t || typeof t !== 'function') {
                return fallback || '';
            }
            
            const translation = t(key, null, fallback);
            
            // Ensure we never return raw keys or empty strings in production
            if (import.meta.env.PROD) {
                if (translation === key && fallback) {
                    return fallback;
                }
                if (!translation || translation.trim() === '') {
                    return fallback || '';
                }
            }
            
            return translation || fallback || '';
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn('Translation error:', error);
            }
            return fallback || '';
        }
    };

    // Navigation items based on user authentication
    // Guests can only browse (Home, Browse, Group Buys, Errands) - no Dashboard or Profile
    const navItems = !user || isGuest
        ? [
            { key: 'start', label: safeTranslate('common.home', 'Home'), screen: 'start', icon: Home },
            { key: 'groupbuys', label: safeTranslate('common.groupBuys', 'Group Buys'), screen: 'groupbuys', icon: ShoppingCart },
            { key: 'errands', label: safeTranslate('common.errands', 'Errands'), screen: 'errands', icon: Package }
          ]
        : [
            { key: 'browse', label: safeTranslate('common.browse', 'Browse'), screen: 'browse', icon: Home },
            { key: 'groupbuys', label: safeTranslate('common.groupBuys', 'Group Buys'), screen: 'groupbuys', icon: ShoppingCart },
            { key: 'errands', label: safeTranslate('common.errands', 'Errands'), screen: 'errands', icon: Package },
            { key: 'dashboard', label: safeTranslate('common.dashboard', 'Dashboard'), screen: 'dashboard', icon: LayoutDashboard },
            { key: 'profile', label: safeTranslate('common.profile', 'Profile'), screen: 'profile', icon: User }
          ];

    return (
        <nav 
            className="bottom-nav md:hidden" 
            role="navigation" 
            aria-label="Bottom navigation"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around px-2 py-2.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen;
                    
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.screen)}
                            className={`bottom-nav-item ${
                                isActive ? 'active' : 'text-gray-600 hover:text-blue-600'
                            }`}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon 
                                size={22} 
                                className={isActive ? 'text-blue-600' : 'text-gray-500'}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-xs font-medium mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;

