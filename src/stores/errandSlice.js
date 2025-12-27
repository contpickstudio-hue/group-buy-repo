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
    const newErrand = {
      ...errand,
      id: errand.id || Date.now() + Math.random(),
      createdAt: errand.createdAt || new Date().toISOString(),
      status: errand.status || 'open',
      requesterEmail: errand.requester_email || errand.requesterEmail
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
            budget: newErrand.budget || 0,
            deadline: newErrand.deadline,
            status: newErrand.status,
            requester_email: newErrand.requesterEmail || newErrand.requester_email
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update with real ID from database
        if (data) {
          set((state) => {
            const index = state.errands.findIndex(e => e.id === newErrand.id);
            if (index !== -1) {
              state.errands[index] = {
                ...state.errands[index],
                id: data.id,
                createdAt: data.created_at
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
      console.warn('Failed to save errand to backend, using local storage:', error);
      try {
        const currentErrands = get().errands || [];
        await dbSaveSlice(StorageKeys.errands, currentErrands);
      } catch (storageError) {
        console.error('Failed to save errand to local storage:', storageError);
      }
      return { success: true, errand: newErrand }; // Still return success for optimistic UI
    }
  },

  updateErrand: (errandId, updates) => {
    set((state) => {
      const index = state.errands.findIndex(e => e.id === errandId);
      if (index !== -1) {
        Object.assign(state.errands[index], updates);
      }
    });
  },

  setApplications: (applications) => {
    set((state) => {
      state.applications = applications || [];
    });
  },

  addApplication: (application) => {
    set((state) => {
      const newApplication = {
        ...application,
        id: application.id || Date.now() + Math.random(),
        createdAt: application.createdAt || new Date().toISOString()
      };
      state.applications.push(newApplication);
    });
  },

  updateApplication: (applicationId, updates) => {
    set((state) => {
      const index = state.applications.findIndex(a => a.id === applicationId);
      if (index !== -1) {
        Object.assign(state.applications[index], updates);
      }
    });
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

