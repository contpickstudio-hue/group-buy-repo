import { loadErrandsFromBackend, supabaseClient, dbSaveSlice, dbLoadSlice, StorageKeys } from '../services/supabaseService';
import { useAuthStore } from './authStore';

export const createErrandSlice = (set, get) => ({
  // Errand state
  errands: [],
  applications: [],
  messages: [],
  errandsLoading: false,
  errandsError: null,

  setErrands: (errands) => {
    set((state) => {
      state.errands = errands || [];
      state.errandsError = null;
    });
  },

  addErrand: async (errand) => {
    // Get login method from authStore (not from combined store)
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Optimistically add to local state
    // Ensure budget is properly preserved (handle 0 as valid value)
    const budgetValue = errand.budget !== null && errand.budget !== undefined
      ? (typeof errand.budget === 'number' ? errand.budget : parseFloat(errand.budget) || 0)
      : 0;
    
    const newErrand = {
      ...errand,
      id: errand.id || Date.now() + Math.random(),
      createdAt: errand.createdAt || new Date().toISOString(),
      status: errand.status || 'open',
      requesterEmail: errand.requester_email || errand.requesterEmail,
      budget: budgetValue // Explicitly preserve budget
    };
    
    set((state) => {
      state.errands.push(newErrand);
    });

    // Try to save to backend (Supabase)
    try {
      // For demo users, skip Supabase and use localStorage
      if (loginMethod === 'demo') {
        const currentErrands = get().errands || [];
        await dbSaveSlice(StorageKeys.errands, currentErrands);
        return { success: true, errand: newErrand };
      }
      
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session && supabaseClient) {
        // User is authenticated - save to Supabase
        const { data, error } = await supabaseClient
          .from('errands')
          .insert({
            title: newErrand.title,
            description: newErrand.description,
            region: newErrand.region,
            budget: newErrand.budget !== null && newErrand.budget !== undefined 
              ? (typeof newErrand.budget === 'number' ? newErrand.budget : parseFloat(newErrand.budget) || 0)
              : 0,
            deadline: newErrand.deadline,
            status: newErrand.status,
            requester_email: newErrand.requesterEmail || newErrand.requester_email
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update with real ID and data from database
        if (data) {
          set((state) => {
            const index = state.errands.findIndex(e => e.id === newErrand.id);
            if (index !== -1) {
              state.errands[index] = {
                ...state.errands[index],
                id: data.id,
                createdAt: data.created_at,
                // Preserve budget from database if available, otherwise keep optimistic value
                budget: data.budget !== null && data.budget !== undefined 
                  ? (typeof data.budget === 'number' ? data.budget : parseFloat(data.budget) || 0)
                  : (state.errands[index].budget !== null && state.errands[index].budget !== undefined 
                      ? state.errands[index].budget 
                      : 0)
              };
            }
          });
        }
        return { success: true, errand: newErrand };
      } else {
        // Demo user or no session - save to localStorage
        const currentErrands = get().errands || [];
        await dbSaveSlice(StorageKeys.errands, currentErrands);
        return { success: true, errand: newErrand };
      }
    } catch (error) {
      // If backend save fails, still keep it in local state and localStorage
      if (import.meta.env.DEV) {
        console.warn('Failed to save errand to backend, using local storage:', error);
      }
      try {
        const currentErrands = get().errands || [];
        await dbSaveSlice(StorageKeys.errands, currentErrands);
      } catch (storageError) {
        if (import.meta.env.DEV) {
          console.error('Failed to save errand to local storage:', storageError);
        }
      }
      return { success: true, errand: newErrand }; // Still return success for optimistic UI
    }
  },

  updateErrand: (errandId, updates) => {
    set((state) => {
      const index = state.errands.findIndex(e => e.id === errandId);
      if (index !== -1) {
        Object.assign(state.errands[index], updates);
        // Update status based on completion confirmations
        if (updates.requesterConfirmedCompletion !== undefined || updates.helperConfirmedCompletion !== undefined) {
          const errand = state.errands[index];
          if (errand.requesterConfirmedCompletion && errand.helperConfirmedCompletion) {
            errand.status = 'completed';
            if (!errand.completedAt) {
              errand.completedAt = new Date().toISOString();
            }
          } else if (errand.requesterConfirmedCompletion || errand.helperConfirmedCompletion) {
            errand.status = 'awaiting_confirmation';
          }
        }
      }
    });
  },

  setApplications: (applications) => {
    set((state) => {
      state.applications = applications || [];
    });
  },

  addApplication: async (errandId, helperEmail, offerAmount = null, message = null) => {
    const { applyToErrand } = await import('../services/errandService');
    const result = await applyToErrand(errandId, helperEmail, offerAmount, message);
    
    if (result.success && result.application) {
      set((state) => {
        state.applications.push(result.application);
      });
    }
    
    return result;
  },

  updateApplication: (applicationId, updates) => {
    set((state) => {
      const index = state.applications.findIndex(a => a.id === applicationId);
      if (index !== -1) {
        Object.assign(state.applications[index], updates);
      }
    });
  },

  acceptHelperApplication: async (errandId, applicationId, requesterEmail) => {
    const { acceptHelperApplication: acceptHelper } = await import('../services/errandService');
    const result = await acceptHelper(errandId, applicationId, requesterEmail);
    
    if (result.success) {
      // Update application status
      set((state) => {
        state.applications.forEach(app => {
          if (app.errandId === errandId) {
            if (app.id === applicationId) {
              app.status = 'accepted';
            } else {
              app.status = 'rejected';
            }
          }
        });
      });
      
      // Update errand status
      set((state) => {
        const errand = state.errands.find(e => e.id === errandId);
        if (errand) {
          const application = state.applications.find(a => a.id === applicationId);
          if (application) {
            errand.assignedHelperEmail = application.helperEmail;
            errand.status = 'assigned';
          }
        }
      });
    }
    
    return result;
  },

  confirmErrandCompletion: async (errandId, userEmail, isRequester) => {
    const { confirmErrandCompletion: confirmCompletion } = await import('../services/errandService');
    const result = await confirmCompletion(errandId, userEmail, isRequester);
    
    if (result.success) {
      // Update errand confirmation status
      set((state) => {
        const errand = state.errands.find(e => e.id === errandId);
        if (errand) {
          if (isRequester) {
            errand.requesterConfirmedCompletion = true;
          } else {
            errand.helperConfirmedCompletion = true;
          }
          
          if (result.bothConfirmed) {
            errand.status = 'completed';
            errand.completedAt = new Date().toISOString();
            // Payment release is handled in the service
          } else {
            errand.status = 'awaiting_confirmation';
          }
        }
      });
    }
    
    return result;
  },

  rateHelper: async (errandId, raterEmail, rating, comment = null) => {
    const { rateHelper: rateHelperService } = await import('../services/errandService');
    return await rateHelperService(errandId, raterEmail, rating, comment);
  },

  setMessages: (messages) => {
    set((state) => {
      state.messages = messages || [];
    });
  },

  addMessage: (message) => {
    set((state) => {
      const newMessage = {
        ...message,
        id: message.id || Date.now() + Math.random(),
        createdAt: message.createdAt || new Date().toISOString()
      };
      state.messages.push(newMessage);
    });
  },

  loadErrands: async () => {
    set((state) => {
      state.errandsLoading = true;
      state.errandsError = null;
    });

    try {
      const result = await loadErrandsFromBackend();
      
      // For demo users, also load from localStorage and merge
      const loginMethod = useAuthStore.getState().loginMethod;
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      let finalErrands = result.errands || [];
      
      // Check if demo user or no session
      if (loginMethod === 'demo' || !session) {
        // Demo user - load from localStorage and merge
        const storedErrands = await dbLoadSlice(StorageKeys.errands, []);
        if (storedErrands && storedErrands.length > 0) {
          // Merge: combine backend errands with localStorage errands, avoiding duplicates
          const backendIds = new Set(finalErrands.map(e => e.id));
          const localErrands = storedErrands.filter(e => !backendIds.has(e.id));
          finalErrands = [...finalErrands, ...localErrands];
        }
      }
      
      set((state) => {
        state.errands = finalErrands;
        state.applications = result.applications || [];
        state.messages = result.messages || [];
        state.errandsLoading = false;
      });
      return { success: true, errands: finalErrands, ...result };
    } catch (error) {
      set((state) => {
        state.errandsError = error.message;
        state.errandsLoading = false;
      });
      return { success: false, error: error.message };
    }
  }
});

