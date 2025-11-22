import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseService';
import { useStore } from '../stores';

/**
 * Custom hook for managing Supabase Realtime subscriptions
 * @param {string} table - The table to subscribe to
 * @param {Object} options - Configuration options
 * @returns {Object} - Subscription status and controls
 */
export const useRealtime = (table, options = {}) => {
  const {
    filter = null,
    event = '*', // '*', 'INSERT', 'UPDATE', 'DELETE'
    schema = 'public',
    onInsert = null,
    onUpdate = null,
    onDelete = null,
    onChange = null,
    enabled = true,
  } = options;

  const channelRef = useRef(null);
  const { showToast } = useStore((state) => ({
    showToast: state.ui?.showToast || (() => {}),
  }));

  const handlePayload = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`Realtime ${eventType} on ${table}:`, payload);

    // Call specific event handlers
    switch (eventType) {
      case 'INSERT':
        if (onInsert) onInsert(newRecord, payload);
        break;
      case 'UPDATE':
        if (onUpdate) onUpdate(newRecord, oldRecord, payload);
        break;
      case 'DELETE':
        if (onDelete) onDelete(oldRecord, payload);
        break;
    }

    // Call general change handler
    if (onChange) onChange(payload);
  }, [onInsert, onUpdate, onDelete, onChange, table]);

  const subscribe = useCallback(() => {
    if (!enabled || channelRef.current) return;

    try {
      const channelName = `${table}_changes_${Date.now()}`;
      const channel = supabase.channel(channelName);

      let subscription = channel.on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          ...(filter && { filter }),
        },
        handlePayload
      );

      subscription.subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${table} changes`);
          showToast(`Connection error for ${table} updates`, 'error');
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏰ Subscription timeout for ${table}`);
          showToast(`Connection timeout for ${table} updates`, 'warning');
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error(`Failed to subscribe to ${table}:`, error);
      showToast(`Failed to connect to ${table} updates`, 'error');
    }
  }, [enabled, table, event, schema, filter, handlePayload, showToast]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log(`🔌 Unsubscribing from ${table} changes`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [table]);

  const resubscribe = useCallback(() => {
    unsubscribe();
    setTimeout(subscribe, 100); // Small delay to ensure cleanup
  }, [unsubscribe, subscribe]);

  // Set up subscription
  useEffect(() => {
    if (enabled) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    isSubscribed: !!channelRef.current,
    subscribe,
    unsubscribe,
    resubscribe,
  };
};

/**
 * Hook for subscribing to products/group buys changes
 */
