import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createUserSlice } from './userSlice';
import { createProductSlice } from './productSlice';
import { createOrderSlice } from './orderSlice';
import { createErrandSlice } from './errandSlice';
import { createUISlice } from './uiSlice';
import { createFilterSlice } from './filterSlice';

// Combine all slices into a single store
export const useAppStore = create()(
    devtools(
        subscribeWithSelector(
            immer((set, get, api) => ({
                // User slice
                ...createUserSlice(set, get, api),
                
                // Product slice
                ...createProductSlice(set, get, api),
                
                // Order slice
                ...createOrderSlice(set, get, api),
                
                // Errand slice
                ...createErrandSlice(set, get, api),
                
                // UI slice
                ...createUISlice(set, get, api),
                
                // Filter slice
                ...createFilterSlice(set, get, api),
                
                // Global actions
                resetStore: () => {
                    set((state) => {
                        // Reset all slices to initial state
                        Object.assign(state, {
                            // User
                            user: null,
                            loginMethod: null,
                            selectedRoles: new Set(),
                            helperData: {
                                name: '',
                                phone: '',
                                street: '',
                                city: '',
                                province: '',
                                postal: '',
                                idPhotoDataUrl: '',
                                generatedCode: '',
                                enteredCode: '',
                                smsVerified: false,
                                idVerified: false
                            },
                            helperStepIndex: 0,
                            
                            // Data
                            products: [],
                            orders: [],
                            errands: [],
                            applications: [],
                            messages: [],
                            
                            // UI
                            currentScreen: 'start',
                            loading: false,
                            error: null,
                            notifications: [],
                            
                            // Filters
                            filters: {
                                groupbuys: {
                                    search: '',
                                    region: 'all',
                                    vendor: 'all',
                                    sort: 'popularity',
                                    category: 'all',
                                    priceRange: 'all',
                                    status: 'all'
                                },
                                errands: {
                                    search: '',
                                    region: 'all',
                                    category: 'all',
                                    budgetMin: '',
                                    budgetMax: ''
                                },
                                vendorOrders: {
                                    status: 'all',
                                    search: ''
                                }
                            }
                        });
                    });
                }
            })),
            {
                name: 'korean-commerce-store', // For Redux DevTools
                partialize: (state) => ({
                    // Only persist certain parts of the state
                    user: state.user,
                    loginMethod: state.loginMethod,
                    helperData: state.helperData,
                    filters: state.filters
                })
            }
        )
    )
);

// Selectors for optimized component subscriptions
export const useUser = () => useAppStore((state) => state.user);
// Individual user action hooks for React 19 compatibility
export const useCheckAuthStatus = () => useAppStore((state) => state.checkAuthStatus);
export const useSignUp = () => useAppStore((state) => state.signUp);
export const useSignIn = () => useAppStore((state) => state.signIn);
export const useSignInWithGoogle = () => useAppStore((state) => state.signInWithGoogle);
export const useSignOut = () => useAppStore((state) => state.signOut);
export const useSetDemoUser = () => useAppStore((state) => state.setDemoUser);
export const useSetUser = () => useAppStore((state) => state.setUser);
export const useUpdateUser = () => useAppStore((state) => state.updateUser);
export const useClearUser = () => useAppStore((state) => state.clearUser);
export const useSetSelectedRoles = () => useAppStore((state) => state.setSelectedRoles);
export const useUpdateHelperData = () => useAppStore((state) => state.updateHelperData);
export const useSetHelperStep = () => useAppStore((state) => state.setHelperStep);

// Backward compatibility hook removed - use individual hooks instead
// export const useUserActions = () => useAppStore((state) => ({...}), shallow);

export const useProducts = () => useAppStore((state) => state.products);
// Individual product action hooks
export const useLoadProducts = () => useAppStore((state) => state.loadProducts);
export const useAddProduct = () => useAppStore((state) => state.addProduct);
export const useUpdateProduct = () => useAppStore((state) => state.updateProduct);
export const useDeleteProduct = () => useAppStore((state) => state.deleteProduct);
export const useSetProducts = () => useAppStore((state) => state.setProducts);
export const useJoinGroupBuy = () => useAppStore((state) => state.joinGroupBuy);
// Backward compatibility hook removed - use individual hooks instead
// export const useProductActions = () => useAppStore((state) => ({...}), shallow);

export const useOrders = () => useAppStore((state) => state.orders);
// Individual order action hooks
export const useLoadOrders = () => useAppStore((state) => state.loadOrders);
export const useAddOrder = () => useAppStore((state) => state.addOrder);
export const useUpdateOrder = () => useAppStore((state) => state.updateOrder);
export const useSetOrders = () => useAppStore((state) => state.setOrders);
export const useUpdatePaymentStatus = () => useAppStore((state) => state.updatePaymentStatus);
export const useUpdateFulfillmentStatus = () => useAppStore((state) => state.updateFulfillmentStatus);
export const useCancelOrder = () => useAppStore((state) => state.cancelOrder);
// Backward compatibility hook removed - use individual hooks instead
// export const useOrderActions = () => useAppStore((state) => ({...}), shallow);

