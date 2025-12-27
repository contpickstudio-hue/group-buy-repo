import { loadProductsFromBackend, supabaseClient, dbSaveSlice, dbLoadSlice, StorageKeys } from '../services/supabaseService';
import { useAuthStore } from './authStore';

export const createProductSlice = (set, get) => ({
    // Product state
    products: [],
    productsLoading: false,
    productsError: null,
    userLocation: null, // { lat, lng }
    nearbyProducts: [],
    
    // Actions
    setProducts: (products) => {
        set((state) => {
            state.products = products || [];
            state.productsError = null;
        });
    },
    
    addProduct: (product) => {
        set((state) => {
            const newProduct = {
                ...product,
                id: product.id || Date.now() + Math.random(),
                createdAt: product.createdAt || new Date().toISOString(),
                currentQuantity: product.currentQuantity || 0,
                targetQuantity: product.targetQuantity || 1
            };
            state.products.push(newProduct);
        });
    },
    
    updateProduct: (productId, updates) => {
        set((state) => {
            const index = state.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                Object.assign(state.products[index], updates);
            }
        });
    },
    
    deleteProduct: (productId) => {
        set((state) => {
            state.products = state.products.filter(p => p.id !== productId);
        });
    },
    
    // Async actions
    loadProducts: async () => {
        set((state) => {
            state.productsLoading = true;
            state.productsError = null;
        });
        
        try {
            const products = await loadProductsFromBackend();
            
            // For demo users, also load from localStorage and merge
            const loginMethod = useAuthStore.getState().loginMethod;
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            let finalProducts = products || [];
            
            // Check if demo user or no session
            if (loginMethod === 'demo' || !session) {
                // Demo user - load from localStorage and merge
                const storedProducts = await dbLoadSlice(StorageKeys.products, []);
                if (storedProducts && storedProducts.length > 0) {
                    // Merge: combine backend products with localStorage products, avoiding duplicates
                    const backendIds = new Set(finalProducts.map(p => p.id));
                    const localProducts = storedProducts.filter(p => !backendIds.has(p.id));
                    finalProducts = [...finalProducts, ...localProducts];
                }
            }
            
            set((state) => {
                state.products = finalProducts || [];
                state.productsLoading = false;
            });
            
            return { success: true, products: finalProducts };
        } catch (error) {
            set((state) => {
                state.productsError = error.message;
                state.productsLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    createProduct: async (productData) => {
        // Get user and loginMethod from authStore (not from combined store)
        const user = useAuthStore.getState().user;
        const loginMethod = useAuthStore.getState().loginMethod;
        
        // Check authentication - support both real and demo users
        if (!user || (!user.email && !user.id)) {
            return { success: false, error: 'User not authenticated' };
        }

        // Enforce vendor role requirement - RBAC check (action level)
        const { checkPermission } = await import('../utils/rbacUtils');
        const permissionCheck = checkPermission(user, loginMethod, 'vendor');
        if (!permissionCheck.allowed) {
            return { 
                success: false, 
                error: permissionCheck.error
            };
        }
        
        // Get user identifier (email or id)
        const userEmail = user.email || user.id;
        
        // Optimistically add to local state
        const newProduct = {
            ...productData,
            id: Date.now() + Math.random(),
            ownerEmail: userEmail,
            vendor: user.name || 'Vendor',
            currentQuantity: 0,
            createdAt: new Date().toISOString()
        };
        
        set((state) => {
            state.products.push(newProduct);
        });

        // Try to save to backend (Supabase)
        try {
            // For demo users, skip Supabase and use localStorage
            if (loginMethod === 'demo') {
                const currentProducts = get().products || [];
                await dbSaveSlice(StorageKeys.products, currentProducts);
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Group buy created successfully!',
                    duration: 3000
                });
                
                return { success: true, product: newProduct };
            }
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session && supabaseClient) {
                // User is authenticated - save to Supabase
                const { data, error } = await supabaseClient
                    .from('products')
                    .insert({
                        title: newProduct.title,
                        description: newProduct.description || '',
                        region: newProduct.region,
                        price: newProduct.price,
                        target_quantity: newProduct.targetQuantity || 20,
                        current_quantity: 0,
                        deadline: newProduct.deadline,
                        delivery_date: newProduct.deliveryDate || null,
                        vendor: newProduct.vendor,
                        owner_email: newProduct.ownerEmail,
                        image_data_url: newProduct.imageDataUrl || null,
                        image_color: newProduct.imageColor || null,
                        latitude: newProduct.latitude || null,
                        longitude: newProduct.longitude || null
                    })
                    .select()
                    .single();

                if (error) throw error;
                
                // Update with real ID from database
                if (data) {
                    set((state) => {
                        const index = state.products.findIndex(p => p.id === newProduct.id);
                        if (index !== -1) {
                            state.products[index] = {
                                ...state.products[index],
                                id: data.id,
                                createdAt: data.created_at
                            };
                        }
                    });
                }
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Group buy created successfully!',
                    duration: 3000
                });
                
                return { success: true, product: newProduct };
            } else {
                // Demo user or no session - save to localStorage
                const currentProducts = get().products || [];
                await dbSaveSlice(StorageKeys.products, currentProducts);
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Group buy created successfully!',
                    duration: 3000
                });
                
                return { success: true, product: newProduct };
            }
        } catch (error) {
            // If backend save fails, try to save to localStorage as fallback
            if (import.meta.env.DEV) {
                console.warn('Failed to save product to backend, trying local storage:', error);
            }
            try {
                const currentProducts = get().products || [];
                await dbSaveSlice(StorageKeys.products, currentProducts);
                
                // Still return success but with a warning
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Group buy created successfully (saved locally)!',
                    duration: 3000
                });
                
                return { success: true, product: newProduct };
            } catch (storageError) {
                // Both backend and localStorage failed - this is a real error
                if (import.meta.env.DEV) {
                    console.error('Failed to save product to local storage:', storageError);
                }
                
                // Remove the optimistically added product
                set((state) => {
                    const index = state.products.findIndex(p => p.id === newProduct.id);
                    if (index !== -1) {
                        state.products.splice(index, 1);
                    }
                });
                
                const errorMessage = error?.message || storageError?.message || 'Failed to create group buy';
                return { success: false, error: errorMessage };
            }
        }
    },
    
    joinGroupBuy: async (productId, quantity, customerData) => {
        // Get user and loginMethod from authStore (not from combined store)
        const user = useAuthStore.getState().user;
        const loginMethod = useAuthStore.getState().loginMethod;
        const { addOrder } = get();
        
        // Check authentication - support both real and demo users
        if (!user || (!user.email && !user.id)) {
            return { success: false, error: 'User not authenticated' };
        }
        
        const userEmail = user.email || user.id;
        
        try {
            const product = get().products.find(p => p.id === productId);
            if (!product) {
                throw new Error('Product not found');
            }
            
            const order = {
                id: Date.now() + Math.random(),
                productId,
                customerEmail: userEmail,
                customerName: user.name || userEmail,
                quantity,
                totalPrice: product.price * quantity,
                total: product.price * quantity,
                groupStatus: 'open',
                fulfillmentStatus: 'pending',
                createdAt: new Date().toISOString(),
                ...customerData
            };
            
            // Add order
            addOrder(order);
            
            // Update product quantity
            set((state) => {
                const productIndex = state.products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    state.products[productIndex].currentQuantity += quantity;
                }
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: `Successfully joined ${product.title}!`,
                duration: 3000
            });
            
            return { success: true, order };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to join group buy: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    // Computed getters
    getProductById: (productId) => {
        const { products } = get();
        return products.find(p => p.id === productId);
    },
    
    getProductsByOwner: (ownerEmail) => {
        const { products } = get();
        return products.filter(p => p.ownerEmail === ownerEmail);
    },
    
    getProductProgress: (productId) => {
        const product = get().getProductById(productId);
        if (!product) return 0;
        return Math.min((product.currentQuantity / product.targetQuantity) * 100, 100);
    },
    
    getProductStatus: (productId) => {
        const product = get().getProductById(productId);
        if (!product) return 'unknown';
        
        const progress = get().getProductProgress(productId);
        const daysLeft = Math.ceil((new Date(product.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (progress >= 100) return 'completed';
        if (daysLeft <= 0) return 'expired';
        if (daysLeft <= 3) return 'closing-soon';
        if (progress >= 80) return 'almost-full';
        return 'open';
    },
    
    getFeaturedProducts: (limit = 3) => {
        const { products, orders } = get();
        
        // Sort by popularity (number of orders) and take the top ones
        return products
            .map(product => ({
                ...product,
                orderCount: orders.filter(o => o.productId === product.id).length
            }))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, limit);
    },
    
    getProductCategories: () => {
        const { products } = get();
        const categories = new Set();
        
        products.forEach(product => {
            if (product.category) {
                categories.add(product.category);
            }
        });
        
        return Array.from(categories);
    },
    
    getProductRegions: () => {
        const { products } = get();
        const regions = new Set();
        
        products.forEach(product => {
            if (product.region) {
                regions.add(product.region);
            }
        });
        
        return Array.from(regions);
    },
    
    setUserLocation: (location) => {
        set((state) => {
            state.userLocation = location;
        });
    },
    
    setNearbyProducts: (products) => {
        set((state) => {
            state.nearbyProducts = products || [];
        });
    }
});
