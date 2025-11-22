import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
// In production, this should come from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QEXAMPLE'; // Replace with your actual key

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * StripeProvider Component
 * Wraps the app with Stripe Elements provider
 */
const StripeProvider = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;

