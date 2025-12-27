-- ============================================
-- Chat System Database Migration
-- Extends messages table to support group buy chats and direct messaging
-- Run this in Supabase SQL Editor
-- ============================================

-- Make errand_id nullable (currently required)
ALTER TABLE messages 
ALTER COLUMN errand_id DROP NOT NULL;

-- Add product_id for group buy chats
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE CASCADE;

-- Add chat_type to distinguish between errand, group_buy, and direct chats
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS chat_type TEXT CHECK (chat_type IN ('errand', 'group_buy', 'direct'));

-- Set default chat_type for existing messages (errand messages)
UPDATE messages 
SET chat_type = 'errand' 
WHERE chat_type IS NULL AND errand_id IS NOT NULL;

-- Add thread_id for grouping messages in group buy or direct chats
-- For group buys: thread_id = 'group_buy_{product_id}'
-- For direct chats: thread_id = 'direct_{user1_email}_{user2_email}' (sorted)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON messages(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_type ON messages(chat_type);

-- Update RLS policies to support group buy messages
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- New policy: Users can view messages where they are sender, receiver, 
-- or part of a group buy they've joined, or part of an errand they're involved in
CREATE POLICY "Users can view relevant messages" ON messages
  FOR SELECT USING (
    -- Direct messages: sender or receiver
    sender_email = auth.uid()::text OR receiver_email = auth.uid()::text
    OR
    -- Group buy messages: user has an order for this product
    (chat_type = 'group_buy' AND product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.product_id = messages.product_id 
      AND orders.customer_email = auth.uid()::text
    ))
    OR
    -- Group buy messages: user is the product owner
    (chat_type = 'group_buy' AND product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = messages.product_id 
      AND products.owner_email = auth.uid()::text
    ))
    OR
    -- Errand messages: user is involved in the errand
    (chat_type = 'errand' AND errand_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM errands 
      WHERE errands.id = messages.errand_id 
      AND (errands.requester_email = auth.uid()::text OR errands.assigned_helper_email = auth.uid()::text)
    ))
  );

-- Users can send messages if authenticated and they're the sender
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND sender_email = auth.uid()::text
    AND (
      -- Direct message: must specify receiver
      (chat_type = 'direct' AND receiver_email IS NOT NULL)
      OR
      -- Group buy message: must have valid product_id and user must be part of the group buy
      (chat_type = 'group_buy' AND product_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.product_id = messages.product_id 
          AND orders.customer_email = auth.uid()::text
        )
        OR
        EXISTS (
          SELECT 1 FROM products 
          WHERE products.id = messages.product_id 
          AND products.owner_email = auth.uid()::text
        )
      ))
      OR
      -- Errand message: user must be involved in the errand
      (chat_type = 'errand' AND errand_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM errands 
        WHERE errands.id = messages.errand_id 
        AND (errands.requester_email = auth.uid()::text OR errands.assigned_helper_email = auth.uid()::text)
      ))
    )
  );

-- Users can update their received messages (mark as read)
CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (
    receiver_email = auth.uid()::text
    OR
    -- Group buy participants can update read status
    (chat_type = 'group_buy' AND product_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.product_id = messages.product_id 
        AND orders.customer_email = auth.uid()::text
      )
      OR
      EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = messages.product_id 
        AND products.owner_email = auth.uid()::text
      )
    ))
  );

-- Enable realtime for messages table (if not already enabled)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Migration Complete!
-- ============================================

