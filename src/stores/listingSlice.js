import { supabaseClient, dbSaveSlice, dbLoadSlice, StorageKeys } from '../services/supabaseService';
import { useAuthStore } from './authStore';

export const createListingSlice = (set, get) => ({
    // Listing state
    listings: [],
    listingsLoading: false,
    listingsError: null,
    
    // Actions
    setListings: (listings) => {
        set((state) => {
            state.listings = listings || [];
            state.listingsError = null;
        });
    },
    
    addListing: (listing) => {
        set((state) => {
            const newListing = {
                ...listing,
                id: listing.id || Date.now() + Math.random(),
                createdAt: listing.createdAt || new Date().toISOString(),
            };
            state.listings.push(newListing);
        });
    },
    
    updateListing: (listingId, updates) => {
        set((state) => {
            const index = state.listings.findIndex(l => l.id === listingId);
            if (index !== -1) {
                Object.assign(state.listings[index], updates);
                state.listings[index].updatedAt = new Date().toISOString();
            }
        });
    },
    
    deleteListing: (listingId) => {
        set((state) => {
            state.listings = state.listings.filter(l => l.id !== listingId);
        });
    },
    
    // Async actions
    loadListings: async () => {
        set((state) => {
            state.listingsLoading = true;
            state.listingsError = null;
        });
        
        try {
            // Import loadListingsFromBackend dynamically to avoid circular dependency
            const { loadListingsFromBackend } = await import('../services/supabaseService');
            const listings = await loadListingsFromBackend();
            
            // For demo users, also load from localStorage and merge
            const loginMethod = useAuthStore.getState().loginMethod;
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            let finalListings = listings || [];
            
            // Check if demo user or no session
            if (loginMethod === 'demo' || !session) {
                // Demo user - load from localStorage and merge
                const storedListings = await dbLoadSlice(StorageKeys.listings, []);
                if (storedListings && storedListings.length > 0) {
                    // Merge: combine backend listings with localStorage listings, avoiding duplicates
                    const backendIds = new Set(finalListings.map(l => l.id));
                    const localListings = storedListings.filter(l => !backendIds.has(l.id));
                    finalListings = [...finalListings, ...localListings];
                }
            }
            
            set((state) => {
                state.listings = finalListings || [];
                state.listingsLoading = false;
            });
            
            return { success: true, listings: finalListings };
        } catch (error) {
            set((state) => {
                state.listingsError = error.message;
                state.listingsLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    createListing: async (listingData) => {
        // Get user and loginMethod from authStore (not from combined store)
        const user = useAuthStore.getState().user;
        const loginMethod = useAuthStore.getState().loginMethod;
        
        // Check authentication - support both real and demo users
        if (!user || (!user.email && !user.id)) {
            return { success: false, error: 'User not authenticated' };
        }
        
        // Get user identifier (email or id)
        const userEmail = user.email || user.id;
        
        // Optimistically add to local state
        const newListing = {
            ...listingData,
            id: Date.now() + Math.random(),
            ownerEmail: userEmail,
            vendor: user.name || 'Vendor',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        set((state) => {
            state.listings.push(newListing);
        });

        // Try to save to backend (Supabase)
        try {
            // For demo users, skip Supabase and use localStorage
            if (loginMethod === 'demo') {
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Listing created successfully!',
                    duration: 3000
                });
                
                return { success: true, listing: newListing };
            }
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session && supabaseClient) {
                // Import createListingInBackend dynamically
                const { createListingInBackend } = await import('../services/supabaseService');
                const result = await createListingInBackend({
                    title: newListing.title,
                    description: newListing.description || '',
                    origin_location: newListing.originLocation,
                    vendor: newListing.vendor,
                    owner_email: newListing.ownerEmail,
                    image_data_url: newListing.imageDataUrl || null,
                    image_color: newListing.imageColor || null
                });

                if (!result.success) {
                    throw new Error(result.error || 'Failed to create listing');
                }
                
                // Update with real ID from database
                if (result.data) {
                    set((state) => {
                        const index = state.listings.findIndex(l => l.id === newListing.id);
                        if (index !== -1) {
                            state.listings[index] = {
                                ...state.listings[index],
                                id: result.data.id,
                                createdAt: result.data.created_at,
                                updatedAt: result.data.updated_at
                            };
                        }
                    });
                }
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Listing created successfully!',
                    duration: 3000
                });
                
                return { success: true, listing: newListing, listingId: result.data?.id };
            } else {
                // Demo user or no session - save to localStorage
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                
                // Add success notification
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Listing created successfully!',
                    duration: 3000
                });
                
                return { success: true, listing: newListing };
            }
        } catch (error) {
            // If backend save fails, try to save to localStorage as fallback
            if (import.meta.env.DEV) {
                console.warn('Failed to save listing to backend, trying local storage:', error);
            }
            try {
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                
                // Still return success but with a warning
                const { addNotification } = get();
                addNotification({
                    type: 'success',
                    message: 'Listing created successfully (saved locally)!',
                    duration: 3000
                });
                
                return { success: true, listing: newListing };
            } catch (storageError) {
                // Both backend and localStorage failed - this is a real error
                if (import.meta.env.DEV) {
                    console.error('Failed to save listing to local storage:', storageError);
                }
                
                // Remove the optimistically added listing
                set((state) => {
                    const index = state.listings.findIndex(l => l.id === newListing.id);
                    if (index !== -1) {
                        state.listings.splice(index, 1);
                    }
                });
                
                const errorMessage = error?.message || storageError?.message || 'Failed to create listing';
                return { success: false, error: errorMessage };
            }
        }
    },
    
    updateListing: async (listingId, updates) => {
        const loginMethod = useAuthStore.getState().loginMethod;
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // Update local state optimistically
        set((state) => {
            const index = state.listings.findIndex(l => l.id === listingId);
            if (index !== -1) {
                Object.assign(state.listings[index], updates);
                state.listings[index].updatedAt = new Date().toISOString();
            }
        });
        
        try {
            if (loginMethod === 'demo' || !session) {
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                return { success: true };
            }
            
            if (session && supabaseClient) {
                const { updateListingInBackend } = await import('../services/supabaseService');
                const result = await updateListingInBackend(listingId, updates);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to update listing');
                }
                
                return { success: true };
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to update listing:', error);
            }
            // Try localStorage fallback
            try {
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                return { success: true };
            } catch (storageError) {
                return { success: false, error: error.message || storageError.message };
            }
        }
    },
    
    deleteListing: async (listingId) => {
        const loginMethod = useAuthStore.getState().loginMethod;
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // Remove from local state optimistically
        set((state) => {
            state.listings = state.listings.filter(l => l.id !== listingId);
        });
        
        try {
            if (loginMethod === 'demo' || !session) {
                const currentListings = get().listings || [];
                await dbSaveSlice(StorageKeys.listings, currentListings);
                return { success: true };
            }
            
            if (session && supabaseClient) {
                const { deleteListingInBackend } = await import('../services/supabaseService');
                const result = await deleteListingInBackend(listingId);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to delete listing');
                }
                
                return { success: true };
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to delete listing:', error);
            }
            return { success: false, error: error.message };
        }
    },
    
    // Computed getters
    getListingById: (listingId) => {
        const { listings } = get();
        return listings.find(l => l.id === listingId);
    },
    
    getListingsByOwner: (ownerEmail) => {
        const { listings } = get();
        return listings.filter(l => l.ownerEmail === ownerEmail);
    }
});

