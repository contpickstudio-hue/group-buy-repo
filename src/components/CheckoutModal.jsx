import React from 'react';
import CheckoutForm from './CheckoutForm';
import { Shield } from 'lucide-react';

const CheckoutModal = ({ isOpen, onClose, product, quantity = 1, orderId, onPaymentSuccess }) => {
  if (!isOpen) return null;
  
  const totalAmount = product?.price ? product.price * quantity : 0;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto my-auto">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
          
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Secure Checkout</h2>
            {product && (
              <div className="text-sm text-gray-600 mb-2">
                <p className="font-medium">{product.title}</p>
                {product.region && <p>Region: {product.region}</p>}
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  Total: ${totalAmount.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          {/* Escrow Protection Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Funds Protected in Escrow</p>
              <p className="text-xs">
                Your payment will be held securely until the group buy succeeds. 
                If it fails, you'll be automatically refunded.
              </p>
            </div>
          </div>
          
          <CheckoutForm
            amount={totalAmount}
            currency="cad"
            orderId={orderId}
            productId={product?.id}
            onSuccess={onPaymentSuccess}
            onCancel={onClose}
            metadata={{
              productTitle: product?.title,
              region: product?.region,
              quantity
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

