import { createNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/notificationService';
import { useAuthStore } from './authStore';

export const createUISlice = (set, get) => ({
  // UI state
  currentScreen: 'start',
  loading: false,
  error: null,
  notifications: [],
  notificationsLoading: false,

  setCurrentScreen: (screen) => {
    set((state) => {
      state.currentScreen = screen;
    });
  },

  setLoading: (loading) => {
    set((state) => {
      state.loading = loading;
    });
  },

  setError: (error) => {
    set((state) => {
      state.error = error;
    });
  },

  clearError: () => {
    set((state) => {
      state.error = null;
    });
  },

  setNotifications: (notifications) => {
    set((state) => {
      state.notifications = notifications || [];
    });
  },

  addNotification: async (notification) => {
    const id = notification.id || Date.now() + Math.random();
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || user?.id;
    
    // Optimistically add to local state
    const newNotification = {
      ...notification,
      id,
      read: false,
      timestamp: notification.timestamp || new Date().toISOString(),
      createdAt: notification.createdAt || notification.timestamp || new Date().toISOString()
    };
    
    set((state) => {
      state.notifications.unshift(newNotification); // Add to beginning
    });

    // Persist to database if user is logged in
    if (userEmail) {
      try {
        await createNotification(
          userEmail,
          notification.type || 'info',
          notification.message,
          notification.title,
          notification.data
        );
      } catch (error) {
        console.error('Failed to persist notification:', error);
        // Continue anyway - notification is in local state
      }
    }

    return id;
  },

  removeNotification: async (id) => {
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || user?.id;
    
    // Remove from local state
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });

    // Delete from database if user is logged in
    if (userEmail) {
      try {
        await deleteNotification(id, userEmail);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
    });
  },

  markNotificationAsRead: async (id) => {
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || user?.id;
    
    // Update local state
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });

    // Persist to database if user is logged in
    if (userEmail) {
      try {
        await markNotificationAsRead(id, userEmail);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  },

  markAllNotificationsAsRead: async () => {
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || user?.id;
    
    // Update local state
    set((state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    });

    // Persist to database if user is logged in
    if (userEmail) {
      try {
        await markAllNotificationsAsRead(userEmail);
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  },

  loadNotifications: async () => {
    const user = useAuthStore.getState().user;
    const userEmail = user?.email || user?.id;
    
    if (!userEmail) {
      return { success: true, notifications: [] };
    }

    set((state) => {
      state.notificationsLoading = true;
    });

    try {
      const { loadNotifications } = await import('../services/notificationService');
      const result = await loadNotifications(userEmail);
      
      if (result.success) {
        set((state) => {
          state.notifications = result.notifications || [];
          state.notificationsLoading = false;
        });
      }
      
      return result;
    } catch (error) {
      set((state) => {
        state.notificationsLoading = false;
      });
      return { success: false, error: error.message };
    }
  }
});

