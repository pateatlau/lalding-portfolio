-- ============================================
-- CONTENT TABLES (Phase 1)
-- ============================================
-- Auth/visitor tables are created in Phase 2.
-- Run this file in the Supabase SQL Editor.

-- Personal info (about, intro, contact, footer — singleton row)
-- Enforced via UNIQUE constraint on a constant sentinel value.
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton = true),
  full_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  tagline TEXT,
  typewriter_titles TEXT[] NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  resume_url TEXT,
  about_tech_stack TEXT,
  about_current_focus TEXT,
  about_beyond_code TEXT,
  about_expertise TEXT[],
  footer_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- About section stats (15+ years, 50+ projects, etc.)
CREATE TABLE profile_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value INTEGER NOT NULL,
  suffix TEXT DEFAULT '+',
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Navigation links
CREATE TABLE nav_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hash TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Companies (logo slider)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Experience / career timeline
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'work',
  start_date DATE NOT NULL,
  end_date DATE,
  display_date TEXT NOT NULL,
  company_logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Project categories
CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  image_url TEXT,
  demo_video_url TEXT,
  source_code_url TEXT,
  live_site_url TEXT,
  category_id UUID REFERENCES project_categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skill groups
CREATE TABLE skill_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skills (belong to a group)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES skill_groups(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
