-- Part 1: Tables and Indexes
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Better Auth schema)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  image TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (for social logins like Google)
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt TIMESTAMP WITH TIME ZONE,
  password TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification table (for email verification)
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Upscale tasks table
CREATE TABLE IF NOT EXISTS upscale_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
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
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  task_id UUID REFERENCES upscale_tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"(userId);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"(userId);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON upscale_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON upscale_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON credit_transactions(user_id);
