import { createClient } from '@supabase/supabase-js';
import { ErrorLogger, apiCall, showErrorToast, showSuccessToast } from './errorService';

// Supabase configuration
// Uses environment variables from .env file, with fallback to default values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://axebuotlssslcnxtixqq.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4ZWJ1b3Rsc3NzbGNueHRpeHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTYzMzksImV4cCI6MjA3OTI3MjMzOX0.WLkdnGgwv6Luq9r5vu7HeYw2RPet9qT56zu3n1trCaM';

// Initialize Supabase client
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table name for key-value storage
const DB_TABLE = 'app_state';

// Storage keys
export const StorageKeys = {
    user: 'userProfile',
    helperData: 'helperData',
    loginMethod: 'loginMethod',
    products: 'products',
    orders: 'orders',
    errands: 'errands',
    applications: 'applications',
    messages: 'messages'
};

// Database operations with error handling
export async function dbSaveSlice(key, value) {
    return await apiCall(async () => {
        // Check if user is authenticated before attempting Supabase calls
        // Demo users and unauthenticated users should use localStorage directly
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session && supabaseClient) {
            // No session - use localStorage directly (demo users, etc.)
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }
        
        if (supabaseClient && session) {
            const { error } = await supabaseClient
                .from(DB_TABLE)
                .upsert({ key, value }, { onConflict: 'key' });
            
            // Check if error is RLS-related (demo users aren't authenticated)
            if (error) {
                const isRLSError = error.message.includes('row-level security') || 
                                 error.message.includes('permission denied') ||
                                 error.message.includes('violates row-level security') ||
                                 error.message.includes('401') ||
                                 error.message.includes('Unauthorized') ||
                                 error.code === '42501' || 
                                 error.code === 'PGRST301' ||
                                 error.code === 'PGRST116' ||
                                 error.status === 401;
                
                if (isRLSError) {
                    // Demo users or unauthenticated users - silently use localStorage
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                        return true; // Success with localStorage fallback
                    } catch (e) {
                        // Even localStorage failed - this is a real error
                        throw new Error(`Database save failed: ${error.message}`);
                    }
                }
                
                throw new Error(`Database save failed: ${error.message}`);
            }
            return true;
        } else {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }
    }, {
        context: `Saving data for key: ${key}`,
        showToast: false,
        logError: false, // Don't log RLS errors - they're expected for demo users
        fallbackValue: (() => {
            // Fallback to localStorage on error
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        })()
    });
}

export async function dbLoadSlice(key, fallback) {
    const result = await apiCall(async () => {
        // Check if user is authenticated before attempting Supabase calls
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session && supabaseClient) {
            // No session - use localStorage directly (demo users, etc.)
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        }
        
        if (supabaseClient && session) {
            const { data, error } = await supabaseClient
                .from(DB_TABLE)
                .select('value')
                .eq('key', key)
                .maybeSingle();
            
            // Handle RLS/401 errors gracefully for demo users
            if (error) {
                const isRLSError = error.message.includes('row-level security') || 
                                 error.message.includes('permission denied') ||
                                 error.message.includes('violates row-level security') ||
                                 error.message.includes('401') ||
                                 error.message.includes('Unauthorized') ||
                                 error.code === '42501' || 
                                 error.code === 'PGRST301' ||
                                 error.code === 'PGRST116';
                
                if (isRLSError) {
                    // Demo users or unauthenticated users - fallback to localStorage
                    try {
                        const stored = localStorage.getItem(key);
                        return stored ? JSON.parse(stored) : fallback;
                    } catch (e) {
                        return fallback;
                    }
                }
                
                throw new Error(`Database load failed: ${error.message}`);
            }
            return data?.value || fallback;
        } else {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        }
    }, {
        context: `Loading data for key: ${key}`,
        showToast: false,
        fallbackValue: (() => {
            // Fallback to localStorage on error
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (e) {
                ErrorLogger.log(e, { operation: 'localStorage fallback', key });
                return fallback;
            }
        })()
    });
    
    return result.success ? result.data : result.data; // fallbackValue is already set
}

