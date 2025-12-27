import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useCurrentScreen, useSetCurrentScreen, useLoading, useError, useNotifications, useRemoveNotification, useUser, useCheckAuthStatus, useInitializeAuth, useLoadProducts, useLoadOrders, useLoadErrands, useCheckAndTransitionBatchStatuses, useLoadNotifications, useInitializeLanguage } from './stores';
import { useAuthStore } from './stores/authStore';
import GlobalErrorBoundary, { SectionErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import FloatingActionButton from './components/FloatingActionButton';
import FirstTimeGuidance from './components/FirstTimeGuidance';
import StripeProvider from './components/StripeProvider';
import TranslationProvider from './contexts/TranslationProvider';
import { initializeErrorTracking } from './services/errorService';
import { initializePushNotifications } from './services/pushNotificationService';
import PermissionDenied from './components/PermissionDenied';

// Import page components
import StartPage from './pages/StartPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import BrowsePage from './pages/BrowsePage';
import GroupBuysPage from './pages/GroupBuysPage';
import GroupBuyDetailPage from './pages/GroupBuyDetailPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ErrandDetailPage from './pages/ErrandDetailPage';
import ErrandsPage from './pages/ErrandsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ModerationPage from './pages/ModerationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { getCurrentLanguage } from './utils/translations';
import { useUpdateGroupBuyFilters, useUpdateErrandFilters } from './stores';
import { getStorageItem } from './utils/storageUtils';

// Loading component
const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
    </div>
);

