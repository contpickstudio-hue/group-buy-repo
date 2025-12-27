import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useGetTotalUnreadCount, useLoadChatThreads } from '../stores';
import ChatList from './ChatList';
import ChatModal from './ChatModal';

/**
 * ChatIcon Component
 * Displays chat icon with unread count badge and opens chat list
 */
const ChatIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const getTotalUnreadCount = useGetTotalUnreadCount();
  const loadChatThreads = useLoadChatThreads();

  const unreadCount = getTotalUnreadCount();

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Chat"
      >
        <MessageCircle size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat List Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-25"
            onClick={handleClosePanel}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
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

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                <ChatList onSelectChat={handleChatSelect} />
              </div>
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

