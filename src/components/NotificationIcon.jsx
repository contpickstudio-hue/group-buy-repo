import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../stores';
import NotificationPanel from './NotificationPanel';
import { useTranslation } from '../contexts/TranslationProvider';

/**
 * NotificationIcon Component
 * Displays notification icon with unread count badge and opens notification panel
 */
const NotificationIcon = () => {
  const notifications = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { t } = useTranslation();
  
  // Count unread notifications
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => n && !n.read).length : 0;
  const tooltipText = unreadCount > 0 
    ? t('navbar.notifications', null, 'Notifications') + ` (${unreadCount} unread)`
    : t('navbar.notifications', null, 'Notifications');

  return (
    <>
      <button
        className="relative p-2.5 sm:p-3 text-gray-600 hover:text-gray-900 transition-colors min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
        aria-label={tooltipText}
        title={tooltipText}
        onClick={() => setIsPanelOpen(true)}
      >
        <Bell size={20} className="flex-shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 sm:top-0 sm:right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <NotificationPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
};

export default NotificationIcon;

