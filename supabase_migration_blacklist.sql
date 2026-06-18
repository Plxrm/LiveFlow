-- Migration: Add blacklist / timeout fields to customers table
-- Run this in Supabase SQL editor

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ban_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unpaid_count INT DEFAULT 0;

-- Index for faster blacklist queries
CREATE INDEX IF NOT EXISTS idx_customers_is_banned ON customers (is_banned) WHERE is_banned = TRUE;
