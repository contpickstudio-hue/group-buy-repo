import {
  generateReferralCode as apiGenerateReferralCode,
  getUserReferralCode as apiGetUserReferralCode,
  createReferralLink,
  processReferralSignup as apiProcessReferralSignup,
  processReferralOrder as apiProcessReferralOrder,
  getUserReferrals as apiGetUserReferrals,
  getReferralStats as apiGetReferralStats,
  createProductReferral as apiCreateProductReferral
} from '../services/referralService';
import {
  getUserCredits as apiGetUserCredits,
  applyCreditsToOrder as apiApplyCreditsToOrder,
  getCreditsHistory as apiGetCreditsHistory
} from '../services/creditsService';

export const createReferralSlice = (set, get) => ({
  // Referral state
  referralCode: null,
  referralStats: {
    totalReferrals: 0,
    successfulReferrals: 0,
    totalCreditsEarned: 0,
    pendingReferrals: 0
  },
  referrals: [],
  credits: {
    balance: 0,
    credits: []
  },
  creditsHistory: [],
  referralLoading: false,
  referralError: null,

  // Actions
  generateReferralCode: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    set((state) => {
      state.referralLoading = true;
      state.referralError = null;
    });

    try {
      const code = await apiGetUserReferralCode(user.email);
      set((state) => {
        state.referralCode = code;
        state.referralLoading = false;
      });
      return { success: true, code };
    } catch (error) {
      set((state) => {
        state.referralError = error.message;
        state.referralLoading = false;
      });
      return { success: false, error: error.message };
    }
  },

  loadReferralStats: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return;
    }

    set((state) => {
      state.referralLoading = true;
    });

    try {
      const stats = await apiGetReferralStats(user.email);
      set((state) => {
        state.referralStats = stats;
        state.referralLoading = false;
      });
    } catch (error) {
      set((state) => {
        state.referralError = error.message;
        state.referralLoading = false;
      });
    }
  },

  loadReferrals: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return;
    }

    try {
      const referrals = await apiGetUserReferrals(user.email);
      set((state) => {
        state.referrals = referrals || [];
      });
    } catch (error) {
      set((state) => {
        state.referralError = error.message;
      });
    }
  },

  loadCredits: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return;
    }

    try {
      const creditsData = await apiGetUserCredits(user.email);
      set((state) => {
        state.credits = creditsData;
      });
    } catch (error) {
      set((state) => {
        state.referralError = error.message;
      });
    }
  },

  loadCreditsHistory: async (limit = 50) => {
    const { user } = get();
    if (!user || !user.email) {
      return;
    }

    try {
      const history = await apiGetCreditsHistory(user.email, limit);
      set((state) => {
        state.creditsHistory = history || [];
      });
    } catch (error) {
      set((state) => {
        state.referralError = error.message;
      });
    }
  },

  applyCredits: async (orderId, amount) => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await apiApplyCreditsToOrder(user.email, orderId, amount);
      // Reload credits after applying
      get().loadCredits();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  shareReferral: (productId = null) => {
    const { referralCode } = get();
    if (!referralCode) {
      // Generate code if not exists
      get().generateReferralCode().then((result) => {
        if (result.success) {
          const link = createReferralLink(result.code, productId);
          return link;
        }
      });
      return null;
    }

    return createReferralLink(referralCode, productId);
  },

  processReferralSignup: async (referralCode, newUserEmail) => {
    try {
      const result = await apiProcessReferralSignup(referralCode, newUserEmail);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  processReferralOrder: async (referredUserEmail, orderId) => {
    try {
      const result = await apiProcessReferralOrder(referredUserEmail, orderId);
      // Reload stats after processing
      get().loadReferralStats();
      get().loadCredits();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createProductReferral: async (productId) => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await apiCreateProductReferral(user.email, productId);
      if (result.success) {
        set((state) => {
          state.referralCode = result.referralCode;
        });
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

