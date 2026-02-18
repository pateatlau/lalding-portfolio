-- ============================================
-- RESUME BUILDER SEED DATA (Phase 8A)
-- ============================================
-- Seeds the built-in "Professional" template matching temp-downloads/resume.pdf.
-- Run this file in the Supabase SQL Editor after resume-builder-schema.sql and resume-builder-rls.sql.

INSERT INTO resume_templates (
  registry_key,
  name,
  description,
  is_builtin,
  page_size,
  columns,
  style_config,
  sort_order
) VALUES (
  'professional',
  'Professional',
  'Clean, traditional layout with teal accent color and LT monogram. Two-region design with section labels in the left column. Matches the original resume PDF.',
  true,
  'A4',
  1,
  '{
    "primaryColor": "#1a1a1a",
    "accentColor": "#2bbcb3",
    "fontFamily": "Open Sans, sans-serif",
    "headingFontFamily": "Open Sans, sans-serif",
    "fontSize": "10pt",
    "lineHeight": "1.4",
    "margins": {
      "top": "0.75in",
      "right": "0.75in",
      "bottom": "0.75in",
      "left": "0.75in"
    }
  }'::jsonb,
  0
);
