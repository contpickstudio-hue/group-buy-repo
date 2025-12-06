import { loadErrandsFromBackend } from '../services/supabaseService';

export const createErrandSlice = (set, get) => ({
    // Errand state
    errands: [],
    applications: [],
    messages: [],
    errandsLoading: false,
    errandsError: null,
    
    // Actions
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
                status: errand.status || 'open'
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
                createdAt: application.createdAt || new Date().toISOString(),
                status: application.status || 'pending'
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
    
    // Async actions
    loadErrands: async () => {
        set((state) => {
            state.errandsLoading = true;
            state.errandsError = null;
        });
        
        try {
            const { errands, applications, messages } = await loadErrandsFromBackend();
            
            set((state) => {
                state.errands = errands || [];
                state.applications = applications || [];
                state.messages = messages || [];
                state.errandsLoading = false;
            });
            
            return { success: true, errands, applications, messages };
        } catch (error) {
            set((state) => {
                state.errandsError = error.message;
                state.errandsLoading = false;
            });
            return { success: false, error: error.message };
        }
    },
    
    createErrand: async (errandData) => {
        const { user } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const newErrand = {
                ...errandData,
                id: Date.now() + Math.random(),
                requesterEmail: user.email,
                status: 'open',
                createdAt: new Date().toISOString()
            };
            
            // In a real app, this would save to Supabase
            set((state) => {
                state.errands.push(newErrand);
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: 'Errand posted successfully!',
                duration: 3000
            });
            
            return { success: true, errand: newErrand };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to create errand: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    applyToErrand: async (errandId, applicationData) => {
        const { user } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const errand = get().errands.find(e => e.id === errandId);
            if (!errand) {
                throw new Error('Errand not found');
            }
            
            if (errand.status !== 'open') {
                throw new Error('Errand is no longer accepting applications');
            }
            
            // Check if user already applied
            const existingApplication = get().applications.find(a => 
                a.errandId === errandId && a.helperEmail === user.email
            );
            
            if (existingApplication) {
                throw new Error('You have already applied to this errand');
            }
            
            const application = {
                id: Date.now() + Math.random(),
                errandId,
                helperEmail: user.email,
                status: 'pending',
                createdAt: new Date().toISOString(),
                ...applicationData
            };
            
            // Add application
            set((state) => {
                state.applications.push(application);
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: `Application submitted for "${errand.title}"!`,
                duration: 3000
            });
            
            return { success: true, application };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to apply: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    acceptApplication: async (applicationId) => {
        const { user } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const application = get().applications.find(a => a.id === applicationId);
            if (!application) {
                throw new Error('Application not found');
            }
            
            const errand = get().errands.find(e => e.id === application.errandId);
            if (!errand || errand.requesterEmail !== user.email) {
                throw new Error('You can only accept applications for your own errands');
            }
            
            // Update application status
            set((state) => {
                const appIndex = state.applications.findIndex(a => a.id === applicationId);
                if (appIndex !== -1) {
                    state.applications[appIndex].status = 'accepted';
                }
                
                // Update errand status and assign helper
                const errandIndex = state.errands.findIndex(e => e.id === application.errandId);
                if (errandIndex !== -1) {
                    state.errands[errandIndex].status = 'matched';
                    state.errands[errandIndex].assignedHelperEmail = application.helperEmail;
                }
                
                // Reject other applications for this errand
                state.applications.forEach(app => {
                    if (app.errandId === application.errandId && app.id !== applicationId && app.status === 'pending') {
                        app.status = 'rejected';
                    }
                });
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: 'Application accepted! Helper has been assigned.',
                duration: 3000
            });
            
            return { success: true };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to accept application: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    completeErrand: async (errandId) => {
        const { user } = get();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }
        
        try {
            const errand = get().errands.find(e => e.id === errandId);
            if (!errand) {
                throw new Error('Errand not found');
            }
            
            if (errand.assignedHelperEmail !== user.email && errand.requesterEmail !== user.email) {
                throw new Error('You can only complete errands you are involved in');
            }
            
            // Update errand status
            set((state) => {
                const index = state.errands.findIndex(e => e.id === errandId);
                if (index !== -1) {
                    state.errands[index].status = 'completed';
                    state.errands[index].completedAt = new Date().toISOString();
                }
            });
            
            // Add success notification
            const { addNotification } = get();
            addNotification({
                type: 'success',
                message: 'Errand marked as completed!',
                duration: 3000
            });
            
            return { success: true };
        } catch (error) {
            const { addNotification } = get();
            addNotification({
                type: 'error',
                message: `Failed to complete errand: ${error.message}`,
                duration: 5000
            });
            return { success: false, error: error.message };
        }
    },
    
    // Computed getters
    getErrandById: (errandId) => {
        const { errands } = get();
        return errands.find(e => e.id === errandId);
    },
    
    getErrandsByRequester: (requesterEmail) => {
        const { errands } = get();
        return errands.filter(e => e.requesterEmail === requesterEmail);
    },
    
    getErrandsByHelper: (helperEmail) => {
        const { errands } = get();
        return errands.filter(e => e.assignedHelperEmail === helperEmail);
    },
    
    getApplicationsByErrand: (errandId) => {
        const { applications } = get();
        return applications.filter(a => a.errandId === errandId);
    },
    
    getApplicationsByHelper: (helperEmail) => {
        const { applications } = get();
        return applications.filter(a => a.helperEmail === helperEmail);
    },
    
    getOpenErrands: () => {
        const { errands } = get();
        return errands.filter(e => e.status === 'open');
    },
    
    getFeaturedErrands: (limit = 3) => {
        const openErrands = get().getOpenErrands();
        
        // Sort by deadline (most urgent first) and budget (highest first)
        return openErrands
            .sort((a, b) => {
                const aDeadline = new Date(a.deadline);
                const bDeadline = new Date(b.deadline);
                const aBudget = a.budget || 0;
                const bBudget = b.budget || 0;
                
                // First sort by urgency (closer deadline)
                const deadlineDiff = aDeadline - bDeadline;
                if (Math.abs(deadlineDiff) > 24 * 60 * 60 * 1000) { // More than 1 day difference
                    return deadlineDiff;
                }
                
                // Then by budget (higher budget first)
                return bBudget - aBudget;
            })
            .slice(0, limit);
    },
    
    getErrandStats: (requesterEmail) => {
        const requesterErrands = get().getErrandsByRequester(requesterEmail);
        
        const totalErrands = requesterErrands.length;
        const completedErrands = requesterErrands.filter(e => e.status === 'completed').length;
        const openErrands = requesterErrands.filter(e => e.status === 'open').length;
        const totalSpent = requesterErrands.reduce((sum, errand) => sum + (errand.budget || 0), 0);
        
        return {
            totalErrands,
            completedErrands,
            openErrands,
            totalSpent,
            completionRate: totalErrands > 0 ? (completedErrands / totalErrands) * 100 : 0
        };
    },
    
    getHelperStats: (helperEmail) => {
        const helperApplications = get().getApplicationsByHelper(helperEmail);
        const helperErrands = get().getErrandsByHelper(helperEmail);
        
        const totalApplications = helperApplications.length;
        const acceptedApplications = helperApplications.filter(a => a.status === 'accepted').length;
        const completedErrands = helperErrands.filter(e => e.status === 'completed').length;
        
        const totalEarnings = helperErrands
            .filter(e => e.status === 'completed')
            .reduce((sum, errand) => {
                const application = helperApplications.find(a => a.errandId === errand.id);
                return sum + (application?.offerAmount || errand.budget || 0);
            }, 0);
        
        return {
            totalApplications,
            acceptedApplications,
            completedErrands,
            totalEarnings,
            acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0,
            completionRate: acceptedApplications > 0 ? (completedErrands / acceptedApplications) * 100 : 0
        };
    }
});
