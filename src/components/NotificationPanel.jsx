import React, { useEffect } from 'react';
import { useLoadNotifications } from '../stores';
import { X, Check, CheckCheck, Trash2, Bell } from 'lucide-react';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useRemoveNotification
} from '../stores';
// Simple date formatting helper
const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

/**
 * NotificationPanel Component
 * Displays list of notifications with read/unread states
 */
const NotificationPanel = ({ isOpen, onClose }) => {
  const notifications = useNotifications();
  const markNotificationAsRead = useMarkNotificationAsRead();
  const markAllNotificationsAsRead = useMarkAllNotificationsAsRead();
  const removeNotification = useRemoveNotification();
  const loadNotifications = useLoadNotifications();
  
  // Safety check: ensure notifications is an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsArray.filter(n => n && !n.read).length;
  const unreadNotifications = notificationsArray.filter(n => n && !n.read);
  const readNotifications = notificationsArray.filter(n => n && n.read);
  
  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleDelete = async (id) => {
    await removeNotification(id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-xl flex flex-col max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-gray-700 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                title="Mark all as read"
                aria-label="Mark all as read"
              >
                <CheckCheck size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notificationsArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No notifications</p>
              <p className="text-sm text-gray-500">
                You'll see notifications here for group buys, errands, and other updates.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      Unread ({unreadNotifications.length})
                    </p>
                  </div>
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      getNotificationIcon={getNotificationIcon}
                      getNotificationColor={getNotificationColor}
                    />
                  ))}
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div>
                  {unreadNotifications.length > 0 && (
                    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        Read ({readNotifications.length})
                      </p>
                    </div>
                  )}
                  {readNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      onDelete={() => handleDelete(notification.id)}
                      getNotificationIcon={getNotificationIcon}
                      getNotificationColor={getNotificationColor}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Item Component
 */
const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  getNotificationIcon,
  getNotificationColor
}) => {
  const timeAgo = formatTimeAgo(notification.createdAt || notification.timestamp);

  const handleClick = () => {
    // Mark as read when notification is clicked/opened
    if (!notification.read) {
      onMarkAsRead();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
        !notification.read ? 'bg-white cursor-pointer' : 'bg-gray-50'
      } hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-lg">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h3 className={`text-sm font-semibold mb-1 ${
              !notification.read ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h3>
          )}
          <p className={`text-sm ${
            !notification.read ? 'text-gray-900' : 'text-gray-600'
          }`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timeAgo}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-1">
          {!notification.read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              className="p-2 sm:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-w-[40px] min-h-[40px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center touch-manipulation"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 sm:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-w-[40px] min-h-[40px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center touch-manipulation"
            title="Delete"
            aria-label="Delete notification"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;

