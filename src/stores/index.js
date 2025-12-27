import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createUserSlice } from './userSlice';
import { createProductSlice } from './productSlice';
import { createListingSlice } from './listingSlice';
import { createRegionalBatchSlice } from './regionalBatchSlice';
import { createOrderSlice } from './orderSlice';
import { createErrandSlice } from './errandSlice';
import { createUISlice } from './uiSlice';
import { createFilterSlice } from './filterSlice';
import { createChatSlice } from './chatSlice';
import { createReferralSlice } from './referralSlice';
import { createCommunityStatsSlice } from './communityStatsSlice';

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
                
                // Chat slice
                ...createChatSlice(set, get, api),
                
                // Referral slice
                ...createReferralSlice(set, get, api),
                
                // Community stats slice
                ...createCommunityStatsSlice(set, get, api),
                
                // Listing slice (regional marketplace)
                ...createListingSlice(set, get, api),
                
                // Regional batch slice (regional marketplace)
                ...createRegionalBatchSlice(set, get, api),
                
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

// Import auth store first to avoid circular dependency
import { 
    useAuthStore, 
    useAuth, 
    useAuthActions, 
    useUserRoles 
} from './authStore';

// Re-export auth store hooks for backward compatibility and convenience
export { 
    useAuthStore, 
    useAuth, 
    useAuthActions, 
    useUserRoles 
};

// Legacy selectors - now using authStore
export const useUser = () => useAuthStore((state) => state.user);
export const useCheckAuthStatus = () => useAuthStore((state) => state.checkAuthStatus);
export const useSignUp = () => useAuthStore((state) => state.signUp);
export const useSignIn = () => useAuthStore((state) => state.signIn);
export const useSignInWithGoogle = () => useAuthStore((state) => state.signInWithGoogle);
export const useSignOut = () => useAuthStore((state) => state.signOut);
export const useSetDemoUser = () => useAuthStore((state) => state.setDemoUser);
export const useSkipLogin = () => useAuthStore((state) => state.skipLogin);
export const useSetUser = () => useAuthStore((state) => state.setUser);
export const useUpdateUser = () => useAuthStore((state) => state.updateUser);
export const useClearUser = () => useAuthStore((state) => state.clearUser);
export const useSetSelectedRoles = () => useAuthStore((state) => state.setSelectedRoles);

// Helper-specific hooks (still in userSlice for now)
export const useUpdateHelperData = () => useAppStore((state) => state.updateHelperData);
export const useSetHelperStep = () => useAppStore((state) => state.setHelperStep);

// Backward compatibility hook removed - use individual hooks instead
// export const useUserActions = () => useAppStore((state) => ({...}), shallow);

export const useProducts = () => useAppStore((state) => state.products);
export const useUserLocation = () => useAppStore((state) => state.userLocation);
export const useNearbyProducts = () => useAppStore((state) => state.nearbyProducts);
// Individual product action hooks
export const useLoadProducts = () => useAppStore((state) => state.loadProducts);
export const useAddProduct = () => useAppStore((state) => state.addProduct);
export const useUpdateProduct = () => useAppStore((state) => state.updateProduct);
export const useDeleteProduct = () => useAppStore((state) => state.deleteProduct);
export const useSetProducts = () => useAppStore((state) => state.setProducts);
export const useCreateProduct = () => useAppStore((state) => state.createProduct);
export const useJoinGroupBuy = () => useAppStore((state) => state.joinGroupBuy);
export const useSetUserLocation = () => useAppStore((state) => state.setUserLocation);
export const useSetNearbyProducts = () => useAppStore((state) => state.setNearbyProducts);

// Listing hooks (new regional marketplace model)
export const useListings = () => useAppStore((state) => state.listings || []);
export const useLoadListings = () => useAppStore((state) => state.loadListings);
export const useCreateListing = () => useAppStore((state) => state.createListing);
export const useUpdateListing = () => useAppStore((state) => state.updateListing);
export const useDeleteListing = () => useAppStore((state) => state.deleteListing);
export const useSetListings = () => useAppStore((state) => state.setListings);
export const useGetListingById = () => useAppStore((state) => state.getListingById);
export const useGetListingsByOwner = () => useAppStore((state) => state.getListingsByOwner);

