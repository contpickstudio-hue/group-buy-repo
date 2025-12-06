/**
 * Stripe Connect Service
 * Handles vendor onboarding, account management, and revenue splitting
 */

import { supabaseClient } from './supabaseService';
import { apiCall, showErrorToast, showSuccessToast } from './errorService';

// Platform fee percentage (configurable via environment variable)
const PLATFORM_FEE_PERCENT = parseFloat(import.meta.env.VITE_PLATFORM_FEE_PERCENT || '15');

/**
 * Create Stripe Connect Express account for vendor
 * @param {string} vendorEmail - Vendor email
 * @returns {Promise<Object>} Account creation response with onboarding URL
 */
export async function createStripeConnectAccount(vendorEmail) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to create Stripe account');
        }

        // Call edge function to create Stripe Connect account
        const { data, error } = await supabaseClient.functions.invoke('stripe-connect-onboard', {
            body: {
                vendorEmail,
                returnUrl: `${window.location.origin}/dashboard?tab=payouts`
            }
        });

        if (error) {
            throw new Error(`Failed to create Stripe account: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        // Save stripe_account_id to vendors table
        const { error: dbError } = await supabaseClient
            .from('vendors')
            .upsert({
                email: vendorEmail,
                stripe_account_id: data.accountId,
                stripe_account_status: 'pending',
                onboarding_completed: false
            }, {
                onConflict: 'email'
            });

        if (dbError) {
            console.warn('Failed to save vendor account to database:', dbError);
        }

        return data;
    }, {
        context: 'Creating Stripe Connect account',
        showToast: true
    });
}

/**
 * Get Stripe Connect account status
 * @param {string} vendorEmail - Vendor email
 * @returns {Promise<Object>} Account status
 */
export async function getStripeConnectAccountStatus(vendorEmail) {
    return await apiCall(async () => {
        // Get vendor record from database
        const { data: vendor, error } = await supabaseClient
            .from('vendors')
            .select('*')
            .eq('email', vendorEmail)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to get vendor account: ${error.message}`);
        }

        if (!vendor || !vendor.stripe_account_id) {
            return {
                connected: false,
                status: 'not_connected',
                accountId: null
            };
        }

        // Optionally verify status with Stripe API
        // For now, return database status
        return {
            connected: vendor.onboarding_completed,
            status: vendor.stripe_account_status,
            accountId: vendor.stripe_account_id
        };
    }, {
        context: 'Getting Stripe Connect account status',
        showToast: false
    });
}

/**
 * Create payment intent with revenue split
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Amount in dollars
 * @param {string} paymentData.vendorEmail - Vendor email
 * @param {string} paymentData.orderId - Order ID
 * @param {string} paymentData.productId - Product ID
 * @returns {Promise<Object>} Payment intent with split information
 */
export async function createPaymentIntentWithSplit(paymentData) {
    return await apiCall(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('User must be authenticated to create payment');
        }

        // Get vendor's Stripe account ID
        const { data: vendor } = await supabaseClient
            .from('vendors')
            .select('stripe_account_id')
            .eq('email', paymentData.vendorEmail)
            .maybeSingle();

        if (!vendor || !vendor.stripe_account_id) {
            throw new Error('Vendor has not connected their Stripe account');
        }

        // Calculate platform fee and vendor payout
        const platformFee = paymentData.amount * (PLATFORM_FEE_PERCENT / 100);
        const vendorPayout = paymentData.amount - platformFee;

        // Call edge function to create payment intent with transfer
        const { data, error } = await supabaseClient.functions.invoke('create-payment-intent-split', {
            body: {
                amount: paymentData.amount,
                currency: paymentData.currency || 'cad',
                vendorStripeAccountId: vendor.stripe_account_id,
                platformFeeAmount: platformFee,
                vendorPayoutAmount: vendorPayout,
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

        // Update order with split information
        if (paymentData.orderId) {
            await supabaseClient
                .from('orders')
                .update({
                    vendor_payout_amount: vendorPayout,
                    platform_fee_amount: platformFee,
                    transfer_id: data.transferId || null
                })
                .eq('id', paymentData.orderId);
        }

        return {
            ...data,
            platformFee,
            vendorPayout
        };
    }, {
        context: 'Creating payment with revenue split',
        showToast: false
    });
}

/**
 * Get vendor payout history
 * @param {string} vendorEmail - Vendor email
 * @returns {Promise<Array>} Payout history
 */
export async function getVendorPayoutHistory(vendorEmail) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('product_id', 
                supabaseClient
                    .from('products')
                    .select('id')
                    .eq('owner_email', vendorEmail)
            )
            .not('vendor_payout_amount', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to get payout history: ${error.message}`);
        }

        return data || [];
    }, {
        context: 'Getting vendor payout history',
        showToast: false
    });
}

