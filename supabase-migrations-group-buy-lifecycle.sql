-- ============================================
-- Group Buy Lifecycle Migration
-- Updates regional_batches to support proper lifecycle states
-- Run this in Supabase SQL Editor
-- ============================================

-- Update status constraint to include new lifecycle states
ALTER TABLE regional_batches 
DROP CONSTRAINT IF EXISTS regional_batches_status_check;

ALTER TABLE regional_batches
ADD CONSTRAINT regional_batches_status_check 
CHECK (status IN ('draft', 'active', 'successful', 'failed', 'cancelled', 'delivered'));

-- Update default status to 'draft' for new batches
ALTER TABLE regional_batches
ALTER COLUMN status SET DEFAULT 'draft';

-- Function to automatically transition batches at deadline
CREATE OR REPLACE FUNCTION check_and_transition_batch_status()
RETURNS void AS $$
BEGIN
  -- Transition active batches past deadline
  UPDATE regional_batches
  SET 
    status = CASE
      WHEN current_quantity >= minimum_quantity THEN 'successful'
      ELSE 'failed'
    END,
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND cutoff_date < NOW()
    AND status NOT IN ('successful', 'failed', 'cancelled', 'delivered');
END;
$$ LANGUAGE plpgsql;

-- Function to activate a draft batch (vendor action)
CREATE OR REPLACE FUNCTION activate_batch(batch_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE regional_batches
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE 
    id = batch_id
    AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

-- Create index for efficient deadline checking
CREATE INDEX IF NOT EXISTS idx_regional_batches_deadline_status 
ON regional_batches(cutoff_date, status) 
WHERE status IN ('active', 'draft');

-- Add trigger to prevent price updates after activation
CREATE OR REPLACE FUNCTION prevent_price_update_after_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent price updates if batch is not in draft status
  IF OLD.status != 'draft' AND NEW.price != OLD.price THEN
    RAISE EXCEPTION 'Cannot update price after batch is activated. Current status: %', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_price_update ON regional_batches;
CREATE TRIGGER trigger_prevent_price_update
  BEFORE UPDATE ON regional_batches
  FOR EACH ROW
  EXECUTE FUNCTION prevent_price_update_after_activation();

