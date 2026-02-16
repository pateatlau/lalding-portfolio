-- ============================================
-- ROW LEVEL SECURITY — Auth & Visitor Tables (Phase 2)
-- ============================================
-- Run this file in the Supabase SQL Editor after auth-schema.sql.

-- visitor_profiles: visitors can read/update/insert their own row, admin can read all
ALTER TABLE visitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON visitor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON visitor_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON visitor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin read all" ON visitor_profiles
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- resume_downloads: visitors insert own, admin read all
ALTER TABLE resume_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own download" ON resume_downloads
  FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Admin read all downloads" ON resume_downloads
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
