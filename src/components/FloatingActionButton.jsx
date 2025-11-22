import React, { useState, useRef, useEffect } from 'react';
import { Plus, Store, HandHeart, Search, ShoppingCart } from 'lucide-react';
import { useUser, useCurrentScreen, useSetCurrentScreen } from '../stores';

const FloatingActionButton = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const setCurrentScreen = useSetCurrentScreen();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const fabRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current && 
                !menuRef.current.contains(event.target) &&
                fabRef.current &&
                !fabRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        }

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMenuOpen]);

    // Early return AFTER all hooks - React rules!
    if (!user) return null; // Only show for authenticated users

    const roles = user.roles || [];

    const handleFabClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleActionClick = (action) => {
        action();
        setIsMenuOpen(false);
    };

    // Define available actions based on user roles
    const actions_list = [];

    if (roles.includes('vendor')) {
        actions_list.push({
            icon: Store,
            label: 'Create Group Buy',
            action: () => {
                setCurrentScreen('dashboard');
                // Scroll to create product form after navigation
                setTimeout(() => {
                    const createForm = document.querySelector('[data-testid="create-product-form"]');
                    if (createForm) {
                        createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        const titleInput = createForm.querySelector('input[name="title"]');
                        if (titleInput) titleInput.focus();
                    }
                }, 100);
            }
        });
    }

    if (roles.includes('customer')) {
        actions_list.push({
            icon: HandHeart,
            label: 'Post Errand',
            action: () => {
                setCurrentScreen('errands');
                // Scroll to create errand form after navigation
                setTimeout(() => {
                    const createForm = document.querySelector('[data-testid="create-errand-form"]');
                    if (createForm) {
                        createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        const titleInput = createForm.querySelector('input[name="title"]');
                        if (titleInput) titleInput.focus();
                    }
                }, 100);
            }
        });
    }

    if (roles.includes('helper')) {
        actions_list.push({
            icon: Search,
            label: 'Browse Errands',
            action: () => {
                setCurrentScreen('errands');
            }
        });
    }

    // Always show browse option
    actions_list.push({
        icon: ShoppingCart,
        label: 'Browse Group Buys',
        action: () => {
            setCurrentScreen('groupbuys');
        }
    });

    return (
        <div className="fab-container fixed bottom-20 right-4 z-40 md:bottom-6">
            {/* FAB Menu */}
            {isMenuOpen && (
                <div 
                    ref={menuRef}
                    className="fab-menu absolute bottom-16 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-48 transform transition-all duration-200 ease-out"
                    style={{
                        transform: isMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                        opacity: isMenuOpen ? 1 : 0
                    }}
                >
                    {actions_list.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => handleActionClick(action.action)}
                                className="fab-menu-item w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                                <Icon 
                                    size={20} 
                                    className="fab-menu-icon mr-3 text-gray-600" 
                                />
                                <span className="fab-menu-label text-sm font-medium text-gray-700">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* FAB Button */}
            <button
                ref={fabRef}
                onClick={handleFabClick}
                className={`fab-button w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
                    isMenuOpen ? 'rotate-45' : 'rotate-0'
                }`}
                aria-label="Quick action button"
                aria-expanded={isMenuOpen}
            >
                <Plus size={24} className="transition-transform duration-200" />
            </button>
        </div>
    );
};

export default FloatingActionButton;
