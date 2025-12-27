import React, { useState, useRef, useEffect } from 'react';
import { Plus, Store, HandHeart, Search, ShoppingCart } from 'lucide-react';
import { useUser, useCurrentScreen, useSetCurrentScreen, useAuthStore } from '../stores';
import { isGuestUser } from '../utils/authUtils';

const FloatingActionButton = () => {
    const user = useUser();
    const currentScreen = useCurrentScreen();
    const setCurrentScreen = useSetCurrentScreen();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const menuRef = useRef(null);
    const fabRef = useRef(null);

    // Hide FAB when input is focused to prevent overlap
    useEffect(() => {
        const handleFocusIn = (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                setIsInputFocused(true);
            }
        };

        const handleFocusOut = (e) => {
            // Small delay to check if another input is focused
            setTimeout(() => {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                    setIsInputFocused(true);
                } else {
                    setIsInputFocused(false);
                }
            }, 100);
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        
        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    // Close menu when clicking outside (handles both mouse and touch events)
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
            // Handle both mouse and touch events for better mobile support
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        }
    }, [isMenuOpen]);

    // Early return AFTER all hooks - React rules!
    if (!user) return null; // Only show for authenticated users

    const loginMethod = useAuthStore((state) => state.loginMethod);
    const isGuest = isGuestUser(user, loginMethod);
    const roles = user.roles || [];

    const handleFabClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleActionClick = (action) => {
        action();
        setIsMenuOpen(false);
    };

    // Define available actions based on user roles
    // Guest users can only browse, not create content
    const actions_list = [];

    if (!isGuest && roles.includes('vendor')) {
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

    if (!isGuest && roles.includes('customer')) {
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

    // Hide FAB when input is focused
    if (isInputFocused) {
        return null;
    }

    return (
        <div className="fab-container" style={{ bottom: 'calc(64px + 1rem + env(safe-area-inset-bottom))', zIndex: 30 }}>
            {/* FAB Menu - Mobile optimized */}
            {isMenuOpen && (
                <div 
                    ref={menuRef}
                    className="fab-menu animate-scale-in"
                >
                    {actions_list.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => handleActionClick(action.action)}
                                className="fab-menu-item touch-manipulation"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                                    <Icon 
                                        size={20} 
                                        className="text-blue-600" 
                                    />
                                </div>
                                <span className="fab-menu-label">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* FAB Button - Mobile optimized */}
            <button
                ref={fabRef}
                onClick={handleFabClick}
                className={`fab-button touch-manipulation ${
                    isMenuOpen ? 'rotate-45 bg-gradient-to-br from-red-500 to-red-600' : ''
                }`}
                aria-label="Quick action button"
                aria-expanded={isMenuOpen}
            >
                <Plus 
                    size={28} 
                    className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}
                    strokeWidth={2.5}
                />
            </button>
        </div>
    );
};

export default FloatingActionButton;
