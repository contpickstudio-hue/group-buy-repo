import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../services/paymentService';
import { useUser } from '../stores';
import toast from 'react-hot-toast';

/**
 * CheckoutForm Component
 * A React component for processing payments using Stripe Elements
 * Supports credit cards, debit cards, and digital wallets
 */
const CheckoutForm = ({ 
  amount, 
  currency = 'cad',
  orderId,
  productId,
  onSuccess,
  onCancel,
  metadata = {}
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const user = useUser();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      if (!user || !amount) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await createPaymentIntent({
          amount,
          currency,
          orderId,
          productId,
          customerEmail: user.email,
          metadata: {
            customerName: user.name || user.email,
            ...metadata
          }
        });

        if (result.success && result.data) {
          setClientSecret(result.data.clientSecret);
          setPaymentIntentId(result.data.paymentIntentId);
        } else {
          setError(result.error || 'Failed to initialize payment');
          toast.error(result.error || 'Failed to initialize payment');
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize payment');
        toast.error(err.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [amount, currency, orderId, productId, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setIsProcessing(false);
        return;
      }

      // Confirm the payment intent
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required', // Don't redirect, handle in-app
      });

      if (confirmError) {
        setError(confirmError.message);
        setIsProcessing(false);
        return;
      }

      // Payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        if (onSuccess) {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            paymentIntent,
            orderId,
            productId
          });
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
        // Payment is held in escrow (requires manual capture)
        toast.success('Payment authorized! Funds are held until order fulfillment.');
        if (onSuccess) {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            paymentIntent,
            orderId,
            productId,
            escrow: true
          });
        }
      } else {
        setError(`Unexpected payment status: ${paymentIntent?.status}`);
        setIsProcessing(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during payment');
      setIsProcessing(false);
      toast.error(err.message || 'Payment failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Initializing payment...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error || 'Failed to initialize payment. Please try again.'}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        
        {/* Payment Element - Stripe handles the form UI */}
        <div className="mb-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodTypes: ['card'],
            }}
          />
        </div>

        {/* Amount Display */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${amount.toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💳 Payment is held securely until order fulfillment
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Processing...
              </span>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Secure Payment</p>
            <p className="mt-1">Your payment information is encrypted and processed securely by Stripe. We never store your card details.</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;

