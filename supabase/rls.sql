-- ============================================
-- ROW LEVEL SECURITY — Content Tables (Phase 1)
-- ============================================
-- Pattern: public read, admin write (via app_metadata.role = 'admin')
-- Auth/visitor RLS policies are created in Phase 2.
-- Run this file in the Supabase SQL Editor after schema.sql.

-- Helper: enable RLS + apply public-read / admin-write pattern
-- Applied to each content table below.

-- profile
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON profile
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON profile
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- profile_stats
ALTER TABLE profile_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON profile_stats
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON profile_stats
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- nav_links
ALTER TABLE nav_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON nav_links
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON nav_links
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON companies
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- experiences
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON experiences
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON experiences
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- project_categories
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON project_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON project_categories
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON projects
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- skill_groups
ALTER TABLE skill_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON skill_groups
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON skill_groups
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- skills
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON skills
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON skills
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
