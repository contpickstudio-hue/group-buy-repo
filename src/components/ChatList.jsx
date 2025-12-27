import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatThreads, useLoadChatThreads, useGetUnreadCount, useSetActiveThread } from '../stores';

/**
 * ChatList Component
 * List of all active chats for the current user
 */
const ChatList = ({ onSelectChat }) => {
  const chatThreads = useChatThreads();
  const loadChatThreads = useLoadChatThreads();
  const getUnreadCount = useGetUnreadCount();
  const setActiveThread = useSetActiveThread();

  useEffect(() => {
    loadChatThreads();
  }, [loadChatThreads]);

  const handleChatClick = (thread) => {
    setActiveThread(thread.threadId);
    if (onSelectChat) {
      onSelectChat(thread);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (chatThreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full min-h-[300px] text-center">
        <div className="mb-6">
          <MessageCircle size={64} className="mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No chats yet
        </h3>
        <p className="text-gray-500 max-w-sm">
          Chats will appear once you join a group buy or errand
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-sm">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Join a group buy or post an errand to start chatting with other community members!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {chatThreads.map((thread) => {
        const unreadCount = getUnreadCount(thread.threadId);
        const displayName = thread.chatType === 'direct' 
          ? (thread.otherUserEmail || 'Unknown User').split('@')[0]
          : thread.chatType === 'group_buy'
          ? `Group Buy Chat`
          : 'Chat';

        return (
          <button
            key={thread.threadId}
            onClick={() => handleChatClick(thread)}
            className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle size={20} className="text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">
                    {displayName}
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {thread.lastMessage || 'No messages yet'}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 text-xs text-gray-500">
                {formatTime(thread.lastMessageTime)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;

