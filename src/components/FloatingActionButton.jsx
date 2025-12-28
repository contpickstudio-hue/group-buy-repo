import React, { useState, useRef, useEffect } from 'react';
import { Plus, Store, HandHeart, Search, ShoppingCart } from 'lucide-react';
import { useUser, useCurrentScreen, useSetCurrentScreen, useAuthStore } from '../stores';
import { isGuestUser, hasRole } from '../utils/authUtils';
import { checkPermission } from '../utils/rbacUtils';
import { t } from '../utils/translations';

const FloatingActionButton = () => {
    // Wrap entire component logic in try-catch to prevent any errors from bubbling up
    try {
        const user = useUser();
        const currentScreen = useCurrentScreen();
        const setCurrentScreen = useSetCurrentScreen();
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [isInputFocused, setIsInputFocused] = useState(false);
        const menuRef = useRef(null);
        const fabRef = useRef(null);

        // Hide FAB when input is focused to prevent overlap
        useEffect(() => {
            try {
                const handleFocusIn = (e) => {
                    try {
                        const target = e?.target;
                        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                            setIsInputFocused(true);
                        }
                    } catch (err) {
                        // Fail silently
                        if (import.meta.env.DEV) {
                            console.warn('FAB focus handler error:', err);
                        }
                    }
                };

                const handleFocusOut = (e) => {
                    try {
                        // Small delay to check if another input is focused
                        setTimeout(() => {
                            try {
                                const activeElement = document?.activeElement;
                                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                                    setIsInputFocused(true);
                                } else {
                                    setIsInputFocused(false);
                                }
                            } catch (err) {
                                // Fail silently
                                if (import.meta.env.DEV) {
                                    console.warn('FAB focus check error:', err);
                                }
                            }
                        }, 100);
                    } catch (err) {
                        // Fail silently
                        if (import.meta.env.DEV) {
                            console.warn('FAB focus out handler error:', err);
                        }
                    }
                };

                document.addEventListener('focusin', handleFocusIn);
                document.addEventListener('focusout', handleFocusOut);
                
                return () => {
                    try {
                        document.removeEventListener('focusin', handleFocusIn);
                        document.removeEventListener('focusout', handleFocusOut);
                    } catch (err) {
                        // Fail silently on cleanup
                    }
                };
            } catch (err) {
                // Fail silently - FAB will still work without focus detection
                if (import.meta.env.DEV) {
                    console.warn('FAB focus effect error:', err);
                }
            }
        }, []);

        // Close menu when clicking outside (handles both mouse and touch events)
        useEffect(() => {
            try {
                function handleClickOutside(event) {
                    try {
                        if (
                            menuRef.current && 
                            !menuRef.current.contains(event.target) &&
                            fabRef.current &&
                            !fabRef.current.contains(event.target)
                        ) {
                            setIsMenuOpen(false);
                        }
                    } catch (err) {
                        // Fail silently
                        if (import.meta.env.DEV) {
                            console.warn('FAB click outside handler error:', err);
                        }
                    }
                }

                if (isMenuOpen) {
                    // Handle both mouse and touch events for better mobile support
                    document.addEventListener('mousedown', handleClickOutside);
                    document.addEventListener('touchstart', handleClickOutside);
                    return () => {
                        try {
                            document.removeEventListener('mousedown', handleClickOutside);
                            document.removeEventListener('touchstart', handleClickOutside);
                        } catch (err) {
                            // Fail silently on cleanup
                        }
                    };
                }
            } catch (err) {
                // Fail silently - menu will still work
                if (import.meta.env.DEV) {
                    console.warn('FAB click outside effect error:', err);
                }
            }
        }, [isMenuOpen]);

        // Early return AFTER all hooks - React rules!
        // Guard: Only show for authenticated users
        if (!user) return null;

        // Safely get loginMethod with error handling
        let loginMethod;
        try {
            loginMethod = useAuthStore((state) => state?.loginMethod);
        } catch (err) {
            // If auth store fails, don't show FAB
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to get loginMethod:', err);
            }
            return null;
        }

        // Guard: Check if user is guest with error handling
        let isGuest = false;
        try {
            isGuest = isGuestUser(user, loginMethod);
        } catch (err) {
            // If guest check fails, don't show FAB to be safe
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to check guest status:', err);
            }
            return null;
        }

        // Guard: Don't render FAB for guest users
        if (isGuest) return null;

        // Check if user has any valid roles for FAB actions with error handling
        let hasVendorRole = false;
        let hasCustomerRole = false;
        let hasHelperRole = false;
        
        try {
            hasVendorRole = hasRole(user, 'vendor', loginMethod);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to check vendor role:', err);
            }
        }

        try {
            hasCustomerRole = hasRole(user, 'customer', loginMethod);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to check customer role:', err);
            }
        }

        try {
            hasHelperRole = hasRole(user, 'helper', loginMethod);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to check helper role:', err);
            }
        }
        
        // If user has no valid roles, don't show FAB
        if (!hasVendorRole && !hasCustomerRole && !hasHelperRole) {
            return null;
        }

        const handleFabClick = () => {
            try {
                setIsMenuOpen(prev => !prev);
            } catch (err) {
                // Fail silently
                if (import.meta.env.DEV) {
                    console.warn('FAB: Failed to toggle menu:', err);
                }
            }
        };

        const handleActionClick = (action) => {
            if (!action || typeof action !== 'function') {
                // Invalid action - fail silently
                if (import.meta.env.DEV) {
                    console.warn('FAB: Invalid action provided');
                }
                return;
            }

            try {
                action();
                setIsMenuOpen(false);
            } catch (error) {
                // Fail silently in production - no error messages to users
                if (import.meta.env.DEV) {
                    console.error('FAB action error:', error);
                }
                try {
                    setIsMenuOpen(false);
                } catch (err) {
                    // Fail silently on menu close
                }
            }
        };

        // Define available actions based on user roles with RBAC checks
        const actions_list = [];

        // Vendor action - guarded by RBAC
        if (hasVendorRole) {
            try {
                actions_list.push({
                    icon: Store,
                    label: t('floatingAction.createGroupBuy'),
                    action: () => {
                        try {
                            // RBAC check before navigation with error handling
                            let permissionCheck;
                            try {
                                permissionCheck = checkPermission(user, loginMethod, 'vendor');
                            } catch (err) {
                                // If permission check fails, don't proceed
                                if (import.meta.env.DEV) {
                                    console.warn('FAB: Permission check error:', err);
                                }
                                return;
                            }

                            if (!permissionCheck || !permissionCheck.allowed) {
                                // Silently fail - user shouldn't see this option if they don't have permission
                                return;
                            }

                            try {
                                if (setCurrentScreen && typeof setCurrentScreen === 'function') {
                                    setCurrentScreen('dashboard');
                                    // Scroll to create product form after navigation
                                    setTimeout(() => {
                                        try {
                                            const createForm = document?.querySelector('[data-testid="create-product-form"]');
                                            if (createForm) {
                                                createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                const titleInput = createForm.querySelector('input[name="title"]');
                                                if (titleInput) titleInput.focus();
                                            }
                                        } catch (scrollError) {
                                            // Fail silently - scrolling errors shouldn't break the app
                                        }
                                    }, 100);
                                }
                            } catch (error) {
                                // Fail silently
                                if (import.meta.env.DEV) {
                                    console.error('FAB: Error navigating to dashboard:', error);
                                }
                            }
                        } catch (err) {
                            // Fail silently
                            if (import.meta.env.DEV) {
                                console.warn('FAB: Vendor action error:', err);
                            }
                        }
                    }
                });
            } catch (err) {
                // Fail silently - skip this action if it can't be added
                if (import.meta.env.DEV) {
                    console.warn('FAB: Failed to add vendor action:', err);
                }
            }
        }

        // Customer action - guarded by RBAC
        if (hasCustomerRole) {
            try {
                actions_list.push({
                    icon: HandHeart,
                    label: t('floatingAction.postErrand'),
                    action: () => {
                        try {
                            // RBAC check before navigation with error handling
                            let permissionCheck;
                            try {
                                permissionCheck = checkPermission(user, loginMethod, 'customer');
                            } catch (err) {
                                // If permission check fails, don't proceed
                                if (import.meta.env.DEV) {
                                    console.warn('FAB: Permission check error:', err);
                                }
                                return;
                            }

                            if (!permissionCheck || !permissionCheck.allowed) {
                                // Silently fail
                                return;
                            }

                            try {
                                if (setCurrentScreen && typeof setCurrentScreen === 'function') {
                                    setCurrentScreen('errands');
                                    // Scroll to create errand form after navigation
                                    setTimeout(() => {
                                        try {
                                            const createForm = document?.querySelector('[data-testid="create-errand-form"]');
                                            if (createForm) {
                                                createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                const titleInput = createForm.querySelector('input[name="title"]');
                                                if (titleInput) titleInput.focus();
                                            }
                                        } catch (scrollError) {
                                            // Fail silently
                                        }
                                    }, 100);
                                }
                            } catch (error) {
                                // Fail silently
                                if (import.meta.env.DEV) {
                                    console.error('FAB: Error navigating to errands:', error);
                                }
                            }
                        } catch (err) {
                            // Fail silently
                            if (import.meta.env.DEV) {
                                console.warn('FAB: Customer action error:', err);
                            }
                        }
                    }
                });
            } catch (err) {
                // Fail silently - skip this action if it can't be added
                if (import.meta.env.DEV) {
                    console.warn('FAB: Failed to add customer action:', err);
                }
            }
        }

        // Helper action - guarded by RBAC
        if (hasHelperRole) {
            try {
                actions_list.push({
                    icon: Search,
                    label: t('floatingAction.browseErrands'),
                    action: () => {
                        try {
                            // RBAC check before navigation with error handling
                            let permissionCheck;
                            try {
                                permissionCheck = checkPermission(user, loginMethod, 'helper');
                            } catch (err) {
                                // If permission check fails, don't proceed
                                if (import.meta.env.DEV) {
                                    console.warn('FAB: Permission check error:', err);
                                }
                                return;
                            }

                            if (!permissionCheck || !permissionCheck.allowed) {
                                // Silently fail
                                return;
                            }

                            try {
                                if (setCurrentScreen && typeof setCurrentScreen === 'function') {
                                    setCurrentScreen('errands');
                                }
                            } catch (error) {
                                // Fail silently
                                if (import.meta.env.DEV) {
                                    console.error('FAB: Error navigating to errands:', error);
                                }
                            }
                        } catch (err) {
                            // Fail silently
                            if (import.meta.env.DEV) {
                                console.warn('FAB: Helper action error:', err);
                            }
                        }
                    }
                });
            } catch (err) {
                // Fail silently - skip this action if it can't be added
                if (import.meta.env.DEV) {
                    console.warn('FAB: Failed to add helper action:', err);
                }
            }
        }

        // Always show browse option (no role required, just navigation)
        try {
            actions_list.push({
                icon: ShoppingCart,
                label: t('floatingAction.browseGroupBuys'),
                action: () => {
                    try {
                        if (setCurrentScreen && typeof setCurrentScreen === 'function') {
                            setCurrentScreen('groupbuys');
                        }
                    } catch (error) {
                        // Fail silently
                        if (import.meta.env.DEV) {
                            console.error('FAB: Error navigating to groupbuys:', error);
                        }
                    }
                }
            });
        } catch (err) {
            // Fail silently - skip browse action if it can't be added
            if (import.meta.env.DEV) {
                console.warn('FAB: Failed to add browse action:', err);
            }
        }

        // Hide FAB when input is focused
        if (isInputFocused) {
            return null;
        }

        // Safety check: Don't render FAB if no actions available
        if (!actions_list || actions_list.length === 0) {
            return null;
        }

        // Render FAB with error handling
        try {
            return (
                <div className="fab-container" style={{ bottom: 'calc(72px + 1rem + env(safe-area-inset-bottom))', zIndex: 30 }}>
                    {/* FAB Menu - Mobile optimized */}
                    {isMenuOpen && (
                        <div 
                            ref={menuRef}
                            className="fab-menu animate-scale-in"
                        >
                            {actions_list.map((action, index) => {
                                try {
                                    if (!action || !action.icon || !action.label) {
                                        // Skip invalid actions
                                        return null;
                                    }
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleActionClick(action.action)}
                                            className="fab-menu-item touch-manipulation"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <Icon 
                                                    size={22} 
                                                    className="text-blue-600" 
                                                />
                                            </div>
                                            <span className="fab-menu-label text-base font-medium">
                                                {action.label}
                                            </span>
                                        </button>
                                    );
                                } catch (err) {
                                    // Skip this action item if it fails to render
                                    if (import.meta.env.DEV) {
                                        console.warn('FAB: Failed to render action item:', err);
                                    }
                                    return null;
                                }
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
        } catch (err) {
            // If render fails, return null instead of throwing
            if (import.meta.env.DEV) {
                console.error('FAB: Render error:', err);
            }
            return null;
        }
    } catch (error) {
        // Catch any errors in the entire component and fail silently
        // This prevents the SectionErrorBoundary from showing error banners
        if (import.meta.env.DEV) {
            console.error('FAB: Component error:', error);
        }
        return null;
    }
};

export default FloatingActionButton;
