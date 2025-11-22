import { supabaseClient } from './supabaseService';
import { apiCall, showErrorToast, showSuccessToast } from './errorService';

/**
 * Payment Service
 * Handles all payment-related API calls to Supabase Edge Functions
 */

/**
 * Create a payment intent for an order
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Amount in dollars (e.g., 100.00)
 * @param {string} paymentData.currency - Currency code (default: 'cad')
 * @param {string} paymentData.orderId - Order ID
 * @param {string} paymentData.productId - Product ID
 * @param {string} paymentData.customerEmail - Customer email
 * @param {Object} paymentData.metadata - Additional metadata
 * @returns {Promise<Object>} Payment intent response with clientSecret
 */
export async function createPaymentIntent(paymentData) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to create payment intent');
        }

        const { data, error } = await supabaseClient.functions.invoke('create-payment-intent', {
            body: {
                amount: paymentData.amount,
                currency: paymentData.currency || 'cad',
                orderId: paymentData.orderId,
                productId: paymentData.productId,
                customerEmail: paymentData.customerEmail,
                metadata: paymentData.metadata || {}
            }
        });

        if (error) {
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }, {
        context: 'Creating payment intent',
        showToast: false
    });
}

/**
 * Confirm a payment intent (capture the payment)
 * This would typically be called after order fulfillment
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Confirmed payment intent
 */
export async function confirmPaymentIntent(paymentIntentId) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to confirm payment');
        }

        // This would call another edge function to confirm/capture the payment
        // For now, we'll return a placeholder
        const { data, error } = await supabaseClient.functions.invoke('confirm-payment-intent', {
            body: { paymentIntentId }
        });

        if (error) {
            throw new Error(`Failed to confirm payment: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }, {
        context: 'Confirming payment',
        showToast: true
    });
}

/**
 * Cancel a payment intent (refund)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Cancelled payment intent
 */
export async function cancelPaymentIntent(paymentIntentId) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to cancel payment');
        }

        // This would call another edge function to cancel/refund the payment
        const { data, error } = await supabaseClient.functions.invoke('cancel-payment-intent', {
            body: { paymentIntentId }
        });

        if (error) {
            throw new Error(`Failed to cancel payment: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        showSuccessToast('Payment cancelled and refunded successfully');
        return data;
    }, {
        context: 'Cancelling payment',
        showToast: true
    });
}

/**
 * Get payment intent status
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Payment intent status
 */
export async function getPaymentIntentStatus(paymentIntentId) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to check payment status');
        }

        const { data, error } = await supabaseClient.functions.invoke('get-payment-intent-status', {
            body: { paymentIntentId }
        });

        if (error) {
            throw new Error(`Failed to get payment status: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }, {
        context: 'Getting payment status',
        showToast: false
    });
}

