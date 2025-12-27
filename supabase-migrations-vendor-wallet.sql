-- ============================================
-- Vendor Wallet and Payout System Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Vendor Wallet Table
CREATE TABLE IF NOT EXISTS vendor_wallets (
  id BIGSERIAL PRIMARY KEY,
  vendor_email TEXT NOT NULL UNIQUE,
  available_balance DECIMAL(10, 2) DEFAULT 0,
  pending_balance DECIMAL(10, 2) DEFAULT 0,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Methods Table
CREATE TABLE IF NOT EXISTS payout_methods (
  id BIGSERIAL PRIMARY KEY,
  vendor_email TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank', 'stripe')),
  method_name TEXT NOT NULL, -- e.g., "Chase Checking", "Stripe Account"
  is_default BOOLEAN DEFAULT FALSE,
  -- Bank account fields (encrypted/masked in production)
  bank_name TEXT,
  account_number_masked TEXT, -- Last 4 digits only
  routing_number TEXT, -- Encrypted in production
  account_holder_name TEXT,
  -- Stripe fields
  stripe_account_id TEXT, -- Stripe Connect account ID
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_default_per_vendor UNIQUE (vendor_email, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id BIGSERIAL PRIMARY KEY,
  vendor_email TEXT NOT NULL,
  payout_method_id BIGINT REFERENCES payout_methods(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  minimum_threshold DECIMAL(10, 2) DEFAULT 50.00, -- Minimum withdrawal amount
  fee DECIMAL(10, 2) DEFAULT 0, -- Processing fee
  net_amount DECIMAL(10, 2), -- Amount after fees
  transaction_id TEXT, -- External transaction ID (Stripe, bank transfer, etc.)
  failure_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_wallets_email ON vendor_wallets(vendor_email);
CREATE INDEX IF NOT EXISTS idx_payout_methods_vendor ON payout_methods(vendor_email);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_vendor ON withdrawal_requests(vendor_email);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable Row Level Security
ALTER TABLE vendor_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can view their own wallet" ON vendor_wallets;
DROP POLICY IF EXISTS "Vendors can update their own wallet" ON vendor_wallets;
DROP POLICY IF EXISTS "Vendors can view their own payout methods" ON payout_methods;
DROP POLICY IF EXISTS "Vendors can insert their own payout methods" ON payout_methods;
DROP POLICY IF EXISTS "Vendors can update their own payout methods" ON payout_methods;
DROP POLICY IF EXISTS "Vendors can delete their own payout methods" ON payout_methods;
DROP POLICY IF EXISTS "Vendors can view their own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Vendors can create their own withdrawal requests" ON withdrawal_requests;

-- Vendor Wallets Policies
CREATE POLICY "Vendors can view their own wallet" ON vendor_wallets
  FOR SELECT USING (auth.uid()::text = vendor_email);

CREATE POLICY "Vendors can update their own wallet" ON vendor_wallets
  FOR UPDATE USING (auth.uid()::text = vendor_email);

-- Payout Methods Policies
CREATE POLICY "Vendors can view their own payout methods" ON payout_methods
  FOR SELECT USING (auth.uid()::text = vendor_email);

CREATE POLICY "Vendors can insert their own payout methods" ON payout_methods
  FOR INSERT WITH CHECK (auth.uid()::text = vendor_email);

CREATE POLICY "Vendors can update their own payout methods" ON payout_methods
  FOR UPDATE USING (auth.uid()::text = vendor_email);

CREATE POLICY "Vendors can delete their own payout methods" ON payout_methods
  FOR DELETE USING (auth.uid()::text = vendor_email);

-- Withdrawal Requests Policies
CREATE POLICY "Vendors can view their own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (auth.uid()::text = vendor_email);

CREATE POLICY "Vendors can create their own withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid()::text = vendor_email);

-- Function to update wallet when escrow is released
CREATE OR REPLACE FUNCTION update_vendor_wallet_on_escrow_release()
RETURNS TRIGGER AS $$
BEGIN
  -- When order escrow is released, add to vendor's available balance
  IF NEW.escrow_status = 'escrow_released' AND OLD.escrow_status != 'escrow_released' THEN
    -- Get vendor email from listing through regional batch
    DECLARE
      vendor_email TEXT;
    BEGIN
      SELECT l.owner_email INTO vendor_email
      FROM listings l
      JOIN regional_batches rb ON rb.listing_id = l.id
      WHERE rb.id = NEW.regional_batch_id;
      
      IF vendor_email IS NOT NULL THEN
        -- Update or insert wallet
        INSERT INTO vendor_wallets (vendor_email, available_balance, total_earned)
        VALUES (vendor_email, NEW.total_price, NEW.total_price)
        ON CONFLICT (vendor_email) DO UPDATE
        SET 
          available_balance = vendor_wallets.available_balance + NEW.total_price,
          total_earned = vendor_wallets.total_earned + NEW.total_price,
          updated_at = NOW();
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet on escrow release
DROP TRIGGER IF EXISTS trigger_update_wallet_on_escrow_release ON orders;
CREATE TRIGGER trigger_update_wallet_on_escrow_release
  AFTER UPDATE OF escrow_status ON orders
  FOR EACH ROW
  WHEN (NEW.escrow_status = 'escrow_released' AND OLD.escrow_status != 'escrow_released')
  EXECUTE FUNCTION update_vendor_wallet_on_escrow_release();

-- Function to update wallet on withdrawal completion
CREATE OR REPLACE FUNCTION update_wallet_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- When withdrawal is completed, deduct from available balance
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE vendor_wallets
    SET 
      available_balance = available_balance - NEW.amount,
      total_withdrawn = total_withdrawn + NEW.amount,
      updated_at = NOW()
    WHERE vendor_email = NEW.vendor_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet on withdrawal
DROP TRIGGER IF EXISTS trigger_update_wallet_on_withdrawal ON withdrawal_requests;
CREATE TRIGGER trigger_update_wallet_on_withdrawal
  AFTER UPDATE OF status ON withdrawal_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_wallet_on_withdrawal();

