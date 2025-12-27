-- ============================================
-- Trust & Safety System
-- Reports, Moderation, and Suspensions
-- ============================================

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_email TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('listing', 'errand', 'user', 'message')),
  target_id BIGINT NOT NULL, -- ID of the reported item (listing_id, errand_id, user_email hash, etc.)
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 
    'fraud', 
    'inappropriate_content', 
    'harassment', 
    'fake_product', 
    'scam', 
    'other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed', 'escalated')),
  admin_notes TEXT,
  reviewed_by TEXT, -- Admin email
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_email);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(report_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- User Suspensions Table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('warning', 'temporary', 'permanent')),
  suspended_until TIMESTAMP WITH TIME ZONE, -- NULL for permanent
  suspended_by TEXT NOT NULL, -- Admin email
  admin_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for suspensions
CREATE INDEX IF NOT EXISTS idx_suspensions_user ON user_suspensions(user_email);
CREATE INDEX IF NOT EXISTS idx_suspensions_active ON user_suspensions(is_active, suspended_until);

-- Listing Suspensions Table
CREATE TABLE IF NOT EXISTS listing_suspensions (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suspended_by TEXT NOT NULL, -- Admin email
  admin_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for listing suspensions
CREATE INDEX IF NOT EXISTS idx_listing_suspensions_listing ON listing_suspensions(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_suspensions_active ON listing_suspensions(is_active);

-- Errand Suspensions Table
CREATE TABLE IF NOT EXISTS errand_suspensions (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT NOT NULL REFERENCES errands(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suspended_by TEXT NOT NULL, -- Admin email
  admin_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for errand suspensions
CREATE INDEX IF NOT EXISTS idx_errand_suspensions_errand ON errand_suspensions(errand_id);
CREATE INDEX IF NOT EXISTS idx_errand_suspensions_active ON errand_suspensions(is_active);

-- Report Rate Limiting Table (for abuse prevention)
CREATE TABLE IF NOT EXISTS report_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  reporter_email TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id BIGINT NOT NULL,
  report_count INTEGER DEFAULT 1,
  first_reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reporter_email, target_type, target_id)
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_reporter ON report_rate_limits(reporter_email);
CREATE INDEX IF NOT EXISTS idx_rate_limits_target ON report_rate_limits(target_type, target_id);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE errand_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Reports
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (reporter_email = auth.uid()::text);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND reporter_email = auth.uid()::text
  );

-- Only admins can update reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- RLS Policies for User Suspensions
-- Users can view their own suspensions
CREATE POLICY "Users can view their own suspensions" ON user_suspensions
  FOR SELECT USING (user_email = auth.uid()::text);

-- Admins can view all suspensions
CREATE POLICY "Admins can view all suspensions" ON user_suspensions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- Only admins can create/update suspensions
CREATE POLICY "Admins can manage suspensions" ON user_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- RLS Policies for Listing Suspensions
-- Everyone can view (to know if listing is suspended)
CREATE POLICY "Everyone can view listing suspensions" ON listing_suspensions
  FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage listing suspensions" ON listing_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- RLS Policies for Errand Suspensions
-- Everyone can view (to know if errand is suspended)
CREATE POLICY "Everyone can view errand suspensions" ON errand_suspensions
  FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage errand suspensions" ON errand_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- RLS Policies for Report Rate Limits
-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits" ON report_rate_limits
  FOR SELECT USING (reporter_email = auth.uid()::text);

-- Admins can view all
CREATE POLICY "Admins can view all rate limits" ON report_rate_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = auth.uid()::text 
      AND (auth.users.raw_user_meta_data->>'roles')::jsonb ? 'admin'
    )
  );

-- System can insert/update (via RPC)
CREATE POLICY "System can manage rate limits" ON report_rate_limits
  FOR ALL USING (true);

-- RPC Functions

-- Function to create a report with rate limiting
CREATE OR REPLACE FUNCTION create_report(
  p_reporter_email TEXT,
  p_report_type TEXT,
  p_target_id BIGINT,
  p_reason TEXT,
  p_description TEXT
)
RETURNS TABLE(success BOOLEAN, report_id BIGINT, error_message TEXT) AS $$
DECLARE
  v_report_id BIGINT;
  v_existing_count INTEGER;
  v_rate_limit_count INTEGER;
  v_last_reported TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check rate limiting: max 3 reports per user per target per 24 hours
  SELECT report_count, last_reported_at 
  INTO v_rate_limit_count, v_last_reported
  FROM report_rate_limits
  WHERE reporter_email = p_reporter_email
    AND target_type = p_report_type
    AND target_id = p_target_id;
  
  IF v_rate_limit_count IS NOT NULL THEN
    -- Check if within 24 hours
    IF v_last_reported > NOW() - INTERVAL '24 hours' THEN
      IF v_rate_limit_count >= 3 THEN
        RETURN QUERY SELECT FALSE, NULL::BIGINT, 'Rate limit exceeded. You can report this item again in 24 hours.'::TEXT;
        RETURN;
      END IF;
    ELSE
      -- Reset count if more than 24 hours
      UPDATE report_rate_limits
      SET report_count = 1, first_reported_at = NOW(), last_reported_at = NOW()
      WHERE reporter_email = p_reporter_email
        AND target_type = p_report_type
        AND target_id = p_target_id;
    END IF;
  END IF;
  
  -- Check for duplicate pending reports (same user, same target)
  SELECT COUNT(*) INTO v_existing_count
  FROM reports
  WHERE reporter_email = p_reporter_email
    AND report_type = p_report_type
    AND target_id = p_target_id
    AND status IN ('pending', 'reviewing');
  
  IF v_existing_count > 0 THEN
    RETURN QUERY SELECT FALSE, NULL::BIGINT, 'You already have a pending report for this item.'::TEXT;
    RETURN;
  END IF;
  
  -- Create the report
  INSERT INTO reports (reporter_email, report_type, target_id, reason, description)
  VALUES (p_reporter_email, p_report_type, p_target_id, p_reason, p_description)
  RETURNING id INTO v_report_id;
  
  -- Update or insert rate limit record
  INSERT INTO report_rate_limits (reporter_email, target_type, target_id, report_count, last_reported_at)
  VALUES (p_reporter_email, p_report_type, p_target_id, 1, NOW())
  ON CONFLICT (reporter_email, target_type, target_id) 
  DO UPDATE SET 
    report_count = report_rate_limits.report_count + 1,
    last_reported_at = NOW();
  
  RETURN QUERY SELECT TRUE, v_report_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get repeat offenders (users with multiple reports)
