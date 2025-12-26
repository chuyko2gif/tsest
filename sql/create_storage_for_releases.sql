-- Создание storage bucket для чеков оплаты
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Создание storage bucket для обложек релизов
INSERT INTO storage.buckets (id, name, public)
VALUES ('release-covers', 'release-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS политики для payment-receipts
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-receipts' AND
    (
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
      )
    )
  );

CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- RLS политики для release-covers
CREATE POLICY "Users can upload own covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'release-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'release-covers');

CREATE POLICY "Users can update own covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'release-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'release-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
