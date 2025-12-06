# Create Payment Intent Edge Function

This Supabase Edge Function creates a Stripe PaymentIntent for secure payment processing with escrow functionality.

## Setup

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Set your Stripe secret key: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
4. Deploy the function: `supabase functions deploy create-payment-intent`

## Environment Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret key (required)

## Request Body

```json
{
  "amount": 100.00,
  "currency": "cad",
  "orderId": "order_123",
  "productId": "product_456",
  "customerEmail": "customer@example.com",
  "metadata": {
    "customField": "value"
  }
}
```

## Response

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 10000,
  "currency": "cad",
  "status": "requires_payment_method"
}
```

## Usage

The function creates a PaymentIntent with:
- Manual capture (escrow) - payment is held until order fulfillment
- Automatic payment methods enabled (credit card, debit, digital wallets)
- Metadata for order tracking

