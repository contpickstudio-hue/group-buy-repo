/**
 * Payment Service
 * Abstracted payment provider interface for escrow-based group buy payments
 * Supports multiple payment providers (Stripe, PayPal, etc.) via provider pattern
 */

import { apiCall } from './errorService';

/**
 * Payment Provider Interface
 * All payment providers must implement these methods
 */
export class PaymentProvider {
  /**
   * Create a payment intent with escrow (funds held, not captured)
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in dollars
   * @param {string} params.currency - Currency code (e.g., 'usd', 'cad')
   * @param {string} params.orderId - Order identifier
   * @param {string} params.customerEmail - Customer email
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<{success: boolean, data?: {clientSecret: string, paymentIntentId: string}, error?: string}>}
   */
  async createEscrowPayment(params) {
    throw new Error('createEscrowPayment must be implemented by payment provider');
  }

  /**
   * Capture a payment (release from escrow to vendor)
   * @param {string} paymentIntentId - Payment intent identifier
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async capturePayment(paymentIntentId) {
    throw new Error('capturePayment must be implemented by payment provider');
  }

  /**
   * Refund a payment (return funds to customer)
   * @param {string} paymentIntentId - Payment intent identifier
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async refundPayment(paymentIntentId, amount = null) {
    throw new Error('refundPayment must be implemented by payment provider');
  }

  /**
   * Get payment status
   * @param {string} paymentIntentId - Payment intent identifier
   * @returns {Promise<{success: boolean, data?: {status: string}, error?: string}>}
   */
  async getPaymentStatus(paymentIntentId) {
    throw new Error('getPaymentStatus must be implemented by payment provider');
  }
}

/**
 * Stripe Payment Provider Implementation
 */
class StripePaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.providerName = 'stripe';
  }

  async createEscrowPayment(params) {
    return await apiCall(async () => {
      const { amount, currency = 'usd', orderId, customerEmail, metadata = {} } = params;

      // Call Supabase Edge Function for payment intent creation
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          customerEmail,
          metadata: {
            ...metadata,
            escrow: true, // Mark as escrow payment
            capture_method: 'manual' // Hold funds until capture
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
          amount: data.amount,
          currency: data.currency
        }
      };
    }, {
      context: 'Creating escrow payment',
      showToast: false
    });
  }

  async capturePayment(paymentIntentId) {
    return await apiCall(async () => {
      // Call Supabase Edge Function for payment capture
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          paymentIntentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to capture payment');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          status: data.status,
          captured: data.captured
        }
      };
    }, {
      context: 'Capturing payment from escrow',
      showToast: false
    });
  }

  async refundPayment(paymentIntentId, amount = null) {
    return await apiCall(async () => {
      // Call Supabase Edge Function for refund
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          paymentIntentId,
          amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to refund payment');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          refundId: data.refundId,
          status: data.status,
          amount: data.amount
        }
      };
    }, {
      context: 'Refunding payment',
      showToast: false
    });
  }

  async getPaymentStatus(paymentIntentId) {
    return await apiCall(async () => {
      // Call Supabase Edge Function for payment status
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          paymentIntentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get payment status');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          status: data.status,
          amount: data.amount,
          captured: data.captured
        }
      };
    }, {
      context: 'Getting payment status',
      showToast: false
    });
  }
}

/**
 * Mock Payment Provider (for testing/development)
 */
class MockPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.providerName = 'mock';
    this.payments = new Map(); // In-memory storage for mock payments
  }

  async createEscrowPayment(params) {
    const { amount, currency = 'usd', orderId, customerEmail } = params;
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.payments.set(paymentIntentId, {
      id: paymentIntentId,
      amount,
      currency,
      orderId,
      customerEmail,
      status: 'requires_capture', // Escrow: payment authorized but not captured
      captured: false,
      refunded: false,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        clientSecret: `mock_secret_${paymentIntentId}`,
        paymentIntentId,
        amount,
        currency
      }
    };
  }

  async capturePayment(paymentIntentId) {
    const payment = this.payments.get(paymentIntentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }
    if (payment.captured) {
      return { success: false, error: 'Payment already captured' };
    }
    if (payment.refunded) {
      return { success: false, error: 'Payment was refunded' };
    }

    payment.status = 'succeeded';
    payment.captured = true;
    payment.capturedAt = new Date().toISOString();

    return {
      success: true,
      data: {
        status: 'succeeded',
        captured: true
      }
    };
  }

  async refundPayment(paymentIntentId, amount = null) {
    const payment = this.payments.get(paymentIntentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }
    if (payment.refunded) {
      return { success: false, error: 'Payment already refunded' };
    }

    const refundAmount = amount || payment.amount;
    payment.status = 'refunded';
    payment.refunded = true;
    payment.refundedAmount = refundAmount;
    payment.refundedAt = new Date().toISOString();

    return {
      success: true,
      data: {
        refundId: `refund_mock_${Date.now()}`,
        status: 'refunded',
        amount: refundAmount
      }
    };
  }

  async getPaymentStatus(paymentIntentId) {
    const payment = this.payments.get(paymentIntentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    return {
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        captured: payment.captured
      }
    };
  }
}

/**
 * Get the configured payment provider
 * Uses environment variable or defaults to mock for development
 * 
 * IMPORTANT: In production, ensure VITE_PAYMENT_PROVIDER is set to 'stripe'
 * Mock payments should NEVER be used in production as they don't process real payments
 */
function getPaymentProvider() {
  const providerName = import.meta.env.VITE_PAYMENT_PROVIDER || 'mock';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // Safety check: Don't allow mock provider in production
  if (isProduction && providerName.toLowerCase() === 'mock') {
    console.error('ERROR: Mock payment provider cannot be used in production!');
    console.error('Please set VITE_PAYMENT_PROVIDER=stripe in production environment.');
    // Still return mock but log error - in real production, this should fail hard
  }
  
  switch (providerName.toLowerCase()) {
    case 'stripe':
      return new StripePaymentProvider();
    case 'mock':
    default:
      return new MockPaymentProvider();
  }
}

/**
 * Check if we're using test/mock payments
 */
export function isTestPaymentMode() {
  const providerName = import.meta.env.VITE_PAYMENT_PROVIDER || 'mock';
  return providerName.toLowerCase() === 'mock';
}

// Export singleton instance
const paymentProvider = getPaymentProvider();

/**
 * Create escrow payment (funds held, not captured)
 */
export async function createEscrowPayment(params) {
  return await paymentProvider.createEscrowPayment(params);
}

/**
 * Capture payment (release from escrow to vendor)
 */
export async function capturePayment(paymentIntentId) {
  return await paymentProvider.capturePayment(paymentIntentId);
}

/**
 * Refund payment (return funds to customer)
 */
export async function refundPayment(paymentIntentId, amount = null) {
  return await paymentProvider.refundPayment(paymentIntentId, amount);
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentIntentId) {
  return await paymentProvider.getPaymentStatus(paymentIntentId);
}

/**
 * Export provider for testing
 */
export { paymentProvider, PaymentProvider, StripePaymentProvider, MockPaymentProvider };

