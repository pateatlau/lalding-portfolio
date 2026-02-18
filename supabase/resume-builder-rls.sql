-- ============================================
-- ROW LEVEL SECURITY — Resume Builder Tables (Phase 8A)
-- ============================================
-- Run this file in the Supabase SQL Editor after resume-builder-schema.sql.

-- resume_templates: public read (for template previews), admin write
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON resume_templates
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON resume_templates
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- resume_configs: admin only (no public access needed)
ALTER TABLE resume_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all" ON resume_configs
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- resume_versions: admin only
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all" ON resume_versions
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
