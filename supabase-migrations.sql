-- ============================================
-- Database Migrations for Enhanced Features
-- Run this in Supabase SQL Editor after initial setup
-- ============================================

-- 1. Add Stripe Connect fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS platform_fee_percent DECIMAL(5, 2) DEFAULT 15.00;

-- 2. Add vendor payout fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS vendor_payout_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS transfer_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_info JSONB,
ADD COLUMN IF NOT EXISTS pickup_info JSONB;

-- 3. Add vendor Stripe Connect account to users (via app_state or new table)
-- We'll use app_state for now, but create a vendors table for better structure
CREATE TABLE IF NOT EXISTS vendors (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'pending', -- pending, active, restricted
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own record
DROP POLICY IF EXISTS "Vendors can view their own record" ON vendors;
CREATE POLICY "Vendors can view their own record" ON vendors
  FOR SELECT USING (auth.uid()::text = email);

-- Vendors can update their own record
DROP POLICY IF EXISTS "Vendors can update their own record" ON vendors;
CREATE POLICY "Vendors can update their own record" ON vendors
  FOR UPDATE USING (auth.uid()::text = email);

-- Authenticated users can insert (for onboarding)
DROP POLICY IF EXISTS "Users can create vendor record" ON vendors;
CREATE POLICY "Users can create vendor record" ON vendors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = email);

-- 4. Create reviews table for vendors and helpers
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  reviewer_email TEXT NOT NULL,
  reviewee_email TEXT NOT NULL,
  order_id TEXT REFERENCES orders(id),
  errand_id BIGINT REFERENCES errands(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_type TEXT NOT NULL CHECK (review_type IN ('vendor', 'helper')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Users can create reviews for their own orders/errands
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = reviews.order_id 
        AND orders.customer_email = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM errands 
        WHERE errands.id = reviews.errand_id 
        AND errands.requester_email = auth.uid()::text
      )
    )
  );

-- 5. Create user engagement tracking table
CREATE TABLE IF NOT EXISTS user_engagement (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'view', 'click', 'join', 'purchase'
  entity_type TEXT NOT NULL, -- 'product', 'errand', 'vendor'
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user engagement
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement data
DROP POLICY IF EXISTS "Users can view their own engagement" ON user_engagement;
CREATE POLICY "Users can view their own engagement" ON user_engagement
  FOR SELECT USING (auth.uid()::text = user_email);

-- Users can insert their own engagement data
DROP POLICY IF EXISTS "Users can track their engagement" ON user_engagement;
CREATE POLICY "Users can track their engagement" ON user_engagement
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_email);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_email, review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_errand ON reviews(errand_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON user_engagement(user_email, created_at);
CREATE INDEX IF NOT EXISTS idx_engagement_entity ON user_engagement(entity_type, entity_id);

-- 7. Update orders policy to allow vendors to update fulfillment status
DROP POLICY IF EXISTS "Vendors can update their orders" ON orders;
CREATE POLICY "Vendors can update their orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = orders.product_id 
      AND products.owner_email = auth.uid()::text
    )
  );

-- ============================================
-- Migration Complete!
-- ============================================

