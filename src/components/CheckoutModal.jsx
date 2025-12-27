import React from 'react';

const CheckoutModal = ({ isOpen, onClose, product, orderId }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-4">Checkout</h2>
          <p className="text-gray-600">Checkout functionality</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

