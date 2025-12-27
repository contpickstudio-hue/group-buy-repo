import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut as supabaseSignOut, getCurrentUser } from '../services/supabaseService';
import { setStorageItem, removeStorageItem, getStorageItem } from '../utils/storageUtils';
import { StorageKeys } from '../services/supabaseService';

export const useAuthStore = create()(
  devtools(
    immer((set, get) => ({
      user: null,
      loginMethod: null,
      selectedRoles: new Set(['customer']),
      authLoading: false,
      authError: null,
      isInitialized: false, // Track if auth state has been restored from storage

      /**
       * Initialize auth state from storage on app load
       * This should be called once when the app starts
       */
      initializeAuth: async () => {
        if (get().isInitialized) {
          return; // Already initialized
        }

        set((state) => {
          state.authLoading = true;
        });

        try {
          // Load stored auth state
          const storedUser = await getStorageItem(StorageKeys.user);
          const storedLoginMethod = await getStorageItem(StorageKeys.loginMethod);

          if (storedUser && storedLoginMethod) {
            // Restore user and login method from storage
            set((state) => {
              state.user = storedUser;
              state.loginMethod = storedLoginMethod;
            });

            // If it's a real user (not demo), validate session with Supabase
            if (storedLoginMethod !== 'demo') {
              // Validate session is still valid
              const { user: supabaseUser, error } = await getCurrentUser();
              
              if (error || !supabaseUser) {
                // Session is invalid - clear stored auth
                set((state) => {
                  state.user = null;
                  state.loginMethod = null;
                });
                await removeStorageItem(StorageKeys.user);
                await removeStorageItem(StorageKeys.loginMethod);
              } else {
                // Session is valid - update user profile from Supabase
                // Only registered users can have roles - guest users never get roles
                const userProfile = {
                  id: supabaseUser.id,
                  email: supabaseUser.email,
                  name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                  roles: Array.isArray(supabaseUser.user_metadata?.roles) ? supabaseUser.user_metadata.roles : [],
                  helperVerified: supabaseUser.user_metadata?.helperVerified === true
                };
                
                set((state) => {
                  state.user = userProfile;
                  state.loginMethod = storedLoginMethod; // Preserve login method (email/google)
                });
                
                // Update stored user profile
                await setStorageItem(StorageKeys.user, userProfile);
              }
            }
            // For demo users, just restore from storage - no Supabase validation needed
          } else if (storedUser && !storedLoginMethod) {
            // Legacy: user exists but no loginMethod - treat as demo if email matches
            if (storedUser.email === 'test@demo.com') {
              set((state) => {
                state.user = storedUser;
                state.loginMethod = 'demo';
              });
              await setStorageItem(StorageKeys.loginMethod, 'demo');
            } else {
              // Unknown user - clear it
              await removeStorageItem(StorageKeys.user);
            }
          } else {
            // No stored auth - check Supabase for active session
            const { user: supabaseUser, error } = await getCurrentUser();
            
            if (!error && supabaseUser) {
              // Active Supabase session found
              // Only registered users can have roles - get from database, no defaults
              const userProfile = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                roles: Array.isArray(supabaseUser.user_metadata?.roles) ? supabaseUser.user_metadata.roles : [],
                helperVerified: supabaseUser.user_metadata?.helperVerified === true
              };
              
              set((state) => {
                state.user = userProfile;
                state.loginMethod = 'email'; // Default to email if unknown
              });
              
              await setStorageItem(StorageKeys.user, userProfile);
              await setStorageItem(StorageKeys.loginMethod, 'email');
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth from storage:', error);
          // On error, clear potentially corrupted state
          await removeStorageItem(StorageKeys.user);
          await removeStorageItem(StorageKeys.loginMethod);
        } finally {
          set((state) => {
            state.authLoading = false;
            state.isInitialized = true;
          });
        }
      },

      checkAuthStatus: async () => {
        set((state) => {
          state.authLoading = true;
          state.authError = null;
        });

        try {
          // Don't overwrite demo users - check if current user is demo first
          const currentState = get();
          if (currentState.loginMethod === 'demo' && currentState.user) {
            // Demo user - don't check Supabase, just ensure it's persisted
            await setStorageItem(StorageKeys.user, currentState.user);
            set((state) => {
              state.authLoading = false;
            });
            return;
          }

          const { user, error } = await getCurrentUser();
          if (error) throw error;
          
          if (user) {
            // Load user profile from metadata - roles come from database, no defaults
            const userProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              roles: Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : [],
              helperVerified: user.user_metadata?.helperVerified === true
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            // Persist both user and login method
            await setStorageItem(StorageKeys.user, userProfile);
            await setStorageItem(StorageKeys.loginMethod, 'email');
          } else {
            // Only clear if not a demo user
            if (currentState.loginMethod !== 'demo') {
              set((state) => {
                state.user = null;
                state.loginMethod = null;
              });
              await removeStorageItem(StorageKeys.user);
              await removeStorageItem(StorageKeys.loginMethod);
            }
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
            // Roles must come from database, not defaults - only use metadata if it exists
            const userProfile = {
              id: user.id,
              email: user.email,
              name: metadata.name || user.user_metadata?.name || email.split('@')[0],
              roles: Array.isArray(metadata.roles) ? metadata.roles : (Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
              helperVerified: user.user_metadata?.helperVerified === true
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            // Persist both user and login method
            await setStorageItem(StorageKeys.user, userProfile);
            await setStorageItem(StorageKeys.loginMethod, 'email');
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
            // Roles must come from database, no defaults
            const userProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              roles: Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : [],
              helperVerified: user.user_metadata?.helperVerified === true
            };
            
            set((state) => {
              state.user = userProfile;
              state.loginMethod = 'email';
            });
            
            // Persist both user and login method
            await setStorageItem(StorageKeys.user, userProfile);
            await setStorageItem(StorageKeys.loginMethod, 'email');
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
          // Google OAuth will redirect, so if successful, we may not get here
          // But if there's an error, we need to handle it
          if (!result.success) {
            const errorMessage = result.error || 'Google sign in failed. Please check if Google OAuth is enabled in your Supabase project.';
            set((state) => {
              state.authError = errorMessage;
            });
            return { success: false, error: errorMessage };
          }
          
          // If we get here, Google sign-in was successful
          // The session will be restored on next page load via initializeAuth
          // But we can also try to get the user immediately
          try {
            const { user: supabaseUser } = await getCurrentUser();
            if (supabaseUser) {
              // Roles must come from database, no defaults
              const userProfile = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                roles: Array.isArray(supabaseUser.user_metadata?.roles) ? supabaseUser.user_metadata.roles : [],
                helperVerified: supabaseUser.user_metadata?.helperVerified === true
              };
              
              set((state) => {
                state.user = userProfile;
                state.loginMethod = 'google';
              });
              
              // Persist both user and login method
              await setStorageItem(StorageKeys.user, userProfile);
              await setStorageItem(StorageKeys.loginMethod, 'google');
            }
          } catch (err) {
            // User will be restored on redirect/refresh
            console.warn('Could not get user immediately after Google sign-in:', err);
          }
          
          return result;
        } catch (error) {
          const errorMessage = error?.message || error?.msg || 'Google sign in failed. Please check if Google OAuth is enabled in your Supabase project.';
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

      signOut: async () => {
        try {
          const currentState = get();
          
          // Clear state first
          set((state) => {
            state.user = null;
            state.loginMethod = null;
            state.authError = null;
          });
          
          // Clear all auth-related storage
          await Promise.all([
            removeStorageItem(StorageKeys.user),
            removeStorageItem(StorageKeys.loginMethod)
          ]);
          
          // Only call Supabase signOut if not a demo user
          if (currentState.loginMethod !== 'demo') {
            try {
              await supabaseSignOut();
            } catch (supabaseError) {
              // Even if Supabase signOut fails, we've cleared local state
              console.warn('Supabase signOut failed, but local state cleared:', supabaseError);
            }
          }
          
          return { success: true };
        } catch (error) {
          // Ensure state is cleared even on error
          set((state) => {
            state.user = null;
            state.loginMethod = null;
          });
          await removeStorageItem(StorageKeys.user).catch(() => {});
          await removeStorageItem(StorageKeys.loginMethod).catch(() => {});
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

      clearUser: async () => {
        set((state) => {
          state.user = null;
          state.loginMethod = null;
        });
        // Also clear storage
        await removeStorageItem(StorageKeys.user).catch(() => {});
        await removeStorageItem(StorageKeys.loginMethod).catch(() => {});
      },

      setDemoUser: async (user) => {
        set((state) => {
          state.user = user;
          state.loginMethod = 'demo';
        });
        // Persist both user and login method
        await setStorageItem(StorageKeys.user, user);
        await setStorageItem(StorageKeys.loginMethod, 'demo');
      },

      skipLogin: async () => {
        // Create a guest preview account with NO roles
        const demoUser = {
          id: 'guest-' + Date.now(),
          email: 'guest@preview.app',
          name: 'Guest User',
          roles: [], // Guest users have NO roles
          helperVerified: false // Guest users are NOT verified
        };
        
        set((state) => {
          state.user = demoUser;
          state.loginMethod = 'demo';
        });
        
        // Save both user and login method to storage
        await setStorageItem(StorageKeys.user, demoUser);
        await setStorageItem(StorageKeys.loginMethod, 'demo');
        return { success: true, user: demoUser };
      },

      setSelectedRoles: (roles) => {
        set((state) => {
          state.selectedRoles = new Set(Array.isArray(roles) ? roles : [roles]);
        });
      },

      deleteAccount: async (userEmail) => {
        try {
          const { deleteUserAccount } = await import('../services/supabaseService');
          const result = await deleteUserAccount(userEmail);
          
          if (result.success) {
            // Clear all state
            set((state) => {
              state.user = null;
              state.loginMethod = null;
              state.authError = null;
              state.selectedRoles = new Set();
            });
            
            // Clear all storage
            await Promise.all([
              removeStorageItem(StorageKeys.user),
              removeStorageItem(StorageKeys.loginMethod)
            ]);
          }
          
          return result;
        } catch (error) {
          return { success: false, error: error.message || 'Failed to delete account' };
        }
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
  checkAuthStatus: state.checkAuthStatus,
  initializeAuth: state.initializeAuth
}));

export const useUserRoles = () => useAuthStore((state) => state.selectedRoles);

