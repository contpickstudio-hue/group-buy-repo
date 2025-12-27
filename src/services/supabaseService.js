import { createClient } from '@supabase/supabase-js';
import { ErrorLogger, apiCall, showErrorToast, showSuccessToast } from './errorService';
import { setStorageItem, getStorageItem, removeStorageItem } from '../utils/storageUtils';

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
    listings: 'listings',
    regionalBatches: 'regionalBatches',
    orders: 'orders',
    errands: 'errands',
    applications: 'applications',
    messages: 'messages',
    vendorWallets: 'vendorWallets',
    payoutMethods: 'payoutMethods',
    withdrawalRequests: 'withdrawalRequests',
    errandRatings: 'errandRatings',
    notifications: 'notifications'
};

// Database operations with error handling
export async function dbSaveSlice(key, value) {
    return await apiCall(async () => {
        // Check if user is authenticated before attempting Supabase calls
        // Demo users and unauthenticated users should use localStorage directly
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session && supabaseClient) {
            // No session - use storage utility (demo users, etc.)
            await setStorageItem(key, value);
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
                    // Demo users or unauthenticated users - silently use storage utility
                    try {
                        await setStorageItem(key, value);
                        return true; // Success with storage fallback
                    } catch (e) {
                        // Even storage failed - this is a real error
                        throw new Error(`Database save failed: ${error.message}`);
                    }
                }
                
                throw new Error(`Database save failed: ${error.message}`);
            }
            return true;
        } else {
            await setStorageItem(key, value);
            return true;
        }
    }, {
        context: `Saving data for key: ${key}`,
        showToast: false,
        logError: false, // Don't log RLS errors - they're expected for demo users
        fallbackValue: true // Fallback handled in try-catch blocks above
    });
}

