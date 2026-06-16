-- สร้าง bucket 'payment' สำหรับเก็บรูป QR ของร้าน

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment', 'payment', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: อนุญาตทุกคนอ่าน (public read)
CREATE POLICY "Public read payment bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment');

-- Policy: อนุญาต service role upload
CREATE POLICY "Service role upload payment bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment');

-- Policy: อนุญาต service role update/delete
CREATE POLICY "Service role manage payment bucket"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'payment');