// Notification component
const NotificationContainer = () => {
    const notifications = useNotifications();
    const removeNotification = useRemoveNotification();

    if (notifications.length === 0) return null;

    return (
        <div 
            className="fixed top-4 right-4 z-50 space-y-2 max-w-[calc(100vw-2rem)] sm:max-w-md"
            style={{
                top: 'calc(1rem + env(safe-area-inset-top))',
                right: 'calc(1rem + env(safe-area-inset-right))'
            }}
        >
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-lg w-full animate-slide-up touch-manipulation ${
                        notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
                        notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
                        notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' :
                        'bg-blue-100 border border-blue-400 text-blue-700'
                    }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            {notification.type === 'error' && <strong className="font-bold">Error: </strong>}
                            {notification.type === 'success' && <strong className="font-bold">Success: </strong>}
                            {notification.type === 'warning' && <strong className="font-bold">Warning: </strong>}
                            <span className="block sm:inline text-sm sm:text-base break-words">{notification.message}</span>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 ml-2 hover:opacity-75 active:opacity-50 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center text-lg sm:text-xl font-bold"
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Version info component
const VersionInfo = () => (
    <div 
        className="fixed bottom-4 right-4 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs z-10 hidden md:block"
        title="Korean Community Commerce v3.2.0 - Modern Mobile-First UI Design"
    >
        v3.2.0
    </div>
);

// Main app content component
function AppContent() {
    const currentScreen = useCurrentScreen();
    const loading = useLoading();
    const error = useError();
    const user = useUser();
    const checkAuthStatus = useCheckAuthStatus();
    const initializeAuth = useInitializeAuth();
    const loadProducts = useLoadProducts();
    const loadOrders = useLoadOrders();
    const loadErrands = useLoadErrands();
    const loadNotifications = useLoadNotifications();
    const initializeLanguage = useInitializeLanguage();
    const checkAndTransitionBatchStatuses = useCheckAndTransitionBatchStatuses();
    const setCurrentScreen = useSetCurrentScreen();
    const updateGroupBuyFilters = useUpdateGroupBuyFilters();
    const updateErrandFilters = useUpdateErrandFilters();

    // Check onboarding status
    const [showOnboarding, setShowOnboarding] = React.useState(false);
    const [onboardingChecked, setOnboardingChecked] = React.useState(false);

    // Initialize app on mount
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize error tracking
                initializeErrorTracking();
                
                // Check onboarding status - only show once for first-time visitors
                const onboardingComplete = await getStorageItem('onboardingComplete');
                if (!onboardingComplete) {
                    // First-time visitor - show onboarding
                    setShowOnboarding(true);
                    setOnboardingChecked(true);
                    return;
                }
                setOnboardingChecked(true);
                
                // Apply preferred region filter if enabled
                try {
                    const autoApplyFilter = await getStorageItem('autoApplyFilter') === 'true';
                    const preferredRegion = await getStorageItem('preferredRegion');
                    if (autoApplyFilter && preferredRegion && preferredRegion !== 'all') {
                        updateGroupBuyFilters({ region: preferredRegion });
                        updateErrandFilters({ region: preferredRegion });
                    }
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.warn('Failed to apply preferred region filter:', error);
                    }
                }
                
                // Initialize language preference
                await initializeLanguage();
                
                // Initialize auth state from storage (restores session on refresh)
                // This handles both demo users and real Supabase sessions
                await initializeAuth();
                
                // Load notifications for authenticated user
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    await loadNotifications();
                }
                
                // Load initial data
                await Promise.all([
                    loadProducts(),
                    loadOrders(),
                    loadErrands()
                ]);
                
                // Check and transition batch statuses at deadline
                await checkAndTransitionBatchStatuses();
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error('App initialization failed:', error);
                }
                // Error handling is managed by individual functions
            }
        };

        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Initialize push notifications when user is authenticated
    useEffect(() => {
        const initPushNotifications = async () => {
            if (user?.email || user?.id) {
                try {
                    const userId = user.email || user.id;
                    await initializePushNotifications(userId);
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.error('Failed to initialize push notifications:', error);
                    }
                    // Don't block app functionality if push notifications fail
                }
            }
        };

        initPushNotifications();
    }, [user]);
    
    // Periodically check and transition batch statuses (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(async () => {
            await checkAndTransitionBatchStatuses();
        }, 5 * 60 * 1000); // 5 minutes
        
        return () => clearInterval(interval);
    }, [checkAndTransitionBatchStatuses]);

    // Listen for hash changes to handle detail page routing
    // IMPORTANT: This hook must be called before any conditional returns
    useEffect(() => {
        const handleHashChange = () => {
            // Hash changes are handled in renderCurrentScreen
            // Force re-render by updating a state if needed
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Show onboarding if needed - AFTER all hooks are called
    if (!onboardingChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (showOnboarding) {
        return <OnboardingPage />;
    }

    const renderCurrentScreen = () => {
        // Check for detail page routing via hash
        const hash = window.location.hash;
        if (hash && hash.startsWith('#listing/')) {
            // Anyone can VIEW listings, but joining requires customer role (enforced at action level)
            return <ListingDetailPage />;
        }
        if (hash && hash.startsWith('#groupbuy/')) {
            return <GroupBuyDetailPage />;
        }
        if (hash && hash.startsWith('#errand/')) {
            return <ErrandDetailPage />;
        }

        switch (currentScreen) {
            case 'start':
                return <StartPage />;
            case 'auth':
                return <AuthPage />;
            case 'browse':
                return <BrowsePage />;
            case 'groupbuys':
                return <GroupBuysPage />;
            case 'errands':
                return <ErrandsPage />;
            case 'dashboard':
                // Route-level RBAC: Dashboard accessible by authenticated users
                // Specific actions (create group buy) are protected at action level
                if (!user) {
                    return <PermissionDenied requiredRole="vendor" action="access dashboard" showUpgradeCTA={false} />;
                }
                return <DashboardPage />;
            case 'profile':
                return <ProfilePage />;
            case 'settings':
                return <SettingsPage />;
            case 'moderation':
                return <ModerationPage />;
            case 'privacypolicy':
                return <PrivacyPolicyPage />;
            default:
                return <StartPage />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Skip to main content link for accessibility */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
            >
                Skip to main content
            </a>

            {/* Navigation */}
            <SectionErrorBoundary section="Navigation">
                <Navbar />
            </SectionErrorBoundary>

            {/* Main content - Mobile optimized spacing */}
            <main id="main-content" className="pb-24 md:pb-8 min-h-screen">
                <SectionErrorBoundary section="Main Content">
                    {renderCurrentScreen()}
                </SectionErrorBoundary>
            </main>

            {/* Mobile bottom navigation */}
            <SectionErrorBoundary section="Bottom Navigation">
                <BottomNavigation />
            </SectionErrorBoundary>

            {/* Floating action button */}
            <SectionErrorBoundary section="Floating Action Button">
                <FloatingActionButton />
            </SectionErrorBoundary>

            {/* First-time user guidance */}
            <FirstTimeGuidance />

            {/* Loading overlay */}
            {loading && <LoadingSpinner />}

            {/* Notifications - Mobile optimized */}
            <NotificationContainer />

            {/* Toast notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#363636',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        borderRadius: '8px',
                        padding: '16px',
                    },
                }}
            />

            {/* Version info */}
            <VersionInfo />
        </div>
    );
}

// Main App component with global error boundary
function App() {
    return (
        <GlobalErrorBoundary>
            <TranslationProvider>
                <StripeProvider>
                    <AppContent />
                </StripeProvider>
            </TranslationProvider>
        </GlobalErrorBoundary>
    );
}

export default App;