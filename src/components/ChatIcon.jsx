import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useGetTotalUnreadCount, useLoadChatThreads, useChatThreads } from '../stores';
import ChatList from './ChatList';
import ChatModal from './ChatModal';

/**
 * ChatIcon Component
 * Displays chat icon with unread count badge and opens chat list
 */
const ChatIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const getTotalUnreadCount = useGetTotalUnreadCount();
  const loadChatThreads = useLoadChatThreads();
  const chatThreads = useChatThreads();

  const unreadCount = getTotalUnreadCount();
  const hasChats = Array.isArray(chatThreads) && chatThreads.length > 0;

  useEffect(() => {
    // Load chat threads when icon is clicked
    if (isOpen) {
      loadChatThreads();
    }
  }, [isOpen, loadChatThreads]);

  const handleChatSelect = (thread) => {
    if (thread) {
      setSelectedChat(thread);
      setIsOpen(false);
    } else {
      // If null is passed, just close the panel (used by empty state CTAs)
      setIsOpen(false);
    }
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  const handleClosePanel = () => {
    setIsOpen(false);
  };

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClosePanel();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <>
      <div 
        className="relative"
        onMouseEnter={() => !hasChats && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 transition-colors ${
            hasChats 
              ? 'text-gray-600 hover:text-gray-900' 
              : 'text-gray-400 hover:text-gray-500 opacity-75'
          }`}
          aria-label={hasChats ? "Chat" : "Chat (no chats yet)"}
          title={!hasChats ? "No chats yet. Join a group buy or errand to start chatting." : undefined}
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        
        {/* Tooltip for when there are no chats */}
        {!hasChats && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            <div className="text-center">
              <div className="font-semibold mb-1">No chats yet</div>
              <div className="text-xs text-gray-300">Join a group buy or errand to start chatting</div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* Chat List Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-25"
            onClick={handleClosePanel}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                aria-label="Close chats"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat List - Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <ChatList onSelectChat={handleChatSelect} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal for selected chat */}
      {selectedChat && (
        <ChatModal
          isOpen={!!selectedChat}
          onClose={handleCloseChat}
          chatType={selectedChat.chatType}
          productId={selectedChat.productId}
          otherUserEmail={selectedChat.otherUserEmail}
          productTitle={selectedChat.chatType === 'group_buy' ? 'Group Buy Chat' : null}
        />
      )}
    </>
  );
};

export default ChatIcon;

