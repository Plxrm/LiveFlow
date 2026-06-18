-- Migration: Add Check-Slip payment verification fields to payments table
-- Run this in Supabase SQL editor

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS verify_method TEXT CHECK (verify_method IN ('manual', 'auto')),
  ADD COLUMN IF NOT EXISTS checkslip_order_id TEXT,
  ADD COLUMN IF NOT EXISTS checkslip_status TEXT CHECK (checkslip_status IN ('pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS checkslip_data JSONB,
  ADD COLUMN IF NOT EXISTS transfer_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS diff_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_bank TEXT;

-- Optional: order_boxes and order_box_items tables
CREATE TABLE IF NOT EXISTS order_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  box_number INT NOT NULL DEFAULT 1,
  weight_g NUMERIC,
  width_cm NUMERIC,
  length_cm NUMERIC,
  height_cm NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_box_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES order_boxes(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster payment lookup by checkslip status
CREATE INDEX IF NOT EXISTS idx_payments_checkslip_status ON payments (checkslip_status) WHERE checkslip_status IS NOT NULL;
