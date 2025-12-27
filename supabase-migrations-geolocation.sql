-- ============================================
-- Geolocation Database Migration
-- Add location fields to products table for map-based discovery
-- Run this in Supabase SQL Editor
-- ============================================

-- Add location fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_radius INTEGER DEFAULT 5000; -- in meters, default 5km

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_products_location ON products(latitude, longitude);

-- Function to calculate distance between two points using Haversine formula
-- Returns distance in meters
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby products
-- Returns products within specified radius (in meters)
CREATE OR REPLACE FUNCTION nearby_products(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000
) RETURNS TABLE (
  id BIGINT,
  title TEXT,
  region TEXT,
  price DECIMAL,
  description TEXT,
  deadline DATE,
  delivery_date DATE,
  vendor TEXT,
  target_quantity INTEGER,
  current_quantity INTEGER,
  image_color TEXT,
  image_data_url TEXT,
  owner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  latitude DECIMAL,
  longitude DECIMAL,
  location_radius INTEGER,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.*,
    calculate_distance(user_lat, user_lng, p.latitude, p.longitude) AS distance_meters
  FROM products p
  WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lng, p.latitude, p.longitude) <= radius_meters
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete!
-- ============================================

