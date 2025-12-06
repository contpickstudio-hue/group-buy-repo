/**
 * Review Service
 * Handles vendor and helper ratings/reviews
 */

import { supabaseClient } from './supabaseService';
import { apiCall, showErrorToast, showSuccessToast } from './errorService';

/**
 * Create a review for a vendor (after order completion)
 * @param {Object} reviewData - Review information
 * @param {string} reviewData.orderId - Order ID
 * @param {string} reviewData.vendorEmail - Vendor email
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.reviewText - Optional review text
 * @returns {Promise<Object>} Created review
 */
export async function createVendorReview(reviewData) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to create review');
        }

        // Get order to verify ownership
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', reviewData.orderId)
            .eq('customer_email', session.user.email)
            .maybeSingle();

        if (orderError || !order) {
            throw new Error('Order not found or access denied');
        }

        // Get vendor email from product
        const { data: product } = await supabaseClient
            .from('products')
            .select('owner_email')
            .eq('id', order.product_id)
            .maybeSingle();

        if (!product) {
            throw new Error('Product not found');
        }

        // Create review
        const { data, error } = await supabaseClient
            .from('reviews')
            .insert({
                reviewer_email: session.user.email,
                reviewee_email: product.owner_email,
                order_id: reviewData.orderId,
                rating: reviewData.rating,
                review_text: reviewData.reviewText || null,
                review_type: 'vendor'
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create review: ${error.message}`);
        }

        showSuccessToast('Review submitted successfully!');
        return data;
    }, {
        context: 'Creating vendor review',
        showToast: true
    });
}

/**
 * Create a review for a helper (after errand completion)
 * @param {Object} reviewData - Review information
 * @param {string} reviewData.errandId - Errand ID
 * @param {string} reviewData.helperEmail - Helper email
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.reviewText - Optional review text
 * @returns {Promise<Object>} Created review
 */
export async function createHelperReview(reviewData) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to create review');
        }

        // Get errand to verify ownership
        const { data: errand, error: errandError } = await supabaseClient
            .from('errands')
            .select('*')
            .eq('id', reviewData.errandId)
            .eq('requester_email', session.user.email)
            .maybeSingle();

        if (errandError || !errand) {
            throw new Error('Errand not found or access denied');
        }

        // Create review
        const { data, error } = await supabaseClient
            .from('reviews')
            .insert({
                reviewer_email: session.user.email,
                reviewee_email: reviewData.helperEmail,
                errand_id: reviewData.errandId,
                rating: reviewData.rating,
                review_text: reviewData.reviewText || null,
                review_type: 'helper'
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create review: ${error.message}`);
        }

        showSuccessToast('Review submitted successfully!');
        return data;
    }, {
        context: 'Creating helper review',
        showToast: true
    });
}

/**
 * Get average rating for a vendor
 * @param {string} vendorEmail - Vendor email
 * @returns {Promise<Object>} Rating statistics
 */
export async function getVendorRating(vendorEmail) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('rating')
            .eq('reviewee_email', vendorEmail)
            .eq('review_type', 'vendor');

        if (error) {
            throw new Error(`Failed to get vendor rating: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const totalReviews = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = sum / totalReviews;

        const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(review => {
            ratings[review.rating]++;
        });

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratings
        };
    }, {
        context: 'Getting vendor rating',
        showToast: false
    });
}

/**
 * Get average rating for a helper
 * @param {string} helperEmail - Helper email
 * @returns {Promise<Object>} Rating statistics
 */
export async function getHelperRating(helperEmail) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('rating')
            .eq('reviewee_email', helperEmail)
            .eq('review_type', 'helper');

        if (error) {
            throw new Error(`Failed to get helper rating: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const totalReviews = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = sum / totalReviews;

        const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(review => {
            ratings[review.rating]++;
        });

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratings
        };
    }, {
        context: 'Getting helper rating',
        showToast: false
    });
}

/**
 * Get reviews for a vendor
 * @param {string} vendorEmail - Vendor email
 * @returns {Promise<Array>} Reviews
 */
export async function getVendorReviews(vendorEmail) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('reviewee_email', vendorEmail)
            .eq('review_type', 'vendor')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to get vendor reviews: ${error.message}`);
        }

        return data || [];
    }, {
        context: 'Getting vendor reviews',
        showToast: false
    });
}

