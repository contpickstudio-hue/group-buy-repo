import { loadOrdersFromBackend } from '../services/supabaseService';

export const createOrderSlice = (set, get) => ({
  // Order state
  orders: [],
  ordersLoading: false,
  ordersError: null,

  setOrders: (orders) => {
    set((state) => {
      state.orders = orders || [];
      state.ordersError = null;
    });
  },

  addOrder: (order) => {
    set((state) => {
      const newOrder = {
        ...order,
        id: order.id || Date.now() + Math.random(),
        createdAt: order.createdAt || new Date().toISOString(),
        status: order.status || 'pending',
        // Escrow payment - default to 'authorized' (held in escrow)
        paymentStatus: order.paymentStatus || 'authorized',
        // Escrow status tracking
        escrowStatus: order.escrowStatus || 'escrow_held',
        paymentIntentId: order.paymentIntentId || order.payment_intent_id || null,
        // Link to regional batch (required for new marketplace model)
        regionalBatchId: order.regionalBatchId || order.regional_batch_id || null,
        // Keep productId for backward compatibility
        productId: order.productId || order.product_id || null
      };
      state.orders.push(newOrder);
    });
  },

  updateOrder: (orderId, updates) => {
    set((state) => {
      const index = state.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        Object.assign(state.orders[index], updates);
      }
    });
  },

  updatePaymentStatus: (orderId, status) => {
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.paymentStatus = status;
      }
    });
  },

  updateEscrowStatus: (orderId, escrowStatus) => {
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.escrowStatus = escrowStatus;
        // Update payment status based on escrow status
        if (escrowStatus === 'escrow_released') {
          order.paymentStatus = 'paid';
        } else if (escrowStatus === 'escrow_refunded') {
          order.paymentStatus = 'refunded';
        }
      }
    });
  },

  updateFulfillmentStatus: async (orderId, status) => {
    // Update local state optimistically
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.fulfillmentStatus = status;
      }
    });
    
    // Persist to backend
    try {
      const { updateOrderFulfillmentStatus } = await import('../services/supabaseService');
      const result = await updateOrderFulfillmentStatus(orderId, status);
      
      if (!result.success) {
        // Revert optimistic update on failure
        set((state) => {
          const order = state.orders.find(o => o.id === orderId);
          if (order) {
            // Revert to previous status - we'd need to track this, but for now just log
            if (import.meta.env.DEV) {
                console.error('Failed to update fulfillment status:', result.error);
            }
          }
        });
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating fulfillment status:', error);
      }
      return { success: false, error: error.message };
    }
  },

  cancelOrder: (orderId) => {
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = 'cancelled';
      }
    });
  },

  getOrdersByBatch: (batchId) => {
    const { orders } = get();
    return orders.filter(o => 
      o.regionalBatchId === batchId || 
      o.regional_batch_id === batchId
    );
  },

  getOrdersByListing: (listingId) => {
    const { orders } = get();
    // Get batches for this listing from regionalBatchSlice
    // Access through the combined store
    const appStore = get();
    const batches = appStore.batchesByListing?.[listingId] || [];
    const batchIds = batches.map(b => b.id);
    
    return orders.filter(o => 
      batchIds.includes(o.regionalBatchId) || 
      batchIds.includes(o.regional_batch_id)
    );
  },

  loadOrders: async () => {
    set((state) => {
      state.ordersLoading = true;
      state.ordersError = null;
    });

    try {
      const orders = await loadOrdersFromBackend();
      set((state) => {
        state.orders = orders || [];
        state.ordersLoading = false;
      });
      return { success: true, orders };
    } catch (error) {
      set((state) => {
        state.ordersError = error.message;
        state.ordersLoading = false;
      });
      return { success: false, error: error.message };
    }
  }
});

