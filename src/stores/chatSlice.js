import {
  sendGroupBuyMessage as apiSendGroupBuyMessage,
  sendDirectMessage as apiSendDirectMessage,
  loadGroupBuyMessages as apiLoadGroupBuyMessages,
  loadDirectMessages as apiLoadDirectMessages,
  markMessagesAsRead as apiMarkMessagesAsRead,
  getUnreadCount as apiGetUnreadCount,
  getUserChatThreads as apiGetUserChatThreads,
  getGroupBuyThreadId,
  getDirectThreadId
} from '../services/chatService';

export const createChatSlice = (set, get) => ({
  // Chat state
  activeChats: {}, // Map of threadId -> messages[]
  unreadCounts: {}, // Map of threadId -> count
  activeThread: null, // Currently active thread ID
  chatThreads: [], // List of all chat threads for the user
  chatLoading: false,
  chatError: null,

  // Actions
  setActiveThread: (threadId) => {
    set((state) => {
      state.activeThread = threadId;
      // Mark messages as read when opening thread
      if (threadId) {
        const { user } = get();
        if (user && user.email) {
          // Async mark as read - don't await
          apiMarkMessagesAsRead(threadId, user.email).then(() => {
            // Update unread count after marking as read
            get().refreshUnreadCount(threadId);
          });
        }
      }
    });
  },

  clearActiveThread: () => {
    set((state) => {
      state.activeThread = null;
    });
  },

  setChatMessages: (threadId, messages) => {
    set((state) => {
      state.activeChats[threadId] = messages || [];
    });
  },

  addMessageToChat: (threadId, message) => {
    set((state) => {
      if (!state.activeChats[threadId]) {
        state.activeChats[threadId] = [];
      }
      state.activeChats[threadId].push(message);
    });
  },

  setUnreadCount: (threadId, count) => {
    set((state) => {
      state.unreadCounts[threadId] = count;
    });
  },

  incrementUnreadCount: (threadId) => {
    set((state) => {
      state.unreadCounts[threadId] = (state.unreadCounts[threadId] || 0) + 1;
    });
  },

  clearUnreadCount: (threadId) => {
    set((state) => {
      state.unreadCounts[threadId] = 0;
    });
  },

  setChatThreads: (threads) => {
    set((state) => {
      state.chatThreads = threads || [];
    });
  },

  // Async actions
  sendMessage: async (content, options = {}) => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    set((state) => {
      state.chatLoading = true;
      state.chatError = null;
    });

    try {
      let result;
      let threadId;

      if (options.chatType === 'group_buy' && options.productId) {
        threadId = getGroupBuyThreadId(options.productId);
        result = await apiSendGroupBuyMessage(options.productId, content, user.email);
      } else if (options.chatType === 'direct' && options.receiverEmail) {
        threadId = getDirectThreadId(user.email, options.receiverEmail);
        result = await apiSendDirectMessage(options.receiverEmail, content, user.email);
      } else {
        throw new Error('Invalid chat options');
      }

      if (result.success && result.message) {
        // Add message to local state
        const message = {
          id: result.message.id,
          productId: result.message.product_id,
          errandId: result.message.errand_id,
          chatType: result.message.chat_type,
          threadId: result.message.thread_id,
          senderEmail: result.message.sender_email,
          receiverEmail: result.message.receiver_email,
          content: result.message.content,
          read: result.message.read,
          createdAt: result.message.created_at
        };

        get().addMessageToChat(threadId, message);

        set((state) => {
          state.chatLoading = false;
        });

        return { success: true, message };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      set((state) => {
        state.chatError = error.message;
        state.chatLoading = false;
      });
      return { success: false, error: error.message };
    }
  },

  loadChat: async (options = {}) => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    set((state) => {
      state.chatLoading = true;
      state.chatError = null;
    });

    try {
      let result;
      let threadId;

      if (options.chatType === 'group_buy' && options.productId) {
        threadId = getGroupBuyThreadId(options.productId);
        result = await apiLoadGroupBuyMessages(options.productId);
      } else if (options.chatType === 'direct' && options.otherUserEmail) {
        threadId = getDirectThreadId(user.email, options.otherUserEmail);
        result = await apiLoadDirectMessages(options.otherUserEmail, user.email);
      } else {
        throw new Error('Invalid chat options');
      }

      if (result.success && result.messages) {
        get().setChatMessages(threadId, result.messages);
        
        // Refresh unread count
        get().refreshUnreadCount(threadId);

        set((state) => {
          state.chatLoading = false;
        });

        return { success: true, messages: result.messages, threadId };
      } else {
        throw new Error(result.error || 'Failed to load messages');
      }
    } catch (error) {
      set((state) => {
        state.chatError = error.message;
        state.chatLoading = false;
      });
      return { success: false, error: error.message };
    }
  },

  markAsRead: async (threadId) => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await apiMarkMessagesAsRead(threadId, user.email);
      if (result.success) {
        get().clearUnreadCount(threadId);
        return { success: true };
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  refreshUnreadCount: async (threadId) => {
    const { user } = get();
    if (!user || !user.email || !threadId) {
      return;
    }

    try {
      const result = await apiGetUnreadCount(threadId, user.email);
      if (result.success) {
        get().setUnreadCount(threadId, result.count);
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  },

  loadChatThreads: async () => {
    const { user } = get();
    if (!user || !user.email) {
      return { success: false, error: 'User not authenticated' };
    }

    set((state) => {
      state.chatLoading = true;
      state.chatError = null;
    });

    try {
      const result = await apiGetUserChatThreads(user.email);
      if (result.success && result.threads) {
        get().setChatThreads(result.threads);
        
        // Refresh unread counts for all threads
        result.threads.forEach(thread => {
          get().refreshUnreadCount(thread.threadId);
        });

        set((state) => {
          state.chatLoading = false;
        });

        return { success: true, threads: result.threads };
      } else {
        throw new Error(result.error || 'Failed to load chat threads');
      }
    } catch (error) {
      set((state) => {
        state.chatError = error.message;
        state.chatLoading = false;
      });
      return { success: false, error: error.message };
    }
  },

  getTotalUnreadCount: () => {
    const { unreadCounts } = get();
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  },

  getUnreadCount: (threadId) => {
    const { unreadCounts } = get();
    return unreadCounts[threadId] || 0;
  }
});

