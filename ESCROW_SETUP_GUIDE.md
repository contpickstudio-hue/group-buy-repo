# Escrow Payment System - Setup Guide

## Quick Setup

### 1. Database Migration

Run the escrow migration in Supabase SQL Editor:

```bash
# Run: supabase-migrations-escrow-payments.sql
```

This adds:
- `escrow_status` column to `orders` table
- Automatic triggers for escrow release/refund
- Indexes for efficient escrow queries
- Vendor escrow summary view

### 2. Environment Variables

Add to your `.env` file:

```env
# Payment Provider Selection
VITE_PAYMENT_PROVIDER=mock  # Use 'mock' for development, 'stripe' for production

# Supabase Configuration (if using Stripe)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Stripe Setup (Production Only)

If using Stripe in production:

1. **Create Supabase Edge Functions**:
   - `create-payment-intent` - Creates escrow payment intent
   - `capture-payment` - Captures payment from escrow
   - `refund-payment` - Refunds payment to customer
   - `get-payment-status` - Gets payment status

2. **Configure Stripe Keys**:
   - Add Stripe secret key to Supabase Edge Function secrets
   - Do NOT hardcode keys in frontend code

3. **Set Environment Variable**:
   ```env
   VITE_PAYMENT_PROVIDER=stripe
   ```

### 4. Testing

#### Mock Provider (Development)
- Set `VITE_PAYMENT_PROVIDER=mock`
- Payments are simulated in-memory
- No real payment processing
- Perfect for development and testing

#### Stripe Provider (Production)
- Set `VITE_PAYMENT_PROVIDER=stripe`
- Requires Supabase Edge Functions
- Real payment processing
- Test with Stripe test keys first

## How It Works

### Payment Flow

1. **User Joins Group Buy**:
   - Payment is authorized but NOT captured
   - Funds held in escrow by payment provider
   - Order created with `escrow_status: 'escrow_held'`

2. **Batch Succeeds**:
   - Database trigger automatically releases escrow
   - Payments are captured (vendor receives funds)
   - Orders updated to `escrow_status: 'escrow_released'`

3. **Batch Fails**:
   - Database trigger automatically refunds escrow
   - Payments are refunded to customers
   - Orders updated to `escrow_status: 'escrow_refunded'`

### Key Features

- ✅ **Automatic Escrow**: Funds held automatically when order placed
- ✅ **Automatic Release**: Funds released when batch succeeds
- ✅ **Automatic Refunds**: Funds refunded when batch fails
- ✅ **Vendor Protection**: Vendors cannot access funds until success
- ✅ **Buyer Protection**: Buyers automatically refunded on failure
- ✅ **Provider Abstraction**: Easy to switch payment providers

## Verification

### Check Escrow Status

```javascript
import { getOrderEscrowStatus } from './services/escrowService';

const status = await getOrderEscrowStatus(orderId);
console.log(status.escrowStatus); // 'escrow_held', 'escrow_released', etc.
```

### Check Batch Escrow Total

```javascript
import { getBatchEscrowTotal } from './services/escrowService';

const total = await getBatchEscrowTotal(batchId);
console.log(total.total); // Total amount in escrow
```

## Troubleshooting

### Payments Not Going to Escrow

- Check that `createEscrowPayment()` is being called (not `createPaymentIntent()`)
- Verify `escrow: true` in payment metadata
- Check payment provider configuration

### Escrow Not Releasing

- Verify batch status is `'successful'`
- Check database triggers are active
- Review `releaseEscrowToVendor()` logs

### Refunds Not Processing

- Verify batch status is `'failed'` or `'cancelled'`
- Check payment provider refund API
- Review `refundEscrowToCustomers()` logs

## Next Steps

1. **Test with Mock Provider**: Verify flow works end-to-end
2. **Set Up Stripe Edge Functions**: If using Stripe
3. **Test with Stripe Test Keys**: Before going live
4. **Monitor Escrow Operations**: Track escrow status in dashboard

