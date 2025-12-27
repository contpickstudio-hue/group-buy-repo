-- ============================================
-- Regional Marketplace Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Create listings table (extends/replaces products)
CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_data_url TEXT,
  image_color TEXT,
  origin_location TEXT NOT NULL,  -- Seller location (e.g., "Montreal")
  owner_email TEXT NOT NULL,
  vendor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regional_batches table (new core abstraction)
CREATE TABLE IF NOT EXISTS regional_batches (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES listings(id) ON DELETE CASCADE,
  region TEXT NOT NULL,  -- e.g., "Hamilton", "Toronto"
  price DECIMAL(10, 2) NOT NULL,  -- Region-specific price
  minimum_quantity INTEGER NOT NULL DEFAULT 1,
  cutoff_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup_point', 'direct_delivery')),
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'ready_to_deliver', 'cancelled', 'delivered')),
  current_quantity INTEGER DEFAULT 0,  -- Aggregated from orders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add regional_batch_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS regional_batch_id BIGINT REFERENCES regional_batches(id);

-- Add refund_required flag to orders for cancelled batches
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_required BOOLEAN DEFAULT FALSE;

-- Create index on regional_batch_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_regional_batch_id ON orders(regional_batch_id);
CREATE INDEX IF NOT EXISTS idx_regional_batches_listing_id ON regional_batches(listing_id);
CREATE INDEX IF NOT EXISTS idx_regional_batches_status ON regional_batches(status);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
DROP POLICY IF EXISTS "Users can insert listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;

DROP POLICY IF EXISTS "Regional batches are viewable by everyone" ON regional_batches;
DROP POLICY IF EXISTS "Users can insert regional batches" ON regional_batches;
DROP POLICY IF EXISTS "Users can update their own regional batches" ON regional_batches;
DROP POLICY IF EXISTS "Users can delete their own regional batches" ON regional_batches;

-- Listings Policies
CREATE POLICY "Listings are viewable by everyone" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert listings" ON listings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (
    auth.uid()::text = owner_email OR
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listings.id
      AND l.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (
    auth.uid()::text = owner_email OR
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listings.id
      AND l.owner_email = auth.uid()::text
    )
  );

-- Regional Batches Policies
CREATE POLICY "Regional batches are viewable by everyone" ON regional_batches
  FOR SELECT USING (true);

CREATE POLICY "Users can insert regional batches" ON regional_batches
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = regional_batches.listing_id
      AND listings.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own regional batches" ON regional_batches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = regional_batches.listing_id
      AND listings.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own regional batches" ON regional_batches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = regional_batches.listing_id
      AND listings.owner_email = auth.uid()::text
    )
  );

-- Function to update current_quantity in regional_batches
CREATE OR REPLACE FUNCTION update_regional_batch_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE regional_batches
    SET current_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM orders
      WHERE regional_batch_id = NEW.regional_batch_id
    )
    WHERE id = NEW.regional_batch_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update old batch if regional_batch_id changed
    IF OLD.regional_batch_id IS DISTINCT FROM NEW.regional_batch_id THEN
      UPDATE regional_batches
      SET current_quantity = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM orders
        WHERE regional_batch_id = OLD.regional_batch_id
      )
      WHERE id = OLD.regional_batch_id;
    END IF;
    -- Update new batch
    UPDATE regional_batches
    SET current_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM orders
      WHERE regional_batch_id = NEW.regional_batch_id
    )
    WHERE id = NEW.regional_batch_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE regional_batches
    SET current_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM orders
      WHERE regional_batch_id = OLD.regional_batch_id
    )
    WHERE id = OLD.regional_batch_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update batch quantities
DROP TRIGGER IF EXISTS trigger_update_batch_quantity ON orders;
CREATE TRIGGER trigger_update_batch_quantity
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_regional_batch_quantity();

-- Function to update listing updated_at timestamp
CREATE OR REPLACE FUNCTION update_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET updated_at = NOW()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update listing timestamp when batches change
DROP TRIGGER IF EXISTS trigger_update_listing_timestamp ON regional_batches;
CREATE TRIGGER trigger_update_listing_timestamp
  AFTER INSERT OR UPDATE ON regional_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_updated_at();

