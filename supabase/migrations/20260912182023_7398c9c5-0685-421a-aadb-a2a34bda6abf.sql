CREATE POLICY "Users read own backgrounds" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own backgrounds" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own backgrounds" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own backgrounds" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);