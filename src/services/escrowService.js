/**
 * Escrow Service
 * Manages payment escrow for group buys
 * Handles escrow holds, releases, and refunds based on batch status
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { capturePayment, refundPayment } from './paymentService';

/**
 * Escrow Status Constants
 */
export const ESCROW_STATUS = {
  HELD: 'escrow_held',           // Funds held in escrow
  RELEASED: 'escrow_released',   // Funds released to vendor (batch succeeded)
  REFUNDED: 'escrow_refunded',   // Funds refunded to customer (batch failed)
  PENDING: 'escrow_pending'      // Payment initiated but not yet in escrow
};

/**
 * Place order payment in escrow
 * Called when user joins a group buy
 */
export async function placeOrderInEscrow(orderId, paymentIntentId, amount) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo/offline mode, mark as held locally
      return { success: true, escrowStatus: ESCROW_STATUS.HELD };
    }

    // Update order with escrow status
    const { error } = await supabaseClient
      .from('orders')
      .update({
        escrow_status: ESCROW_STATUS.HELD,
        payment_intent_id: paymentIntentId,
        payment_status: 'authorized', // Authorized but not captured
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      escrowStatus: ESCROW_STATUS.HELD,
      paymentIntentId
    };
  }, {
    context: `Placing order ${orderId} in escrow`,
    showToast: false
  });
}

/**
 * Release escrow funds to vendor (batch succeeded)
 * Called automatically when batch status becomes 'successful'
 */
export async function releaseEscrowToVendor(batchId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo/offline mode, mark as released locally
      return { success: true, released: 0 };
    }

    // Get all orders for this batch
    const { data: orders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('regional_batch_id', batchId)
      .eq('escrow_status', ESCROW_STATUS.HELD);

    if (fetchError) {
      throw fetchError;
    }

    if (!orders || orders.length === 0) {
      return { success: true, released: 0 };
    }

    let releasedCount = 0;
    const errors = [];

    // Capture each payment
    for (const order of orders) {
      if (!order.payment_intent_id) {
        console.warn(`Order ${order.id} has no payment intent ID, skipping`);
        continue;
      }

      try {
        // Capture payment from escrow
        const captureResult = await capturePayment(order.payment_intent_id);
        
        if (captureResult.success) {
          // Update order escrow status
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
              escrow_status: ESCROW_STATUS.RELEASED,
              payment_status: 'paid',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Failed to update order ${order.id}:`, updateError);
            errors.push({ orderId: order.id, error: updateError.message });
          } else {
            releasedCount++;
          }
        } else {
          errors.push({ orderId: order.id, error: captureResult.error });
        }
      } catch (error) {
        console.error(`Failed to capture payment for order ${order.id}:`, error);
        errors.push({ orderId: order.id, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      released: releasedCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }, {
    context: `Releasing escrow for batch ${batchId}`,
    showToast: false
  });
}

/**
 * Refund escrow funds to customers (batch failed)
 * Called automatically when batch status becomes 'failed' or 'cancelled'
 */
export async function refundEscrowToCustomers(batchId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // For demo/offline mode, mark as refunded locally
      return { success: true, refunded: 0 };
    }

    // Get all orders for this batch that are in escrow
    const { data: orders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('regional_batch_id', batchId)
      .eq('escrow_status', ESCROW_STATUS.HELD);

    if (fetchError) {
      throw fetchError;
    }

    if (!orders || orders.length === 0) {
      return { success: true, refunded: 0 };
    }

    let refundedCount = 0;
    const errors = [];

    // Refund each payment
    for (const order of orders) {
      if (!order.payment_intent_id) {
        console.warn(`Order ${order.id} has no payment intent ID, skipping`);
        continue;
      }

      try {
        // Refund payment
        const refundResult = await refundPayment(order.payment_intent_id);
        
        if (refundResult.success) {
          // Update order escrow status
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
              escrow_status: ESCROW_STATUS.REFUNDED,
              payment_status: 'refunded',
              refund_required: false, // Refund completed
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Failed to update order ${order.id}:`, updateError);
            errors.push({ orderId: order.id, error: updateError.message });
          } else {
            refundedCount++;
          }
        } else {
          errors.push({ orderId: order.id, error: refundResult.error });
        }
      } catch (error) {
        console.error(`Failed to refund payment for order ${order.id}:`, error);
        errors.push({ orderId: order.id, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      refunded: refundedCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }, {
    context: `Refunding escrow for batch ${batchId}`,
    showToast: false
  });
}

/**
 * Get escrow status for an order
 */
export async function getOrderEscrowStatus(orderId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      return { success: true, escrowStatus: ESCROW_STATUS.HELD };
    }

    const { data, error } = await supabaseClient
      .from('orders')
      .select('escrow_status, payment_status, payment_intent_id')
      .eq('id', orderId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      escrowStatus: data.escrow_status || ESCROW_STATUS.PENDING,
      paymentStatus: data.payment_status,
      paymentIntentId: data.payment_intent_id
    };
  }, {
    context: `Getting escrow status for order ${orderId}`,
    showToast: false
  });
}

/**
 * Get total escrow amount for a batch
 */
export async function getBatchEscrowTotal(batchId) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      return { success: true, total: 0 };
    }

    const { data, error } = await supabaseClient
      .from('orders')
      .select('total_price')
      .eq('regional_batch_id', batchId)
      .eq('escrow_status', ESCROW_STATUS.HELD);

    if (error) {
      throw error;
    }

    const total = (data || []).reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);

    return {
      success: true,
      total,
      orderCount: data?.length || 0
    };
  }, {
    context: `Getting escrow total for batch ${batchId}`,
    showToast: false
  });
}

