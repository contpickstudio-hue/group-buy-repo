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

export const createUserSlice = (set, get) => ({
    // User state
    user: null,
    loginMethod: null,
    selectedRoles: new Set(),
    helperData: {
        name: '',
        phone: '',
        street: '',
        city: '',
        province: '',
        postal: '',
        idPhotoDataUrl: '',
        generatedCode: '',
        enteredCode: '',
        smsVerified: false,
        idVerified: false
    },
    helperStepIndex: 0,
    
    // Loading states
    authLoading: false,
    authError: null,
    
    // Actions
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
    
    clearUser: () => {
        set((state) => {
            state.user = null;
            state.loginMethod = null;
            state.selectedRoles = new Set();
            state.authError = null;
        });
    },
    
    setSelectedRoles: (roles) => {
        set((state) => {
            state.selectedRoles = new Set(roles);
        });
    },
    
    updateHelperData: (updates) => {
        set((state) => {
            Object.assign(state.helperData, updates);
        });
        
        // Persist helper data
        const { helperData } = get();
        dbSaveSlice(StorageKeys.helperData, helperData);
    },
    
    setHelperStep: (step) => {
        set((state) => {
            state.helperStepIndex = step;
        });
    },
    
    // Async actions with error handling
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
    
    signOut: async () => {
        set((state) => {
            state.authLoading = true;
        });
        
        try {
            await signOut();
            
            set((state) => {
                state.user = null;
                state.loginMethod = null;
                state.selectedRoles = new Set();
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
    
    // Helper verification actions
    generateSmsCode: () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        set((state) => {
            state.helperData.generatedCode = code;
            state.helperData.smsVerified = false;
        });
        
        // In a real app, this would send SMS
        console.log(`SMS Code: ${code}`);
        
        // Persist helper data
        const { helperData } = get();
        dbSaveSlice(StorageKeys.helperData, helperData);
        
        return code;
    },
    
    verifySmsCode: (enteredCode) => {
        const { helperData } = get();
        const isValid = enteredCode === helperData.generatedCode;
        
        set((state) => {
            state.helperData.enteredCode = enteredCode;
            state.helperData.smsVerified = isValid;
        });
        
        // Persist helper data
        const updatedHelperData = get().helperData;
        dbSaveSlice(StorageKeys.helperData, updatedHelperData);
        
        return isValid;
    },
    
    completeHelperVerification: () => {
        const { user, helperData } = get();
        
        if (!user || !helperData.smsVerified || !helperData.idVerified) {
            return { success: false, error: 'Verification incomplete' };
        }
        
        set((state) => {
            if (state.user) {
                state.user.helperVerified = true;
            }
        });
        
        // Persist updated user data
        const updatedUser = get().user;
        dbSaveSlice(StorageKeys.user, updatedUser);
        
        return { success: true };
    },
    
    // Demo user for testing
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
    }
});