// Split into individual hooks to avoid object selector issues
export const useErrands = () => useAppStore((state) => state.errands);
export const useApplications = () => useAppStore((state) => state.applications);
export const useMessages = () => useAppStore((state) => state.messages);
// Individual errand action hooks
export const useLoadErrands = () => useAppStore((state) => state.loadErrands);
export const useAddErrand = () => useAppStore((state) => state.addErrand);
export const useUpdateErrand = () => useAppStore((state) => state.updateErrand);
export const useSetErrands = () => useAppStore((state) => state.setErrands);
export const useSetApplications = () => useAppStore((state) => state.setApplications);
export const useAddApplication = () => useAppStore((state) => state.addApplication);
export const useUpdateApplication = () => useAppStore((state) => state.updateApplication);
export const useSetMessages = () => useAppStore((state) => state.setMessages);
export const useAddMessage = () => useAppStore((state) => state.addMessage);
// Backward compatibility hook removed - use individual hooks instead
// export const useErrandActions = () => useAppStore((state) => ({...}), shallow);

// Use individual selectors to avoid object reference issues
export const useCurrentScreen = () => useAppStore((state) => state.currentScreen);
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useNotifications = () => useAppStore((state) => state.notifications);

// Individual UI action hooks for React 19 compatibility
export const useSetCurrentScreen = () => useAppStore((state) => state.setCurrentScreen);
export const useSetLoading = () => useAppStore((state) => state.setLoading);
export const useSetError = () => useAppStore((state) => state.setError);
export const useClearError = () => useAppStore((state) => state.clearError);
export const useAddNotification = () => useAppStore((state) => state.addNotification);
export const useRemoveNotification = () => useAppStore((state) => state.removeNotification);
export const useClearNotifications = () => useAppStore((state) => state.clearNotifications);
export const useMarkNotificationAsRead = () => useAppStore((state) => state.markNotificationAsRead);
export const useMarkAllNotificationsAsRead = () => useAppStore((state) => state.markAllNotificationsAsRead);

// Backward compatibility hook removed - use individual hooks instead
// export const useUIActions = () => useAppStore((state) => ({...}), shallow);

export const useFilters = () => useAppStore((state) => state.filters);
// Individual filter action hooks
export const useUpdateGroupBuyFilters = () => useAppStore((state) => state.updateGroupBuyFilters);
export const useUpdateErrandFilters = () => useAppStore((state) => state.updateErrandFilters);
export const useUpdateVendorOrderFilters = () => useAppStore((state) => state.updateVendorOrderFilters);
export const useResetFilters = () => useAppStore((state) => state.resetFilters);
// Backward compatibility hook removed - use individual hooks instead
// export const useFilterActions = () => useAppStore((state) => ({...}), shallow);