export async function dbLoadSlice(key, fallback) {
    const result = await apiCall(async () => {
        // Check if user is authenticated before attempting Supabase calls
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session && supabaseClient) {
            // No session - use storage utility (demo users, etc.)
            const stored = await getStorageItem(key, fallback);
            return stored;
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
                    // Demo users or unauthenticated users - fallback to storage utility
                    try {
                        const stored = await getStorageItem(key, fallback);
                        return stored;
                    } catch (e) {
                        return fallback;
                    }
                }
                
                throw new Error(`Database load failed: ${error.message}`);
            }
            return data?.value || fallback;
        } else {
            const stored = await getStorageItem(key, fallback);
            return stored;
        }
    }, {
        context: `Loading data for key: ${key}`,
        showToast: false,
        fallbackValue: fallback // Fallback handled in try-catch blocks above
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
        // Also clear storage
        for (const key of Object.values(StorageKeys)) {
            await removeStorageItem(key);
        }
    } catch (e) {
        if (import.meta.env.DEV) {
            console.error('dbClearAll error', e);
        }
        // Fallback to clearing storage only
        for (const key of Object.values(StorageKeys)) {
            await removeStorageItem(key);
        }
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
        if (error) {
            // Extract error message from various possible formats
            const errorMsg = error.msg || error.message || error.error_description || 'Google sign in failed';
            throw new Error(errorMsg);
        }
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

/**
 * Request a role for the current user
 * Updates user metadata in database (not session)
 * @param {string} role - Role to request ('vendor' or 'helper')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function requestRole(role) {
    return await apiCall(async () => {
        if (!role || !['vendor', 'helper', 'customer'].includes(role)) {
            throw new Error('Invalid role. Must be vendor, helper, or customer.');
        }

        const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser();
        if (getUserError || !user) {
            throw new Error('User not authenticated');
        }

        // Get current roles from metadata
        const currentRoles = Array.isArray(user.user_metadata?.roles) 
            ? user.user_metadata.roles 
            : [];

        // Check if user already has this role
        if (currentRoles.includes(role)) {
            return { success: true, message: `You already have the ${role} role.` };
        }

        // Add the new role to existing roles (don't replace)
        const updatedRoles = [...currentRoles, role];

        // Update user metadata in database
        const { data, error } = await supabaseClient.auth.updateUser({
            data: {
                ...user.user_metadata,
                roles: updatedRoles
            }
        });

        if (error) {
            throw new Error(`Failed to update role: ${error.message}`);
        }

        showSuccessToast(`Successfully added ${role} role to your account.`);
        return { success: true, user: data.user };
    }, {
        context: `Requesting ${role} role`,
        showToast: true
    });
}

/**
 * Remove a role from the current user
 * Updates user metadata in database
 * @param {string} role - Role to remove ('vendor' or 'helper')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeRole(role) {
    return await apiCall(async () => {
        const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser();
        if (getUserError || !user) {
            throw new Error('User not authenticated');
        }

        // Get current roles from metadata
        const currentRoles = Array.isArray(user.user_metadata?.roles) 
            ? user.user_metadata.roles 
            : [];

        // Remove the role
        const updatedRoles = currentRoles.filter(r => r !== role);

        // Update user metadata in database
        const { data, error } = await supabaseClient.auth.updateUser({
            data: {
                ...user.user_metadata,
                roles: updatedRoles
            }
        });

        if (error) {
            throw new Error(`Failed to remove role: ${error.message}`);
        }

        showSuccessToast(`Successfully removed ${role} role from your account.`);
        return { success: true, user: data.user };
    }, {
        context: `Removing ${role} role`,
        showToast: true
    });
}

/**
 * Delete user account and all associated data
 * This is a critical operation and should be used with caution
 */
export async function deleteUserAccount(userEmail) {
    return await apiCall(async () => {
        // Check if user is authenticated
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // For demo users, just clear local storage
            if (userEmail === 'guest@preview.app' || userEmail?.includes('guest-')) {
                // Clear all user-related data from localStorage
                const keysToRemove = [
                    StorageKeys.user,
                    StorageKeys.loginMethod,
                    StorageKeys.products,
                    StorageKeys.orders,
                    StorageKeys.errands,
                    StorageKeys.applications,
                    StorageKeys.messages,
                    StorageKeys.notifications
                ];
                
                for (const key of keysToRemove) {
                    try {
                        await removeStorageItem(key);
                    } catch (e) {
                        if (import.meta.env.DEV) {
                            console.warn(`Failed to remove ${key}:`, e);
                        }
                    }
                }
                
                return { success: true };
            }
            throw new Error('No active session');
        }

        // For real users, delete from Supabase
        // Note: This requires proper RLS policies and may need to be done via Edge Function
        // for cascading deletes of related data
        
        // First, sign out the user
        await supabaseClient.auth.signOut();
        
        // Then delete the user account
        // Note: Supabase doesn't have a direct deleteUser method in the client
        // This would typically be done via an Edge Function or admin API
        // For now, we'll clear local data and sign out
        
        // Clear all local storage
        const keysToRemove = [
            StorageKeys.user,
            StorageKeys.loginMethod,
            StorageKeys.products,
            StorageKeys.orders,
            StorageKeys.errands,
            StorageKeys.applications,
            StorageKeys.messages,
            StorageKeys.notifications
        ];
        
        for (const key of keysToRemove) {
            try {
                await removeStorageItem(key);
            } catch (e) {
                if (import.meta.env.DEV) {
                    console.warn(`Failed to remove ${key}:`, e);
                }
            }
        }
        
        showSuccessToast('Account deletion requested. Please contact support to complete the process.');
        return { success: true };
    }, {
        context: 'Deleting user account',
        showToast: true
    });
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
            if (import.meta.env.DEV) {
                console.error('Error loading products', error);
            }
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
        if (import.meta.env.DEV) {
            console.error('Error loading products', error);
        }
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
            if (import.meta.env.DEV) {
                console.error('Error loading orders', error);
            }
            return [];
        }
        
        // Transform database format to app format
        const transformedOrders = (data || []).map(o => ({
            id: o.id,
            productId: o.product_id,
            regionalBatchId: o.regional_batch_id,
            customerEmail: o.customer_email,
            customerName: o.customer_name,
            quantity: o.quantity,
            totalPrice: parseFloat(o.total_price || 0),
            total: parseFloat(o.total_price || 0),
            groupStatus: o.group_status,
            fulfillmentStatus: o.fulfillment_status,
            paymentStatus: o.payment_status || 'authorized',
            escrowStatus: o.escrow_status || 'escrow_held',
            paymentIntentId: o.payment_intent_id || null,
            refundRequired: o.refund_required || false,
            createdAt: o.created_at
        }));
        
        return transformedOrders;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error loading orders', error);
        }
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
            if (import.meta.env.DEV) {
                console.error('Error loading errands', errErr);
            }
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
            budget: e.budget !== null && e.budget !== undefined 
              ? (typeof e.budget === 'number' ? e.budget : parseFloat(e.budget) || 0)
              : 0,
            deadline: e.deadline,
            status: e.status,
            requesterEmail: e.requester_email,
            assignedHelperEmail: e.assigned_helper_email,
            requesterConfirmedCompletion: e.requester_confirmed_completion || false,
            helperConfirmedCompletion: e.helper_confirmed_completion || false,
            paymentReleased: e.payment_released || false,
            paymentReleasedAt: e.payment_released_at,
            completedAt: e.completed_at,
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
        if (import.meta.env.DEV) {
            console.error('Error loading errands', error);
        }
        return {
            errands: normalizeErrands(SeedData.errands),
            applications: [],
            messages: []
        };
    }
}