export const useProductsRealtime = (options = {}) => {
  const { addNotification } = useStore((state) => ({
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  return useRealtime('products', {
    onInsert: (newProduct) => {
      addNotification({
        id: `product_${newProduct.id}`,
        type: 'info',
        title: 'New Group Buy Available!',
        message: `${newProduct.name} is now available for group buying`,
        timestamp: new Date().toISOString(),
        data: { productId: newProduct.id, type: 'product_created' },
      });
    },
    onUpdate: (updatedProduct, oldProduct) => {
      // Notify about significant changes
      if (updatedProduct.current_participants !== oldProduct.current_participants) {
        const isGoalReached = updatedProduct.current_participants >= updatedProduct.min_participants;
        if (isGoalReached && oldProduct.current_participants < oldProduct.min_participants) {
          addNotification({
            id: `product_goal_${updatedProduct.id}`,
            type: 'success',
            title: 'Group Buy Goal Reached!',
            message: `${updatedProduct.name} has reached its minimum participants`,
            timestamp: new Date().toISOString(),
            data: { productId: updatedProduct.id, type: 'goal_reached' },
          });
        }
      }
    },
    ...options,
  });
};

/**
 * Hook for subscribing to errands changes
 */
export const useErrandsRealtime = (options = {}) => {
  const { user, addNotification } = useStore((state) => ({
    user: state.user?.user,
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  return useRealtime('errands', {
    onInsert: (newErrand) => {
      // Only notify if it's not the current user's errand
      if (newErrand.customer_id !== user?.id) {
        addNotification({
          id: `errand_${newErrand.id}`,
          type: 'info',
          title: 'New Errand Posted!',
          message: `${newErrand.title} - Budget: $${newErrand.budget}`,
          timestamp: new Date().toISOString(),
          data: { errandId: newErrand.id, type: 'errand_created' },
        });
      }
    },
    onUpdate: (updatedErrand, oldErrand) => {
      // Notify about status changes for user's errands
      if (updatedErrand.customer_id === user?.id && updatedErrand.status !== oldErrand.status) {
        const statusMessages = {
          'in_progress': 'Your errand has been accepted!',
          'completed': 'Your errand has been completed!',
          'cancelled': 'Your errand has been cancelled.',
        };

        if (statusMessages[updatedErrand.status]) {
          addNotification({
            id: `errand_status_${updatedErrand.id}`,
            type: updatedErrand.status === 'completed' ? 'success' : 'info',
            title: 'Errand Status Update',
            message: statusMessages[updatedErrand.status],
            timestamp: new Date().toISOString(),
            data: { errandId: updatedErrand.id, type: 'status_change' },
          });
        }
      }
    },
    ...options,
  });
};

/**
 * Hook for subscribing to errand applications changes
 */
export const useErrandApplicationsRealtime = (options = {}) => {
  const { user, addNotification } = useStore((state) => ({
    user: state.user?.user,
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  return useRealtime('errand_applications', {
    onInsert: (newApplication) => {
      // Notify errand owner about new applications
      // Note: We'd need to join with errands table to get customer_id
      // For now, we'll handle this in the component level
      addNotification({
        id: `application_${newApplication.id}`,
        type: 'info',
        title: 'New Errand Application!',
        message: 'Someone applied to help with your errand',
        timestamp: new Date().toISOString(),
        data: { applicationId: newApplication.id, type: 'application_received' },
      });
    },
    onUpdate: (updatedApplication, oldApplication) => {
      // Notify helper about application status changes
      if (updatedApplication.helper_id === user?.id && updatedApplication.status !== oldApplication.status) {
        const statusMessages = {
          'accepted': 'Your errand application was accepted!',
          'rejected': 'Your errand application was declined.',
        };

        if (statusMessages[updatedApplication.status]) {
          addNotification({
            id: `application_status_${updatedApplication.id}`,
            type: updatedApplication.status === 'accepted' ? 'success' : 'warning',
            title: 'Application Update',
            message: statusMessages[updatedApplication.status],
            timestamp: new Date().toISOString(),
            data: { applicationId: updatedApplication.id, type: 'application_status' },
          });
        }
      }
    },
    ...options,
  });
};

/**
 * Hook for subscribing to orders changes
 */
export const useOrdersRealtime = (options = {}) => {
  const { user, addNotification } = useStore((state) => ({
    user: state.user?.user,
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  return useRealtime('orders', {
    onInsert: (newOrder) => {
      // Notify vendor about new orders
      // Note: We'd need to join with products table to get vendor info
      // For now, we'll handle this in the component level
      if (newOrder.customer_id !== user?.id) {
        addNotification({
          id: `order_${newOrder.id}`,
          type: 'success',
          title: 'New Order Received!',
          message: `Order #${newOrder.id} for $${newOrder.total_price}`,
          timestamp: new Date().toISOString(),
          data: { orderId: newOrder.id, type: 'order_received' },
        });
      }
    },
    onUpdate: (updatedOrder, oldOrder) => {
      // Notify customer about order status changes
      if (updatedOrder.customer_id === user?.id && updatedOrder.status !== oldOrder.status) {
        const statusMessages = {
          'confirmed': 'Your order has been confirmed!',
          'shipped': 'Your order has been shipped!',
          'delivered': 'Your order has been delivered!',
          'cancelled': 'Your order has been cancelled.',
        };

        if (statusMessages[updatedOrder.status]) {
          addNotification({
            id: `order_status_${updatedOrder.id}`,
            type: updatedOrder.status === 'delivered' ? 'success' : 'info',
            title: 'Order Update',
            message: statusMessages[updatedOrder.status],
            timestamp: new Date().toISOString(),
            data: { orderId: updatedOrder.id, type: 'order_status' },
          });
        }
      }
    },
    ...options,
  });
};

/**
 * Hook for subscribing to messages changes
 */
export const useMessagesRealtime = (options = {}) => {
  const { user, addNotification } = useStore((state) => ({
    user: state.user?.user,
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  return useRealtime('messages', {
    filter: `recipient_id=eq.${user?.id}`, // Only messages for current user
    onInsert: (newMessage) => {
      if (newMessage.sender_id !== user?.id) {
        addNotification({
          id: `message_${newMessage.id}`,
          type: 'info',
          title: 'New Message',
          message: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
          data: { messageId: newMessage.id, type: 'message_received' },
        });
      }
    },
    ...options,
  });
};

/**
 * Master hook that sets up all real-time subscriptions for a user
 */
export const useRealtimeSubscriptions = (enabled = true) => {
  const { user } = useStore((state) => ({
    user: state.user?.user,
  }));

  const productsSubscription = useProductsRealtime({ enabled: enabled && !!user });
  const errandsSubscription = useErrandsRealtime({ enabled: enabled && !!user });
  const applicationsSubscription = useErrandApplicationsRealtime({ enabled: enabled && !!user });
  const ordersSubscription = useOrdersRealtime({ enabled: enabled && !!user });
  const messagesSubscription = useMessagesRealtime({ enabled: enabled && !!user });

  const isConnected = 
    productsSubscription.isSubscribed &&
    errandsSubscription.isSubscribed &&
    applicationsSubscription.isSubscribed &&
    ordersSubscription.isSubscribed &&
    messagesSubscription.isSubscribed;

  const reconnectAll = useCallback(() => {
    productsSubscription.resubscribe();
    errandsSubscription.resubscribe();
    applicationsSubscription.resubscribe();
    ordersSubscription.resubscribe();
    messagesSubscription.resubscribe();
  }, [
    productsSubscription,
    errandsSubscription,
    applicationsSubscription,
    ordersSubscription,
    messagesSubscription,
  ]);

  return {
    isConnected,
    reconnectAll,
    subscriptions: {
      products: productsSubscription,
      errands: errandsSubscription,
      applications: applicationsSubscription,
      orders: ordersSubscription,
      messages: messagesSubscription,
    },
  };
};
