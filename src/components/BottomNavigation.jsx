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
        <nav className="bottom-nav md:hidden touch-manipulation">
            <div className="flex justify-around items-center max-w-md mx-auto px-2 py-1">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen || 
                        (item.screen === 'browse' && currentScreen === 'start');
                    
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.screen)}
                            className={`bottom-nav-item ${
                                isActive 
                                    ? 'text-blue-600' 
                                    : 'text-gray-500'
                            }`}
                            role="menuitem"
                            aria-label={`Go to ${item.label.toLowerCase()}`}
                        >
                            <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                                <Icon 
                                    size={22} 
                                    className="mb-1" 
                                    strokeWidth={isActive ? 2.5 : 2}
                                    aria-hidden="true"
                                />
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                                )}
                            </div>
                            <span className={`bottom-nav-label ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
