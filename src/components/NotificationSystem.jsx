import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle, Clock, MessageSquare, Package, Users } from 'lucide-react';
import { useNotifications, useUIActions } from '../stores';

const NotificationBadge = ({ count, className = '' }) => {
  if (count === 0) return null;
  
  return (
    <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

const NotificationIcon = ({ type, size = 20 }) => {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
    message: MessageSquare,
    order: Package,
    errand: Users,
    product: Package,
  };
  
  const colors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    message: 'text-purple-500',
    order: 'text-indigo-500',
    errand: 'text-orange-500',
    product: 'text-teal-500',
  };
  
  const IconComponent = icons[type] || Info;
  const colorClass = colors[type] || 'text-gray-500';
  
  return <IconComponent size={size} className={colorClass} />;
};

const NotificationItem = ({ notification, onMarkAsRead, onRemove }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (!notification.read) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [notification.read]);

  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(notification.id);
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div
      className={`
        p-4 border-b border-gray-200 cursor-pointer transition-all duration-300 hover:bg-gray-50
        ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'}
        ${isAnimating ? 'animate-pulse' : ''}
      `}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.data?.type || notification.type} size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </p>
              <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <Clock size={12} className="mr-1" />
                {timeAgo(notification.timestamp)}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <button
                onClick={handleRemove}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Remove notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter = ({ isOpen, onClose }) => {
  const notifications = useNotifications();
  const { markNotificationAsRead, removeNotification, clearNotifications } = useUIActions();

  const unreadCount = notifications.filter(n => !n.read).length;
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  const clearAllNotifications = () => {
    clearNotifications();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bell size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <NotificationBadge count={unreadCount} />
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                className="text-sm text-red-600 hover:text-red-800 font-medium ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bell size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div>
                {sortedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markNotificationAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        <NotificationBadge count={unreadCount} />
      </button>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

// Toast notification component for real-time updates
const ToastNotification = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-remove after 5 seconds
    const timer2 = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(notification.id), 300);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.id]); // onRemove is stable, don't need it in deps

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <NotificationIcon type={notification.data?.type || notification.type} size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Container for toast notifications
const ToastContainer = () => {
  const [toastNotifications, setToastNotifications] = useState([]);
  const notifications = useNotifications();

  // Show toast for new notifications
  useEffect(() => {
    setToastNotifications(prev => {
      const newNotifications = notifications.filter(n => 
        !n.read && 
        !prev.some(t => t.id === n.id) &&
        Date.now() - new Date(n.timestamp).getTime() < 10000 // Only show toasts for notifications less than 10 seconds old
      );

      if (newNotifications.length > 0) {
        return [...prev, ...newNotifications];
      }
      return prev;
    });
  }, [notifications]); // Only depend on notifications, not toastNotifications

  const removeToast = (id) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toastNotifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

// Connection status indicator
const ConnectionStatus = () => {
  const [isVisible, setIsVisible] = useState(false);
  // For now, default to connected - real-time status can be added later
  const isConnected = true;

  useEffect(() => {
    if (!isConnected) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium
      ${isConnected 
        ? 'bg-green-500 text-white' 
        : 'bg-yellow-500 text-black'
      }
    `}>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>Connected</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <AlertTriangle size={16} />
          <span>Reconnecting...</span>
        </div>
      )}
    </div>
  );
};

export {
  NotificationButton,
  NotificationCenter,
  ToastContainer,
  ConnectionStatus,
  NotificationBadge,
  NotificationIcon,
};

export default NotificationButton;
