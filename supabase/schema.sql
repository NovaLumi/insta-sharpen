-- InstaSharpen Database Schema (Supabase Auth Compatible)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- App Specific Tables (using Supabase Auth)
-- ============================================

-- Credits table (references auth.users, not "user" table)
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Upscale tasks table
CREATE TABLE IF NOT EXISTS upscale_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_id VARCHAR(255),
  original_url VARCHAR(1000),
  result_url VARCHAR(1000),
  upscale_factor VARCHAR(10) NOT NULL,
  credits_used INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  task_id UUID REFERENCES upscale_tasks(id),
  paypal_order_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Add paypal_order_id if not exists (migration)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN paypal_order_id VARCHAR(255);
  END IF;
END $$;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON upscale_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON upscale_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON credit_transactions(user_id);

-- Unique index for paypal_order_id to prevent duplicate payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_paypal_order_id_unique
ON credit_transactions(paypal_order_id)
WHERE paypal_order_id IS NOT NULL;

-- ============================================
-- Row Level Security (RLS) - FIXED
-- ============================================
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upscale_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (including ones we're about to create)
DROP POLICY IF EXISTS "Users can view own credits" ON credits;
DROP POLICY IF EXISTS "Service role can manage credits" ON credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON credits;
DROP POLICY IF EXISTS "Users can update own credits" ON credits;
DROP POLICY IF EXISTS "Users can view own tasks" ON upscale_tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON upscale_tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON upscale_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON upscale_tasks;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

-- Credits policies - users can only access their own data
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Tasks policies - users can only access their own tasks
CREATE POLICY "Users can view own tasks" ON upscale_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON upscale_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON upscale_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies - users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Storage - FIXED (only authenticated users)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Everyone can read (images are public after upload)
CREATE POLICY "Anyone can read images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'images');

-- Only authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete own uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images');

-- ============================================
-- Helper Functions for Atomic Operations
-- ============================================

-- Function to atomically deduct credits if sufficient
CREATE OR REPLACE FUNCTION deduct_credits_if_sufficient(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_amount INTEGER;
BEGIN
  SELECT amount INTO current_amount
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_amount IS NULL OR current_amount < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE credits
  SET amount = amount - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to atomically increment credits
CREATE OR REPLACE FUNCTION increment_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO credits (user_id, amount)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    amount = credits.amount + p_amount,
    updated_at = NOW();
END;
$$;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;
CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
