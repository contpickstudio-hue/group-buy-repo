import React, { useEffect } from 'react';
import CheckoutForm from './CheckoutForm';

/**
 * CheckoutModal Component
 * A modal wrapper for the checkout form with Stripe Elements
 * Mobile-optimized with scroll lock and proper touch handling
 */
const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  currency = 'cad',
  orderId,
  productId,
  productName,
  onSuccess,
  metadata = {}
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position
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

  const handleSuccess = (paymentData) => {
    if (onSuccess) {
      onSuccess(paymentData);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleCancel();
    }
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
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
      ></div>

      {/* Modal - Mobile optimized */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div 
          className="relative bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto touch-manipulation"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem)'
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
        >
          {/* Header - Mobile optimized */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 id="checkout-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Complete Payment
              </h2>
              {productName && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{productName}</p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Mobile optimized */}
          <div className="p-4 sm:p-6">
            <CheckoutForm
              amount={amount}
              currency={currency}
              orderId={orderId}
              productId={productId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              metadata={metadata}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

