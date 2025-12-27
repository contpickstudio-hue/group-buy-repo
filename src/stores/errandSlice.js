import { loadErrandsFromBackend } from '../services/supabaseService';

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

  addErrand: (errand) => {
    set((state) => {
      const newErrand = {
        ...errand,
        id: errand.id || Date.now() + Math.random(),
        createdAt: errand.createdAt || new Date().toISOString(),
        status: errand.status || 'open',
        currentQuantity: 0
      };
      state.errands.push(newErrand);
    });
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
      set((state) => {
        state.errands = result.errands || [];
        state.applications = result.applications || [];
        state.messages = result.messages || [];
        state.errandsLoading = false;
      });
      return { success: true, ...result };
    } catch (error) {
      set((state) => {
        state.errandsError = error.message;
        state.errandsLoading = false;
      });
      return { success: false, error: error.message };
    }
  }
});

