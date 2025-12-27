-- ============================================
-- Escrow Payment System Migration
-- Adds escrow status tracking to orders
-- Run this in Supabase SQL Editor
-- ============================================

-- Add escrow status column to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'escrow_pending'
CHECK (escrow_status IN ('escrow_pending', 'escrow_held', 'escrow_released', 'escrow_refunded'));

-- Update payment_status to support escrow states
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'authorized', 'paid', 'refunded', 'failed', 'cancelled'));

-- Create index for efficient escrow queries
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_batch_escrow ON orders(regional_batch_id, escrow_status) 
WHERE escrow_status = 'escrow_held';

-- Function to automatically release escrow when batch succeeds
CREATE OR REPLACE FUNCTION release_escrow_on_batch_success()
RETURNS TRIGGER AS $$
BEGIN
  -- When batch status changes to 'successful', mark orders for escrow release
  IF NEW.status = 'successful' AND OLD.status != 'successful' THEN
    UPDATE orders
    SET escrow_status = 'escrow_released',
        payment_status = 'paid',
        payment_date = NOW(),
        updated_at = NOW()
    WHERE regional_batch_id = NEW.id
      AND escrow_status = 'escrow_held';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to release escrow on batch success
DROP TRIGGER IF EXISTS trigger_release_escrow_on_success ON regional_batches;
CREATE TRIGGER trigger_release_escrow_on_success
  AFTER UPDATE OF status ON regional_batches
  FOR EACH ROW
  WHEN (NEW.status = 'successful' AND OLD.status != 'successful')
  EXECUTE FUNCTION release_escrow_on_batch_success();

-- Function to automatically flag orders for refund when batch fails
CREATE OR REPLACE FUNCTION flag_refund_on_batch_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- When batch status changes to 'failed' or 'cancelled', flag orders for refund
  IF (NEW.status = 'failed' OR NEW.status = 'cancelled') 
     AND (OLD.status != 'failed' AND OLD.status != 'cancelled') THEN
    UPDATE orders
    SET refund_required = TRUE,
        escrow_status = 'escrow_refunded',
        payment_status = 'refunded',
        updated_at = NOW()
    WHERE regional_batch_id = NEW.id
      AND escrow_status = 'escrow_held';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to flag refunds on batch failure
DROP TRIGGER IF EXISTS trigger_flag_refund_on_failure ON regional_batches;
CREATE TRIGGER trigger_flag_refund_on_failure
  AFTER UPDATE OF status ON regional_batches
  FOR EACH ROW
  WHEN ((NEW.status = 'failed' OR NEW.status = 'cancelled') 
        AND (OLD.status != 'failed' AND OLD.status != 'cancelled'))
  EXECUTE FUNCTION flag_refund_on_batch_failure();

-- View for vendor escrow summary (funds held in escrow)
CREATE OR REPLACE VIEW vendor_escrow_summary AS
SELECT 
  l.owner_email as vendor_email,
  rb.id as batch_id,
  rb.region,
  COUNT(o.id) as order_count,
  SUM(o.total_price) as total_escrow_amount,
  rb.status as batch_status
FROM regional_batches rb
JOIN listings l ON l.id = rb.listing_id
LEFT JOIN orders o ON o.regional_batch_id = rb.id 
  AND o.escrow_status = 'escrow_held'
GROUP BY l.owner_email, rb.id, rb.region, rb.status;

-- Grant access to authenticated users
GRANT SELECT ON vendor_escrow_summary TO authenticated;

