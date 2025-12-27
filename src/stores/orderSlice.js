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
        // Immediate payment - default to 'paid'
        paymentStatus: order.paymentStatus || 'paid',
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

  updateFulfillmentStatus: (orderId, status) => {
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.fulfillmentStatus = status;
      }
    });
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

