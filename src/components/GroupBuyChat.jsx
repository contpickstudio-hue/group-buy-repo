import React, { useState, useEffect, useRef } from 'react';
import { useUser, useActiveChats, useSetActiveThread, useSendMessage, useLoadChat, useActiveThread } from '../stores';
import { useGroupBuyChatRealtime } from '../hooks/useRealtime';
import { getGroupBuyThreadId } from '../services/chatService';
import VerifiedBadge from './VerifiedBadge';
import { t } from '../utils/translations';
import EmptyState from './EmptyState';

/**
 * GroupBuyChat Component
 * Chat interface for group buy coordination
 */
const GroupBuyChat = ({ productId, onClose }) => {
  const user = useUser();
  const activeChats = useActiveChats();
  const activeThread = useActiveThread();
  const setActiveThread = useSetActiveThread();
  const sendMessage = useSendMessage();
  const loadChat = useLoadChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const threadId = productId ? getGroupBuyThreadId(productId) : null;
  const messages = activeChats[threadId] || [];

  // Set up real-time subscription
  useGroupBuyChatRealtime(productId);

  // Load chat messages on mount
  useEffect(() => {
    if (productId && threadId) {
      setActiveThread(threadId);
      loadChat({ chatType: 'group_buy', productId }).then(() => {
        setIsLoading(false);
      });
    }
    
    return () => {
      // Clear active thread when component unmounts
      setActiveThread(null);
    };
  }, [productId, threadId, setActiveThread, loadChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !user || !productId) return;

    const content = messageInput.trim();
    setMessageInput('');

    await sendMessage(content, {
      chatType: 'group_buy',
      productId
    });
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please sign in to use chat
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <EmptyState 
              message={t('chat.noMessages')}
              className="text-gray-500"
            />
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderEmail === user.email;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.senderEmail}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={t('chat.typeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupBuyChat;

