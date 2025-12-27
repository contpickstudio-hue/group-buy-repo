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
import { supabaseClient, dbSaveSlice, dbLoadSlice, StorageKeys } from '../services/supabaseService';
import { useAuthStore } from './authStore';
import { isGuestUser } from '../utils/authUtils';

// Note: Removed generateLocalReferralCode - referrals now only persist to database for authenticated users
// This prevents trust abuse and ensures referrals are only available to registered users

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

  // Load referral code from localStorage on initialization
  loadReferralCodeFromStorage: async () => {
    // Get user and loginMethod from authStore (not from combined store)
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot access referrals
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return;
    }
    const userEmail = user.email || user.id;

    try {
      // Require valid Supabase session - referrals only for authenticated registered users
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        // No session - cannot load referral code (guests cannot access referrals)
        return;
      }
      
      // Authenticated user - referral code will be loaded from database when generateReferralCode is called
      // No need to load from localStorage as referrals now only persist to database
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to load referral code from storage:', error);
      }
    }
  },

  // Actions
  generateReferralCode: async () => {
    // Get user and loginMethod from authStore (not from combined store)
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot generate referral codes
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return { success: false, error: 'Referral codes are only available for registered users. Please sign up to generate a referral code.' };
    }
    
    const userEmail = user.email || user.id;

    set((state) => {
      state.referralLoading = true;
      state.referralError = null;
    });

    try {
      // Require valid Supabase session - referrals only for authenticated registered users
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session || !supabaseClient) {
        return { 
          success: false, 
          error: 'Referral codes require an active session. Please sign up or log in to generate a referral code.' 
        };
      }
      
      // Authenticated user - get/create code from Supabase (persists to database)
      const code = await apiGetUserReferralCode(userEmail);
      
      set((state) => {
        state.referralCode = code;
        state.referralLoading = false;
      });
      return { success: true, code };
    } catch (error) {
      const errorMessage = error?.message || 'Failed to generate referral code';
      set((state) => {
        state.referralError = errorMessage;
        state.referralLoading = false;
      });
      return { success: false, error: errorMessage };
    }
  },
  

  loadReferralStats: async () => {
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot load referral stats
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return;
    }
    const userEmail = user.email || user.id;

    set((state) => {
      state.referralLoading = true;
    });

    try {
      const stats = await apiGetReferralStats(userEmail);
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
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot load referrals
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return;
    }
    const userEmail = user.email || user.id;

    try {
      const referrals = await apiGetUserReferrals(userEmail);
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
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot load credits
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return;
    }
    const userEmail = user.email || user.id;

    try {
      const creditsData = await apiGetUserCredits(userEmail);
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
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot load credits history
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return;
    }
    const userEmail = user.email || user.id;

    try {
      const history = await apiGetCreditsHistory(userEmail, limit);
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
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot apply credits
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return { success: false, error: 'Credits are only available for registered users. Please sign up to use credits.' };
    }
    const userEmail = user.email || user.id;

    try {
      const result = await apiApplyCreditsToOrder(userEmail, orderId, amount);
      // Reload credits after applying
      get().loadCredits();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  shareReferral: (productId = null) => {
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot share referral codes
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return null;
    }
    
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
    const user = useAuthStore.getState().user;
    const loginMethod = useAuthStore.getState().loginMethod;
    
    // Restrict to registered users only - guests cannot create product referrals
    if (!user || (!user.email && !user.id) || isGuestUser(user, loginMethod)) {
      return { success: false, error: 'Product referrals are only available for registered users. Please sign up to create referrals.' };
    }
    const userEmail = user.email || user.id;

    try {
      const result = await apiCreateProductReferral(userEmail, productId);
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

