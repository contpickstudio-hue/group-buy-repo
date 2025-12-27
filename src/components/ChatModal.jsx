import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import GroupBuyChat from './GroupBuyChat';

/**
 * ChatModal Component
 * Modal wrapper for chat interfaces (group buy and direct chats)
 */
const ChatModal = ({ 
  isOpen, 
  onClose, 
  chatType = 'group_buy', // 'group_buy' or 'direct'
  productId = null,
  otherUserEmail = null,
  productTitle = null
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getHeaderTitle = () => {
    if (chatType === 'group_buy' && productTitle) {
      return `Chat: ${productTitle}`;
    }
    if (chatType === 'direct' && otherUserEmail) {
      return `Chat with ${otherUserEmail.split('@')[0]}`;
    }
    return 'Chat';
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto touch-manipulation"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      
      {/* Modal Content */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              {getHeaderTitle()}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close chat"
            >
              <X size={24} />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            {chatType === 'group_buy' && productId ? (
              <GroupBuyChat 
                productId={productId} 
                onClose={onClose}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                Direct chat not yet implemented
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;