// ============================================
// Listing Service Functions
// ============================================

export async function loadListingsFromBackend() {
    try {
        if (!supabaseClient) {
            const storedListings = await dbLoadSlice(StorageKeys.listings, []);
            return storedListings || [];
        }
        
        const { data, error } = await supabaseClient
            .from('listings')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error loading listings', error);
            }
            return [];
        }
        
        // Transform database format to app format
        const transformedListings = (data || []).map(l => ({
            id: l.id,
            title: l.title,
            description: l.description,
            originLocation: l.origin_location,
            ownerEmail: l.owner_email,
            vendor: l.vendor,
            imageColor: l.image_color,
            imageDataUrl: l.image_data_url,
            createdAt: l.created_at,
            updatedAt: l.updated_at
        }));
        
        return transformedListings;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error loading listings', error);
        }
        return [];
    }
}

export async function createListingInBackend(listingData) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const { data, error } = await supabaseClient
            .from('listings')
            .insert({
                title: listingData.title,
                description: listingData.description || '',
                origin_location: listingData.origin_location,
                owner_email: listingData.owner_email,
                vendor: listingData.vendor || 'Vendor',
                image_data_url: listingData.image_data_url || null,
                image_color: listingData.image_color || null
            })
            .select()
            .single();
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error creating listing', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error creating listing', error);
        }
        return { success: false, error: error.message };
    }
}

export async function updateListingInBackend(listingId, updates) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const updateData = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.originLocation !== undefined) updateData.origin_location = updates.originLocation;
        if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
        if (updates.imageDataUrl !== undefined) updateData.image_data_url = updates.imageDataUrl;
        if (updates.imageColor !== undefined) updateData.image_color = updates.imageColor;
        
        const { data, error } = await supabaseClient
            .from('listings')
            .update(updateData)
            .eq('id', listingId)
            .select()
            .single();
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error updating listing', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error updating listing', error);
        }
        return { success: false, error: error.message };
    }
}

export async function deleteListingInBackend(listingId) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const { error } = await supabaseClient
            .from('listings')
            .delete()
            .eq('id', listingId);
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error deleting listing', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error deleting listing', error);
        }
        return { success: false, error: error.message };
    }
}

// ============================================
// Regional Batch Service Functions
// ============================================

export async function loadRegionalBatchesFromBackend(listingId) {
    try {
        if (!supabaseClient) {
            const storedBatches = await dbLoadSlice(StorageKeys.regionalBatches, []);
            const filtered = storedBatches.filter(b => b.listingId === listingId || b.listing_id === listingId);
            return { success: true, batches: filtered };
        }
        
        const { data, error } = await supabaseClient
            .from('regional_batches')
            .select('*')
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false });
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error loading regional batches', error);
            }
            return { success: false, error: error.message };
        }
        
        // Transform database format to app format
        const transformedBatches = (data || []).map(b => ({
            id: b.id,
            listingId: b.listing_id,
            region: b.region,
            price: parseFloat(b.price || 0),
            minimumQuantity: b.minimum_quantity,
            cutoffDate: b.cutoff_date,
            deliveryMethod: b.delivery_method,
            status: b.status,
            currentQuantity: b.current_quantity || 0,
            createdAt: b.created_at,
            updatedAt: b.updated_at
        }));
        
        return { success: true, batches: transformedBatches };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error loading regional batches', error);
        }
        return { success: false, error: error.message };
    }
}

