import { loadOrdersFromBackend } from '../services/supabaseService';

export const createOrderSlice = (set, get) => ({
    // Order state
    orders: [],
    ordersLoading: false,
    ordersError: null,
    
    // Actions
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
                groupStatus: order.groupStatus || 'open',
                fulfillmentStatus: order.fulfillmentStatus || 'pending',
                paymentStatus: order.paymentStatus || 'pending',
                paymentIntentId: order.paymentIntentId || null
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
    
    cancelOrder: (orderId) => {
        set((state) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                state.orders[index].groupStatus = 'cancelled';
                state.orders[index].fulfillmentStatus = 'cancelled';
            }
        });
        
        // Update product quantity
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
            const { updateProduct } = get();
            const product = get().products.find(p => p.id === order.productId);
            if (product) {
                updateProduct(order.productId, {
                    currentQuantity: Math.max(0, product.currentQuantity - order.quantity)
                });
            }
        }
    },
    
    // Async actions
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
    },
    
    updateFulfillmentStatus: async (orderId, status) => {
        try {
            set((state) => {
                const index = state.orders.findIndex(o => o.id === orderId);
                if (index !== -1) {
                    state.orders[index].fulfillmentStatus = status;
                }
            });
            
            // In a real app, this would update Supabase
            
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: `Order status updated to ${status}`,
                duration: 3000
            });
            
            return { success: true };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to update order status: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    updatePaymentStatus: async (orderId, paymentData) => {
        try {
            set((state) => {
                const index = state.orders.findIndex(o => o.id === orderId);
                if (index !== -1) {
                    state.orders[index].paymentStatus = paymentData.status || 'paid';
                    state.orders[index].paymentIntentId = paymentData.paymentIntentId || state.orders[index].paymentIntentId;
                    state.orders[index].paymentDate = paymentData.paymentDate || new Date().toISOString();
                }
            });
            
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: 'Payment processed successfully!',
                duration: 3000
            });
            
            return { success: true };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to update payment status: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    // Computed getters
    getOrderById: (orderId) => {
        const { orders } = get();
        return orders.find(o => o.id === orderId);
    },
    
    getOrdersByCustomer: (customerEmail) => {
        const { orders } = get();
        return orders.filter(o => o.customerEmail === customerEmail);
    },
    
    getOrdersByProduct: (productId) => {
        const { orders } = get();
        return orders.filter(o => o.productId === productId);
    },
    
    getOrdersByVendor: (vendorEmail) => {
        const { orders, products } = get();
        return orders.filter(order => {
            const product = products.find(p => p.id === order.productId);
            return product && product.ownerEmail === vendorEmail;
        });
    },
    
    getOrderStats: (customerEmail) => {
        const customerOrders = get().getOrdersByCustomer(customerEmail);
        
        const totalSpent = customerOrders.reduce((sum, order) => 
            sum + (order.totalPrice || order.total || 0), 0
        );
        
        const totalOrders = customerOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        
        // Calculate estimated savings (15% on group buys)
        const totalSavings = customerOrders.reduce((savings, order) => {
            const product = get().products.find(p => p.id === order.productId);
            if (product && product.currentQuantity > 1) {
                return savings + ((order.totalPrice || order.total || 0) * 0.15);
            }
            return savings;
        }, 0);
        
        return {
            totalSpent,
            totalOrders,
            avgOrderValue,
            totalSavings,
            savingsRate: totalSpent > 0 ? (totalSavings / (totalSpent + totalSavings)) * 100 : 0
        };
    },
    
    getVendorStats: (vendorEmail) => {
        const vendorOrders = get().getOrdersByVendor(vendorEmail);
        
        const totalRevenue = vendorOrders.reduce((sum, order) => 
            sum + (order.totalPrice || order.total || 0), 0
        );
        
        const totalOrders = vendorOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate platform fee (15%)
        const platformFee = totalRevenue * 0.15;
        const netRevenue = totalRevenue - platformFee;
        
        // Recent orders (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentOrders = vendorOrders.filter(order => 
            new Date(order.createdAt) > thirtyDaysAgo
        );
        const monthlyRevenue = recentOrders.reduce((sum, order) => 
            sum + (order.totalPrice || order.total || 0), 0
        );
        
        return {
            totalRevenue,
            netRevenue,
            platformFee,
            totalOrders,
            avgOrderValue,
            monthlyRevenue,
            recentOrders: recentOrders.length
        };
    },
    
    getOrderStatusCounts: (vendorEmail) => {
        const vendorOrders = get().getOrdersByVendor(vendorEmail);
        
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            prepared: 0,
            delivered: 0,
            cancelled: 0
        };
        
        vendorOrders.forEach(order => {
            const status = order.fulfillmentStatus || 'pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            }
        });
        
        return statusCounts;
    },
    
    // Order management helpers
    refreshOrderStatuses: () => {
        set((state) => {
            state.orders.forEach(order => {
                const product = state.products.find(p => p.id === order.productId);
                if (product) {
                    const progress = (product.currentQuantity / product.targetQuantity) * 100;
                    const daysLeft = Math.ceil((new Date(product.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    // Auto-update group status based on product status
                    if (progress >= 100 && order.groupStatus === 'open') {
                        order.groupStatus = 'completed';
                    } else if (daysLeft <= 0 && order.groupStatus === 'open') {
                        order.groupStatus = 'expired';
                    }
                }
            });
        });
    }
});
