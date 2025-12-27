-- ============================================
-- Database Migration for Referral System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_email TEXT NOT NULL,
  referred_email TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'joined', 'rewarded')) DEFAULT 'pending',
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  credits_issued DECIMAL(10, 2) DEFAULT 0,
  credits_issued_to_referee DECIMAL(10, 2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (
    auth.uid()::text = referrer_email OR auth.uid()::text = referred_email
  );

-- Users can create referrals
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid()::text = referrer_email
  );

-- Users can update their own referrals
DROP POLICY IF EXISTS "Users can update their referrals" ON referrals;
CREATE POLICY "Users can update their referrals" ON referrals
  FOR UPDATE USING (
    auth.uid()::text = referrer_email OR auth.uid()::text = referred_email
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_email ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_product_id ON referrals(product_id);

-- 2. Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('referral', 'bonus', 'promotion')),
  referral_id BIGINT REFERENCES referrals(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL
);

-- Enable Row Level Security for user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
DROP POLICY IF EXISTS "Users can view their credits" ON user_credits;
CREATE POLICY "Users can view their credits" ON user_credits
  FOR SELECT USING (auth.uid()::text = user_email);

-- Users can insert their own credits (system/admin will also insert)
DROP POLICY IF EXISTS "Users can create credits" ON user_credits;
CREATE POLICY "Users can create credits" ON user_credits
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid()::text = user_email
  );

-- Users can update their own unused credits
DROP POLICY IF EXISTS "Users can update their credits" ON user_credits;
CREATE POLICY "Users can update their credits" ON user_credits
  FOR UPDATE USING (
    auth.uid()::text = user_email AND used_at IS NULL
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_email ON user_credits(user_email);
CREATE INDEX IF NOT EXISTS idx_user_credits_referral_id ON user_credits(referral_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_used_at ON user_credits(used_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at) WHERE expires_at IS NOT NULL;

-- 3. Add referral_code to orders table (to track which order used referral)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS credits_applied DECIMAL(10, 2) DEFAULT 0;

-- Create index for referral_code in orders
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON orders(referral_code);

-- 4. Function to calculate user's total credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_email_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
  total_credits DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM user_credits
  WHERE user_email = user_email_param
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(user_email_param TEXT)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalReferrals', COUNT(*) FILTER (WHERE referrer_email = user_email_param),
    'successfulReferrals', COUNT(*) FILTER (WHERE referrer_email = user_email_param AND status = 'rewarded'),
    'totalCreditsEarned', COALESCE(SUM(credits_issued) FILTER (WHERE referrer_email = user_email_param), 0),
    'pendingReferrals', COUNT(*) FILTER (WHERE referrer_email = user_email_param AND status IN ('pending', 'joined'))
  ) INTO stats
  FROM referrals
  WHERE referrer_email = user_email_param;
  
  RETURN COALESCE(stats, '{"totalReferrals": 0, "successfulReferrals": 0, "totalCreditsEarned": 0, "pendingReferrals": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
