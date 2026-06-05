-- Migration: สร้างตาราง message_templates
-- สร้าง bucket 'messages' ใน Supabase Storage (ถ้ายังไม่มี)

-- ────────────────────────────────────────────────────
-- 1. ตาราง message_templates
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  msg_type    TEXT NOT NULL CHECK (msg_type IN ('text', 'image', 'flex')),
  content     TEXT,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index เพื่อดึงเร็ว
CREATE INDEX IF NOT EXISTS idx_message_templates_step       ON message_templates(step);
CREATE INDEX IF NOT EXISTS idx_message_templates_step_active ON message_templates(step, is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_sort        ON message_templates(step, sort_order);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_message_templates_updated_at ON message_templates;
CREATE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_message_templates_updated_at();

-- ────────────────────────────────────────────────────
-- 2. RLS Policy (ถ้าต้องการ — service_role bypass ได้เสมอ)
-- ────────────────────────────────────────────────────
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ service_role ทำได้ทุกอย่าง (สำหรับ Admin API)
CREATE POLICY "service_role_all" ON message_templates
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ────────────────────────────────────────────────────
-- 3. Seed ข้อมูลตัวอย่าง (ลบ comment ถ้าต้องการ seed)
-- ────────────────────────────────────────────────────

/*
INSERT INTO message_templates (step, sort_order, msg_type, content) VALUES
  ('welcome',           0, 'text', '👋 สวัสดีครับ/ค่ะ! ยินดีต้อนรับสู่ร้านของเรา\nพิมพ์ CF [รหัสสินค้า] เพื่อสั่งซื้อในช่วงไลฟ์ได้เลยครับ'),
  ('cf_success',        0, 'text', '✅ สั่งซื้อสำเร็จ!\n\n📦 {{product_name}} — ฿{{price}}\n🚚 ค่าส่ง: {{shipping_text}}\n💰 รวม: ฿{{total}}\n📋 เลขออเดอร์: {{order_number}}'),
  ('cf_not_found',      0, 'text', '❌ ไม่พบรหัส {{cf_code}} ในไลฟ์นี้\nกรุณาตรวจสอบรหัสสินค้าอีกครั้งครับ'),
  ('cf_no_live',        0, 'text', '⏸️ ขออภัย ขณะนี้ยังไม่มีไลฟ์เปิดขาย\nติดตามประกาศไลฟ์ครั้งถัดไปได้เลยครับ'),
  ('cf_out_of_stock',   0, 'text', '😢 ขออภัย {{product_name}} หมดสต็อกแล้ว\nสินค้าคงเหลือ: {{quantity}} ชิ้น'),
  ('slip_received',     0, 'text', '📸 ได้รับสลิปแล้วครับ!\n📋 ออเดอร์: {{order_number}}\nรอแอดมินตรวจสอบสักครู่นะครับ'),
  ('slip_no_order',     0, 'text', '❓ ไม่พบออเดอร์ที่รอชำระเงิน\nหากมีปัญหา กรุณาติดต่อแอดมินครับ'),
  ('payment_confirmed', 0, 'text', '✅ ยืนยันการชำระเงินแล้ว!\n📋 ออเดอร์: {{order_number}}\nระบบกำลังดำเนินการจัดส่งให้คุณครับ'),
  ('payment_rejected',  0, 'text', '🚫 ขออภัย ไม่สามารถยืนยันสลิปได้\n📋 ออเดอร์: {{order_number}}\nกรุณาส่งสลิปใหม่หรือติดต่อแอดมินครับ'),
  ('shipped',           0, 'text', '📦 พัสดุของคุณถูกจัดส่งแล้ว!\n🚚 เลขพัสดุ: {{tracking_number}}\n📄 ออเดอร์: {{order_number}}\n\nติดตามพัสดุ: https://th.kerryexpress.com/th/track/?track={{tracking_number}}'),
  ('delivered',         0, 'text', '🎉 พัสดุถึงมือคุณแล้ว!\n📄 ออเดอร์: {{order_number}}\nขอบคุณที่ใช้บริการนะครับ 🙏'),
  ('order_cancelled',   0, 'text', '🚫 ออเดอร์ {{order_number}} ถูกยกเลิกแล้ว\nหากมีข้อสงสัย กรุณาติดต่อแอดมินครับ');
*/

-- ────────────────────────────────────────────────────
-- 4. Storage bucket 'messages' (ทำใน Supabase Dashboard)
-- ────────────────────────────────────────────────────
-- ไปที่ Storage → New bucket → ชื่อ: messages → Public: ON
-- หรือใช้ SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('messages', 'messages', true)
-- ON CONFLICT (id) DO NOTHING;
