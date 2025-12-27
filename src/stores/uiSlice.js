export const createUISlice = (set, get) => ({
  // UI state
  currentScreen: 'start',
  loading: false,
  error: null,
  notifications: [],

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

  addNotification: (notification) => {
    const id = notification.id || Date.now() + Math.random();
    set((state) => {
      state.notifications.push({
        ...notification,
        id,
        read: false,
        timestamp: notification.timestamp || new Date().toISOString()
      });
    });
    return id;
  },

  removeNotification: (id) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
    });
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });
  },

  markAllNotificationsAsRead: () => {
    set((state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    });
  }
});

