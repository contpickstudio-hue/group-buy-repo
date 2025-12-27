import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut as supabaseSignOut, getCurrentUser } from '../services/supabaseService';
import { setStorageItem, removeStorageItem } from '../utils/storageUtils';
import { StorageKeys } from '../services/supabaseService';

export const useAuthStore = create()(
  devtools(
    immer((set, get) => ({
      user: null,
      loginMethod: null,
      selectedRoles: new Set(['customer']),
      authLoading: false,
      authError: null,

      checkAuthStatus: async () => {
        set((state) => {
          state.authLoading = true;
          state.authError = null;
        });

        try {
          const { user, error } = await getCurrentUser();
          if (error) throw error;
          
          if (user) {
            // Load user profile from metadata or create default
            const userProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              roles: user.user_metadata?.roles || ['customer'],
              helperVerified: user.user_metadata?.helperVerified || false
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            await setStorageItem(StorageKeys.user, userProfile);
          } else {
            set((state) => {
              state.user = null;
              state.loginMethod = null;
            });
            await removeStorageItem(StorageKeys.user);
          }
        } catch (error) {
          set((state) => {
            state.authError = error.message;
          });
        } finally {
          set((state) => {
            state.authLoading = false;
          });
        }
      },

      signUp: async (email, password, metadata = {}) => {
        set((state) => {
          state.authLoading = true;
          state.authError = null;
        });

        try {
          const result = await signUpWithEmail(email, password, metadata);
          // Check for user in the nested data structure: result.data.data.user
          const user = result.data?.data?.user;
          
          if (result.success && user) {
            // User is available immediately (email confirmation may be disabled)
            const userProfile = {
              id: user.id,
              email: user.email,
              name: metadata.name || user.user_metadata?.name || email.split('@')[0],
              roles: metadata.roles || user.user_metadata?.roles || ['customer'],
              helperVerified: user.user_metadata?.helperVerified || false
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            await setStorageItem(StorageKeys.user, userProfile);
            return { success: true, user: userProfile };
          }
          
          // Handle case where signup succeeds but user needs email verification
          // Supabase may return user: null when email confirmation is required
          if (result.success) {
            // Signup was successful but user needs to verify email
            return { 
              success: false, 
              error: 'Account created successfully! Please check your email for verification before signing in.' 
            };
          }
          
          return { 
            success: false, 
            error: result.error || 'Failed to create account. Please try again.' 
          };
        } catch (error) {
          const errorMessage = error?.message || 'An unexpected error occurred during sign up';
          set((state) => {
            state.authError = errorMessage;
          });
          return { success: false, error: errorMessage };
        } finally {
          set((state) => {
            state.authLoading = false;
          });
        }
      },

      signIn: async (email, password) => {
        set((state) => {
          state.authLoading = true;
          state.authError = null;
        });

        try {
          const result = await signInWithEmail(email, password);
          if (result.success && result.data?.data?.user) {
            const user = result.data.data.user;
            const userProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              roles: user.user_metadata?.roles || ['customer'],
              helperVerified: user.user_metadata?.helperVerified || false
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            await setStorageItem(StorageKeys.user, userProfile);
            return { success: true, user: userProfile };
          }
          return { 
            success: false, 
            error: result.error || 'Failed to sign in. Please check your credentials and try again.' 
          };
        } catch (error) {
          const errorMessage = error?.message || 'An unexpected error occurred during sign in';
          set((state) => {
            state.authError = errorMessage;
          });
          return { success: false, error: errorMessage };
        } finally {
          set((state) => {
            state.authLoading = false;
          });
        }
      },

      signInWithGoogle: async () => {
        set((state) => {
          state.authLoading = true;
          state.authError = null;
        });

        try {
          const result = await signInWithGoogle();
          return result;
        } catch (error) {
          set((state) => {
            state.authError = error.message;
          });
          return { success: false, error: error.message };
        } finally {
          set((state) => {
            state.authLoading = false;
          });
        }
      },

      signOut: async () => {
        try {
          await supabaseSignOut();
          set((state) => {
            state.user = null;
            state.loginMethod = null;
          });
          await removeStorageItem(StorageKeys.user);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
      },

      updateUser: (updates) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        });
      },

      clearUser: () => {
        set((state) => {
          state.user = null;
          state.loginMethod = null;
        });
      },

      setDemoUser: (user) => {
        set((state) => {
          state.user = user;
          state.loginMethod = 'demo';
        });
      },

      setSelectedRoles: (roles) => {
        set((state) => {
          state.selectedRoles = new Set(Array.isArray(roles) ? roles : [roles]);
        });
      }
    })),
    { name: 'auth-store' }
  )
);

// Hooks
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: !!state.user,
  loading: state.authLoading,
  error: state.authError
}));

export const useAuthActions = () => useAuthStore((state) => ({
  signUp: state.signUp,
  signIn: state.signIn,
  signInWithGoogle: state.signInWithGoogle,
  signOut: state.signOut,
  checkAuthStatus: state.checkAuthStatus
}));

export const useUserRoles = () => useAuthStore((state) => state.selectedRoles);