// Computed selectors
export const useFilteredProducts = () => useAppStore((state) => {
    const { products = [], filters = {} } = state;
    const { groupbuys = {} } = filters;
    
    if (!Array.isArray(products)) return [];
    
    return products.filter(product => {
        if (!product) return false;
        
        // Search filter
        if (groupbuys.search) {
            const searchLower = groupbuys.search.toLowerCase();
            const matchesSearch = 
                (product.title || '').toLowerCase().includes(searchLower) ||
                (product.description || '').toLowerCase().includes(searchLower) ||
                (product.vendor || '').toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }
        
        // Region filter
        if (groupbuys.region && groupbuys.region !== 'all' && product.region !== groupbuys.region) {
            return false;
        }
        
        // Category filter
        if (groupbuys.category && groupbuys.category !== 'all' && product.category !== groupbuys.category) {
            return false;
        }
        
        // Price range filter
        if (groupbuys.priceRange && groupbuys.priceRange !== 'all') {
            const price = product.price || 0;
            switch (groupbuys.priceRange) {
                case 'under-25':
                    if (price >= 25) return false;
                    break;
                case '25-50':
                    if (price < 25 || price > 50) return false;
                    break;
                case '50-100':
                    if (price < 50 || price > 100) return false;
                    break;
                case '100-200':
                    if (price < 100 || price > 200) return false;
                    break;
                case 'over-200':
                    if (price <= 200) return false;
                    break;
            }
        }
        
        // Status filter
        if (groupbuys.status && groupbuys.status !== 'all') {
            const currentQuantity = product.currentQuantity || 0;
            const targetQuantity = product.targetQuantity || 1;
            const progress = targetQuantity > 0 ? (currentQuantity / targetQuantity) * 100 : 0;
            const deadline = product.deadline ? new Date(product.deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
            
            switch (groupbuys.status) {
                case 'open':
                    if (progress >= 100 || (daysLeft !== null && daysLeft <= 0)) return false;
                    break;
                case 'closing-soon':
                    if (daysLeft === null || daysLeft > 3 || daysLeft <= 0) return false;
                    break;
                case 'almost-full':
                    if (progress < 80 || progress >= 100) return false;
                    break;
                case 'new':
                    const createdDate = product.createdAt ? new Date(product.createdAt) : null;
                    if (!createdDate) return false;
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    if (createdDate < weekAgo) return false;
                    break;
            }
        }
        
        return true;
    }).sort((a, b) => {
        // Apply sorting
        const sortOption = groupbuys.sort || 'popularity';
        switch (sortOption) {
            case 'popularity':
                const orders = state.orders || [];
                const aOrders = orders.filter(o => o && o.productId === a.id).length;
                const bOrders = orders.filter(o => o && o.productId === b.id).length;
                return bOrders - aOrders;
            case 'deadline':
                const aDeadline = a.deadline ? new Date(a.deadline) : new Date(0);
                const bDeadline = b.deadline ? new Date(b.deadline) : new Date(0);
                return aDeadline - bDeadline;
            case 'price-low':
                return (a.price || 0) - (b.price || 0);
            case 'price-high':
                return (b.price || 0) - (a.price || 0);
            case 'progress':
                const aCurrentQty = a.currentQuantity || 0;
                const aTargetQty = a.targetQuantity || 1;
                const bCurrentQty = b.currentQuantity || 0;
                const bTargetQty = b.targetQuantity || 1;
                const aProgress = aTargetQty > 0 ? (aCurrentQty / aTargetQty) * 100 : 0;
                const bProgress = bTargetQty > 0 ? (bCurrentQty / bTargetQty) * 100 : 0;
                return bProgress - aProgress;
            case 'newest':
                const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return bCreated - aCreated;
            default:
                return 0;
        }
    });
});

export const useFilteredErrands = () => useAppStore((state) => {
    const { errands, filters } = state;
    const { errands: errandFilters } = filters;
    
    return errands.filter(errand => {
        // Search filter
        if (errandFilters.search) {
            const searchLower = errandFilters.search.toLowerCase();
            const matchesSearch = 
                errand.title.toLowerCase().includes(searchLower) ||
                errand.description.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }
        
        // Region filter
        if (errandFilters.region !== 'all' && errand.region !== errandFilters.region) {
            return false;
        }
        
        // Category filter
        if (errandFilters.category !== 'all' && errand.category !== errandFilters.category) {
            return false;
        }
        
        // Budget filters
        if (errandFilters.budgetMin && errand.budget < parseFloat(errandFilters.budgetMin)) {
            return false;
        }
        
        if (errandFilters.budgetMax && errand.budget > parseFloat(errandFilters.budgetMax)) {
            return false;
        }
        
        return true;
    });
});

// Analytics selectors
export const useVendorMetrics = () => useAppStore((state) => {
    const { user, products, orders } = state;
    if (!user || !user.roles?.includes('vendor')) return null;
    
    const vendorProducts = products.filter(p => p.ownerEmail === user.email);
    const vendorOrders = orders.filter(o => {
        const product = products.find(p => p.id === o.productId);
        return product && product.ownerEmail === user.email;
    });
    
    const totalRevenue = vendorOrders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
    const totalProducts = vendorProducts.length;
    const totalOrders = vendorOrders.length;
    
    return {
        totalRevenue,
        totalProducts,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        // Add more metrics as needed
    };
});

export const useHelperMetrics = () => useAppStore((state) => {
    const { user, applications, errands } = state;
    if (!user || !user.roles?.includes('helper')) return null;
    
    const helperApplications = applications.filter(a => a.helperEmail === user.email);
    const acceptedApplications = helperApplications.filter(a => a.status === 'accepted');
    const completedErrands = errands.filter(e => 
        e.assignedHelperEmail === user.email && e.status === 'completed'
    );
    
    const totalEarnings = completedErrands.reduce((sum, errand) => {
        const application = helperApplications.find(a => a.errandId === errand.id);
        return sum + (application?.offerAmount || errand.budget || 0);
    }, 0);
    
    return {
        totalEarnings,
        totalApplications: helperApplications.length,
        acceptedApplications: acceptedApplications.length,
        completedErrands: completedErrands.length,
        acceptanceRate: helperApplications.length > 0 ? (acceptedApplications.length / helperApplications.length) * 100 : 0,
        // Add more metrics as needed
    };
});

export const useCustomerMetrics = () => useAppStore((state) => {
    const { user, orders, errands } = state;
    if (!user || !user.roles?.includes('customer')) return null;
    
    const customerOrders = orders.filter(o => o.customerEmail === user.email);
    const customerErrands = errands.filter(e => e.requesterEmail === user.email);
    
    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
    const totalSavings = customerOrders.reduce((savings, order) => {
        // Estimate 15% savings on group buys
        return savings + ((order.totalPrice || order.total || 0) * 0.15);
    }, 0);
    
    return {
        totalSpent,
        totalSavings,
        totalOrders: customerOrders.length,
        totalErrands: customerErrands.length,
        avgOrderValue: customerOrders.length > 0 ? totalSpent / customerOrders.length : 0,
        savingsRate: totalSpent > 0 ? (totalSavings / (totalSpent + totalSavings)) * 100 : 0,
        // Add more metrics as needed
    };
});
