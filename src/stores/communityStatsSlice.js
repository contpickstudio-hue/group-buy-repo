import {
  getCommunitySavings as apiGetCommunitySavings,
  getUserContribution as apiGetUserContribution,
  getTopContributors as apiGetTopContributors,
  getSavingsByRegion as apiGetSavingsByRegion,
  getCommunityStatsSummary as apiGetCommunityStatsSummary
} from '../services/communityStatsService';

export const createCommunityStatsSlice = (set, get) => ({
  // Community stats state
  communitySavings: 0,
  userContribution: 0,
  topContributors: [],
  savingsByRegion: [],
  statsSummary: null,
  loading: false,
  error: null,

  // Actions
  loadCommunityStats: async () => {
    set((state) => {
      state.loading = true;
      state.error = null;
    });

    try {
      const savings = await apiGetCommunitySavings();
      // Ensure savings is always a valid number (handle NaN, null, undefined)
      const safeSavings = typeof savings === 'number' && !isNaN(savings) ? savings : 0;
      set((state) => {
        state.communitySavings = safeSavings;
        state.loading = false;
      });
    } catch (error) {
      set((state) => {
        state.communitySavings = 0; // Set to 0 on error
        state.error = error.message;
        state.loading = false;
      });
    }
  },

  loadUserContribution: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return;
    }

    try {
      const contribution = await apiGetUserContribution(user.email);
      // Ensure contribution is always a valid number (handle NaN, null, undefined)
      const safeContribution = typeof contribution === 'number' && !isNaN(contribution) ? contribution : 0;
      set((state) => {
        state.userContribution = safeContribution;
      });
    } catch (error) {
      set((state) => {
        state.userContribution = 0; // Set to 0 on error
        state.error = error.message;
      });
    }
  },

  loadTopContributors: async (limit = 10) => {
    try {
      const contributors = await apiGetTopContributors(limit);
      set((state) => {
        state.topContributors = contributors || [];
      });
    } catch (error) {
      set((state) => {
        state.error = error.message;
      });
    }
  },

  loadSavingsByRegion: async () => {
    try {
      const regionSavings = await apiGetSavingsByRegion();
      set((state) => {
        state.savingsByRegion = regionSavings || [];
      });
    } catch (error) {
      set((state) => {
        state.error = error.message;
      });
    }
  },

  loadStatsSummary: async () => {
    set((state) => {
      state.loading = true;
    });

    try {
      const summary = await apiGetCommunityStatsSummary();
      set((state) => {
        state.statsSummary = summary;
        state.loading = false;
      });
    } catch (error) {
      set((state) => {
        state.error = error.message;
        state.loading = false;
      });
    }
  },

  refreshAllStats: async () => {
    await Promise.all([
      get().loadCommunityStats(),
      get().loadUserContribution(),
      get().loadTopContributors(),
      get().loadStatsSummary()
    ]);
  }
});