// Regional batch hooks (new regional marketplace model)
export const useRegionalBatches = () => useAppStore((state) => state.regionalBatches || []);
export const useBatchesByListing = () => useAppStore((state) => state.batchesByListing || {});
export const useGetBatchesByListing = () => useAppStore((state) => state.getBatchesByListing);
export const useLoadBatchesForListing = () => useAppStore((state) => state.loadBatchesForListing);
export const useLoadAllBatches = () => useAppStore((state) => state.loadAllBatches);
export const useCreateRegionalBatch = () => useAppStore((state) => state.createRegionalBatch);
export const useUpdateRegionalBatchStatus = () => useAppStore((state) => state.updateRegionalBatchStatus);
export const useCancelRegionalBatch = () => useAppStore((state) => state.cancelRegionalBatch);
export const useAggregateBatchQuantity = () => useAppStore((state) => state.aggregateBatchQuantity);
export const useGetBatchById = () => useAppStore((state) => state.getBatchById);
export const useGetBatchProgress = () => useAppStore((state) => state.getBatchProgress);
export const useGetBatchStatus = () => useAppStore((state) => state.getBatchStatus);
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
export const useGetOrdersByBatch = () => useAppStore((state) => state.getOrdersByBatch);
export const useGetOrdersByListing = () => useAppStore((state) => state.getOrdersByListing);
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

// Chat hooks
export const useActiveChats = () => useAppStore((state) => state.activeChats || {});
export const useUnreadCounts = () => useAppStore((state) => state.unreadCounts || {});
export const useActiveThread = () => useAppStore((state) => state.activeThread);
export const useChatThreads = () => useAppStore((state) => state.chatThreads || []);
export const useChatLoading = () => useAppStore((state) => state.chatLoading || false);
export const useChatError = () => useAppStore((state) => state.chatError);
export const useSetActiveThread = () => useAppStore((state) => state.setActiveThread);
export const useClearActiveThread = () => useAppStore((state) => state.clearActiveThread);
export const useSendMessage = () => useAppStore((state) => state.sendMessage);
export const useLoadChat = () => useAppStore((state) => state.loadChat);
export const useMarkAsRead = () => useAppStore((state) => state.markAsRead);
export const useLoadChatThreads = () => useAppStore((state) => state.loadChatThreads);
export const useGetTotalUnreadCount = () => useAppStore((state) => state.getTotalUnreadCount);
export const useGetUnreadCount = () => useAppStore((state) => state.getUnreadCount);

// Referral hooks
export const useReferralCode = () => useAppStore((state) => state.referralCode);
export const useReferralStats = () => useAppStore((state) => state.referralStats);
export const useReferrals = () => useAppStore((state) => state.referrals || []);
export const useCredits = () => useAppStore((state) => state.credits);
export const useCreditsHistory = () => useAppStore((state) => state.creditsHistory || []);
export const useReferralLoading = () => useAppStore((state) => state.referralLoading || false);
export const useReferralError = () => useAppStore((state) => state.referralError);
export const useGenerateReferralCode = () => useAppStore((state) => state.generateReferralCode);
export const useLoadReferralCodeFromStorage = () => useAppStore((state) => state.loadReferralCodeFromStorage);
export const useLoadReferralStats = () => useAppStore((state) => state.loadReferralStats);
export const useLoadReferrals = () => useAppStore((state) => state.loadReferrals);
export const useLoadCredits = () => useAppStore((state) => state.loadCredits);
export const useLoadCreditsHistory = () => useAppStore((state) => state.loadCreditsHistory);
export const useApplyCredits = () => useAppStore((state) => state.applyCredits);
export const useShareReferral = () => useAppStore((state) => state.shareReferral);
export const useProcessReferralSignup = () => useAppStore((state) => state.processReferralSignup);
export const useProcessReferralOrder = () => useAppStore((state) => state.processReferralOrder);
export const useCreateProductReferral = () => useAppStore((state) => state.createProductReferral);

// Community stats hooks
export const useCommunitySavings = () => {
  const savings = useAppStore((state) => state.communitySavings);
  // Handle NaN, null, undefined - ensure always returns a valid number
  if (typeof savings !== 'number' || isNaN(savings)) {
    return 0;
  }
  return savings;
};
export const useUserContribution = () => {
  const contribution = useAppStore((state) => state.userContribution);
  // Handle NaN, null, undefined - ensure always returns a valid number
  if (typeof contribution !== 'number' || isNaN(contribution)) {
    return 0;
  }
  return contribution;
};
export const useTopContributors = () => useAppStore((state) => state.topContributors || []);
export const useSavingsByRegion = () => useAppStore((state) => state.savingsByRegion || []);
export const useStatsSummary = () => useAppStore((state) => state.statsSummary);
export const useCommunityStatsLoading = () => useAppStore((state) => state.loading || false);
export const useCommunityStatsError = () => useAppStore((state) => state.error);
export const useLoadCommunityStats = () => useAppStore((state) => state.loadCommunityStats);
export const useLoadUserContribution = () => useAppStore((state) => state.loadUserContribution);
export const useLoadTopContributors = () => useAppStore((state) => state.loadTopContributors);
export const useLoadSavingsByRegion = () => useAppStore((state) => state.loadSavingsByRegion);
export const useLoadStatsSummary = () => useAppStore((state) => state.loadStatsSummary);
export const useRefreshAllStats = () => useAppStore((state) => state.refreshAllStats);

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
