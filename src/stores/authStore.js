import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
    signUpWithEmail, 
    signInWithEmail, 
    signInWithGoogle, 
    signOut, 
    getCurrentUser,
    dbSaveSlice,
    StorageKeys
} from '../services/supabaseService';
import { handleFormSubmission } from '../services/errorService';

/**
 * Dedicated authentication store using Zustand
 * Centralizes all authentication-related state and actions including:
 * - User authentication state
 * - Demo Tester functionality
 * - User roles management
 * - Login methods
 */
export const useAuthStore = create()(
    devtools(
        immer((set, get) => ({
            // Authentication state
            user: null,
            loginMethod: null,
            selectedRoles: new Set(['customer']),
                
                // Loading and error states
                authLoading: false,
                authError: null,
                
                // Actions
                
                /**
                 * Set the current authenticated user
                 * @param {Object} user - User object with email, name, roles, etc.
                 */
                setUser: (user) => {
                    set((state) => {
                        state.user = user;
                        state.authError = null;
                    });
                    
                    // Persist user data
                    if (user) {
                        dbSaveSlice(StorageKeys.user, user);
                    }
                },
                
                /**
                 * Update user properties
                 * @param {Object} updates - Partial user object to update
                 */
                updateUser: (updates) => {
                    set((state) => {
                        if (state.user) {
                            Object.assign(state.user, updates);
                        }
                    });
                    
                    // Persist updated user data
                    const { user } = get();
                    if (user) {
                        dbSaveSlice(StorageKeys.user, user);
                    }
                },
                
                /**
                 * Clear user authentication state
                 */
                clearUser: () => {
                    set((state) => {
                        state.user = null;
                        state.loginMethod = null;
                        state.selectedRoles = new Set(['customer']);
                        state.authError = null;
                    });
                },
                
                /**
                 * Set selected roles for registration
                 * @param {Array|Set} roles - Array or Set of role strings
                 */
                setSelectedRoles: (roles) => {
                    set((state) => {
                        state.selectedRoles = new Set(roles);
                    });
                },
                
                /**
                 * Sign up with email and password
                 * @param {string} email - User email
                 * @param {string} password - User password
                 * @param {Object} userData - Additional user data (name, roles, etc.)
                 */
                signUp: async (email, password, userData) => {
                    set((state) => {
                        state.authLoading = true;
                        state.authError = null;
                    });
                    
                    const result = await handleFormSubmission(async () => {
                        const response = await signUpWithEmail(email, password, userData);
                        
                        if (!response.success) {
                            throw new Error(response.error || 'Sign up failed');
                        }
                        
                        const user = {
                            email,
                            name: userData.name,
                            roles: userData.roles || ['customer'],
                            helperVerified: false
                        };
                        
                        set((state) => {
                            state.user = user;
                            state.loginMethod = 'email';
                            state.authLoading = false;
                        });
                        
                        // Persist user data
                        await dbSaveSlice(StorageKeys.user, user);
                        await dbSaveSlice(StorageKeys.loginMethod, 'email');
                        
                        return user;
                    }, {
                        context: 'Account Registration'
                    });
                    
                    if (!result.success) {
                        set((state) => {
                            state.authError = result.error;
                            state.authLoading = false;
                        });
                    }
                    
                    return result;
                },
                
                /**
                 * Sign in with email and password
                 * @param {string} email - User email
                 * @param {string} password - User password
                 */
                signIn: async (email, password) => {
                    set((state) => {
                        state.authLoading = true;
                        state.authError = null;
                    });
                    
                    try {
                        const { data, error } = await signInWithEmail(email, password);
                        
                        if (error) throw error;
                        
                        const user = {
                            email: data.user.email,
                            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                            roles: data.user.user_metadata?.roles || ['customer'],
                            helperVerified: data.user.user_metadata?.helperVerified || false
                        };
                        
                        set((state) => {
                            state.user = user;
                            state.loginMethod = 'email';
                            state.authLoading = false;
                        });
                        
                        // Persist user data
                        await dbSaveSlice(StorageKeys.user, user);
                        await dbSaveSlice(StorageKeys.loginMethod, 'email');
                        
                        return { success: true, user };
                    } catch (error) {
                        set((state) => {
                            state.authError = error.message;
                            state.authLoading = false;
                        });
                        return { success: false, error: error.message };
                    }
                },
                
                /**
                 * Sign in with Google OAuth
                 */
                signInWithGoogle: async () => {
                    set((state) => {
                        state.authLoading = true;
                        state.authError = null;
                    });
                    
                    try {
                        const { data, error } = await signInWithGoogle();
                        
                        if (error) throw error;
                        
                        // Google sign-in will redirect, so we don't handle success here
                        return { success: true };
                    } catch (error) {
                        set((state) => {
                            state.authError = error.message;
                            state.authLoading = false;
                        });
                        return { success: false, error: error.message };
                    }
                },
                
                /**
                 * Sign out the current user
                 */
                signOut: async () => {
                    set((state) => {
                        state.authLoading = true;
                    });
                    
                    try {
                        await signOut();
                        
                        set((state) => {
                            state.user = null;
                            state.loginMethod = null;
                            state.selectedRoles = new Set(['customer']);
                            state.authError = null;
                            state.authLoading = false;
                        });
                        
                        return { success: true };
                    } catch (error) {
                        set((state) => {
                            state.authError = error.message;
                            state.authLoading = false;
                        });
                        return { success: false, error: error.message };
                    }
                },
                
                /**
                 * Check current authentication status
                 */
                checkAuthStatus: async () => {
                    try {
                        const { user, error } = await getCurrentUser();
                        
                        if (error || !user) {
                            set((state) => {
                                state.user = null;
                                state.loginMethod = null;
                            });
                            return { authenticated: false };
                        }
                        
                        const userData = {
                            email: user.email,
                            name: user.user_metadata?.name || user.email.split('@')[0],
                            roles: user.user_metadata?.roles || ['customer'],
                            helperVerified: user.user_metadata?.helperVerified || false
                        };
                        
                        set((state) => {
                            state.user = userData;
                            state.loginMethod = 'email'; // or determine from user data
                        });
                        
                        return { authenticated: true, user: userData };
                    } catch (error) {
                        console.error('Auth check failed:', error);
                        return { authenticated: false, error: error.message };
                    }
                },
                
                /**
                 * Set demo user for testing purposes
                 * Creates a demo user with all roles (customer, vendor, helper)
                 */
                setDemoUser: () => {
                    const demoUser = {
                        email: 'demo+tester@example.com',
                        name: 'Demo Tester',
                        roles: ['customer', 'vendor', 'helper'],
                        helperVerified: true
                    };
                    
                    set((state) => {
                        state.user = demoUser;
                        state.loginMethod = 'demo';
                        state.authError = null;
                    });
                    
                    // Persist demo user
                    dbSaveSlice(StorageKeys.user, demoUser);
                    dbSaveSlice(StorageKeys.loginMethod, 'demo');
                    
                    return demoUser;
                },
                
                /**
                 * Check if user has a specific role
                 * @param {string} role - Role to check (e.g., 'customer', 'vendor', 'helper')
                 * @returns {boolean} - True if user has the role
                 */
                hasRole: (role) => {
                    const { user } = get();
                    return user?.roles?.includes(role) || false;
                },
                
                /**
                 * Check if user is authenticated
                 * @returns {boolean} - True if user is authenticated
                 */
            isAuthenticated: () => {
                const { user } = get();
                return user !== null;
            }
        })),
        {
            name: 'auth-store'
        }
    )
);

// Convenience hooks for common auth operations
export const useAuth = () => useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated(),
    loginMethod: state.loginMethod,
    authLoading: state.authLoading,
    authError: state.authError
}));

export const useAuthActions = () => useAuthStore((state) => ({
    signUp: state.signUp,
    signIn: state.signIn,
    signInWithGoogle: state.signInWithGoogle,
    signOut: state.signOut,
    setUser: state.setUser,
    updateUser: state.updateUser,
    clearUser: state.clearUser,
    checkAuthStatus: state.checkAuthStatus,
    setDemoUser: state.setDemoUser
}));

export const useUserRoles = () => useAuthStore((state) => ({
    roles: state.user?.roles || [],
    selectedRoles: Array.from(state.selectedRoles),
    setSelectedRoles: state.setSelectedRoles,
    hasRole: state.hasRole
}));

