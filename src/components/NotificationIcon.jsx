import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../stores';

/**
 * NotificationIcon Component
 * Displays notification icon with unread count badge
 */
const NotificationIcon = () => {
  const notifications = useNotifications();
  
  // Count unread notifications (assuming notifications have a read property)
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <button
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="Notifications"
      onClick={() => {
        // Notification functionality can be added here
        console.log('Notifications clicked');
      }}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationIcon;

