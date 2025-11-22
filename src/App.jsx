import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useCurrentScreen, useLoading, useError, useNotifications, useRemoveNotification, useUser, useCheckAuthStatus, useLoadProducts, useLoadOrders, useLoadErrands } from './stores';
import GlobalErrorBoundary, { SectionErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import FloatingActionButton from './components/FloatingActionButton';
import StripeProvider from './components/StripeProvider';
import { initializeErrorTracking } from './services/errorService';

// Import page components
import StartPage from './pages/StartPage';
import AuthPage from './pages/AuthPage';
import BrowsePage from './pages/BrowsePage';
import GroupBuysPage from './pages/GroupBuysPage';
import ErrandsPage from './pages/ErrandsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

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
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`px-4 py-3 rounded-lg shadow-lg max-w-md animate-slide-up ${
                        notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
                        notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
                        notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' :
                        'bg-blue-100 border border-blue-400 text-blue-700'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            {notification.type === 'error' && <strong className="font-bold">Error: </strong>}
                            {notification.type === 'success' && <strong className="font-bold">Success: </strong>}
                            {notification.type === 'warning' && <strong className="font-bold">Warning: </strong>}
                            <span className="block sm:inline">{notification.message}</span>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="ml-4 hover:opacity-75"
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
        title="Korean Community Commerce v3.1.0 - Modern Mobile-First UI Design"
    >
        v3.1.0
    </div>
);

// Main app content component
function AppContent() {
    const currentScreen = useCurrentScreen();
    const loading = useLoading();
    const error = useError();
    const user = useUser();
    const checkAuthStatus = useCheckAuthStatus();
    const loadProducts = useLoadProducts();
    const loadOrders = useLoadOrders();
    const loadErrands = useLoadErrands();

    // Initialize app on mount
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize error tracking
                initializeErrorTracking();
                
                // Check authentication status
                await checkAuthStatus();
                
                // Load initial data
                await Promise.all([
                    loadProducts(),
                    loadOrders(),
                    loadErrands()
                ]);
            } catch (error) {
                console.error('App initialization failed:', error);
                // Error handling is managed by individual functions
            }
        };

        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const renderCurrentScreen = () => {
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
                return <DashboardPage />;
            case 'profile':
                return <ProfilePage />;
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

            {/* Language toggle - Mobile optimized */}
            <div className="fixed top-16 sm:top-4 right-3 sm:right-4 z-40 flex space-x-1 sm:space-x-2">
                <button className="px-2.5 py-1.5 text-xs sm:text-sm bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all font-medium min-h-[36px] min-w-[36px]">
                    EN
                </button>
                <button className="px-2.5 py-1.5 text-xs sm:text-sm bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all font-medium min-h-[36px] min-w-[36px]">
                    한국어
                </button>
            </div>

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

            {/* Loading overlay */}
            {loading && <LoadingSpinner />}

            {/* Notifications */}
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
            <StripeProvider>
                <AppContent />
            </StripeProvider>
        </GlobalErrorBoundary>
    );
}

export default App;