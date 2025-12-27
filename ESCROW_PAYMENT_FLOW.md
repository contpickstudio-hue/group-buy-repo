# Escrow Payment Flow for Group Buys

## Overview

This document describes the payment and escrow system for group buys. Funds are held in escrow until the group buy succeeds or fails, ensuring buyers are protected and vendors only receive payment when successful.

## Architecture

### Payment Service Abstraction (`src/services/paymentService.js`)

- **Provider Pattern**: Abstracted payment provider interface supporting multiple providers (Stripe, PayPal, etc.)
- **Mock Provider**: Included for development/testing without real payment processing
- **Provider Selection**: Controlled via `VITE_PAYMENT_PROVIDER` environment variable

**Key Functions:**
- `createEscrowPayment()` - Create payment intent with funds held in escrow
- `capturePayment()` - Release funds from escrow to vendor
- `refundPayment()` - Return funds to customer
- `getPaymentStatus()` - Check payment status

### Escrow Service (`src/services/escrowService.js`)

Manages the escrow lifecycle for group buy orders.

**Escrow Statuses:**
- `escrow_pending` - Payment initiated but not yet in escrow
- `escrow_held` - Funds held in escrow
- `escrow_released` - Funds released to vendor (batch succeeded)
- `escrow_refunded` - Funds refunded to customer (batch failed)

**Key Functions:**
- `placeOrderInEscrow()` - Place order payment in escrow when user joins
- `releaseEscrowToVendor()` - Release funds when batch succeeds
- `refundEscrowToCustomers()` - Refund funds when batch fails
- `getOrderEscrowStatus()` - Get escrow status for an order
- `getBatchEscrowTotal()` - Get total escrow amount for a batch

## Payment Flow

### 1. User Joins Group Buy

1. User selects region and clicks "Place Order"
2. Checkout modal opens with payment form
3. `createEscrowPayment()` is called to create payment intent
4. Payment is authorized but **not captured** (funds held)
5. Order is created with:
   - `paymentStatus: 'authorized'`
   - `escrowStatus: 'escrow_held'`
   - `paymentIntentId: <stripe_payment_intent_id>`

### 2. Funds Held in Escrow

- Funds are held by payment provider (Stripe, etc.)
- Vendor **cannot access funds** until batch succeeds
- Orders show `escrow_held` status
- Database triggers automatically update escrow status

### 3. Batch Deadline Reached

When batch deadline passes, automatic status transition occurs:

**If batch succeeds** (quantity >= minimum):
- Batch status → `'successful'`
- Database trigger calls `releaseEscrowToVendor()`
- Each order's payment is **captured** (released to vendor)
- Order status updates:
  - `escrowStatus: 'escrow_released'`
  - `paymentStatus: 'paid'`

**If batch fails** (quantity < minimum):
- Batch status → `'failed'`
- Database trigger calls `refundEscrowToCustomers()`
- Each order's payment is **refunded** to customer
- Order status updates:
  - `escrowStatus: 'escrow_refunded'`
  - `paymentStatus: 'refunded'`

### 4. Manual Cancellation

If vendor cancels batch:
- Batch status → `'cancelled'`
- `cancelRegionalBatch()` automatically calls `refundEscrowToCustomers()`
- All orders refunded immediately

## Database Schema

### Orders Table Updates

```sql
ALTER TABLE orders 
ADD COLUMN escrow_status TEXT DEFAULT 'escrow_pending'
CHECK (escrow_status IN ('escrow_pending', 'escrow_held', 'escrow_released', 'escrow_refunded'));

ALTER TABLE orders
ADD COLUMN payment_intent_id TEXT; -- Payment provider's payment intent ID
```

### Automatic Triggers

1. **Release Escrow on Success**: When batch status changes to `'successful'`, automatically release escrow
2. **Refund on Failure**: When batch status changes to `'failed'` or `'cancelled'`, automatically refund

## Integration Points

### Order Creation (`src/pages/ListingDetailPage.jsx`)

```javascript
const handlePaymentSuccess = async (paymentData) => {
  // Place order in escrow
  const escrowResult = await placeOrderInEscrow(
    order.id,
    paymentData.paymentIntentId,
    order.totalPrice
  );
  
  // Create order with escrow status
  const order = {
    paymentStatus: 'authorized',
    escrowStatus: 'escrow_held',
    paymentIntentId: paymentData.paymentIntentId,
    // ...
  };
};
```

### Batch Status Transitions (`src/services/supabaseService.js`)

```javascript
// When batch succeeds
if (newStatus === 'successful') {
  await releaseEscrowToVendor(batch.id);
}

// When batch fails
if (newStatus === 'failed') {
  await refundEscrowToCustomers(batch.id);
}
```

### Checkout Form (`src/components/CheckoutForm.jsx`)

Uses `createEscrowPayment()` instead of regular payment intent to ensure funds are held in escrow.

## Security & Vendor Protection

1. **Vendor Cannot Access Funds Early**: Payments are authorized but not captured until batch succeeds
2. **Automatic Refunds**: Failed batches automatically refund all customers
3. **Database Triggers**: Ensure escrow operations happen atomically with status changes
4. **Payment Provider Security**: All payment operations go through secure payment provider APIs

## Testing

### Mock Payment Provider

For development/testing, use the `MockPaymentProvider`:
- Set `VITE_PAYMENT_PROVIDER=mock` in `.env`
- Payments are simulated in-memory
- No real payment processing occurs

### Stripe Integration

For production, use Stripe:
- Set `VITE_PAYMENT_PROVIDER=stripe` in `.env`
- Configure Stripe keys in Supabase Edge Functions
- Real payments are processed through Stripe

## Edge Cases Handled

1. **Partial Refunds**: Support for partial refunds if needed
2. **Payment Failures**: Failed payments don't create orders
3. **Retry Logic**: Escrow operations can be retried if they fail
4. **Offline Mode**: Demo users have escrow status tracked locally

## Future Enhancements

1. **Escrow Dashboard**: Show vendors total escrow amounts
2. **Refund Notifications**: Notify customers when refunds are processed
3. **Payment History**: Track all escrow operations
4. **Multi-Provider Support**: Add PayPal, Square, etc.

