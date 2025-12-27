/**
 * Notification Service
 * Manages persistent notifications stored in database
 */

import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';
import { dbSaveSlice, dbLoadSlice, StorageKeys } from './supabaseService';

/**
 * Create a notification
 */
export async function createNotification(userEmail, type, message, title = null, data = null) {
  return await apiCall(async () => {
    // Also add to local store immediately for instant UI update
    try {
      const { useAppStore } = await import('../stores');
      const appStore = useAppStore.getState();
      const currentUser = appStore.user?.email || appStore.user?.id;
      
      // Only add to store if it's for the current user
      if (currentUser === userEmail && appStore.addNotification) {
        const notificationId = Date.now() + Math.random();
        appStore.addNotification({
          id: notificationId,
          type,
          title,
          message,
          data,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to add notification to store:', error);
    }

    if (!supabaseClient) {
      // Demo mode - save to localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      const newNotification = {
        id: Date.now(),
        userEmail,
        type,
        title,
        message,
        read: false,
        data,
        createdAt: new Date().toISOString()
      };
      storedNotifications.push(newNotification);
      await dbSaveSlice(StorageKeys.notifications, storedNotifications);
      return { success: true, notification: newNotification };
    }

    // Use RPC function if available
    let notificationId;
    let notificationData;
    
    try {
      const { data: rpcId, error: rpcError } = await supabaseClient.rpc('create_notification', {
        p_user_email: userEmail,
        p_type: type,
        p_message: message,
        p_title: title,
        p_data: data
      });
      
      if (!rpcError && rpcId) {
        notificationId = rpcId;
      } else {
        throw new Error('RPC failed');
      }
    } catch (rpcErr) {
      // Fallback to direct insert
      const { data, error } = await supabaseClient
        .from('notifications')
        .insert({
          user_email: userEmail,
          type,
          title,
          message,
          data
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      notificationId = data.id;
      notificationData = data;
    }

    // Update store if this is for the current user
    try {
      const { useAppStore } = await import('../stores');
      const appStore = useAppStore.getState();
      const currentUser = appStore.user?.email || appStore.user?.id;
      if (currentUser === userEmail) {
        // Reload notifications to sync with database
        if (appStore.loadNotifications) {
          appStore.loadNotifications();
        }
      }
    } catch (error) {
      console.warn('Failed to sync notification to store:', error);
    }

    return {
      success: true,
      notification: notificationData ? {
        id: notificationData.id,
        userEmail: notificationData.user_email,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        read: notificationData.read,
        data: notificationData.data,
        createdAt: notificationData.created_at
      } : { id: notificationId }
    };
  }, {
    context: 'Creating notification',
    showToast: false
  });
}

/**
 * Load notifications for a user
 */
export async function loadNotifications(userEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - load from localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      const userNotifications = storedNotifications
        .filter(n => n.userEmail === userEmail)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        success: true,
        notifications: userNotifications
      };
    }

    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to last 100 notifications

    if (error) {
      throw error;
    }

    return {
      success: true,
      notifications: (data || []).map(n => ({
        id: n.id,
        userEmail: n.user_email,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        data: n.data,
        createdAt: n.created_at
      }))
    };
  }, {
    context: 'Loading notifications',
    showToast: false
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId, userEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - update localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      const notification = storedNotifications.find(n => n.id === notificationId && n.userEmail === userEmail);
      if (notification) {
        notification.read = true;
        await dbSaveSlice(StorageKeys.notifications, storedNotifications);
      }
      return { success: true };
    }

    // Use RPC function if available
    const { error: rpcError } = await supabaseClient.rpc('mark_notification_read', {
      p_notification_id: notificationId,
      p_user_email: userEmail
    });

    if (rpcError) {
      // Fallback to direct update
      const { error } = await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_email', userEmail);

      if (error) {
        throw error;
      }
    }

    return { success: true };
  }, {
    context: 'Marking notification as read',
    showToast: false
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - update localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      storedNotifications.forEach(n => {
        if (n.userEmail === userEmail) {
          n.read = true;
        }
      });
      await dbSaveSlice(StorageKeys.notifications, storedNotifications);
      return { success: true };
    }

    // Use RPC function if available
    const { error: rpcError } = await supabaseClient.rpc('mark_all_notifications_read', {
      p_user_email: userEmail
    });

    if (rpcError) {
      // Fallback to direct update
      const { error } = await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('user_email', userEmail)
        .eq('read', false);

      if (error) {
        throw error;
      }
    }

    return { success: true };
  }, {
    context: 'Marking all notifications as read',
    showToast: false
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - count from localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      const unreadCount = storedNotifications.filter(
        n => n.userEmail === userEmail && !n.read
      ).length;
      return {
        success: true,
        count: unreadCount
      };
    }

    // Use RPC function if available
    const { data: count, error: rpcError } = await supabaseClient.rpc('get_unread_notification_count', {
      p_user_email: userEmail
    });

    if (rpcError) {
      // Fallback to direct count
      const { count, error } = await supabaseClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_email', userEmail)
        .eq('read', false);

      if (error) {
        throw error;
      }

      return {
        success: true,
        count: count || 0
      };
    }

    return {
      success: true,
      count: count || 0
    };
  }, {
    context: 'Getting unread notification count',
    showToast: false
  });
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, userEmail) {
  return await apiCall(async () => {
    if (!supabaseClient) {
      // Demo mode - remove from localStorage
      const storedNotifications = await dbLoadSlice(StorageKeys.notifications, []);
      const filtered = storedNotifications.filter(
        n => !(n.id === notificationId && n.userEmail === userEmail)
      );
      await dbSaveSlice(StorageKeys.notifications, filtered);
      return { success: true };
    }

    const { error } = await supabaseClient
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_email', userEmail);

    if (error) {
      throw error;
    }

    return { success: true };
  }, {
    context: 'Deleting notification',
    showToast: false
  });
}
