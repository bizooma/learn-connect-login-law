CREATE POLICY "Authenticated can upload wiki files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wiki-files');
CREATE POLICY "Authenticated can read wiki files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'wiki-files');
CREATE POLICY "Authenticated can update own wiki files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'wiki-files' AND owner = auth.uid());
CREATE POLICY "Authenticated can delete own wiki files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wiki-files' AND owner = auth.uid());