-- ============================================
-- Korean Commerce App - Complete Database Setup
-- Paste this entire file into Supabase SQL Editor
-- ============================================

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  deadline DATE,
  delivery_date DATE,
  vendor TEXT,
  target_quantity INTEGER DEFAULT 1,
  current_quantity INTEGER DEFAULT 0,
  image_color TEXT,
  image_data_url TEXT,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert products" ON products;
CREATE POLICY "Users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own products" ON products;
CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid()::text = owner_email);

DROP POLICY IF EXISTS "Users can delete their own products" ON products;
CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid()::text = owner_email);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  group_status TEXT DEFAULT 'open',
  fulfillment_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid()::text = customer_email OR 
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = orders.product_id 
      AND products.owner_email = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid()::text = customer_email);

-- Errands Table
CREATE TABLE IF NOT EXISTS errands (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  region TEXT NOT NULL,
  budget DECIMAL(10, 2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open',
  requester_email TEXT NOT NULL,
  assigned_helper_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Errands
ALTER TABLE errands ENABLE ROW LEVEL SECURITY;

-- Errands Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Errands are viewable by everyone" ON errands;
CREATE POLICY "Errands are viewable by everyone" ON errands
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create errands" ON errands;
CREATE POLICY "Users can create errands" ON errands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own errands" ON errands;
CREATE POLICY "Users can update their own errands" ON errands
  FOR UPDATE USING (auth.uid()::text = requester_email);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT REFERENCES errands(id),
  helper_email TEXT NOT NULL,
  offer_amount DECIMAL(10, 2),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Applications Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Applications are viewable by requester and helper" ON applications;
CREATE POLICY "Applications are viewable by requester and helper" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM errands 
      WHERE errands.id = applications.errand_id 
      AND errands.requester_email = auth.uid()::text
    ) OR
    applications.helper_email = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can create applications" ON applications;
CREATE POLICY "Users can create applications" ON applications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Errand requester can update applications" ON applications;
CREATE POLICY "Errand requester can update applications" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM errands 
      WHERE errands.id = applications.errand_id 
      AND errands.requester_email = auth.uid()::text
    )
  );

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT REFERENCES errands(id),
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    sender_email = auth.uid()::text OR receiver_email = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND sender_email = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (receiver_email = auth.uid()::text);

-- App State Table (for key-value storage)
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for App State
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- App State Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can manage their own state" ON app_state;
CREATE POLICY "Users can manage their own state" ON app_state
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Enable Real-time for all tables
-- ============================================
-- Note: These commands may fail if tables are already in the publication
-- That's okay - it means real-time is already enabled
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE products;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE errands;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE applications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Setup Complete!
-- ============================================

