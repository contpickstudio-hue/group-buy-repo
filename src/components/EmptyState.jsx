import React from 'react';
import { useUser, useSetCurrentScreen } from '../stores';
import { hasRole, isGuestUser } from '../utils/authUtils';
import { useAuthStore } from '../stores';
import { t } from '../utils/translations';

/**
 * EmptyState Component
 * Lightweight, action-focused empty state with role-aware CTAs
 * Focuses on activation, not decoration
 */
const EmptyState = ({ 
    message, 
    actionLabel, 
    action, 
    icon,
    className = "" 
}) => {
    return (
        <div className={`text-center py-8 px-4 ${className}`}>
            {icon && (
                <div className="mb-3 text-gray-400">
                    {icon}
                </div>
            )}
            <p className="text-gray-600 mb-3 text-sm sm:text-base">
                {message}
            </p>
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

/**
 * EmptyState with role-aware actions
 * Automatically determines appropriate CTA based on user role
 */
export const EmptyStateWithAction = ({ 
    type, // 'groupbuys', 'errands', 'orders', 'chats', 'credits', 'batches'
    message,
    className = ""
}) => {
    const user = useUser();
    const loginMethod = useAuthStore((state) => state.loginMethod);
    const isGuest = isGuestUser(user, loginMethod);
    const setCurrentScreen = useSetCurrentScreen();
    const isVendor = hasRole(user, 'vendor', loginMethod);
    const isCustomer = hasRole(user, 'customer', loginMethod);

    const getConfig = () => {
        if (!user || isGuest) {
            // Guest users - show early access messaging
            return {
                message: message || 'This community marketplace is in early access. Group buys will appear here as vendors create listings.',
                actionLabel: t('auth.signUpToContinue'),
                action: () => setCurrentScreen('auth')
            };
        }

        switch (type) {
            case 'groupbuys':
                if (isVendor) {
                    return {
                        message: message || 'Be the first to create a group buy in your region. Start building the community marketplace.',
                        actionLabel: 'Create the First Group Buy',
                        action: () => {
                            setCurrentScreen('dashboard');
                            setTimeout(() => {
                                const form = document.querySelector('[data-testid="create-product-form"]');
                                if (form) {
                                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }
                    };
                } else {
                    return {
                        message: message || 'Group buys will appear here as vendors create listings for your region. Join when your area opens.',
                        actionLabel: 'Browse Marketplace',
                        action: () => setCurrentScreen('groupbuys')
                    };
                }

            case 'errands':
                if (isCustomer) {
                    return {
                        message: message || t('emptyState.noErrandsAvailable'),
                        actionLabel: t('errand.postErrand'),
                        action: () => {
                            setCurrentScreen('errands');
                            setTimeout(() => {
                                const form = document.querySelector('[data-testid="create-errand-form"]');
                                if (form) {
                                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }
                    };
                } else {
                    return {
                        message: message || t('emptyState.noErrandsAvailable'),
                        actionLabel: t('errand.browseErrands'),
                        action: () => setCurrentScreen('errands')
                    };
                }

            case 'orders':
                return {
                    message: message || t('emptyState.noOrdersYet'),
                    actionLabel: t('emptyState.joinGroupBuy'),
                    action: () => setCurrentScreen('groupbuys')
                };

            case 'chats':
                return {
                    message: message || t('emptyState.noChatsYet'),
                    actionLabel: t('emptyState.joinGroupBuyOrErrand'),
                    action: () => setCurrentScreen('groupbuys')
                };

            case 'credits':
                return {
                    message: message || t('emptyState.noCreditHistoryYet'),
                    actionLabel: t('emptyState.joinGroupBuy'),
                    action: () => setCurrentScreen('groupbuys')
                };

            case 'batches':
                if (isVendor) {
                    return {
                        message: message || t('emptyState.noBatchesYet'),
                        actionLabel: t('emptyState.createListing'),
                        action: () => {
                            setCurrentScreen('dashboard');
                            setTimeout(() => {
                                const form = document.querySelector('[data-testid="create-listing-form"]');
                                if (form) {
                                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }
                    };
                } else {
                    return {
                        message: message || t('emptyState.noBatchesAvailable'),
                        actionLabel: t('emptyState.browseListings'),
                        action: () => setCurrentScreen('groupbuys')
                    };
                }

            default:
                return {
                    message: message || t('emptyState.nothingHereYet'),
                    actionLabel: null,
                    action: null
                };
        }
    };

    const config = getConfig();

    return (
        <EmptyState
            message={config.message}
            actionLabel={config.actionLabel}
            action={config.action}
            className={className}
        />
    );
};

export default EmptyState;

