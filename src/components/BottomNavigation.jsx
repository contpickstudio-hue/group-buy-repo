import React from 'react';
import { Home, ShoppingCart, Users, User } from 'lucide-react';
import { useUser, useCurrentScreen, useSetCurrentScreen } from '../stores';

const BottomNavigation = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const setCurrentScreen = useSetCurrentScreen();

    if (!user) return null; // Only show for authenticated users

    const handleNavigation = (screen) => {
        setCurrentScreen(screen);
    };

    const navItems = [
        {
            key: 'browse',
            label: 'Home',
            icon: Home,
            screen: 'browse'
        },
        {
            key: 'groupbuys',
            label: 'Group Buys',
            icon: ShoppingCart,
            screen: 'groupbuys'
        },
        {
            key: 'errands',
            label: 'Errands',
            icon: Users,
            screen: 'errands'
        },
        {
            key: 'profile',
            label: 'Profile',
            icon: User,
            screen: 'profile'
        }
    ];

    return (
        <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50 md:hidden">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen || 
                        (item.screen === 'browse' && currentScreen === 'start');
                    
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.screen)}
                            className={`bottom-nav-item flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                                isActive 
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                            role="menuitem"
                            aria-label={`Go to ${item.label.toLowerCase()}`}
                        >
                            <Icon 
                                size={20} 
                                className="bottom-nav-icon mb-1" 
                                aria-hidden="true"
                            />
                            <span className="bottom-nav-label text-xs font-medium">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;
