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

// Helper function to generate referral code locally for demo users
async function generateLocalReferralCode(userEmail) {
  // Check localStorage first
  const storageKey = `referral_code_${userEmail}`;
  const stored = await dbLoadSlice(storageKey, null);
  if (stored) {
    return stored;
  }
  
  // Generate new code
  const emailPrefix = userEmail
    .split('@')[0]
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .padEnd(3, 'X');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `${emailPrefix}${randomSuffix}`;
  
  // Save to localStorage
  await dbSaveSlice(storageKey, code);
  
  return code;
}

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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
      return;
    }
    const userEmail = user.email || user.id;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        // Demo user - try to load from localStorage
        const storageKey = `referral_code_${userEmail}`;
        const storedCode = await dbLoadSlice(storageKey, null);
        if (storedCode) {
          set((state) => {
            state.referralCode = storedCode;
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load referral code from storage:', error);
    }
  },

  // Actions
  generateReferralCode: async () => {
    const { user, loginMethod } = get();
    // Support both real and demo users
    if (!user || (!user.email && !user.id)) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const userEmail = user.email || user.id;

    set((state) => {
      state.referralLoading = true;
      state.referralError = null;
    });

    try {
      // Check if user has a Supabase session or is demo user
      let code;
      
      if (loginMethod === 'demo') {
        // Demo user - generate and store locally
        code = await generateLocalReferralCode(userEmail);
      } else {
        // Check for Supabase session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session && supabaseClient) {
          // Authenticated user - try to get/create code from Supabase
          try {
            code = await apiGetUserReferralCode(userEmail);
          } catch (error) {
            // If Supabase fails, fall back to localStorage
            console.warn('Failed to get referral code from Supabase, using localStorage:', error);
            code = await generateLocalReferralCode(userEmail);
          }
        } else {
          // No session - generate and store locally
          code = await generateLocalReferralCode(userEmail);
        }
      }
      
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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
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
    const { user } = get();
    if (!user || (!user.email && !user.id)) {
      return { success: false, error: 'User not authenticated' };
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
    if (!user || (!user.email && !user.id)) {
      return { success: false, error: 'User not authenticated' };
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

