import { supabaseClient, dbSaveSlice, dbLoadSlice, StorageKeys } from '../services/supabaseService';
import { useAuthStore } from './authStore';

export const createRegionalBatchSlice = (set, get) => ({
    // Regional batch state
    regionalBatches: [],
    batchesByListing: {}, // Map of listingId -> batches[]
    batchesLoading: false,
    batchesError: null,
    
    // Actions
    setRegionalBatches: (batches) => {
        set((state) => {
            state.regionalBatches = batches || [];
            state.batchesError = null;
            // Update batchesByListing index
            const index = {};
            (batches || []).forEach(batch => {
                if (!index[batch.listingId]) {
                    index[batch.listingId] = [];
                }
                index[batch.listingId].push(batch);
            });
            state.batchesByListing = index;
        });
    },
    
    addRegionalBatch: (batch) => {
        set((state) => {
            const newBatch = {
                ...batch,
                id: batch.id || Date.now() + Math.random(),
                createdAt: batch.createdAt || new Date().toISOString(),
                updatedAt: batch.updatedAt || new Date().toISOString(),
            currentQuantity: batch.currentQuantity || 0,
            status: batch.status || 'draft'
            };
            state.regionalBatches.push(newBatch);
            
            // Update batchesByListing index
            if (!state.batchesByListing[newBatch.listingId]) {
                state.batchesByListing[newBatch.listingId] = [];
            }
            state.batchesByListing[newBatch.listingId].push(newBatch);
        });
    },
    
    updateRegionalBatch: (batchId, updates) => {
        set((state) => {
            const index = state.regionalBatches.findIndex(b => b.id === batchId);
            if (index !== -1) {
                Object.assign(state.regionalBatches[index], updates);
                state.regionalBatches[index].updatedAt = new Date().toISOString();
                
                // Update batchesByListing index
                const batch = state.regionalBatches[index];
                const listingBatches = state.batchesByListing[batch.listingId] || [];
                const listingIndex = listingBatches.findIndex(b => b.id === batchId);
                if (listingIndex !== -1) {
                    Object.assign(listingBatches[listingIndex], updates);
                    listingBatches[listingIndex].updatedAt = new Date().toISOString();
                }
            }
        });
    },
    
    deleteRegionalBatch: (batchId) => {
        set((state) => {
            const batch = state.regionalBatches.find(b => b.id === batchId);
            if (batch) {
                state.regionalBatches = state.regionalBatches.filter(b => b.id !== batchId);
                
                // Update batchesByListing index
                if (state.batchesByListing[batch.listingId]) {
                    state.batchesByListing[batch.listingId] = 
                        state.batchesByListing[batch.listingId].filter(b => b.id !== batchId);
                }
            }
        });
    },
    
    // Async actions
    loadBatchesForListing: async (listingId) => {
        set((state) => {
            state.batchesLoading = true;
            state.batchesError = null;
        });
        
        try {
            const { loadRegionalBatchesFromBackend } = await import('../services/supabaseService');
            const result = await loadRegionalBatchesFromBackend(listingId);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to load regional batches');
            }
            
            const batches = result.batches || [];
            
            // Update state
            set((state) => {
                // Remove old batches for this listing
                state.regionalBatches = state.regionalBatches.filter(b => b.listingId !== listingId);
                // Add new batches
                state.regionalBatches.push(...batches);
                
                // Update batchesByListing index
                state.batchesByListing[listingId] = batches;
                state.batchesLoading = false;
            });
            
            return { success: true, batches };
        } catch (error) {
            set((state) => {
                state.batchesError = error.message;
                state.batchesLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    loadAllBatches: async () => {
        set((state) => {
            state.batchesLoading = true;
            state.batchesError = null;
        });
        
        try {
            const { loadAllRegionalBatchesFromBackend } = await import('../services/supabaseService');
            const result = await loadAllRegionalBatchesFromBackend();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to load regional batches');
            }
            
            const batches = result.batches || [];
            
            // Build batchesByListing index
            const index = {};
            batches.forEach(batch => {
                if (!index[batch.listingId]) {
                    index[batch.listingId] = [];
                }
                index[batch.listingId].push(batch);
            });
            
            set((state) => {
                state.regionalBatches = batches;
                state.batchesByListing = index;
                state.batchesLoading = false;
            });
            
            return { success: true, batches };
        } catch (error) {
            set((state) => {
                state.batchesError = error.message;
                state.batchesLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    createRegionalBatch: async (listingId, batchData) => {
        const user = useAuthStore.getState().user;
        const loginMethod = useAuthStore.getState().loginMethod;
        
        if (!user || (!user.email && !user.id)) {
            return { success: false, error: 'User not authenticated' };
        }
        
        // Optimistically add to local state
        const newBatch = {
            ...batchData,
            id: Date.now() + Math.random(),
            listingId,
            currentQuantity: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        set((state) => {
            state.regionalBatches.push(newBatch);
            if (!state.batchesByListing[listingId]) {
                state.batchesByListing[listingId] = [];
            }
            state.batchesByListing[listingId].push(newBatch);
        });
        
        try {
            if (loginMethod === 'demo') {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true, batch: newBatch };
            }
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session && supabaseClient) {
                const { createRegionalBatchInBackend } = await import('../services/supabaseService');
                const result = await createRegionalBatchInBackend({
                    listing_id: listingId,
                    region: batchData.region,
                    price: batchData.price,
                    minimum_quantity: batchData.minimumQuantity,
                    cutoff_date: batchData.cutoffDate,
                    delivery_method: batchData.deliveryMethod,
                    status: 'draft'
                });
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create regional batch');
                }
                
                // Update with real ID from database
                if (result.data) {
                    set((state) => {
                        const index = state.regionalBatches.findIndex(b => b.id === newBatch.id);
                        if (index !== -1) {
                            state.regionalBatches[index] = {
                                ...state.regionalBatches[index],
                                id: result.data.id,
                                createdAt: result.data.created_at,
                                updatedAt: result.data.updated_at
                            };
                            
                            // Update batchesByListing
                            const listingBatches = state.batchesByListing[listingId] || [];
                            const listingIndex = listingBatches.findIndex(b => b.id === newBatch.id);
                            if (listingIndex !== -1) {
                                listingBatches[listingIndex] = state.regionalBatches[index];
                            }
                        }
                    });
                }
                
                return { success: true, batch: newBatch, batchId: result.data?.id };
            } else {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true, batch: newBatch };
            }
        } catch (error) {
            console.warn('Failed to save batch to backend, trying local storage:', error);
            try {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true, batch: newBatch };
            } catch (storageError) {
                console.error('Failed to save batch to local storage:', storageError);
                
                // Remove optimistically added batch
                set((state) => {
                    state.regionalBatches = state.regionalBatches.filter(b => b.id !== newBatch.id);
                    if (state.batchesByListing[listingId]) {
                        state.batchesByListing[listingId] = 
                            state.batchesByListing[listingId].filter(b => b.id !== newBatch.id);
                    }
                });
                
                const errorMessage = error?.message || storageError?.message || 'Failed to create regional batch';
                return { success: false, error: errorMessage };
            }
        }
    },
    
    updateRegionalBatchStatus: async (batchId, status) => {
        const loginMethod = useAuthStore.getState().loginMethod;
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // Update local state optimistically
        set((state) => {
            const index = state.regionalBatches.findIndex(b => b.id === batchId);
            if (index !== -1) {
                state.regionalBatches[index].status = status;
                state.regionalBatches[index].updatedAt = new Date().toISOString();
                
                // Update batchesByListing
                const batch = state.regionalBatches[index];
                const listingBatches = state.batchesByListing[batch.listingId] || [];
                const listingIndex = listingBatches.findIndex(b => b.id === batchId);
                if (listingIndex !== -1) {
                    listingBatches[listingIndex].status = status;
                    listingBatches[listingIndex].updatedAt = new Date().toISOString();
                }
            }
        });
        
        try {
            if (loginMethod === 'demo' || !session) {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true };
            }
            
            if (session && supabaseClient) {
                const { updateRegionalBatchStatusInBackend } = await import('../services/supabaseService');
                const result = await updateRegionalBatchStatusInBackend(batchId, status);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to update batch status');
                }
                
                // Notify users about batch status change
                if (status === 'successful' || status === 'failed') {
                    const batch = get().getBatchById(batchId);
                    const appStore = get();
                    const listing = appStore.listings?.find(l => l.id === batch?.listingId);
                    const batchOrders = appStore.orders?.filter(o => String(o.regionalBatchId) === String(batchId)) || [];
                    
                    // Notify vendor and buyers using notification service (targeted per user)
                    const { createNotification } = await import('../services/notificationService');
                    
                    // Notify vendor
                    if (listing?.ownerEmail) {
                        await createNotification(
                            listing.ownerEmail,
                            status === 'successful' ? 'success' : 'warning',
                            `"${listing.title}" in ${batch.region} ${status === 'successful' ? 'reached its target!' : 'did not reach its target.'}`,
                            status === 'successful' ? 'Group Buy Successful!' : 'Group Buy Failed',
                            { type: 'group_buy_status', listingId: listing.id, batchId, status }
                        );
                    }
                    
                    // Notify buyers
                    for (const order of batchOrders) {
                        if (order.customerEmail && order.customerEmail !== listing?.ownerEmail) {
                            await createNotification(
                                order.customerEmail,
                                status === 'successful' ? 'success' : 'warning',
                                `"${listing.title}" in ${batch.region} ${status === 'successful' ? 'succeeded! Your order will be processed.' : 'failed. You will be refunded.'}`,
                                status === 'successful' ? 'Group Buy Successful!' : 'Group Buy Failed',
                                { type: 'group_buy_status', listingId: listing.id, batchId, orderId: order.id, status }
                            );
                        }
                    }
                }
                
                return { success: true };
            }
        } catch (error) {
            console.error('Failed to update batch status:', error);
            try {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true };
            } catch (storageError) {
                return { success: false, error: error.message || storageError.message };
            }
        }
    },
    
    activateRegionalBatch: async (batchId) => {
        const loginMethod = useAuthStore.getState().loginMethod;
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // Check if batch is in draft status
        const batch = get().getBatchById(batchId);
        if (!batch) {
            return { success: false, error: 'Batch not found' };
        }
        if (batch.status !== 'draft') {
            return { success: false, error: `Cannot activate batch. Current status: ${batch.status}` };
        }
        
        // Update local state optimistically
        set((state) => {
            const index = state.regionalBatches.findIndex(b => b.id === batchId);
            if (index !== -1) {
                state.regionalBatches[index].status = 'active';
                state.regionalBatches[index].updatedAt = new Date().toISOString();
                
                // Update batchesByListing
                const batch = state.regionalBatches[index];
                const listingBatches = state.batchesByListing[batch.listingId] || [];
                const listingIndex = listingBatches.findIndex(b => b.id === batchId);
                if (listingIndex !== -1) {
                    listingBatches[listingIndex].status = 'active';
                    listingBatches[listingIndex].updatedAt = new Date().toISOString();
                }
            }
        });
        
        try {
            if (loginMethod === 'demo' || !session) {
                const currentBatches = get().regionalBatches || [];
                await dbSaveSlice(StorageKeys.regionalBatches, currentBatches);
                return { success: true };
            }
            
            if (session && supabaseClient) {
                const { activateRegionalBatch: activateBatch } = await import('../services/supabaseService');
                const result = await activateBatch(batchId);
                
                if (!result.success) {
                    // Revert optimistic update
                    set((state) => {
                        const index = state.regionalBatches.findIndex(b => b.id === batchId);
                        if (index !== -1) {
                            state.regionalBatches[index].status = 'draft';
                        }
                    });
                    throw new Error(result.error || 'Failed to activate batch');
                }
                
                return { success: true };
            }
        } catch (error) {
            console.error('Failed to activate batch:', error);
            // Revert optimistic update
            set((state) => {
                const index = state.regionalBatches.findIndex(b => b.id === batchId);
                if (index !== -1) {
                    state.regionalBatches[index].status = 'draft';
                }
            });
            return { success: false, error: error.message };
        }
    },
    
    checkAndTransitionBatchStatuses: async () => {
        try {
            const { checkAndTransitionBatchStatuses: checkStatuses } = await import('../services/supabaseService');
            const result = await checkStatuses();
            
            if (result.success) {
                // Reload batches to get updated statuses
                const { loadAllBatches } = get();
                await loadAllBatches();
            }
            
            return result;
        } catch (error) {
            console.error('Failed to check batch statuses:', error);
            return { success: false, error: error.message };
        }
    },
    
    cancelRegionalBatch: async (batchId) => {
        // First update status to cancelled
        const statusResult = await get().updateRegionalBatchStatus(batchId, 'cancelled');
        
        if (!statusResult.success) {
            return statusResult;
        }
        
        // Refund escrow funds to customers
        try {
            const { refundEscrowToCustomers } = await import('../services/escrowService');
            const refundResult = await refundEscrowToCustomers(batchId);
            
            if (refundResult.success) {
                console.log(`Refunded ${refundResult.refunded} orders for cancelled batch ${batchId}`);
            } else {
                console.warn('Some refunds failed:', refundResult.errors);
            }
        } catch (error) {
            console.warn('Failed to refund escrow for cancelled batch:', error);
            // Don't fail the cancellation if refund fails - it will be retried
        }
        
        return { success: true };
    },
    
    aggregateBatchQuantity: async (batchId) => {
        try {
            const { getBatchQuantityFromBackend } = await import('../services/supabaseService');
            const result = await getBatchQuantityFromBackend(batchId);
            
            if (result.success && result.quantity !== undefined) {
                set((state) => {
                    const index = state.regionalBatches.findIndex(b => b.id === batchId);
                    if (index !== -1) {
                        state.regionalBatches[index].currentQuantity = result.quantity;
                        
                        // Update batchesByListing
                        const batch = state.regionalBatches[index];
                        const listingBatches = state.batchesByListing[batch.listingId] || [];
                        const listingIndex = listingBatches.findIndex(b => b.id === batchId);
                        if (listingIndex !== -1) {
                            listingBatches[listingIndex].currentQuantity = result.quantity;
                        }
                    }
                });
            }
            
            return result;
        } catch (error) {
            console.error('Failed to aggregate batch quantity:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Computed getters
    getBatchById: (batchId) => {
        const { regionalBatches } = get();
        return regionalBatches.find(b => b.id === batchId);
    },
    
    getBatchesByListing: (listingId) => {
        const { batchesByListing } = get();
        return batchesByListing[listingId] || [];
    },
    
    getBatchProgress: (batchId) => {
        const batch = get().getBatchById(batchId);
        if (!batch) return 0;
        if (batch.minimumQuantity === 0) return 100;
        return Math.min((batch.currentQuantity / batch.minimumQuantity) * 100, 100);
    },
    
    getBatchStatus: (batchId) => {
        const batch = get().getBatchById(batchId);
        if (!batch) return 'unknown';
        return batch.status;
    }
});

