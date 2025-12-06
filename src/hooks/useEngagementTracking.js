/**
 * useEngagementTracking Hook
 * Provides easy way to track user actions throughout the app
 */

import { useCallback } from 'react';
import { useUser } from '../stores';
import { trackUserEngagement } from '../services/recommendationService';

/**
 * Hook to track user engagement
 * @returns {Function} track function
 */
export const useEngagementTracking = () => {
    const user = useUser();

    const track = useCallback(async (actionType, entityType, entityId, metadata = {}) => {
        if (!user?.email) {
            // Still track for analytics, but without user ID
            await trackUserEngagement(null, actionType, entityType, entityId, metadata);
            return;
        }

        await trackUserEngagement(user.email, actionType, entityType, entityId, metadata);
    }, [user]);

    return track;
};

/**
 * Hook to track product views
 */
export const useProductViewTracking = () => {
    const track = useEngagementTracking();

    return useCallback((productId) => {
        track('view', 'product', productId);
    }, [track]);
};

/**
 * Hook to track product clicks
 */
export const useProductClickTracking = () => {
    const track = useEngagementTracking();

    return useCallback((productId) => {
        track('click', 'product', productId);
    }, [track]);
};

/**
 * Hook to track group buy joins
 */
export const useGroupBuyJoinTracking = () => {
    const track = useEngagementTracking();

    return useCallback((productId, quantity) => {
        track('join', 'product', productId, { quantity });
    }, [track]);
};

/**
 * Hook to track purchases
 */
export const usePurchaseTracking = () => {
    const track = useEngagementTracking();

    return useCallback((orderId, productId, amount) => {
        track('purchase', 'product', productId, { orderId, amount });
    }, [track]);
};