export async function dbClearAll() {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from(DB_TABLE)
                .delete()
                .neq('key', ''); // Delete all records
            if (error) throw error;
        }
        // Also clear localStorage
        Object.values(StorageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (e) {
        console.error('dbClearAll error', e);
        // Fallback to clearing localStorage only
        Object.values(StorageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// Authentication helpers with error handling
export async function signUpWithEmail(email, password, userData) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        if (error) throw new Error(`Sign up failed: ${error.message}`);
        
        showSuccessToast('Account created successfully! Please check your email for verification.');
        return { data, error: null };
    }, {
        context: 'Creating new account',
        showToast: true
    });
}

export async function signInWithEmail(email, password) {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw new Error(`Sign in failed: ${error.message}`);
        
        showSuccessToast(`Welcome back, ${data.user.email}!`);
        return { data, error: null };
    }, {
        context: 'Signing in to account',
        showToast: true
    });
}

export async function signInWithGoogle() {
    return await apiCall(async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw new Error(`Google sign in failed: ${error.message}`);
        return { data, error: null };
    }, {
        context: 'Google OAuth sign in',
        showToast: true
    });
}

export async function signOut() {
    return await apiCall(async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw new Error(`Sign out failed: ${error.message}`);
        
        showSuccessToast('Signed out successfully');
        return { error: null };
    }, {
        context: 'Signing out',
        showToast: true
    });
}

export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return { user, error: null };
    } catch (error) {
        return { user: null, error };
    }
}

// Data loading functions
export async function loadProductsFromBackend() {
    try {
        if (!supabaseClient) {
            const storedProducts = await dbLoadSlice(StorageKeys.products, SeedData.products);
            return normalizeProducts(storedProducts);
        }
        
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error loading products', error);
            return normalizeProducts(SeedData.products);
        }
        
        // Transform database format to app format
        const transformedProducts = (data || []).map(p => ({
            id: p.id,
            title: p.title,
            region: p.region,
            price: parseFloat(p.price),
            description: p.description,
            deadline: p.deadline,
            deliveryDate: p.delivery_date,
            vendor: p.vendor,
            targetQuantity: p.target_quantity,
            currentQuantity: p.current_quantity,
            imageColor: p.image_color,
            imageDataUrl: p.image_data_url,
            ownerEmail: p.owner_email,
            createdAt: p.created_at
        }));
        
        return normalizeProducts(transformedProducts);
    } catch (error) {
        console.error('Error loading products', error);
        return normalizeProducts(SeedData.products);
    }
}

export async function loadOrdersFromBackend() {
    try {
        if (!supabaseClient) {
            const storedOrders = await dbLoadSlice(StorageKeys.orders, []);
            return storedOrders || [];
        }
        
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error loading orders', error);
            return [];
        }
        
        // Transform database format to app format
        const transformedOrders = (data || []).map(o => ({
            id: o.id,
            productId: o.product_id,
            customerEmail: o.customer_email,
            customerName: o.customer_name,
            quantity: o.quantity,
            totalPrice: parseFloat(o.total_price || 0),
            total: parseFloat(o.total_price || 0),
            groupStatus: o.group_status,
            fulfillmentStatus: o.fulfillment_status,
            createdAt: o.created_at
        }));
        
        return transformedOrders;
    } catch (error) {
        console.error('Error loading orders', error);
        return [];
    }
}

