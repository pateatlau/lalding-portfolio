# Phase 8: Resume Builder

> **Parent document**: [`docs/cms-and-auth-plan.md`](./cms-and-auth-plan.md)
>
> This plan was extracted from the main CMS plan to keep file sizes manageable. Phase 8 follows Phases 1–7 (Supabase CMS, Auth, Data Layer, Admin Dashboard, File Uploads, Testing, Sentry).

---

## Overview

Add a resume builder to the admin dashboard that generates PDF resumes from existing CMS data. The builder uses a template system with React components rendered to HTML, converted to PDF via Playwright (already a dev dependency). Generated PDFs are stored in the existing Supabase `resume` bucket and any version can be "activated" as the downloadable resume for visitors.

**Key design principle**: The resume builder _references_ existing CMS tables (profile, experiences, projects, skills) — it does NOT duplicate data. A "resume config" defines which CMS items to include and in what order, plus layout/style preferences. When generating a PDF, the builder fetches live CMS data, filters it per the config, renders it through a template, and produces a PDF.

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│                  Admin Dashboard                     │
│  /admin/resume-builder                              │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐    │
│  │Templates│  │ Composer  │  │ Versions/History│    │
│  │  List   │  │  Editor   │  │   + Activate    │    │
│  └─────────┘  └──────────┘  └─────────────────┘    │
└───────────────────┬─────────────────────────────────┘
                    │ Server Action: generateResumePdf()
                    ▼
┌─────────────────────────────────────────────────────┐
│              PDF Generation Pipeline                 │
│  1. Fetch CMS data (profile, experiences, etc.)     │
│  2. Filter & reorder per resume_config              │
│  3. Render React template → HTML string             │
│  4. Launch Playwright → PDF buffer                  │
│  5. Upload PDF to Supabase Storage (resume bucket)  │
│  6. Save resume_version row with PDF path           │
└─────────────────────────────────────────────────────┘
```

## Data Model — New Tables

Three new tables. All follow existing conventions (UUID PKs, `sort_order`, RLS with admin-only write).

```sql
-- ============================================
-- RESUME BUILDER TABLES
-- ============================================

