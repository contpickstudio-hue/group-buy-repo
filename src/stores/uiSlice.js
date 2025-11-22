export const createUISlice = (set, get) => ({
    // UI state
    currentScreen: 'start',
    loading: false,
    error: null,
    notifications: [],
    
    // Modal and overlay states
    modals: {
        productDetails: { open: false, productId: null },
        errandDetails: { open: false, errandId: null },
        userProfile: { open: false },
        helperVerification: { open: false }
    },
    
    // Mobile UI states
    mobileMenuOpen: false,
    fabMenuOpen: false,
    
    // Actions
    setCurrentScreen: (screen) => {
        set((state) => {
            state.currentScreen = screen;
            state.error = null; // Clear errors when navigating
        });
        
        // Scroll to top when changing screens (defer to avoid render issues)
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
    },
    
    setLoading: (loading) => {
        set((state) => {
            state.loading = loading;
        });
    },
    
    setError: (error) => {
        set((state) => {
            state.error = error;
            state.loading = false; // Stop loading when there's an error
        });
    },
    
    clearError: () => {
        set((state) => {
            state.error = null;
        });
    },
    
    // Notification system
    addNotification: (notification) => {
        const id = notification.id || Date.now() + Math.random();
        const newNotification = {
            id,
            type: 'info', // info, success, warning, error
            title: '',
            message: '',
            duration: 5000, // Auto-dismiss after 5 seconds (0 = persistent)
            read: false,
            timestamp: new Date().toISOString(),
            data: null, // Additional data for the notification
            ...notification
        };
        
        set((state) => {
            state.notifications.unshift(newNotification); // Add to beginning for newest first
            
            // Keep only last 100 notifications
            if (state.notifications.length > 100) {
                state.notifications = state.notifications.slice(0, 100);
            }
        });
        
        // Auto-dismiss notification (only if duration > 0)
        if (newNotification.duration > 0) {
            setTimeout(() => {
                get().removeNotification(id);
            }, newNotification.duration);
        }
        
        return id;
    },
    
    removeNotification: (notificationId) => {
        set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== notificationId);
        });
    },
    
    clearNotifications: () => {
        set((state) => {
            state.notifications = [];
        });
    },
    
    // Enhanced notification management for real-time features
    markNotificationAsRead: (notificationId) => {
        set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
            }
        });
    },
    
    markAllNotificationsAsRead: () => {
        set((state) => {
            state.notifications.forEach(notification => {
                notification.read = true;
            });
        });
    },
    
    getUnreadNotificationCount: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.read).length;
    },
    
    // Modal management
    openModal: (modalName, data = {}) => {
        set((state) => {
            if (state.modals[modalName]) {
                state.modals[modalName] = { open: true, ...data };
            }
        });
    },
    
    closeModal: (modalName) => {
        set((state) => {
            if (state.modals[modalName]) {
                state.modals[modalName] = { open: false };
            }
        });
    },
    
    closeAllModals: () => {
        set((state) => {
            Object.keys(state.modals).forEach(modalName => {
                state.modals[modalName] = { open: false };
            });
        });
    },
    
    // Mobile UI actions
    toggleMobileMenu: () => {
        set((state) => {
            state.mobileMenuOpen = !state.mobileMenuOpen;
        });
    },
    
    closeMobileMenu: () => {
        set((state) => {
            state.mobileMenuOpen = false;
        });
    },
    
    toggleFabMenu: () => {
        set((state) => {
            state.fabMenuOpen = !state.fabMenuOpen;
        });
    },
    
    closeFabMenu: () => {
        set((state) => {
            state.fabMenuOpen = false;
        });
    },
    
    // Navigation helpers
    goToScreen: (screen, data = {}) => {
        const { setCurrentScreen, closeMobileMenu, closeFabMenu } = get();
        
        // Close mobile overlays
        closeMobileMenu();
        closeFabMenu();
        
        // Navigate to screen
        setCurrentScreen(screen);
        
        // Handle screen-specific data
        if (data.productId) {
            get().openModal('productDetails', { productId: data.productId });
        }
        if (data.errandId) {
            get().openModal('errandDetails', { errandId: data.errandId });
        }
    },
    
    // Toast notifications (legacy support)
    showToast: (message, type = 'info', duration = 3000) => {
        return get().addNotification({
            message,
            type,
            duration
        });
    },
    
    // Loading states for specific operations
    setOperationLoading: (operation, loading) => {
        set((state) => {
            if (!state.operationLoading) {
                state.operationLoading = {};
            }
            state.operationLoading[operation] = loading;
        });
    },
    
    isOperationLoading: (operation) => {
        const { operationLoading } = get();
        return operationLoading?.[operation] || false;
    },
    
    // Screen transition helpers
    navigateWithTransition: async (screen, transitionType = 'slide') => {
        const { setLoading, setCurrentScreen } = get();
        
        // Start transition
        setLoading(true);
        
        // Simulate transition delay
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Navigate
        setCurrentScreen(screen);
        setLoading(false);
    },
    
    // Breadcrumb management
    breadcrumbs: [],
    
    pushBreadcrumb: (crumb) => {
        set((state) => {
            state.breadcrumbs.push({
                label: crumb.label,
                screen: crumb.screen,
                timestamp: Date.now()
            });
            
            // Limit breadcrumb history
            if (state.breadcrumbs.length > 10) {
                state.breadcrumbs = state.breadcrumbs.slice(-10);
            }
        });
    },
    
    popBreadcrumb: () => {
        set((state) => {
            state.breadcrumbs.pop();
        });
    },
    
    clearBreadcrumbs: () => {
        set((state) => {
            state.breadcrumbs = [];
        });
    },
    
    // Accessibility helpers
    announceToScreenReader: (message) => {
        // Create a live region for screen reader announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },
    
    // Focus management
    focusElement: (selector) => {
        setTimeout(() => {
            const element = document.querySelector(selector);
            if (element) {
                element.focus();
            }
        }, 100);
    },
    
    // Real-time connection status
    realtimeStatus: {
        isConnected: false,
        lastConnectionTime: null,
        connectionAttempts: 0,
        subscriptions: {},
    },
    
    // Theme and preferences (placeholder for future implementation)
    theme: 'light',
    language: 'en',
    
    setTheme: (theme) => {
        set((state) => {
            state.theme = theme;
        });
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    setLanguage: (language) => {
        set((state) => {
            state.language = language;
        });
        
        // Apply language to document
        document.documentElement.setAttribute('lang', language);
    },
    
    // Real-time status management
    setRealtimeStatus: (status) => {
        set((state) => {
            state.realtimeStatus = { ...state.realtimeStatus, ...status };
        });
    },
    
    updateRealtimeSubscription: (subscriptionName, isConnected) => {
        set((state) => {
            state.realtimeStatus.subscriptions[subscriptionName] = isConnected;
            
            // Update overall connection status
            const allSubscriptions = Object.values(state.realtimeStatus.subscriptions);
            state.realtimeStatus.isConnected = allSubscriptions.length > 0 && allSubscriptions.every(Boolean);
        });
    },
    
    incrementConnectionAttempts: () => {
        set((state) => {
            state.realtimeStatus.connectionAttempts++;
        });
    },
    
    resetConnectionAttempts: () => {
        set((state) => {
            state.realtimeStatus.connectionAttempts = 0;
        });
    },
    
    // Performance monitoring
    performanceMetrics: {},
    
    recordMetric: (name, value, unit = 'ms') => {
        set((state) => {
            if (!state.performanceMetrics[name]) {
                state.performanceMetrics[name] = [];
            }
            state.performanceMetrics[name].push({
                value,
                unit,
                timestamp: Date.now()
            });
            
            // Keep only last 100 measurements
            if (state.performanceMetrics[name].length > 100) {
                state.performanceMetrics[name] = state.performanceMetrics[name].slice(-100);
            }
        });
    },
    
    getAverageMetric: (name) => {
        const { performanceMetrics } = get();
        const metrics = performanceMetrics[name];
        
        if (!metrics || metrics.length === 0) return 0;
        
        const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
        return sum / metrics.length;
    }
});
