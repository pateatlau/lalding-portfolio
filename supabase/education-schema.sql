-- Education table for CMS-managed education entries
CREATE TABLE educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  display_date TEXT,
  institution_logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- RLS: public read + admin write (same as experiences)
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read educations"
  ON educations FOR SELECT
  USING (true);

CREATE POLICY "Admin write educations"
  ON educations FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
