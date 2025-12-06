import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
// In production, this should come from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QEXAMPLE'; // Replace with your actual key

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY).catch((error) => {
  // Handle Stripe loading errors (e.g., ad blockers)
  console.warn('Stripe failed to load. This may be due to an ad blocker.', error);
  return null; // Return null instead of throwing
});

/**
 * StripeProvider Component
 * Wraps the app with Stripe Elements provider
 * Gracefully handles cases where Stripe fails to load (e.g., ad blockers)
 */
const StripeProvider = ({ children }) => {
  const [stripeError, setStripeError] = useState(null);

  useEffect(() => {
    // Check if Stripe loaded successfully
    stripePromise.then((stripe) => {
      if (!stripe) {
        setStripeError('Stripe payment service is unavailable. Please disable your ad blocker to enable payments.');
      }
    });
  }, []);

  // If Stripe failed to load, render children without Stripe Elements
  // Payment features will be disabled but the app will still work
  if (stripeError) {
    // In development, show a console warning
    if (import.meta.env.DEV) {
      console.warn('⚠️ Stripe is blocked. Payment features will be unavailable.');
      console.warn('💡 To fix: Disable your ad blocker or add Stripe domains to allowlist.');
    }
    
    // Render children without Stripe wrapper
    // Payment components should check for Stripe availability before rendering
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;

