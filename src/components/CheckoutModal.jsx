import React from 'react';
import CheckoutForm from './CheckoutForm';

/**
 * CheckoutModal Component
 * A modal wrapper for the checkout form with Stripe Elements
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
              {productName && (
                <p className="text-sm text-gray-600 mt-1">{productName}</p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
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