export async function loadErrandsFromBackend() {
    try {
        if (!supabaseClient) {
            const storedErrands = await dbLoadSlice(StorageKeys.errands, SeedData.errands);
            return {
                errands: normalizeErrands(storedErrands),
                applications: await dbLoadSlice(StorageKeys.applications, []),
                messages: await dbLoadSlice(StorageKeys.messages, [])
            };
        }
        
        // Load errands
        const { data: errandsData, error: errErr } = await supabaseClient
            .from('errands')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (errErr) {
            console.error('Error loading errands', errErr);
            return {
                errands: normalizeErrands(SeedData.errands),
                applications: [],
                messages: []
            };
        }
        
        // Load applications
        const { data: appsData, error: appsErr } = await supabaseClient
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });
            
        // Load messages
        const { data: messagesData, error: messagesErr } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Transform errands
        const transformedErrands = (errandsData || []).map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            region: e.region,
            budget: parseFloat(e.budget || 0),
            deadline: e.deadline,
            status: e.status,
            requesterEmail: e.requester_email,
            assignedHelperEmail: e.assigned_helper_email,
            createdAt: e.created_at
        }));
        
        // Transform applications
        const transformedApplications = (appsData || []).map(a => ({
            id: a.id,
            errandId: a.errand_id,
            helperEmail: a.helper_email,
            offerAmount: parseFloat(a.offer_amount || 0),
            message: a.message,
            status: a.status,
            createdAt: a.created_at
        }));
        
        return {
            errands: normalizeErrands(transformedErrands),
            applications: transformedApplications,
            messages: messagesData || []
        };
    } catch (error) {
        console.error('Error loading errands', error);
        return {
            errands: normalizeErrands(SeedData.errands),
            applications: [],
            messages: []
        };
    }
}

// Seed data (extracted from original file)
const SeedData = {
    products: [
        {
            id: 1,
            title: 'Premium Korean Strawberries',
            region: 'Toronto',
            price: 38,
            description: 'Sweet-picked winter strawberries flown in twice a week.',
            deadline: '2025-02-01',
            deliveryDate: '2025-02-05',
            vendor: 'Soo Fresh Imports',
            targetQuantity: 50,
            currentQuantity: 32,
            imageColor: '#ff6b6b',
            ownerEmail: 'vendor@example.com',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Jeju Tangerine Crates',
            region: 'Niagara',
            price: 45,
            description: '10kg crates of Jeju tangerines, direct from the island.',
            deadline: '2025-02-04',
            deliveryDate: '2025-02-08',
            vendor: 'Island Citrus Co.',
            targetQuantity: 40,
            currentQuantity: 12,
            imageColor: '#ffa500',
            ownerEmail: 'vendor@example.com',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Korean Pantry Essentials Kit',
            region: 'Hamilton',
            price: 85,
            description: 'Bundle includes gochujang, doenjang, sesame oil, and seaweed.',
            deadline: '2025-02-07',
            deliveryDate: '2025-02-10',
            vendor: 'K-Pantry Plus',
            targetQuantity: 35,
            currentQuantity: 14,
            imageColor: '#4ecdc4',
            ownerEmail: 'vendor@example.com',
            createdAt: new Date().toISOString()
        }
    ],
    errands: [
        {
            id: 1,
            title: 'Weekly H-Mart Grocery Run',
            description: 'Need kimchi, rice, and fresh tofu delivered to my apartment.',
            region: 'Toronto',
            budget: 30,
            deadline: '2025-01-28T10:00:00',
            status: 'open',
            requesterEmail: 'customer@example.com',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Pharmacy Pickup for Mom',
            description: 'Pickup prescription from Shoppers and drop off near King St.',
            region: 'Hamilton',
            budget: 20,
            deadline: '2025-01-27T15:00:00',
            status: 'open',
            requesterEmail: 'customer@example.com',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Airport Drop-off Ride',
            description: 'Need a ride to YYZ with 2 suitcases, leaving Saturday morning.',
            region: 'Niagara',
            budget: 70,
            deadline: '2025-02-01T07:00:00',
            status: 'open',
            requesterEmail: 'customer@example.com',
            createdAt: new Date().toISOString()
        }
    ]
};

// Utility functions (extracted from original file)
function normalizeProducts(products) {
    return (products || []).map(product => ({
        ...product,
        id: product.id || Date.now() + Math.random(),
        price: parseFloat(product.price) || 0,
        targetQuantity: parseInt(product.targetQuantity) || 1,
        currentQuantity: parseInt(product.currentQuantity) || 0,
        createdAt: product.createdAt || new Date().toISOString()
    }));
}

function normalizeErrands(errands) {
    return (errands || []).map(errand => ({
        ...errand,
        id: errand.id || Date.now() + Math.random(),
        budget: parseFloat(errand.budget) || 0,
        createdAt: errand.createdAt || new Date().toISOString()
    }));
}