CREATE OR REPLACE FUNCTION get_repeat_offenders(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  target_email TEXT,
  report_count BIGINT,
  latest_report_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.target_id::TEXT as target_email,
    COUNT(*)::BIGINT as report_count,
    MAX(r.created_at) as latest_report_at
  FROM reports r
  WHERE r.report_type = 'user'
    AND r.status IN ('pending', 'reviewing', 'resolved')
  GROUP BY r.target_id
  HAVING COUNT(*) >= 2
  ORDER BY report_count DESC, latest_report_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend a user
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_email TEXT,
  p_reason TEXT,
  p_suspension_type TEXT,
  p_suspended_until TIMESTAMP WITH TIME ZONE,
  p_suspended_by TEXT,
  p_admin_notes TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
BEGIN
  -- Deactivate any existing suspensions
  UPDATE user_suspensions
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_email = p_user_email AND is_active = TRUE;
  
  -- Create new suspension
  INSERT INTO user_suspensions (
    user_email, reason, suspension_type, suspended_until, 
    suspended_by, admin_notes, is_active
  )
  VALUES (
    p_user_email, p_reason, p_suspension_type, p_suspended_until,
    p_suspended_by, p_admin_notes, TRUE
  );
  
  RETURN QUERY SELECT TRUE, NULL::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend a listing
CREATE OR REPLACE FUNCTION suspend_listing(
  p_listing_id BIGINT,
  p_reason TEXT,
  p_suspended_by TEXT,
  p_admin_notes TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
BEGIN
  -- Deactivate any existing suspensions
  UPDATE listing_suspensions
  SET is_active = FALSE, updated_at = NOW()
  WHERE listing_id = p_listing_id AND is_active = TRUE;
  
  -- Create new suspension
  INSERT INTO listing_suspensions (
    listing_id, reason, suspended_by, admin_notes, is_active
  )
  VALUES (
    p_listing_id, p_reason, p_suspended_by, p_admin_notes, TRUE
  );
  
  RETURN QUERY SELECT TRUE, NULL::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend an errand
CREATE OR REPLACE FUNCTION suspend_errand(
  p_errand_id BIGINT,
  p_reason TEXT,
  p_suspended_by TEXT,
  p_admin_notes TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
BEGIN
  -- Deactivate any existing suspensions
  UPDATE errand_suspensions
  SET is_active = FALSE, updated_at = NOW()
  WHERE errand_id = p_errand_id AND is_active = TRUE;
  
  -- Create new suspension
  INSERT INTO errand_suspensions (
    errand_id, reason, suspended_by, admin_notes, is_active
  )
  VALUES (
    p_errand_id, p_reason, p_suspended_by, p_admin_notes, TRUE
  );
  
  RETURN QUERY SELECT TRUE, NULL::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_suspended BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_suspensions
    WHERE user_email = p_user_email
      AND is_active = TRUE
      AND (
        suspension_type = 'permanent'
        OR (suspension_type = 'temporary' AND (suspended_until IS NULL OR suspended_until > NOW()))
      )
  ) INTO v_suspended;
  
  RETURN COALESCE(v_suspended, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if listing is suspended
CREATE OR REPLACE FUNCTION is_listing_suspended(p_listing_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_suspended BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM listing_suspensions
    WHERE listing_id = p_listing_id AND is_active = TRUE
  ) INTO v_suspended;
  
  RETURN COALESCE(v_suspended, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if errand is suspended
CREATE OR REPLACE FUNCTION is_errand_suspended(p_errand_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_suspended BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM errand_suspensions
    WHERE errand_id = p_errand_id AND is_active = TRUE
  ) INTO v_suspended;
  
  RETURN COALESCE(v_suspended, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_suspensions_updated_at
  BEFORE UPDATE ON user_suspensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_suspensions_updated_at
  BEFORE UPDATE ON listing_suspensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_errand_suspensions_updated_at
  BEFORE UPDATE ON errand_suspensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

