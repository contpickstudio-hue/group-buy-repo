-- ============================================
-- User Verification System Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Create user_verifications table
CREATE TABLE IF NOT EXISTS user_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('id', 'address', 'phone')),
  document_data JSONB, -- Stores document metadata, file paths, etc.
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification records
DROP POLICY IF EXISTS "Users can view their own verifications" ON user_verifications;
CREATE POLICY "Users can view their own verifications" ON user_verifications
  FOR SELECT USING (auth.uid()::text = user_email);

-- Users can insert their own verification requests
DROP POLICY IF EXISTS "Users can create verification requests" ON user_verifications;
CREATE POLICY "Users can create verification requests" ON user_verifications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid()::text = user_email
  );

-- Users can update their own pending verification requests
DROP POLICY IF EXISTS "Users can update pending verifications" ON user_verifications;
CREATE POLICY "Users can update pending verifications" ON user_verifications
  FOR UPDATE USING (
    auth.uid()::text = user_email AND status = 'pending'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_email ON user_verifications(user_email);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(verification_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_verifications_updated_at ON user_verifications;
CREATE TRIGGER trigger_update_user_verifications_updated_at
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_user_verifications_updated_at();

-- Add is_verified flag to user metadata via app_state (or could use auth.users metadata)
-- For now, we'll create a computed view/function to check verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(user_email_param TEXT)
RETURNS JSONB AS $$
DECLARE
  verification_status JSONB;
BEGIN
  SELECT jsonb_build_object(
    'is_verified', EXISTS (
      SELECT 1 FROM user_verifications
      WHERE user_verifications.user_email = user_email_param
      AND user_verifications.status = 'approved'
      AND user_verifications.verification_type IN ('id', 'address')
    ),
    'has_pending', EXISTS (
      SELECT 1 FROM user_verifications
      WHERE user_verifications.user_email = user_email_param
      AND user_verifications.status = 'pending'
    ),
    'verified_at', (
      SELECT MAX(verified_at) FROM user_verifications
      WHERE user_verifications.user_email = user_email_param
      AND user_verifications.status = 'approved'
    )
  ) INTO verification_status;
  
  RETURN verification_status;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for verification documents (run in Supabase Dashboard Storage)
-- This SQL will create the bucket structure (bucket creation needs to be done in dashboard)
-- But we can set up the policies here via SQL if bucket exists

-- ============================================
-- Migration Complete!
-- ============================================
-- Note: Create the 'verification-documents' storage bucket in Supabase Dashboard
-- with public access disabled and RLS enabled

