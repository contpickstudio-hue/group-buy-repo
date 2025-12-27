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
        status: order.status || 'pending'
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

