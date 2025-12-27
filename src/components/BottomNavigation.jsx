import React from 'react';
import { useUser, useCurrentScreen, useSetCurrentScreen } from '../stores';
import { Home, ShoppingCart, Package, LayoutDashboard, User } from 'lucide-react';

const BottomNavigation = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const setCurrentScreen = useSetCurrentScreen();

    const handleNavigation = (screen) => {
        setCurrentScreen(screen);
        // Scroll to top when navigating
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Navigation items based on user authentication
    const navItems = user
        ? [
            { key: 'browse', label: 'Browse', screen: 'browse', icon: Home },
            { key: 'groupbuys', label: 'Group Buys', screen: 'groupbuys', icon: ShoppingCart },
            { key: 'errands', label: 'Errands', screen: 'errands', icon: Package },
            { key: 'dashboard', label: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
            { key: 'profile', label: 'Profile', screen: 'profile', icon: User }
          ]
        : [
            { key: 'start', label: 'Home', screen: 'start', icon: Home },
            { key: 'groupbuys', label: 'Group Buys', screen: 'groupbuys', icon: ShoppingCart },
            { key: 'errands', label: 'Errands', screen: 'errands', icon: Package }
          ];

    return (
        <nav 
            className="bottom-nav md:hidden" 
            role="navigation" 
            aria-label="Bottom navigation"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around px-2 py-2">
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

