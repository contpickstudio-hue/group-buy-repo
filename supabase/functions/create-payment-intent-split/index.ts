// Supabase Edge Function: create-payment-intent-split
// Creates a Stripe PaymentIntent with automatic revenue split to vendor

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      amount,
      currency = 'cad',
      vendorStripeAccountId,
      platformFeeAmount,
      vendorPayoutAmount,
      orderId,
      productId,
      customerEmail,
      metadata = {},
    } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vendorStripeAccountId) {
      return new Response(
        JSON.stringify({ error: 'Vendor Stripe account ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountInCents = Math.round(amount * 100);
    const platformFeeInCents = Math.round(platformFeeAmount * 100);
    const vendorPayoutInCents = Math.round(vendorPayoutAmount * 100);

    // Create PaymentIntent with application fee (platform fee)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      application_fee_amount: platformFeeInCents,
      transfer_data: {
        destination: vendorStripeAccountId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId || '',
        productId: productId || '',
        customerEmail: customerEmail || '',
        platformFee: platformFeeAmount.toString(),
        vendorPayout: vendorPayoutAmount.toString(),
        ...metadata,
      },
      capture_method: 'manual', // Escrow: hold payment until fulfillment
      confirmation_method: 'manual',
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        platformFee: platformFeeAmount,
        vendorPayout: vendorPayoutAmount,
        transferId: paymentIntent.transfer_data?.destination,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment intent with split:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

