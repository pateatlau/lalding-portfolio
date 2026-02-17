# Continuation Prompt: Resume Builder — Architecture Design & Implementation Plan

## Context

We're designing and planning a **Resume Builder** feature for the portfolio site (lalding.in). This is **planning only** — no implementation yet. The goal is to produce a comprehensive architecture design and phased implementation plan in `docs/cms-and-auth-plan.md`.

The Resume Builder will generate PDF resumes from existing CMS data (profile, experience, skills, projects) already stored in Supabase. The user has PRD and NFR documents from a separate project called "Open Resume Engine (ORE)" that inform the design, but this feature is being built **into the existing portfolio site**, not as a standalone product.

## What's Been Done

The portfolio site has completed:

- **Phases 1–6**: Full Supabase CMS with admin dashboard, OAuth auth, resume gating, testing, CI/CD
- **Phase 7**: Sentry error monitoring and performance tracking
- **Contact form email**: Working with verified `lalding.in` domain via Resend

## Key Files to Read First

- `docs/cms-and-auth-plan.md` — Master plan document (all plans go here, do NOT create separate plan files)
- `CLAUDE.md` — Project conventions and structure
- `temp-downloads/open-resume-engine-PRD.md` — PRD reference document (standalone product vision, adapt for portfolio integration)
- `temp-downloads/open-resume-engine-NFR.md` — Non-functional requirements reference
- `lib/supabase/types.ts` — Current Supabase schema types (existing data the builder will leverage)
- `actions/admin.ts` — Existing admin server actions pattern
- `components/admin/` — Existing admin UI component patterns

## Current CMS Data Model (already in Supabase)

The resume builder can leverage these existing tables:

| Table                     | Key Fields                                                                                                                  | Resume Relevance              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `profile`                 | `full_name`, `job_title`, `email`, `phone`, `location`, `linkedin_url`, `github_url`, `about_tech_stack`, `about_expertise` | Header, contact info, summary |
| `experiences`             | `title`, `company`, `description`, `start_date`, `end_date`, `display_date`                                                 | Work experience section       |
| `projects`                | `title`, `description`, `tags`, `source_code_url`, `live_site_url`                                                          | Projects section              |
| `skill_groups` + `skills` | `category`, `name` (grouped skills)                                                                                         | Skills section                |
| `profile_stats`           | `value`, `suffix`, `label`                                                                                                  | Optional stats/highlights     |

## Current Architecture

- **Framework**: Next.js 16 (App Router) with `proxy.ts` (Next.js 16 convention)
- **Database**: Supabase (Postgres) with RLS
- **Auth**: Supabase Auth (admin-only for resume builder)
- **File storage**: Supabase Storage (already has `resume` bucket)
- **Admin dashboard**: `/admin/*` with sidebar nav, CRUD editors, image/video uploads
- **CI/CD**: GitHub Actions → Vercel
- **Monitoring**: Sentry for error tracking

## PRD Summary (adapt for portfolio, not standalone)

The ORE PRD envisions a standalone resume engine. For the portfolio site, we need to **adapt** this to:

- Use existing CMS data (no separate resume data model duplication)
- Fit into the existing admin dashboard (new `/admin/resume-builder` route)
- Single-user (admin only, not multi-tenant)
- Template-driven HTML → PDF generation
- Store generated PDFs in the existing Supabase `resume` bucket

### Key ORE concepts to adopt:

- **Resume composition**: Select/filter/reorder CMS sections for a specific resume
- **Template system**: HTML/CSS templates with React rendering
- **PDF generation**: Headless browser (Playwright — already a dev dependency) for HTML → PDF
- **Versioning**: Track resume versions with template + filter config

### Key ORE concepts to skip (not needed for portfolio):

- Multi-user auth / user-scoped data (single admin)
- Resume marketplace / community templates
- SaaS features / payment integration
- Docker deployment
- AI layer (Phase 3 in PRD — skip entirely)

## NFR Summary (relevant ones)

- PDF generation < 5 seconds
- Deterministic rendering (locked Chromium version — Playwright handles this)
- A4 and US Letter support
- Print-optimized CSS
- Page-break management
- Signed URLs for generated PDFs (already have this pattern)

## What to Do

1. **Read the PRD and NFR documents** in `temp-downloads/`
2. **Read the existing CMS data model** in `lib/supabase/types.ts`
3. **Design the architecture** — how the resume builder integrates with the existing portfolio:
   - New Supabase tables needed (resume configs, versions, templates)
   - How to reference existing CMS data without duplication
   - PDF generation approach (server action using Playwright)
   - Template system design
   - Admin UI pages/components needed
4. **Write a phased implementation plan** as a new section in `docs/cms-and-auth-plan.md` (Phase 8)
   - Break into sub-tasks (8A, 8B, 8C, etc.)
   - Each sub-task should be implementable independently
   - Include testing strategy per phase
5. **Do NOT implement anything** — this is planning and design only

## Workflow Rules

- All plans and implementation notes go in `docs/cms-and-auth-plan.md` — do NOT create separate plan files
- Wait for user confirmation before finalizing the plan
- Consider the existing patterns (how Phases 1–7 are structured in the plan doc)

## Design Questions to Address

1. **Data model**: What new tables are needed? How do they reference existing CMS tables vs. duplicating data?
2. **Template system**: How are templates stored and rendered? React components? HTML strings? CSS approach?
3. **PDF generation**: Server action with Playwright? API route? Edge function limitations?
4. **Admin UI**: What pages are needed? Resume list, editor/composer, preview, template picker?
5. **Storage**: Where do generated PDFs go? How do they relate to the current manually-uploaded resume?
6. **Integration point**: Should the generated resume replace the current manually-uploaded one, or coexist?
