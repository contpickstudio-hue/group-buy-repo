import React from 'react';
import { Home, ShoppingCart, Users, User, LayoutDashboard, Settings } from 'lucide-react';
import { useUser, useCurrentScreen, useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

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
            label: t('common.home'),
            icon: Home,
            screen: 'browse'
        },
        {
            key: 'groupbuys',
            label: t('common.groupBuys'),
            icon: ShoppingCart,
            screen: 'groupbuys'
        },
        {
            key: 'errands',
            label: t('common.errands'),
            icon: Users,
            screen: 'errands'
        },
        {
            key: 'dashboard',
            label: t('common.dashboard'),
            icon: LayoutDashboard,
            screen: 'dashboard'
        },
        {
            key: 'settings',
            label: t('common.settings'),
            icon: Settings,
            screen: 'settings'
        }
    ];

    return (
        <nav className="bottom-nav md:hidden touch-manipulation" style={{ minHeight: '64px' }}>
            <div className="flex justify-around items-center max-w-md mx-auto px-2 py-2">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen || 
                        (item.screen === 'browse' && currentScreen === 'start');
                    
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.screen)}
                            className={`bottom-nav-item flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 ${
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
                            <span className={`bottom-nav-label text-xs mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
