-- ─── Shipments table ──────────────────────────────────────────────────────────
-- รัน migration นี้ใน Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier         TEXT NOT NULL DEFAULT 'kex',
  tracking_number TEXT,
  label_pdf_url   TEXT,
  status          TEXT NOT NULL DEFAULT 'created'
                  CHECK (status IN ('created','picked_up','in_transit','out_for_delivery','delivered','failed','returned','cancelled')),
  kex_con_no      TEXT,
  kex_ref_no      TEXT,
  kex_lh_route    TEXT,
  kex_del_route   TEXT,
  kex_service_code TEXT,
  kex_status_desc TEXT,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipments_order_id_idx ON shipments (order_id);
CREATE INDEX IF NOT EXISTS shipments_tracking_idx  ON shipments (tracking_number);

-- ─── เพิ่ม columns ในตาราง customers (ถ้ายังไม่มี) ────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address_detail TEXT,
  ADD COLUMN IF NOT EXISTS subdistrict    TEXT,
  ADD COLUMN IF NOT EXISTS district       TEXT,
  ADD COLUMN IF NOT EXISTS province       TEXT,
  ADD COLUMN IF NOT EXISTS zipcode        TEXT;
