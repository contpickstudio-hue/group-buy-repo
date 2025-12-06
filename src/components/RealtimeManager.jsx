import React, { useEffect, useState } from 'react';
import { useRealtimeSubscriptions } from '../hooks/useRealtime';
import { useStore } from '../stores';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * RealtimeManager - Manages all real-time subscriptions and connection status
 * This component should be included once at the app level
 */
const RealtimeManager = ({ children }) => {
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState(null);
  
  const { user, setRealtimeStatus, showToast } = useStore((state) => ({
    user: state.user?.user,
    setRealtimeStatus: state.ui?.setRealtimeStatus || (() => {}),
    showToast: state.ui?.showToast || (() => {}),
  }));

  // Set up real-time subscriptions
  const { isConnected, reconnectAll, subscriptions } = useRealtimeSubscriptions(!!user);

  // Update store with connection status
  useEffect(() => {
    setRealtimeStatus({
      isConnected,
      lastConnectionTime,
      connectionAttempts,
      subscriptions: Object.keys(subscriptions).reduce((acc, key) => {
        acc[key] = subscriptions[key].isSubscribed;
        return acc;
      }, {}),
    });
  }, [isConnected, lastConnectionTime, connectionAttempts, subscriptions, setRealtimeStatus]);

  // Handle connection changes
  useEffect(() => {
    if (isConnected && user) {
      setLastConnectionTime(new Date().toISOString());
      if (connectionAttempts > 0) {
        showToast('Real-time connection restored', 'success');
      }
    } else if (user && !isConnected) {
      // Only show disconnection message if we were previously connected
      if (lastConnectionTime) {
        showToast('Real-time connection lost. Attempting to reconnect...', 'warning');
      }
    }
  }, [isConnected, user, connectionAttempts, lastConnectionTime, showToast]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!isConnected && user) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect real-time subscriptions...');
        setConnectionAttempts(prev => prev + 1);
        reconnectAll();
      }, Math.min(1000 * Math.pow(2, connectionAttempts), 30000)); // Exponential backoff, max 30s

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, user, connectionAttempts, reconnectAll]);

  // Reset connection attempts on successful connection
  useEffect(() => {
    if (isConnected) {
      setConnectionAttempts(0);
    }
  }, [isConnected]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored, reconnecting real-time...');
      reconnectAll();
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      showToast('Network connection lost', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnectAll, showToast]);

  // Page visibility handling - reconnect when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Page became visible, check connection and reconnect if needed
        setTimeout(() => {
          if (!isConnected) {
            console.log('Page visible, reconnecting real-time...');
            reconnectAll();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, user, reconnectAll]);

  return (
    <>
      {children}
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator 
        isConnected={isConnected}
        connectionAttempts={connectionAttempts}
        onReconnect={reconnectAll}
        user={user}
      />
    </>
  );
};

/**
 * Visual indicator for real-time connection status
 */
const ConnectionStatusIndicator = ({ isConnected, connectionAttempts, onReconnect, user }) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Show indicator when disconnected or reconnecting
  useEffect(() => {
    if (!user) {
      setShowIndicator(false);
      return;
    }

    if (!isConnected || connectionAttempts > 0) {
      setShowIndicator(true);
    } else {
      // Hide after successful connection with a delay
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionAttempts, user]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await onReconnect();
    } finally {
      setTimeout(() => setIsReconnecting(false), 1000);
    }
  };

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300
        ${isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-yellow-500 text-black'
        }
      `}>
        {isConnected ? (
          <>
            <Wifi size={16} />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>
              {connectionAttempts > 0 
                ? `Reconnecting... (${connectionAttempts})`
                : 'Disconnected'
              }
            </span>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors"
              aria-label="Reconnect"
            >
              <RefreshCw 
                size={14} 
                className={isReconnecting ? 'animate-spin' : ''} 
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for components to check real-time connection status
 */
export const useRealtimeStatus = () => {
  const { realtimeStatus } = useStore((state) => ({
    realtimeStatus: state.ui?.realtimeStatus || {
      isConnected: false,
      lastConnectionTime: null,
      connectionAttempts: 0,
      subscriptions: {},
    },
  }));

  return realtimeStatus;
};

/**
 * Component to display detailed connection info (for debugging)
 */
export const RealtimeDebugInfo = () => {
  const status = useRealtimeStatus();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-2 py-1 rounded text-xs"
      >
        RT Debug
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white p-3 rounded text-xs min-w-64">
          <div className="space-y-1">
            <div>Status: {status.isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
            <div>Attempts: {status.connectionAttempts}</div>
            <div>Last Connected: {status.lastConnectionTime ? new Date(status.lastConnectionTime).toLocaleTimeString() : 'Never'}</div>
            <div className="mt-2 text-xs text-gray-300">Subscriptions:</div>
            {Object.entries(status.subscriptions).map(([key, connected]) => (
              <div key={key} className="ml-2">
                {key}: {connected ? '✅' : '❌'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeManager;