export async function loadAllRegionalBatchesFromBackend() {
    try {
        if (!supabaseClient) {
            const storedBatches = await dbLoadSlice(StorageKeys.regionalBatches, []);
            return { success: true, batches: storedBatches || [] };
        }
        
        const { data, error } = await supabaseClient
            .from('regional_batches')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error loading all regional batches', error);
            }
            return { success: false, error: error.message };
        }
        
        // Transform database format to app format
        const transformedBatches = (data || []).map(b => ({
            id: b.id,
            listingId: b.listing_id,
            region: b.region,
            price: parseFloat(b.price || 0),
            minimumQuantity: b.minimum_quantity,
            cutoffDate: b.cutoff_date,
            deliveryMethod: b.delivery_method,
            status: b.status,
            currentQuantity: b.current_quantity || 0,
            createdAt: b.created_at,
            updatedAt: b.updated_at
        }));
        
        return { success: true, batches: transformedBatches };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error loading all regional batches', error);
        }
        return { success: false, error: error.message };
    }
}

export async function createRegionalBatchInBackend(batchData) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const { data, error } = await supabaseClient
            .from('regional_batches')
            .insert({
                listing_id: batchData.listing_id,
                region: batchData.region,
                price: batchData.price,
                minimum_quantity: batchData.minimum_quantity,
                cutoff_date: batchData.cutoff_date,
                delivery_method: batchData.delivery_method,
                status: batchData.status || 'draft',
                current_quantity: 0
            })
            .select()
            .single();
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error creating regional batch', error);
            }
            return { success: false, error: error.message };
        }
        
        // Transform to app format
        const transformed = {
            id: data.id,
            listingId: data.listing_id,
            region: data.region,
            price: parseFloat(data.price || 0),
            minimumQuantity: data.minimum_quantity,
            cutoffDate: data.cutoff_date,
            deliveryMethod: data.delivery_method,
            status: data.status,
            currentQuantity: data.current_quantity || 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
        
        return { success: true, data: transformed };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error creating regional batch', error);
        }
        return { success: false, error: error.message };
    }
}

export async function updateRegionalBatchStatusInBackend(batchId, status) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const { data, error } = await supabaseClient
            .from('regional_batches')
            .update({ status })
            .eq('id', batchId)
            .select()
            .single();
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error updating regional batch status', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error updating regional batch status', error);
        }
        return { success: false, error: error.message };
    }
}

export async function getBatchQuantityFromBackend(batchId) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        // Get quantity from orders
        const { data, error } = await supabaseClient
            .from('orders')
            .select('quantity')
            .eq('regional_batch_id', batchId);
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error getting batch quantity', error);
            }
            return { success: false, error: error.message };
        }
        
        const quantity = (data || []).reduce((sum, order) => sum + (order.quantity || 0), 0);
        
        return { success: true, quantity };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error getting batch quantity', error);
        }
        return { success: false, error: error.message };
    }
}

export async function flagOrdersForRefund(batchId) {
    try {
        if (!supabaseClient) {
            if (import.meta.env.DEV) {
                console.warn('Supabase client not available, skipping refund flagging');
            }
            return { success: true }; // Don't fail if Supabase unavailable
        }
        
        // Update all orders for this batch to flag for refund
        const { error } = await supabaseClient
            .from('orders')
            .update({ refund_required: true })
            .eq('regional_batch_id', batchId);
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error flagging orders for refund', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error flagging orders for refund', error);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Update order fulfillment status
 */
export async function updateOrderFulfillmentStatus(orderId, fulfillmentStatus) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ 
                fulfillment_status: fulfillmentStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error updating order fulfillment status', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error updating order fulfillment status', error);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Activate a draft batch (transition from draft to active)
 */