-- Resume templates (layout + style definitions)
-- Built-in templates are shipped with the app; custom templates can be added.
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key TEXT NOT NULL UNIQUE,     -- maps to React component in template registry ("professional", "modern")
  name TEXT NOT NULL,                    -- "Professional", "Modern", "Minimal"
  description TEXT,                      -- short description shown in template picker
  thumbnail_url TEXT,                    -- preview image (Supabase Storage path)
  is_builtin BOOLEAN NOT NULL DEFAULT false,  -- shipped with the app vs user-created
  -- Layout configuration
  page_size TEXT NOT NULL DEFAULT 'A4',  -- 'A4' or 'Letter'
  columns INTEGER NOT NULL DEFAULT 1,   -- 1 or 2 column layout
  -- Style configuration (CSS custom properties / design tokens)
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example style_config:
  -- {
  --   "primaryColor": "#1a1a2e",
  --   "accentColor": "#e94560",
  --   "fontFamily": "Inter, sans-serif",
  --   "headingFontFamily": "Inter, sans-serif",
  --   "fontSize": "10pt",
  --   "lineHeight": "1.4",
  --   "margins": { "top": "0.75in", "right": "0.75in", "bottom": "0.75in", "left": "0.75in" }
  -- }
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resume configs (a "composition" — which sections + items to include)
-- Each config represents a tailored resume (e.g., "Frontend Focus", "Leadership Focus").
CREATE TABLE resume_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Frontend Focus", "Full-stack General"
  description TEXT,                      -- optional notes about this config
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  -- Section inclusion & ordering (JSONB array)
  -- Each entry: { "section": "experience"|"projects"|"skills"|"summary"|"custom",
  --               "enabled": true, "label": "Work Experience",
  --               "itemIds": ["uuid1","uuid2"] | null,  -- null = include all
  --               "sort_order": 0 }
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Style overrides (merged on top of template's style_config)
  style_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Summary/objective override (custom text for this resume variant)
  custom_summary TEXT,
  -- JD Optimization (nullable — feature is optional, built in 8I/8J)
  job_description TEXT,              -- pasted job description text
  jd_keywords TEXT[],                -- extracted keywords from JD
  jd_coverage_score REAL,            -- 0.0–1.0 keyword match percentage
  jd_analysis JSONB,                 -- full analysis: { matchedKeywords, missingKeywords, suggestions }
  is_active BOOLEAN NOT NULL DEFAULT false,  -- the "active" resume used for visitor downloads
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resume versions (generated PDF snapshots)
-- Each time a resume is generated, a version is created.
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES resume_configs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  -- Snapshot of the config at generation time (for reproducibility)
  config_snapshot JSONB NOT NULL,
  -- Generated output
  pdf_storage_path TEXT NOT NULL,        -- path in 'resume' bucket
  pdf_file_size INTEGER,                 -- bytes
  page_count INTEGER,                    -- number of pages
  -- Metadata
  generation_time_ms INTEGER,            -- how long PDF generation took
  is_active BOOLEAN NOT NULL DEFAULT false,  -- the version currently served for downloads
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enforce at most one active version across all configs at the database level.
-- The activation server action should deactivate all others first, but this
-- constraint prevents concurrent requests from leaving >1 active row.
CREATE UNIQUE INDEX resume_versions_single_active
  ON resume_versions ((true))
  WHERE is_active = true;
```

**RLS Policies** (follow existing admin-only write pattern):

```sql
-- resume_templates: public read (for template previews), admin write
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON resume_templates FOR SELECT USING (true);
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
```

**TypeScript types** (added to `lib/supabase/types.ts`):

```typescript
export type ResumeTemplate = {
  id: string;
  registry_key: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_builtin: boolean;
  page_size: string;
  columns: number;
  style_config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ResumeConfig = {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  sections: ResumeSectionConfig[];
  style_overrides: Record<string, unknown>;
  custom_summary: string | null;
  job_description: string | null;
  jd_keywords: string[] | null;
  jd_coverage_score: number | null;
  jd_analysis: JdAnalysisResult | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type JdAnalysisResult = {
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: JdSuggestion[];
};

export type JdSuggestion = {
  type: 'include_experience' | 'include_project' | 'include_skill_group' | 'emphasize';
  itemId: string;
  reason: string;
};

export type ResumeSectionConfig = {
  section: 'summary' | 'experience' | 'projects' | 'skills' | 'custom';
  enabled: boolean;
  label: string;
  itemIds: string[] | null; // null = include all items
  sort_order: number;
};

export type ResumeVersion = {
  id: string;
  config_id: string;
  template_id: string | null;
  config_snapshot: Record<string, unknown>;
  pdf_storage_path: string;
  pdf_file_size: number | null;
  page_count: number | null;
  generation_time_ms: number | null;
  is_active: boolean;
  created_at: string;
};
```

## How CMS Data Is Referenced (Not Duplicated)

The `resume_configs.sections` JSONB array references existing CMS items by ID:

```jsonc
// Example sections array for a "Frontend Focus" resume config
[
  {
    "section": "summary",
    "enabled": true,
    "label": "Professional Summary",
    "itemIds": null, // uses custom_summary or profile.about_tech_stack
    "sort_order": 0,
  },
  {
    "section": "experience",
    "enabled": true,
    "label": "Work Experience",
    "itemIds": ["uuid-exp-1", "uuid-exp-2", "uuid-exp-3"], // specific experiences
    "sort_order": 1,
  },
  {
    "section": "skills",
    "enabled": true,
    "label": "Technical Skills",
    "itemIds": ["uuid-group-frontend", "uuid-group-tools"], // specific skill groups
    "sort_order": 2,
  },
  {
    "section": "projects",
    "enabled": true,
    "label": "Selected Projects",
    "itemIds": ["uuid-proj-1", "uuid-proj-4"], // specific projects
    "sort_order": 3,
  },
]
```

When generating a PDF:

1. Fetch all CMS data (profile, experiences, projects, skill_groups+skills)
2. Filter each section: if `itemIds` is null, include all; otherwise include only matching IDs
3. Order sections by `sort_order`
4. Pass the filtered/ordered data to the template renderer

## Template System Design

### Master Reference: `temp-downloads/resume.pdf`

The primary template is built to **pixel-match** the existing resume PDF (`temp-downloads/resume.pdf`). The PDF serves as a design spec — its layout, typography, colors, and spacing are faithfully reproduced in the React template. The PDF is not used at runtime; it's a visual reference consumed during implementation.

**Design tokens extracted from the reference PDF:**

| Element              | Value                                                                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**           | Two-region: section labels in left column (~22%), content in right column (~78%)                                                                                                                                                             |
| **Name**             | Large uppercase, ~28-32pt, dark charcoal text, bold/heavy weight                                                                                                                                                                             |
| **Accent color**     | Teal/cyan `#2bbcb3` — used for section labels and the "LT" monogram logo                                                                                                                                                                     |
| **Body font**        | Clean sans-serif (likely Open Sans / Lato / similar), ~10-11pt                                                                                                                                                                               |
| **Section labels**   | Uppercase, teal, bold, left-aligned in the margin column                                                                                                                                                                                     |
| **Contact line**     | Pipe-separated, below name: email \| phone \| location \| website (optional) \| GitHub (optional) \| LinkedIn (optional). All sourced from `profile` table. Website requires new `website_url` column (added in 8A).                         |
| **Work history**     | **Bold title** \| Company — Location, date right-aligned on same line                                                                                                                                                                        |
| **Bullets**          | Standard disc bullets, indented under each role                                                                                                                                                                                              |
| **Skills**           | Categorized by group (e.g., "Frontend", "Backend & Database") with bold group name, comma-separated skills per group. Differs from reference PDF which uses a flat two-column bullet list — we use the CMS `skill_groups` structure instead. |
| **Education**        | Institution name, then **bold degree** on next line. No CMS education table exists — rendered via the `custom` section type using `CustomItem` with free-form content.                                                                       |
| **Logo**             | "L/T" monogram in a teal-bordered square, top-left corner                                                                                                                                                                                    |
| **Page size**        | A4                                                                                                                                                                                                                                           |
| **Margins**          | ~0.75in all sides                                                                                                                                                                                                                            |
| **Header separator** | Subtle horizontal rule between contact info and first section                                                                                                                                                                                |

### Template Strategy

1. **Primary template (`professional.tsx`)** — Pixel-match of the reference PDF. This is the default template seeded in the database and used for all initial resume generation.
2. **Second template (future)** — A variation (e.g., modern two-column sidebar) can be added later. The template system supports multiple templates, but only one is built in Phase 8B.

Templates are React components that accept a standardized `ResumeData` prop and render print-optimized HTML. Each template lives as a file in `components/resume-templates/`.

```text
components/resume-templates/
├── types.ts                  # ResumeData type + TemplateComponent interface
├── registry.ts               # Maps template IDs to React components
├── professional.tsx          # Primary template — pixel-match of reference PDF
└── shared/
    ├── page-wrapper.tsx      # A4/Letter page container with print margins
    └── section-heading.tsx   # Teal uppercase section label (left column)
```

**Template interface**:

```typescript
// components/resume-templates/types.ts

// Standardized data shape passed to every template
export type ResumeData = {
  profile: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string | null;
    location: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
  };
  summary: string | null;
  sections: ResumeSection[];
  style: ResumeStyle;
  pageSize: 'A4' | 'Letter';
};

export type ResumeSection = {
  type: 'experience' | 'projects' | 'skills' | 'education' | 'custom';
  label: string;
  items: ExperienceItem[] | ProjectItem[] | SkillGroupItem[] | CustomItem[];
};

export type ExperienceItem = {
  title: string;
  company: string;
  displayDate: string;
  description: string;
};

export type ProjectItem = {
  title: string;
  description: string;
  tags: string[];
  sourceCodeUrl: string | null;
  liveSiteUrl: string | null;
};

export type SkillGroupItem = {
  category: string;
  skills: string[]; // skill names
};

export type CustomItem = {
  content: string; // free-form text or HTML
};

export type ResumeStyle = {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: string;
  lineHeight: string;
  margins: { top: string; right: string; bottom: string; left: string };
};

// Every template component must satisfy this interface
export type ResumeTemplateComponent = React.FC<{ data: ResumeData }>;
```

**Template registry** (maps DB template IDs → React components):

```typescript
// components/resume-templates/registry.ts
import type { ResumeTemplateComponent } from './types';

// Keys match the `registry_key` column in the `resume_templates` DB table.
// The DB stores human-readable keys (not UUIDs) so the registry can look up
// components directly without an extra mapping layer.
const templateRegistry: Record<string, () => Promise<{ default: ResumeTemplateComponent }>> = {
  professional: () => import('./professional'),
  // Additional templates can be added here in the future:
  // modern: () => import('./modern'),
};

// Accepts a registry_key (from resume_templates.registry_key), not a UUID.
export async function getTemplateComponent(
  registryKey: string
): Promise<ResumeTemplateComponent | null> {
  const loader = templateRegistry[registryKey];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function getAvailableRegistryKeys(): string[] {
  return Object.keys(templateRegistry);
}
```

**Template rendering approach**:

- Templates use **inline CSS** (no external stylesheets) for deterministic Playwright rendering
- CSS custom properties from `style_config` are applied as inline styles on a root container
- Print-specific rules: `@media print`, `page-break-inside: avoid`, `page-break-after: auto`
- No Tailwind in templates (inline CSS only for PDF fidelity)
- Templates use `<div>` with explicit widths matching A4 (210mm × 297mm) or Letter (8.5in × 11in)

## PDF Generation Pipeline

A server action that orchestrates the full pipeline:

```typescript
// actions/resume-builder.ts

async function generateResumePdf(
  configId: string
): Promise<{ data?: { versionId: string; pdfUrl: string }; error?: string }> {
  // 1. requireAdmin()
  // 2. Fetch resume_config + template from DB
  // 3. Fetch CMS data (profile, experiences, projects, skill_groups)
  // 4. Filter CMS data per config.sections (itemIds)
  // 5. Build ResumeData object
  // 6. Dynamically import template component from registry
  // 7. Render template to HTML string via ReactDOMServer.renderToStaticMarkup()
  // 8. Wrap HTML with full document (<!DOCTYPE html>, <head> with fonts, <body>)
  // 9. Launch Playwright browser, navigate to about:blank, set HTML content
  // 10. Call page.pdf({ format, margin, printBackground: true })
  // 11. Upload PDF buffer to Supabase Storage (resume bucket)
  // 12. Insert resume_versions row
  // 13. Return version ID and signed URL for preview
}
```

**Playwright specifics**:

- Use `chromium.launch()` (Playwright is already a dev dependency with locked Chromium)
- Set `page.setContent(html, { waitUntil: 'networkidle' })` for font loading
- PDF options: `format: 'A4'` or `'Letter'`, `margin` from style config, `printBackground: true`
- **Server-only**: Playwright runs on the server in the Node.js runtime, not edge
- **Timeout**: 30-second timeout for PDF generation, with Sentry breadcrumb logging
- **Cleanup**: Always close browser in a `finally` block

**Performance considerations**:

- Target: < 5 seconds for PDF generation (per NFR)
- Playwright browser launch is the main cost (~1-2s cold start)
- Consider caching the browser instance across requests if generation is frequent (future optimization)
- PDF buffer size: typically 50-200 KB for a 1-2 page resume

## "Active" Resume Integration

The resume builder produces versions stored in the `resume` bucket alongside the manually uploaded resume. The integration point:

1. Each `resume_version` has an `is_active` boolean (only one can be active at a time)
2. Each `resume_config` has an `is_active` boolean (only one config can be active)
3. When a version is "activated", the `activateResumeVersion` server action:
   a. Sets `is_active = false` on all other versions
   b. Sets `is_active = true` on the selected version
   c. Updates `profile.resume_url` to point to the activated version's `pdf_storage_path`
   d. Steps a–c should run sequentially (Supabase doesn't support multi-statement transactions via the JS client, but the unique partial index `resume_versions_single_active` prevents concurrent activations from producing >1 active row — a constraint violation is surfaced as an error to the caller)
   e. The existing visitor download flow (`actions/resume.ts`) works unchanged
4. The admin can still manually upload a resume via the existing Resume Manager — this overwrites `profile.resume_url` and sets all builder versions to `is_active = false`
5. The Resume Manager page shows which resume is currently active: a generated version or a manually uploaded file

## Admin UI Pages

```text
app/admin/(dashboard)/
├── resume-builder/
│   └── page.tsx              # Main resume builder page (URL: /admin/resume-builder)
```

The resume builder page uses a **tabbed interface** (consistent with the profile editor pattern):

| Tab                    | Purpose                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Configs**            | List of resume configs, create/edit/delete, set active                                                             |
| **Composer**           | Edit a selected config: pick template, toggle sections, filter items, reorder, set custom summary, style overrides |
| **Preview & Generate** | Live HTML preview, generate PDF button, download preview                                                           |
| **Templates**          | View/manage templates, style customization                                                                         |
| **History**            | List of generated versions with download/activate/delete actions                                                   |

**Components** (in `components/admin/`):

```text
components/admin/
├── resume-builder/
│   ├── resume-builder-tabs.tsx      # Main tabbed container
│   ├── config-list.tsx              # Configs tab: CRUD list of resume configs
│   ├── resume-composer.tsx          # Composer tab: section picker, item filter, reorder
│   ├── resume-preview.tsx           # Preview tab: live HTML preview + generate button
│   ├── template-manager.tsx         # Templates tab: template list + style editor
│   └── version-history.tsx          # History tab: version list + activate/download/delete
```

### Admin Shell Navigation Update

Add a new nav item to `components/admin/admin-shell.tsx`:

```typescript
{ href: '/admin/resume-builder', label: 'Resume Builder', icon: FileText }
```

This sits between the existing "Resume" (upload/download management) and "Visitors" nav items. The existing "Resume" page remains for manual upload and download log viewing.

---

## Implementation Sub-tasks

### 8A: Database Schema & Types

**Scope:** Create the three new tables, RLS policies, and TypeScript types.

**Tasks:**

1. Create `supabase/resume-builder-schema.sql` with `resume_templates`, `resume_configs`, `resume_versions` tables
2. Create `supabase/resume-builder-rls.sql` with RLS policies
3. Add `website_url TEXT` column to the existing `profile` table (needed for resume header contact line — not currently in the CMS schema). Update `Profile` / `ProfileInsert` types in `lib/supabase/types.ts`.
4. Add Row, Insert, Update types to `lib/supabase/types.ts` for all three new tables
5. Add `ResumeSectionConfig` type for the JSONB sections array
6. Seed 1 built-in template ("Professional" — matching the reference PDF `temp-downloads/resume.pdf`) via a seed script or SQL insert

**Testing:**

- Verify SQL runs without errors in Supabase SQL Editor
- Verify TypeScript types compile (`npm run build`)

### 8A Status: PENDING

---

### 8B: Template System & React Components

**Scope:** Build the template rendering infrastructure and the primary "Professional" template that pixel-matches `temp-downloads/resume.pdf`.

**Master reference:** `temp-downloads/resume.pdf` — the generated PDF must be visually indistinguishable from this file.

**Tasks:**

1. Create `components/resume-templates/types.ts` — `ResumeData`, `ResumeSection`, `ExperienceItem`, `ProjectItem`, `SkillGroupItem`, `ResumeStyle`, `ResumeTemplateComponent` types
2. Create `components/resume-templates/registry.ts` — template ID → component mapping with lazy imports
3. Create `components/resume-templates/shared/page-wrapper.tsx` — A4/Letter container with CSS margins, print styles
4. Create `components/resume-templates/shared/section-heading.tsx` — teal uppercase section label positioned in the left column (matching reference PDF)
5. Create `components/resume-templates/professional.tsx` — **pixel-match of `temp-downloads/resume.pdf`**:
   - Two-region layout: ~22% left column (section labels), ~78% right column (content)
   - "LT" monogram logo in teal-bordered square, top-left
   - Large uppercase name heading, teal accent color `#2bbcb3`
   - Pipe-separated contact info line (email | phone | location | website | LinkedIn)
   - Section labels: uppercase, teal, bold, in left column
   - Work history: bold title | company — location, date right-aligned
   - Skills: categorized by group — bold group name, comma-separated skills (uses CMS `skill_groups` structure, not flat list from reference PDF)
   - Education: institution name, bold degree below (uses `custom` section type — no CMS education table)
   - Inline CSS only (no Tailwind) for PDF fidelity

**Testing:**

- Unit tests: render the Professional template with mock `ResumeData`, verify output contains expected content (name, sections, contact info)
- Visual test: generate a PDF via Playwright and compare side-by-side with `temp-downloads/resume.pdf`
- Verify HTML output is valid and contains print CSS
- Verify inline styles use design tokens from `ResumeStyle`

### 8B Status: PENDING

---

### 8C: PDF Generation Server Action

**Scope:** Build the server action that assembles CMS data, renders a template, and produces a PDF via Playwright.

**Tasks:**

1. Create `actions/resume-builder.ts` with:
   - `generateResumePdf(configId: string)` — full pipeline: fetch config → fetch CMS data → filter → render template → Playwright PDF → upload to storage → insert version row
   - `assembleResumeData(config: ResumeConfig)` — helper that fetches CMS data and filters per config sections
   - `renderTemplateToHtml(templateId: string, data: ResumeData)` — renders React component to full HTML document string
2. Create `lib/resume-builder/render-to-pdf.ts` — isolated Playwright logic:
   - `htmlToPdf(html: string, options: { pageSize, margins })` — launches Playwright, sets HTML, generates PDF buffer
   - Handles browser lifecycle (launch → close in finally)
   - 30-second timeout
3. Upload generated PDF to `resume` bucket with path pattern: `generated/{configId}/{versionId}.pdf`
4. Insert `resume_versions` row with snapshot and metadata

**Testing:**

- Unit tests: mock Playwright and Supabase, verify `assembleResumeData` filters correctly
- Unit tests: verify `renderTemplateToHtml` produces valid HTML with expected content
- Integration test (optional): generate an actual PDF with Playwright in a test, verify buffer is non-empty and > 1 KB

### 8C Status: PENDING

---

### 8D: Resume Config CRUD Server Actions

**Scope:** Server actions for creating, updating, deleting, and listing resume configs.

**Tasks:**

1. Add to `actions/resume-builder.ts`:
   - `getResumeConfigs()` — fetch all configs with their template name (join)
   - `getResumeConfig(id: string)` — fetch single config with full data
   - `createResumeConfig(data: ResumeConfigInsert)` — insert + return
   - `updateResumeConfig(id: string, data: Partial<ResumeConfigInsert>)` — update + return
   - `deleteResumeConfig(id: string)` — fetch all associated versions, remove their PDFs from storage via `deleteStorageFile`, then delete config row (DB cascade removes version rows). Storage errors are logged but do not block DB cleanup.
   - `activateResumeVersion(versionId: string)` — set version as active, update `profile.resume_url`
   - `getResumeVersions(configId: string)` — fetch versions for a config, ordered by `created_at` desc
   - `deleteResumeVersion(id: string)` — delete version + clean up storage file
2. Add template CRUD actions:
   - `getResumeTemplates()` — fetch all templates
   - `updateResumeTemplate(id: string, data: Partial<ResumeTemplateInsert>)` — update style_config/name/description (built-in templates can have style customized)

**Testing:**

- Unit tests following the existing `admin.test.ts` pattern: mock Supabase, verify CRUD operations, verify `revalidatePath` calls, verify `requireAdmin` is called

### 8D Status: PENDING

---

### 8E: Admin UI — Config List & Composer

**Scope:** Build the Configs tab and Composer tab of the resume builder page.

**Tasks:**

1. Create `app/admin/(dashboard)/resume-builder/page.tsx` — server component that fetches configs, templates, and CMS data (experiences, projects, skill groups)
2. Create `components/admin/resume-builder/resume-builder-tabs.tsx` — tabbed container with Configs, Composer, Preview, Templates, History tabs
3. Create `components/admin/resume-builder/config-list.tsx`:
   - Table/card list of resume configs with name, template, section count, active badge
   - Create/Edit dialog (name, description, template picker)
   - Delete confirmation dialog
   - "Select" button to load config into Composer tab
4. Create `components/admin/resume-builder/resume-composer.tsx`:
   - Section list with enable/disable toggles
   - Item picker per section (checkboxes of experiences/projects/skill groups from CMS data)
   - Drag-and-drop or up/down arrow reordering of sections
   - Custom summary textarea
   - Style override controls (primary color, accent color, font size)
   - Save button (calls `updateResumeConfig`)
5. Add "Resume Builder" nav item to `components/admin/admin-shell.tsx`

**Testing:**

- Component tests: render ConfigList with mock data, verify CRUD interactions
- Component tests: render ResumeComposer with mock config + CMS data, verify section toggling and item selection

### 8E Status: PENDING

---

### 8F: Admin UI — Preview & Generation

**Scope:** Build the Preview tab with live HTML preview and PDF generation trigger.

**Tasks:**

1. Create `components/admin/resume-builder/resume-preview.tsx`:
   - Renders the selected config's template as an `<iframe>` with the assembled HTML
   - "Generate PDF" button that calls `generateResumePdf(configId)` server action
   - Loading state with progress indication during generation
   - Success: show download link + option to activate
   - Error: display error message
   - Page size indicator (A4/Letter)
2. Create a helper server action `previewResumeHtml(configId: string)` that returns the rendered HTML string (same as generation but without the Playwright/PDF step) for the iframe preview
3. Add zoom controls for the preview (50%, 75%, 100%)

**Testing:**

- Component tests: render ResumePreview with mock HTML, verify iframe renders, verify generate button calls server action
- Verify loading/success/error states

### 8F Status: PENDING

---

### 8G: Admin UI — Templates & Version History

**Scope:** Build the Templates tab (style customization) and History tab (version management).

**Tasks:**

1. Create `components/admin/resume-builder/template-manager.tsx`:
   - Card grid of available templates with thumbnail preview
   - Style editor panel: color pickers, font selectors, margin inputs
   - "Reset to defaults" button for built-in templates
   - Save style changes (calls `updateResumeTemplate`)
2. Create `components/admin/resume-builder/version-history.tsx`:
   - Table of generated versions: date, config name, template, file size, page count, generation time, active badge
   - Actions per version: Download, Activate (as visitor-facing resume), Delete
   - "Activate" calls `activateResumeVersion` which updates `profile.resume_url`
   - Delete confirmation with storage cleanup

**Testing:**

- Component tests: render TemplateManager with mock templates, verify style editing
- Component tests: render VersionHistory with mock versions, verify activate/download/delete actions

### 8G Status: PENDING

---

### 8H: Testing & Polish

**Scope:** Integration testing, E2E test, loading states, error boundaries, and final polish.

**Tasks:**

1. Add `loading.tsx` skeleton for `/admin/resume-builder` page
2. Add error handling for Playwright failures (browser not available, timeout, etc.)
3. Add Sentry breadcrumbs to PDF generation pipeline for debugging
4. Integration test: generate a real PDF with Playwright (if CI has Playwright installed)
5. E2E test (`e2e/admin-resume-builder.spec.ts`):
   - Navigate to Resume Builder page
   - Create a resume config
   - Verify config appears in list
   - (PDF generation E2E may be skipped if Playwright browser conflicts with test runner)
6. Verify existing resume download flow still works when `profile.resume_url` points to a generated PDF
7. Run full test suite: `npm run test:run`, `npm run lint`, `npm run build`, `npm run format:check`

**Testing:**

- All new unit/component tests pass
- E2E tests pass
- Build succeeds
- No regression in existing resume download flow

### 8H Status: PENDING

---

### 8I: JD Analysis Engine

**Scope:** Server-side module that accepts a job description, extracts keywords via LLM, scores coverage against CMS data, and returns suggestions for section emphasis.

**Prerequisites:** Requires an LLM API key (Anthropic Claude or OpenAI). Adds `RESUME_BUILDER_LLM_API_KEY` env var. Optional feature — the resume builder works without it.

**Tasks:**

1. Create `lib/resume-builder/jd-analyzer.ts`:
   - `extractKeywords(jobDescription: string)` — calls LLM to extract key skills, technologies, qualifications, and soft skills from the JD. Returns `string[]` of normalized keywords.
   - `scoreCoverage(keywords: string[], cmsData: { experiences, projects, skillGroups })` — matches extracted keywords against CMS content (skill names, experience descriptions, project tags/descriptions). Returns `{ score: number, matchedKeywords: string[], missingKeywords: string[] }`.
   - `generateSuggestions(keywords: string[], cmsData)` — recommends which experiences/projects/skill groups to include based on keyword relevance. Returns `JdSuggestion[]` with item IDs and reasons.
2. Add server actions to `actions/resume-builder.ts`:
   - `analyzeJobDescription(configId: string, jobDescription: string)` — orchestrates: extract keywords → score coverage → generate suggestions → update `resume_configs` row with results.
   - `clearJdAnalysis(configId: string)` — clears JD fields on a config.
3. LLM integration:
   - Use Anthropic Claude API (Haiku model for cost efficiency, ~$0.01 per analysis)
   - Structured prompt that returns JSON: `{ keywords: string[], categories: { technical: string[], soft: string[], qualifications: string[] } }`
   - Guard: skip LLM call if `RESUME_BUILDER_LLM_API_KEY` is not set, return error
   - Timeout: 15-second timeout on LLM call
4. Keyword matching logic:
   - Case-insensitive matching
   - Fuzzy matching for common variations (e.g., "JS" ↔ "JavaScript", "React.js" ↔ "React")
   - Match against: skill names, experience descriptions + titles, project descriptions + tags

**Testing:**

- Unit tests: mock LLM response, verify keyword extraction parsing
- Unit tests: verify coverage scoring with known CMS data and keyword sets
- Unit tests: verify suggestion generation picks relevant items
- Test graceful degradation when LLM API key is not configured

### 8I Status: PENDING

---

### 8J: JD Optimization UI

**Scope:** Add JD optimization section to the Composer tab — paste JD, view keyword analysis, see coverage score, apply suggestions.

**Tasks:**

1. Add JD section to `components/admin/resume-builder/resume-composer.tsx` (or create a separate `jd-optimizer.tsx` component):
   - Textarea to paste job description
   - "Analyze" button that calls `analyzeJobDescription` server action
   - Loading state during LLM analysis
   - Results display:
     - **Coverage score**: progress bar (0–100%) with color coding (red < 50%, amber 50–75%, green > 75%)
     - **Matched keywords**: green chips/badges
     - **Missing keywords**: amber chips/badges
     - **Suggestions list**: each suggestion shows the recommended item (experience/project/skill group) with the reason. "Apply" button per suggestion that checks the item in the section picker.
   - "Apply All Suggestions" button that batch-applies all recommendations to the config's sections
   - "Clear Analysis" button to reset
2. Persist JD and analysis results in the resume config (already saved via `analyzeJobDescription` server action)
3. Show JD coverage score as a badge in the Config List tab (next to config name)
4. Guard: hide the JD section entirely when `RESUME_BUILDER_LLM_API_KEY` is not configured (check via a server action or env var flag passed as prop)

**Testing:**

- Component tests: render JD optimizer with mock analysis results, verify keyword chips, score bar, suggestion cards
- Component tests: verify "Apply" button updates section selections
- Component tests: verify hidden state when LLM is not configured
- Verify graceful UX when analysis fails (error message, retry button)

### 8J Status: PENDING

---

## Implementation Notes

- **Playwright in production**: Playwright is currently a dev dependency used for E2E testing. For PDF generation in production (Vercel), it needs to be available at runtime. Options:
  - **Option A (recommended)**: Use `@playwright/browser-chromium` as a production dependency + `playwright-core` for the API. This installs only the Chromium browser, keeping the bundle smaller.
  - **Option B**: Use an API route instead of a server action, deployed as a serverless function with enough memory/timeout for Playwright (Vercel Pro plan may be needed for >10s timeout).
  - **Option C**: Use a separate microservice/API for PDF generation (overengineered for single-user).
  - **Decision needed before 8C**: confirm deployment target and Playwright runtime strategy.
- **Template fonts**: Built-in templates use web-safe fonts (Inter via Google Fonts CDN `<link>` in the HTML document). Playwright loads fonts during `waitUntil: 'networkidle'`.
- **Storage path convention**: Generated PDFs stored at `generated/{configId}/{versionId}.pdf` in the `resume` bucket, separate from the manually uploaded `resume.pdf`.
- **Active resume precedence**: `profile.resume_url` is the single source of truth for what visitors download. Both the manual upload and the "activate version" action update this same field.
- **No data duplication**: The `config_snapshot` in `resume_versions` stores the _config_ (sections, itemIds, style) at generation time — not the CMS data itself. This allows understanding what was included in a version without duplicating experience/project/skill rows. If exact content reproduction is needed, a full data snapshot could be added later.
- **JD Optimization LLM dependency (8I/8J)**: Uses Anthropic Claude API (Haiku model) for keyword extraction. The feature is fully optional — guarded by `RESUME_BUILDER_LLM_API_KEY` env var. When not configured, the JD section is hidden in the UI and the resume builder works as a manual composition tool. Cost: ~$0.01–0.05 per JD analysis. The LLM is only called on explicit user action ("Analyze" button), never automatically.

## Phase 8 Status: PENDING
