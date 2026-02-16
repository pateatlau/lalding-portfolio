-- ============================================
-- STORAGE BUCKETS (Phase 1)
-- ============================================
-- Run this file in the Supabase SQL Editor after schema.sql.

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('resume', 'resume', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-videos', 'project-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Public buckets: anyone can read, admin can upload/update/delete
-- resume bucket: authenticated users can read (via signed URL in app code), admin can upload/update/delete

-- project-images: public read
CREATE POLICY "Public read project-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

-- project-images: admin write
CREATE POLICY "Admin write project-images" ON storage.objects
  FOR ALL
  USING (bucket_id = 'project-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'project-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- project-videos: public read
CREATE POLICY "Public read project-videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-videos');

-- project-videos: admin write
CREATE POLICY "Admin write project-videos" ON storage.objects
  FOR ALL
  USING (bucket_id = 'project-videos' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'project-videos' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- company-logos: public read
CREATE POLICY "Public read company-logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

-- company-logos: admin write
CREATE POLICY "Admin write company-logos" ON storage.objects
  FOR ALL
  USING (bucket_id = 'company-logos' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'company-logos' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- resume: admin write (upload/replace)
CREATE POLICY "Admin write resume" ON storage.objects
  FOR ALL
  USING (bucket_id = 'resume' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'resume' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- resume: authenticated users can read (signed URLs are generated server-side,
-- but the storage policy still needs to allow the read operation)
CREATE POLICY "Authenticated read resume" ON storage.objects
  FOR SELECT USING (bucket_id = 'resume' AND auth.role() = 'authenticated');
