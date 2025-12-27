import { loadProductsFromBackend } from '../services/supabaseService';

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
            
            set((state) => {
                state.products = products || [];
                state.productsLoading = false;
            });
            
            return { success: true, products };
        } catch (error) {
            set((state) => {
                state.productsError = error.message;
                state.productsLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    createProduct: async (productData) => {
        const { user } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const newProduct = {
                ...productData,
                id: Date.now() + Math.random(),
                ownerEmail: user.email,
                vendor: user.name,
                currentQuantity: 0,
                createdAt: new Date().toISOString()
            };
            
            // In a real app, this would save to Supabase
            set((state) => {
                state.products.push(newProduct);
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: 'Product created successfully!',
                duration: 3000
            });
            
            return { success: true, product: newProduct };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to create product: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    joinGroupBuy: async (productId, quantity, customerData) => {
        const { user, addOrder } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const product = get().products.find(p => p.id === productId);
            if (!product) {
                throw new Error('Product not found');
            }
            
            const order = {
                id: Date.now() + Math.random(),
                productId,
                customerEmail: user.email,
                customerName: user.name,
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
