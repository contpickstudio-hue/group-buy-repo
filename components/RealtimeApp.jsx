import React from 'react';
import RealtimeManager from './RealtimeManager';
import { NotificationButton, ToastContainer, ConnectionStatus } from './NotificationSystem';
import { useStore } from '../stores';

/**
 * Enhanced App component with real-time features
 * This shows how to integrate all real-time components
 */
const RealtimeApp = ({ children }) => {
  const { user } = useStore((state) => ({
    user: state.user?.user,
  }));

  return (
    <RealtimeManager>
      <div className="min-h-screen bg-gray-100">
        {/* Enhanced Navbar with notifications */}
        <EnhancedNavbar />
        
        {/* Main content */}
        <main className="pt-16 pb-16 md:pb-0">
          {children}
        </main>
        
        {/* Real-time components */}
        <ToastContainer />
        <ConnectionStatus />
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && <RealtimeDebugPanel />}
      </div>
    </RealtimeManager>
  );
};

/**
 * Enhanced Navbar with notification button
 */
const EnhancedNavbar = () => {
  const { user, currentScreen, goToScreen, signOut } = useStore((state) => ({
    user: state.user?.user,
    currentScreen: state.ui?.currentScreen || 'start',
    goToScreen: state.ui?.goToScreen || (() => {}),
    signOut: state.user?.signOut || (() => {}),
  }));

  const handleSignOut = async () => {
    await signOut();
    goToScreen('start');
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 w-full z-10">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-800 mr-4">
          Korean Community Commerce
        </h1>
        <ul className="flex space-x-4">
          <li>
            <button
              onClick={() => goToScreen('browse')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentScreen === 'browse' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Browse
            </button>
          </li>
          {user && (
            <>
              <li>
                <button
                  onClick={() => goToScreen('groupbuys')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentScreen === 'groupbuys' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Group Buys
                </button>
              </li>
              <li>
                <button
                  onClick={() => goToScreen('errands')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentScreen === 'errands' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Errands
                </button>
              </li>
              <li>
                <button
                  onClick={() => goToScreen('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentScreen === 'dashboard' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Dashboard
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <>
            {/* Notification button */}
            <NotificationButton />
            
            {/* User info */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 text-sm">{user.name || user.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </>
        )}
        
        {!user && (
          <button
            onClick={() => goToScreen('auth')}
            className="px-3 py-2 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

/**
 * Debug panel for development
 */
const RealtimeDebugPanel = () => {
  const { realtimeStatus, notifications } = useStore((state) => ({
    realtimeStatus: state.ui?.realtimeStatus || {},
    notifications: state.ui?.notifications || [],
  }));

  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-mono"
      >
        RT Debug ({notifications.filter(n => !n.read).length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white p-4 rounded text-xs font-mono min-w-80 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            <div className="text-yellow-400 font-bold">Real-time Status</div>
            <div>Connected: {realtimeStatus.isConnected ? '✅' : '❌'}</div>
            <div>Attempts: {realtimeStatus.connectionAttempts || 0}</div>
            <div>Last Connected: {realtimeStatus.lastConnectionTime 
              ? new Date(realtimeStatus.lastConnectionTime).toLocaleTimeString() 
              : 'Never'}</div>
            
            <div className="text-yellow-400 font-bold mt-3">Subscriptions</div>
            {Object.entries(realtimeStatus.subscriptions || {}).map(([key, connected]) => (
              <div key={key}>
                {key}: {connected ? '✅' : '❌'}
              </div>
            ))}
            
            <div className="text-yellow-400 font-bold mt-3">Recent Notifications</div>
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="border-l-2 border-blue-500 pl-2 py-1">
                <div className="text-blue-300">{notification.title}</div>
                <div className="text-gray-300 text-xs">{notification.message}</div>
                <div className="text-gray-500 text-xs">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                  {!notification.read && <span className="text-yellow-400 ml-1">UNREAD</span>}
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="text-gray-400">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example usage component showing real-time features
 */
export const RealtimeDemo = () => {
  const { addNotification } = useStore((state) => ({
    addNotification: state.ui?.addNotification || (() => {}),
  }));

  const simulateNotifications = () => {
    const notifications = [
      {
        title: 'New Group Buy!',
        message: 'Korean BBQ Set is now available for group buying',
        type: 'info',
        data: { type: 'product_created', productId: 1 },
      },
      {
        title: 'Goal Reached!',
        message: 'Kimchi Bundle has reached its minimum participants',
        type: 'success',
        data: { type: 'goal_reached', productId: 2 },
      },
      {
        title: 'New Message',
        message: 'You have a new message about your errand',
        type: 'info',
        data: { type: 'message_received', messageId: 1 },
      },
      {
        title: 'Order Update',
        message: 'Your order has been shipped!',
        type: 'success',
        data: { type: 'order_status', orderId: 1 },
      },
    ];

    notifications.forEach((notification, index) => {
      setTimeout(() => {
        addNotification(notification);
      }, index * 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Real-time Features Demo</h2>
        <p className="text-gray-600 mb-6">
          This demo shows the real-time notification system in action. Click the button below to simulate real-time events.
        </p>
        
        <button
          onClick={simulateNotifications}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Simulate Real-time Events
        </button>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Features Included:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time product updates</li>
              <li>• Live errand notifications</li>
              <li>• Order status changes</li>
              <li>• Message notifications</li>
              <li>• Connection status monitoring</li>
              <li>• Auto-reconnection</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Visual Indicators:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Toast notifications for new events</li>
              <li>• Badge counts on notification bell</li>
              <li>• Connection status indicator</li>
              <li>• Animated product cards</li>
              <li>• Real-time activity feed</li>
              <li>• Debug panel (development)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeApp;
