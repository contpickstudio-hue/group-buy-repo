-- Supabase Database Schema for Multi-User Group Buy & Errand Platform
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS errands CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    roles TEXT[] DEFAULT '{}',
    primary_role TEXT,
    helper_verified BOOLEAN DEFAULT FALSE,
    helper_phone TEXT,
    helper_address TEXT,
    helper_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table (for group buys)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    owner_email TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    deadline DATE,
    delivery_date DATE,
    vendor TEXT,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER DEFAULT 0,
    image_color TEXT,
    image_data_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (for group buy participation)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    customer_email TEXT NOT NULL,
    vendor_email TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    fulfillment_status TEXT DEFAULT 'pending',
    cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Errands Table
CREATE TABLE IF NOT EXISTS errands (
    id SERIAL PRIMARY KEY,
    requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    requester_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    region TEXT NOT NULL,
    budget DECIMAL(10,2),
    deadline DATE,
    status TEXT DEFAULT 'open',
    assigned_helper_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_helper_email TEXT,
    assigned_helper_name TEXT,
    accepted_helper_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Errand Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    errand_id INTEGER REFERENCES errands(id) ON DELETE CASCADE NOT NULL,
    helper_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    helper_email TEXT NOT NULL,
    helper_name TEXT NOT NULL,
    offer_amount DECIMAL(10,2),
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table (for communication)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_email TEXT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    errand_id INTEGER REFERENCES errands(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- User Profiles: Users can read all profiles but only update their own
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Products: Anyone can read, only owners can modify
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create products" ON products
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their products" ON products
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their products" ON products
    FOR DELETE USING (auth.uid() = owner_id);

-- Orders: Users can see their own orders, vendors can see orders for their products
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() IN (SELECT owner_id FROM products WHERE products.id = orders.product_id)
    );

CREATE POLICY "Authenticated users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Vendors can update fulfillment status" ON orders
    FOR UPDATE USING (
        auth.uid() IN (SELECT owner_id FROM products WHERE products.id = orders.product_id)
    );

-- Errands: Anyone can read, only requesters can modify
ALTER TABLE errands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view errands" ON errands
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create errands" ON errands
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their errands" ON errands
    FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Assigned helpers can update errand status" ON errands
    FOR UPDATE USING (auth.uid() = assigned_helper_id);

-- Applications: Users can see applications for their errands or their own applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant applications" ON applications
    FOR SELECT USING (
        auth.uid() = helper_id OR 
        auth.uid() IN (SELECT requester_id FROM errands WHERE errands.id = applications.errand_id)
    );

CREATE POLICY "Helpers can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helpers can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = helper_id);

CREATE POLICY "Errand owners can update application status" ON applications
    FOR UPDATE USING (
        auth.uid() IN (SELECT requester_id FROM errands WHERE errands.id = applications.errand_id)
    );

-- Messages: Users can see messages they sent or received
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        (SELECT email FROM user_profiles WHERE id = auth.uid()) = recipient_email
    );

CREATE POLICY "Authenticated users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_errands_updated_at BEFORE UPDATE ON errands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_region ON products(region);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_errands_requester_id ON errands(requester_id);
CREATE INDEX IF NOT EXISTS idx_errands_region ON errands(region);
CREATE INDEX IF NOT EXISTS idx_errands_status ON errands(status);
CREATE INDEX IF NOT EXISTS idx_applications_errand_id ON applications(errand_id);
CREATE INDEX IF NOT EXISTS idx_applications_helper_id ON applications(helper_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON messages(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_errand_id ON messages(errand_id);

-- Remove the old app_state table if it exists (localStorage replacement)
DROP TABLE IF EXISTS app_state;