export async function activateRegionalBatch(batchId) {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        // Use RPC function if available, otherwise direct update
        const { data, error } = await supabaseClient
            .rpc('activate_batch', { batch_id: batchId })
            .then(async (result) => {
                if (result.error) {
                    // Fallback to direct update if RPC doesn't exist
                    return await supabaseClient
                        .from('regional_batches')
                        .update({ 
                            status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', batchId)
                        .eq('status', 'draft')
                        .select()
                        .single();
                }
                return result;
            })
            .catch(async () => {
                // Fallback to direct update
                return await supabaseClient
                    .from('regional_batches')
                    .update({ 
                        status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', batchId)
                    .eq('status', 'draft')
                    .select()
                    .single();
            });
            
        if (error) {
            if (import.meta.env.DEV) {
                console.error('Error activating regional batch', error);
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error activating regional batch', error);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Check and transition batches at deadline (should be called periodically)
 * Also handles escrow release/refund based on batch outcome
 */
export async function checkAndTransitionBatchStatuses() {
    try {
        if (!supabaseClient) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        // Use RPC function if available
        const { error: rpcError } = await supabaseClient
            .rpc('check_and_transition_batch_status');
            
        if (rpcError) {
            // Fallback: manually check and update batches
            const now = new Date().toISOString();
            const { data: activeBatches, error: fetchError } = await supabaseClient
                .from('regional_batches')
                .select('*')
                .eq('status', 'active')
                .lt('cutoff_date', now);
                
            if (fetchError) {
                if (import.meta.env.DEV) {
                    console.error('Error fetching batches for transition', fetchError);
                }
                return { success: false, error: fetchError.message };
            }
            
            // Import escrow service
            const { releaseEscrowToVendor, refundEscrowToCustomers } = await import('./escrowService');
            
            // Update each batch based on quantity
            for (const batch of activeBatches || []) {
                const newStatus = (batch.current_quantity || 0) >= batch.minimum_quantity
                    ? 'successful'
                    : 'failed';
                    
                await supabaseClient
                    .from('regional_batches')
                    .update({ 
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', batch.id);
                
                // Handle escrow based on outcome
                if (newStatus === 'successful') {
                    // Release escrow to vendor
                    try {
                        await releaseEscrowToVendor(batch.id);
                    } catch (escrowError) {
                        if (import.meta.env.DEV) {
                            console.error(`Failed to release escrow for batch ${batch.id}:`, escrowError);
                        }
                        // Don't fail the status transition if escrow release fails
                    }
                } else if (newStatus === 'failed') {
                    // Refund escrow to customers
                    try {
                        await refundEscrowToCustomers(batch.id);
                    } catch (escrowError) {
                        if (import.meta.env.DEV) {
                            console.error(`Failed to refund escrow for batch ${batch.id}:`, escrowError);
                        }
                        // Don't fail the status transition if escrow refund fails
                    }
                }
            }
        } else {
            // RPC succeeded - trigger escrow operations for newly transitioned batches
            // This is handled by database triggers, but we can also call the service
            // to ensure consistency
            const { data: transitionedBatches } = await supabaseClient
                .from('regional_batches')
                .select('id, status')
                .in('status', ['successful', 'failed'])
                .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Last minute
                
            if (transitionedBatches && transitionedBatches.length > 0) {
                const { releaseEscrowToVendor, refundEscrowToCustomers } = await import('./escrowService');
                
                for (const batch of transitionedBatches) {
                    if (batch.status === 'successful') {
                        try {
                            await releaseEscrowToVendor(batch.id);
                        } catch (error) {
                            if (import.meta.env.DEV) {
                                console.error(`Failed to release escrow for batch ${batch.id}:`, error);
                            }
                        }
                    } else if (batch.status === 'failed') {
                        try {
                            await refundEscrowToCustomers(batch.id);
                        } catch (error) {
                            if (import.meta.env.DEV) {
                                console.error(`Failed to refund escrow for batch ${batch.id}:`, error);
                            }
                        }
                    }
                }
            }
        }
        
        return { success: true };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Error checking batch statuses', error);
        }
        return { success: false, error: error.message };
    }
}

/**
 * Check if a batch can accept new orders
 */
export function canJoinBatch(batch) {
    if (!batch) return false;
    
    // Cannot join if batch is not active
    if (batch.status !== 'active') {
        return false;
    }
    
    // Cannot join if deadline has passed
    if (batch.cutoffDate) {
        const cutoffDate = new Date(batch.cutoffDate);
        const now = new Date();
        if (cutoffDate < now) {
            return false;
        }
    }
    
    return true;
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
