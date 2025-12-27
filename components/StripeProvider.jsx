import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
// In production, this should come from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QEXAMPLE'; // Replace with your actual key

// Suppress Stripe errors from adblockers - they're expected and handled gracefully
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY).catch((error) => {
  // Silently handle Stripe loading errors (e.g., ad blockers)
  // These errors are expected and don't affect app functionality
  if (import.meta.env.DEV) {
    console.warn('⚠️ Stripe blocked by ad blocker. Payment features will be unavailable.');
  }
  return null; // Return null instead of throwing
});

// Suppress Stripe fetch errors from console (adblocker-related)
// Note: Console errors from blocked resources may still appear but won't break functionality
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections for Stripe tracking/analytics
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    const errorStack = event.reason?.stack || '';
    
    // Suppress Stripe tracking/analytics errors (these are non-critical)
    const isStripeTrackingError = 
      errorMessage.includes('r.stripe.com') ||
      errorMessage.includes('m.stripe.com') ||
      errorMessage.includes('ERR_BLOCKED_BY_ADBLOCKER') ||
      (errorMessage.includes('Failed to fetch') && (errorMessage.includes('stripe.com') || errorStack.includes('stripe'))) ||
      (errorMessage.includes('FetchError') && (errorMessage.includes('stripe.com') || errorStack.includes('stripe')));
    
    if (isStripeTrackingError) {
      event.preventDefault(); // Prevent error from showing in console
      // Note: Console errors from network requests may still appear in browser dev tools
      // but this prevents them from bubbling up as unhandled rejections
      return;
    }
  }, { passive: true });
}

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

