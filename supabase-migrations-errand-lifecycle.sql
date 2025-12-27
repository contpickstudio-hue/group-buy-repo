-- ============================================
-- Errand Lifecycle Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Update errands table to support full lifecycle
ALTER TABLE errands 
ADD COLUMN IF NOT EXISTS requester_confirmed_completion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS helper_confirmed_completion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_released BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include new states
ALTER TABLE errands
DROP CONSTRAINT IF EXISTS errands_status_check;

ALTER TABLE errands
ADD CONSTRAINT errands_status_check
CHECK (status IN ('open', 'assigned', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'));

-- Update applications table to support acceptance
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));

-- Create errand ratings table
CREATE TABLE IF NOT EXISTS errand_ratings (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT REFERENCES errands(id) ON DELETE CASCADE,
  rater_email TEXT NOT NULL, -- Requester who rates
  rated_email TEXT NOT NULL, -- Helper being rated
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(errand_id, rater_email) -- One rating per errand per rater
);

-- Create index for helper active errand count
CREATE INDEX IF NOT EXISTS idx_errands_helper_status ON errands(assigned_helper_email, status) 
WHERE status IN ('assigned', 'in_progress', 'awaiting_confirmation');

-- Function to check helper active errand count
CREATE OR REPLACE FUNCTION get_helper_active_errand_count(helper_email TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM errands
    WHERE assigned_helper_email = helper_email
      AND status IN ('assigned', 'in_progress', 'awaiting_confirmation')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to accept helper application
CREATE OR REPLACE FUNCTION accept_helper_application(
  p_errand_id BIGINT,
  p_application_id BIGINT,
  p_requester_email TEXT
)
RETURNS void AS $$
DECLARE
  v_helper_email TEXT;
  v_current_status TEXT;
  v_active_count INTEGER;
BEGIN
  -- Get helper email and check errand status
  SELECT helper_email, status INTO v_helper_email, v_current_status
  FROM applications
  WHERE id = p_application_id AND errand_id = p_errand_id;
  
  IF v_helper_email IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Verify requester owns the errand
  IF NOT EXISTS (
    SELECT 1 FROM errands 
    WHERE id = p_errand_id AND requester_email = p_requester_email
  ) THEN
    RAISE EXCEPTION 'Only the requester can accept applications';
  END IF;
  
  -- Check errand is still open
  IF v_current_status != 'open' THEN
    RAISE EXCEPTION 'Errand is no longer open';
  END IF;
  
  -- Check helper doesn't have more than 3 active errands
  v_active_count := get_helper_active_errand_count(v_helper_email);
  IF v_active_count >= 3 THEN
    RAISE EXCEPTION 'Helper already has 3 active errands';
  END IF;
  
  -- Accept application and assign helper
  UPDATE applications
  SET status = 'accepted'
  WHERE id = p_application_id;
  
  -- Reject other applications
  UPDATE applications
  SET status = 'rejected'
  WHERE errand_id = p_errand_id AND id != p_application_id;
  
  -- Update errand status
  UPDATE errands
  SET 
    assigned_helper_email = v_helper_email,
    status = 'assigned'
  WHERE id = p_errand_id;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm completion (requester or helper)
CREATE OR REPLACE FUNCTION confirm_errand_completion(
  p_errand_id BIGINT,
  p_user_email TEXT,
  p_is_requester BOOLEAN
)
RETURNS void AS $$
DECLARE
  v_errand_status TEXT;
  v_requester_confirmed BOOLEAN;
  v_helper_confirmed BOOLEAN;
  v_budget DECIMAL(10, 2);
  v_helper_email TEXT;
BEGIN
  -- Get errand details
  SELECT 
    status, 
    requester_confirmed_completion,
    helper_confirmed_completion,
    budget,
    assigned_helper_email
  INTO 
    v_errand_status,
    v_requester_confirmed,
    v_helper_confirmed,
    v_budget,
    v_helper_email
  FROM errands
  WHERE id = p_errand_id;
  
  IF v_errand_status IS NULL THEN
    RAISE EXCEPTION 'Errand not found';
  END IF;
  
  -- Verify user is requester or helper
  IF p_is_requester THEN
    IF NOT EXISTS (
      SELECT 1 FROM errands 
      WHERE id = p_errand_id AND requester_email = p_user_email
    ) THEN
      RAISE EXCEPTION 'Only the requester can confirm completion';
    END IF;
    
    -- Update requester confirmation
    UPDATE errands
    SET requester_confirmed_completion = TRUE
    WHERE id = p_errand_id;
    
  ELSE
    IF v_helper_email != p_user_email THEN
      RAISE EXCEPTION 'Only the assigned helper can confirm completion';
    END IF;
    
    -- Update helper confirmation
    UPDATE errands
    SET helper_confirmed_completion = TRUE
    WHERE id = p_errand_id;
  END IF;
  
  -- Check if both confirmed
  SELECT requester_confirmed_completion, helper_confirmed_completion
  INTO v_requester_confirmed, v_helper_confirmed
  FROM errands
  WHERE id = p_errand_id;
  
  IF v_requester_confirmed AND v_helper_confirmed THEN
    -- Both confirmed - mark as completed
    UPDATE errands
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_errand_id;
    
    -- Payment release will be handled by application logic
    -- (not in database trigger to allow for credit/payment processing)
  ELSE
    -- Update status to awaiting confirmation
    UPDATE errands
    SET 
      status = 'awaiting_confirmation',
      updated_at = NOW()
    WHERE id = p_errand_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security for ratings
ALTER TABLE errand_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view ratings" ON errand_ratings;
DROP POLICY IF EXISTS "Requesters can rate helpers" ON errand_ratings;

-- Ratings Policies
CREATE POLICY "Users can view ratings" ON errand_ratings
  FOR SELECT USING (true);

CREATE POLICY "Requesters can rate helpers" ON errand_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM errands
      WHERE errands.id = errand_ratings.errand_id
        AND errands.requester_email = auth.uid()::text
        AND errands.status = 'completed'
    )
  );

-- Update applications policies to allow helpers to update their own applications
DROP POLICY IF EXISTS "Helpers can update their own applications" ON applications;
CREATE POLICY "Helpers can update their own applications" ON applications
  FOR UPDATE USING (auth.uid()::text = helper_email);

-- Update errands policies to allow helpers to update assigned errands
DROP POLICY IF EXISTS "Helpers can update assigned errands" ON errands;
CREATE POLICY "Helpers can update assigned errands" ON errands
  FOR UPDATE USING (
    auth.uid()::text = assigned_helper_email AND
    status IN ('assigned', 'in_progress', 'awaiting_confirmation')
  );

