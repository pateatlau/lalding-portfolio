-- ============================================
-- RESUME BUILDER TABLES (Phase 8A)
-- ============================================
-- Run this file in the Supabase SQL Editor after the base schema.

-- Add website_url to profile table (used in resume header contact line)
ALTER TABLE profile ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Resume templates (layout + style definitions)
-- Built-in templates are shipped with the app; custom templates can be added.
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  page_size TEXT NOT NULL DEFAULT 'A4',
  columns INTEGER NOT NULL DEFAULT 1,
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resume configs (a "composition" — which sections + items to include)
-- Each config represents a tailored resume (e.g., "Frontend Focus", "Leadership Focus").
CREATE TABLE resume_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_summary TEXT,
  job_description TEXT,
  jd_keywords TEXT[],
  jd_coverage_score REAL CHECK (jd_coverage_score >= 0.0 AND jd_coverage_score <= 1.0),
  jd_analysis JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resume versions (generated PDF snapshots)
-- Each time a resume is generated, a version is created.
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES resume_configs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  config_snapshot JSONB NOT NULL,
  pdf_storage_path TEXT NOT NULL,
  pdf_file_size INTEGER,
  page_count INTEGER,
  generation_time_ms INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce at most one active version across all configs at the database level.
CREATE UNIQUE INDEX resume_versions_single_active
  ON resume_versions ((true))
  WHERE is_active = true;

-- FK indexes for efficient joins and cascading deletes.
CREATE INDEX idx_resume_configs_template_id ON resume_configs (template_id);
CREATE INDEX idx_resume_versions_config_id ON resume_versions (config_id);
