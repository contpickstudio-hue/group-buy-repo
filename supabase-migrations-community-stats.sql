-- ============================================
-- Database Migration for Community Stats
-- Run this in Supabase SQL Editor
-- ============================================

-- Note: For savings calculation, we'll assume savings are based on group buying discount
-- If products had a retail_price column, we'd use: (retail_price - price) * quantity
-- For now, we'll calculate estimated savings as 15% of total spent on completed group buys

-- 1. Function to calculate total community savings
CREATE OR REPLACE FUNCTION get_community_savings()
RETURNS DECIMAL AS $$
DECLARE
  total_savings DECIMAL;
BEGIN
  -- Calculate savings from completed group buys
  -- Assumes 15% savings on group buy purchases (can be adjusted)
  SELECT COALESCE(SUM(o.total_price * 0.15), 0) INTO total_savings
  FROM orders o
  INNER JOIN products p ON p.id = o.product_id
  WHERE o.fulfillment_status = 'completed'
    AND p.current_quantity >= p.target_quantity
    AND p.target_quantity > 0;
  
  RETURN total_savings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to get user's contribution to community savings
CREATE OR REPLACE FUNCTION get_user_community_contribution(user_email_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
  user_contribution DECIMAL;
BEGIN
  -- Calculate user's contribution from their completed orders
  SELECT COALESCE(SUM(o.total_price * 0.15), 0) INTO user_contribution
  FROM orders o
  INNER JOIN products p ON p.id = o.product_id
  WHERE o.customer_email = user_email_param
    AND o.fulfillment_status = 'completed'
    AND p.current_quantity >= p.target_quantity
    AND p.target_quantity > 0;
  
  RETURN user_contribution;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get top contributors
CREATE OR REPLACE FUNCTION get_top_contributors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_email TEXT,
  contribution DECIMAL,
  orders_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.customer_email,
    SUM(o.total_price * 0.15)::DECIMAL AS contribution,
    COUNT(*)::BIGINT AS orders_count
  FROM orders o
  INNER JOIN products p ON p.id = o.product_id
  WHERE o.fulfillment_status = 'completed'
    AND p.current_quantity >= p.target_quantity
    AND p.target_quantity > 0
  GROUP BY o.customer_email
  ORDER BY contribution DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get savings by region
CREATE OR REPLACE FUNCTION get_savings_by_region()
RETURNS TABLE (
  region TEXT,
  total_savings DECIMAL,
  orders_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.region,
    SUM(o.total_price * 0.15)::DECIMAL AS total_savings,
    COUNT(*)::BIGINT AS orders_count
  FROM orders o
  INNER JOIN products p ON p.id = o.product_id
  WHERE o.fulfillment_status = 'completed'
    AND p.current_quantity >= p.target_quantity
    AND p.target_quantity > 0
  GROUP BY p.region
  ORDER BY total_savings DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View for easy querying of community stats (optional, for performance)
CREATE OR REPLACE VIEW community_stats_view AS
SELECT 
  COUNT(DISTINCT o.customer_email) AS total_participants,
  COUNT(DISTINCT o.product_id) AS completed_group_buys,
  SUM(o.total_price) AS total_spent,
  SUM(o.total_price * 0.15) AS total_savings,
  AVG(o.total_price * 0.15) AS avg_savings_per_order
FROM orders o
INNER JOIN products p ON p.id = o.product_id
WHERE o.fulfillment_status = 'completed'
  AND p.current_quantity >= p.target_quantity
  AND p.target_quantity > 0;

