# CMS, Authentication & Content Management Plan

## Overview

Migrate hardcoded portfolio content to a Supabase-backed CMS with an admin dashboard, and add authentication for resume downloads and admin access.

### Decisions

| Concern            | Choice                             |
| ------------------ | ---------------------------------- |
| Database           | Supabase (Postgres)                |
| Auth               | Supabase Auth                      |
| File storage       | Supabase Storage                   |
| Admin dashboard    | Built-in Next.js `/admin` routes   |
| Visitor login gate | Resume download only               |
| Visitor data       | Capture profile + optional fields  |
| Contact form       | Pre-fill from session if logged in |

---

## Phase 1: Supabase Setup & Database Schema

### 1.1 Supabase Project Setup

- Create Supabase project
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, for bootstrap operations like seeding and setting admin roles — never exposed to the client)
- Create Supabase client utilities:
  - `lib/supabase/client.ts` — browser client (uses anon key)
  - `lib/supabase/server.ts` — server client (uses anon key + user's JWT for RLS-respecting operations; service role key used only in `lib/supabase/admin.ts` for specific operations that genuinely need to bypass RLS, such as setting admin roles)

### 1.2 Database Schema

Tables map to the current data structures in `lib/data.ts` plus hardcoded content across components.

```sql
-- ============================================
-- CONTENT TABLES
-- ============================================

-- Personal info (about, intro, contact, footer — singleton row)
-- Enforced via UNIQUE constraint on a constant sentinel value.
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton = true),
  full_name TEXT NOT NULL,
  short_name TEXT NOT NULL,           -- "Lalding"
  job_title TEXT NOT NULL,            -- "Full-stack Tech Lead"
  tagline TEXT,                       -- intro paragraph
  typewriter_titles TEXT[] NOT NULL,  -- ["Full-stack Tech Lead", "React Specialist", ...]
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  resume_url TEXT,                    -- Supabase Storage path
  about_tech_stack TEXT,              -- tech stack description paragraph
  about_current_focus TEXT,           -- current focus paragraph
  about_beyond_code TEXT,             -- beyond code paragraph
  about_expertise TEXT[],             -- ["Monorepos & NX", "Micro Frontends", ...]
  footer_text TEXT,                   -- footer description
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
  hash TEXT NOT NULL,                 -- "#home", "#about", etc.
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Companies (logo slider)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,             -- Supabase Storage path
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Experience / career timeline
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- "Deputy Vice President"
  company TEXT NOT NULL,              -- "HDFC Bank Limited"
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'work',  -- string identifier mapped to React icons in frontend
  start_date DATE NOT NULL,           -- enables sorting and date-based queries
  end_date DATE,                      -- NULL = current/present role
  display_date TEXT NOT NULL,         -- human-readable label, e.g. "May 2023 - Present"
  company_logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Project categories
CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- "All", "React", "Mobile", "Full-stack"
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  image_url TEXT,                     -- Supabase Storage path (e.g. "project-images/my-project.png")
  demo_video_url TEXT,               -- Supabase Storage path (optional, e.g. "project-videos/demo.mp4")
  source_code_url TEXT,
  live_site_url TEXT,
  category_id UUID REFERENCES project_categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skill groups
CREATE TABLE skill_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,             -- "Frontend", "Backend & Database", etc.
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skills (belong to a group)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES skill_groups(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- AUTH & VISITOR TABLES
-- ============================================

-- Visitor profiles (populated on social login)
-- Supabase Auth handles the auth.users table automatically.
-- This table extends it with optional fields not available in auth.users
-- (company, role). The email field is denormalized here for convenience
-- in admin views and CSV export; it is kept in sync via a DB trigger
-- (see below) and refreshed on every login upsert. auth.users is the
-- source of truth for email.
CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,                         -- denormalized from auth.users, synced via trigger
  avatar_url TEXT,
  provider TEXT,                      -- "google", "linkedin_oidc", "github"
  company TEXT,                       -- optional, asked before download
  role TEXT,                          -- optional, asked before download
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Keep visitor_profiles.email in sync when auth.users.email changes
CREATE OR REPLACE FUNCTION sync_visitor_email()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE visitor_profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_visitor_email();

-- Resume download log
CREATE TABLE resume_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitor_profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (subset of auth.users with admin role)
-- Managed via Supabase Auth app_metadata: { role: "admin" }
-- Set server-side via Supabase Admin API (supabase.auth.admin.updateUserById)
-- No separate table needed — use RLS policies + app_metadata.
```

**Icon mapping note**: The current `lib/data.ts` stores React elements (`React.createElement(CgWorkAlt)`) for experience icons. The database stores string identifiers (e.g., `"work"`, `"react"`). The seed script maps current React elements to string keys, and the frontend maps strings back to icons via a lookup object:

```typescript
const iconMap: Record<string, React.ReactNode> = {
  work: <CgWorkAlt />,
  react: <FaReact />,
};
```

### 1.3 Row Level Security (RLS)

```sql
-- Content tables: public read, admin write
-- Pattern applied to all content tables:
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON profile
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON profile
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- visitor_profiles: visitors can read/update their own row
ALTER TABLE visitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON visitor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON visitor_profiles
  FOR UPDATE USING (auth.uid() = id);

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
```

### 1.4 Supabase Storage Buckets

| Bucket           | Access  | Purpose                                    |
| ---------------- | ------- | ------------------------------------------ |
| `resume`         | Private | Resume PDF (served via signed URL on auth) |
| `project-images` | Public  | Project screenshot images                  |
| `project-videos` | Public  | Optional short demo videos for projects    |
| `company-logos`  | Public  | Company logo images                        |

### 1.5 Seed Script

Create `lib/supabase/seed.ts` to migrate current `lib/data.ts` + hardcoded content into the database. This ensures no data is lost during migration. The seed script:

- Maps `React.createElement()` icon calls to string identifiers
- Parses free-form date strings into structured date fields using a `parseDateRange()` function
- Sets `demo_video_url` to `NULL` for all existing projects (videos will be added later via admin dashboard)

**Date parsing rules** (`parseDateRange`):

| Input pattern               | start_date   | end_date     | display_date    |
| --------------------------- | ------------ | ------------ | --------------- |
| `"Month Year - Month Year"` | 1st of month | 1st of month | original string |
| `"Month Year - Year"`       | 1st of month | Jan 1st      | original string |
| `"Month Year - Present"`    | 1st of month | `NULL`       | original string |
| Year-only (e.g., `"2025"`)  | Jan 1st      | `NULL`       | original string |

- "Present", "Current", and "Now" (case-insensitive) → `end_date = NULL`
- Unparseable values → log a warning, use current date as `start_date`, `NULL` as `end_date`, and flag for manual review
- The original string is always preserved as `display_date`

Example: `"May 2023 - 2025"` → `{ start_date: "2023-05-01", end_date: "2025-01-01", display_date: "May 2023 - 2025" }`

### Phase 1 Implementation Notes

- Auth/visitor tables (`visitor_profiles`, `resume_downloads`, email sync trigger) are deferred to Phase 2 since they depend on Supabase Auth being configured. Phase 1 creates content tables only.
- SQL files are stored in `supabase/` directory at the project root:
  - `supabase/schema.sql` — content tables
  - `supabase/rls.sql` — RLS policies for content tables
  - `supabase/storage.sql` — storage bucket creation + access policies
- These SQL files must be run manually in the Supabase SQL Editor after creating the project.
- TypeScript types in `lib/supabase/types.ts` are hand-written to match the schema. They can be regenerated later via `supabase gen types typescript` once the Supabase CLI is set up.
- The seed script uses the admin client (service role key) to bypass RLS.
- `next.config.js` is updated with Supabase hostname in `images.remotePatterns` so `<Image>` works with Supabase Storage URLs.

### Phase 1 Status: COMPLETE

---

## Phase 2: Authentication

### 2.1 Supabase Auth Configuration

Configure providers in Supabase dashboard:

| Provider         | Use case              | Notes                                        |
| ---------------- | --------------------- | -------------------------------------------- |
| Google           | Visitor + Admin login | OAuth 2.0, configure in Google Cloud Console |
| LinkedIn (OIDC)  | Visitor + Admin login | LinkedIn uses OIDC provider in Supabase      |
| GitHub           | Visitor + Admin login | OAuth App in GitHub settings                 |
| Email + Password | Admin login only      | Disabled for visitors                        |

### 2.2 Auth Proxy (Route Protection)

Create `proxy.ts` at the project root to handle session refresh and route protection (Next.js 16 uses the `proxy` convention instead of `middleware`):

```text
/admin/*     → Require authenticated user with admin role
/api/admin/* → Require authenticated user with admin role
Everything else → Public
```

Resume downloads are handled via a server action (not an API route), so auth is checked inside the action itself rather than in middleware.

### 2.3 Auth UI Components

| Component             | Location                                    | Purpose                                                                                                  |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `LoginModal`          | `components/auth/login-modal.tsx`           | Modal with social login buttons (Google, LinkedIn, GitHub). Shown when visitor clicks "Download Resume". |
| `AdminLoginPage`      | `app/admin/login/page.tsx`                  | Admin login page with email/password + social login options.                                             |
| `AuthProvider`        | `context/auth-context.tsx`                  | React context wrapping Supabase auth state. Provides `user`, `session`, `signIn`, `signOut`.             |
| `OptionalFieldsModal` | `components/auth/optional-fields-modal.tsx` | After first social login, optionally ask for company and role before proceeding to download.             |

### 2.4 Resume Download Flow

```text
1. Visitor clicks "Download Resume" (intro.tsx or command palette)
2. If not authenticated → show LoginModal with social login buttons
3. On successful login:
   a. Upsert visitor_profiles row (name, email, avatar, provider from OAuth)
   b. If first login → show OptionalFieldsModal (company, role — skippable)
   c. Call server action to generate a signed URL (5-minute expiry) for the private resume bucket
   d. Log download in resume_downloads table (server-side)
   e. Return signed URL to client, trigger browser download
4. If already authenticated → skip to step 3c
```

### 2.5 Contact Form Pre-fill

When a visitor is logged in (has an active Supabase session):

- Pre-fill the contact form's name and email fields from `visitor_profiles`
- Fields remain editable (pre-filled, not locked)
- No change to the server action `sendEmail.ts` — it still receives form data as before

### Phase 2 Implementation Notes

- Created `supabase/auth-schema.sql` with `visitor_profiles` table (references `auth.users`), `resume_downloads` table, and `sync_visitor_email()` trigger function.
- Created `supabase/auth-rls.sql` with RLS policies: visitors can read/update/insert own profile row, admin can read all; visitors can insert own downloads, admin can read all.
- Added `VisitorProfile`, `ResumeDownload`, and their Insert types to `lib/supabase/types.ts`, following the existing pattern with Row, Insert, Update, Relationships properties.
- Created `proxy.ts` at project root using `@supabase/ssr` `createServerClient` with request/response cookie handling (Next.js 16 convention). Refreshes auth session on every request, protects `/admin/*` routes (requires `app_metadata.role === 'admin'`), redirects unauthorized users to `/`.
- Created `app/auth/callback/route.ts` — GET route handler that exchanges OAuth `code` for a session via `supabase.auth.exchangeCodeForSession()` and redirects to the `next` query param or `/`.
- Created `context/auth-context.tsx` following existing context provider pattern. Provides `user`, `visitorProfile`, `isLoading`, `isNewUser`, `signInWithProvider()`, `signOut()`, `refreshVisitorProfile()`, `clearNewUserFlag()`. Listens to `onAuthStateChange` and upserts visitor profile via server action on `SIGNED_IN`.
- Created `actions/resume.ts` with three server actions:
  - `upsertVisitorProfile()` — gets user from session, upserts `visitor_profiles` row, returns `{ data, isNewUser }`.
  - `updateVisitorOptionalFields(company, role)` — updates company and role fields.
  - `downloadResume()` — verifies auth, generates signed URL (5-min expiry) from private `resume` bucket, logs download in `resume_downloads`.
- Created `components/auth/login-modal.tsx` — Framer Motion modal with Google, GitHub, LinkedIn social login buttons. Stores `pendingAction` in localStorage before OAuth redirect.
- Created `components/auth/optional-fields-modal.tsx` — Framer Motion modal with Company and Role inputs, Skip/Continue buttons.
- Added `useResumeDownload` hook to `lib/hooks.ts` — encapsulates the full auth-gated download flow. Checks auth state, shows login modal for unauthenticated users, shows optional fields modal for new users, triggers signed URL download for authenticated users. Subscribes to `onAuthStateChange` to resume download after OAuth redirect.
- Updated `components/intro.tsx` — replaced `<a>` download link with `<button>` that calls `handleResumeClick()`, shows loading spinner during download, renders `LoginModal` and `OptionalFieldsModal`.
- Updated `components/command-palette.tsx` — replaced direct download action with `handleResumeClick()`, renders `LoginModal` and `OptionalFieldsModal`.
- Updated `components/contact.tsx` — added `senderName` text input above email field, pre-fills both name and email from `visitorProfile` using `defaultValue` with `key`-based re-mounting when profile loads. Fields remain editable.
- Updated `app/layout.tsx` — wrapped with `AuthProvider` inside `ThemeContextProvider`.
- Note: Next.js 16 shows a deprecation warning that "middleware" should use "proxy" convention. The middleware still works correctly; this is an informational warning for a future migration.
- AdminLoginPage (`app/admin/login/page.tsx`) is deferred to Phase 4 since it's part of the admin dashboard.
- **Known issue**: LinkedIn OIDC login is not working (Google and GitHub work fine). Deferred — will debug after all phases are implemented. Most likely a configuration issue in the LinkedIn Developer Portal (OIDC product approval, redirect URL, or scope mismatch).

### Phase 2 Status: COMPLETE

---

## Phase 3: Data Layer — Fetching Content from Supabase

### 3.1 Data Fetching Strategy

Replace static imports from `lib/data.ts` with Supabase queries. Since this is a portfolio site with infrequently changing content, we'll use **ISR (Incremental Static Regeneration)** with on-demand revalidation.

| Pattern                | Where                        | How                                                                 |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------- |
| Server Components      | `app/page.tsx`               | Fetch data in server components, pass as props to client components |
| ISR + revalidation     | `app/page.tsx`, `layout.tsx` | `export const revalidate = 3600` (per-segment, App Router pattern)  |
| On-demand revalidation | Admin dashboard save         | Call `revalidatePath('/')` and `revalidateTag()` after admin edits  |
| Client-side auth state | Auth context                 | Supabase real-time auth listener                                    |

### 3.2 Cache Tag Strategy

Use `revalidateTag()` for granular cache invalidation. Each data fetch is tagged, and admin actions invalidate only the relevant tag(s).

| Tag           | Scope                                | Attached to                               | Invalidated by                                                   |
| ------------- | ------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| `profile`     | Profile info, stats, contact, footer | `getProfile()`, `getProfileStats()`       | `updateProfile()`, `updateStats()`                               |
| `experiences` | Career timeline + companies slider   | `getExperiences()`, `getCompanies()`      | `createExperience()`, `updateExperience()`, `deleteExperience()` |
| `projects`    | Project cards + categories           | `getProjects()`, `getProjectCategories()` | `createProject()`, `updateProject()`, `deleteProject()`          |
| `skills`      | Skill groups and individual skills   | `getSkillGroups()`                        | `createSkill()`, `updateSkill()`, `deleteSkill()`                |
| `navigation`  | Header nav links                     | `getNavLinks()`                           | `updateNavLinks()`                                               |

Tags are attached in query functions via `next: { tags: ['profile'] }` options. Admin server actions call `revalidateTag('<tag>')` after mutations, with `revalidatePath('/')` as a fallback to ensure full-page invalidation when needed.

### 3.3 Refactor Component Architecture

Currently `app/page.tsx` is a client component (`'use client'`) and all data-consuming components import directly from `lib/data.ts`. Refactor:

1. **`app/page.tsx`** — Remove `'use client'` directive, convert to a **server component**. Fetch all content data from Supabase here. This requires moving Framer Motion animations out of the page component and into individual section wrapper client components.
2. Pass data as serializable props to child components.
3. Client components (`'use client'`) remain for:
   - Components with interactivity (animations, filters, scroll observers)
   - Auth-dependent UI (download button, contact form pre-fill)
   - Each section already has its own client component — these receive data as props instead of importing from `lib/data.ts`

### 3.4 Data Fetching Functions

Create `lib/supabase/queries.ts` with typed query functions:

```typescript
// Each function returns typed data from Supabase
getProfile()          → Profile
getProfileStats()     → ProfileStat[]
getNavLinks()         → NavLink[]
getCompanies()        → Company[]
getExperiences()      → Experience[]
getProjectCategories()→ ProjectCategory[]
getProjects()         → Project[] (includes optional demo_video_url)
getSkillGroups()      → SkillGroup[] (with nested skills)
```

### 3.5 TypeScript Types

Create `lib/supabase/types.ts` — generate from Supabase schema using `supabase gen types typescript`. These types replace the current `lib/types.ts` and inline types in `lib/data.ts`.

### 3.6 Migration Path

To avoid a big-bang migration, implement a **fallback pattern** during development only:

1. Keep `lib/data.ts` as a static fallback during local development
2. Data fetching functions try Supabase first, fall back to static data if `NEXT_PUBLIC_SUPABASE_URL` is not configured
3. Log a warning when fallback is triggered so it's never silently active
4. Remove fallback before production deployment — production always requires Supabase

### Phase 3 Implementation Notes

- Created `lib/supabase/queries.ts` with 9 data fetching functions (`getProfile`, `getProfileStats`, `getNavLinks`, `getCompanies`, `getExperiences`, `getProjectCategories`, `getProjects`, `getSkillGroups`) plus a shared `getProfileData()` helper that maps DB columns to frontend camelCase types with static fallback.
- Converted `app/page.tsx` from a client component to an async **server component**. It fetches all content data from Supabase via `Promise.all()` and passes serializable props to child components. Uses `export const revalidate = 3600` for ISR.
- Created `components/section-animation.tsx` — a client component wrapper for Framer Motion scroll-triggered animations, extracted from page.tsx since server components cannot use Framer Motion directly.
- Created shared serializable data types in `lib/types.ts` (`ProfileData`, `ProfileStatData`, `CompanyData`, `ExperienceData`, `ProjectData`, `SkillGroupData`) to bridge the server→client boundary with camelCase naming.
- Refactored all content-consuming components to receive data as props instead of importing from `lib/data.ts`:
  - `intro.tsx` — accepts `{ profile: ProfileData }`
  - `about.tsx` — accepts `{ profile: ProfileData; stats: ProfileStatData[] }`
  - `projects.tsx` — accepts `{ projects: ProjectData[]; categories: string[] }`
  - `project.tsx` — accepts `ProjectData` props directly
  - `skills.tsx` — accepts `{ skillGroups: SkillGroupData[] }`
  - `experience.tsx` — accepts `{ experiences: ExperienceData[]; companies: CompanyData[] }`, maps icon string identifiers (`"work"`, `"react"`) to React elements via `iconMap`
  - `companies-slider.tsx` — accepts `{ companies: CompanyData[] }`
  - `contact.tsx` — accepts `{ profile: ProfileData }`, uses profile data for email/phone/location/social links
  - `footer.tsx` — accepts `{ profile: ProfileData }`, uses profile data for name, footer text, and source code link
  - `command-palette.tsx` — accepts `{ profile: ProfileData }`, uses profile data for resume URL, LinkedIn/GitHub links
- Updated `app/layout.tsx` to be an async server component that fetches profile data via `getProfileData()` and passes it to `Footer` and `CommandPalette`.
- `header.tsx` still imports `links` from `lib/data.ts` — navigation links are structural and tightly coupled to the `SectionName` type used across the app. These will be migrated when nav_links are needed from the DB.
- The `lib/data.ts` file is preserved as a static fallback; all query functions return `null` when Supabase env vars are missing, triggering the static data path.

### Phase 3 Status: COMPLETE

---

## Phase 4: Admin Dashboard

Phase 4 is split into sub-tasks 4A–4H, implemented sequentially with manual verification between each.

### Route Structure (actual)

```tree
app/admin/
├── login/
│   └── page.tsx              # Admin login (public, outside route group)
└── (dashboard)/              # Route group — auth guard + AdminShell
    ├── layout.tsx            # Server component: auth check, fixed overlay
    ├── page.tsx              # Dashboard overview (URL: /admin)
    ├── profile/
    │   └── page.tsx          # Edit profile info, about section, contact info
    ├── experience/
    │   └── page.tsx          # CRUD experience entries (reorderable)
    ├── projects/
    │   └── page.tsx          # CRUD projects, upload images, manage categories
    ├── skills/
    │   └── page.tsx          # CRUD skill groups and skills (reorderable)
    ├── resume/
    │   └── page.tsx          # Upload/replace resume PDF, view download log
    └── visitors/
        └── page.tsx          # View visitor profiles and download history
```

### Server Actions for Admin

All admin server actions live in `actions/admin.ts`. Every action:

- Calls `requireAdmin()` to verify auth + `app_metadata.role === 'admin'`
- Performs the database operation via `createClient()` (RLS-respecting)
- Calls `revalidateTag()` for granular cache invalidation + `revalidatePath('/')` as fallback
- Returns `{ data?, error? }` response

### shadcn/ui Components

Installed: `button`, `badge`, `card`, `tooltip` (pre-existing) + `table`, `dialog`, `input`, `textarea`, `label`, `select`, `tabs`, `dropdown-menu`, `avatar`, `separator`, `sheet` (added in 4A).

---

### 4A: Foundation — Login + Layout + Dashboard

**Scope:** shadcn/ui installation, admin login page, admin layout with auth guard, admin shell (sidebar + topbar), dashboard overview page, `requireAdmin()` + `getAdminStats()` server actions.

**Files created:**

- `actions/admin.ts` — `requireAdmin()` helper + `getAdminStats()` action
- `app/admin/login/page.tsx` — email/password + social login, fixed overlay
- `app/admin/(dashboard)/layout.tsx` — auth guard + AdminShell wrapper
- `app/admin/(dashboard)/page.tsx` — dashboard overview
- `components/admin/admin-shell.tsx` — sidebar nav + topbar + mobile sheet
- `components/admin/dashboard-content.tsx` — stats cards + downloads table + quick actions

**Files modified:**

- `proxy.ts` — exclude `/admin/login` from admin protection, redirect to `/admin/login` instead of `/`

**Key decisions:**

- `(dashboard)` route group separates auth-guarded pages from the public login page
- `fixed inset-0 z-[1000]` overlay covers portfolio chrome without restructuring app directory
- Dashboard stats use parallel Supabase queries via `Promise.all()`

### 4A Status: COMPLETE

---

### 4B: Profile Editor

**Scope:** Profile editor page, tabbed form for General/About/Stats fields, `updateProfile()` + `updateProfileStats()` server actions, cache invalidation via `revalidateTag('profile')`.

**Files to create:**

- `app/admin/(dashboard)/profile/page.tsx` — server component, fetches profile + stats
- `components/admin/profile-form.tsx` — client component, tabbed interface (General, About, Stats)

**Files to modify:**

- `actions/admin.ts` — add `updateProfile()`, `updateProfileStats()` actions

### 4B Status: PENDING

---

### 4C: Experience CRUD

**Scope:** Experience editor page, table view with add/edit/delete dialogs, sort_order controls, CRUD server actions, cache invalidation via `revalidateTag('experiences')`.

**Files to create:**

- `app/admin/(dashboard)/experience/page.tsx` — server component, fetches experiences
- `components/admin/experience-editor.tsx` — client component, table + dialogs

**Files to modify:**

- `actions/admin.ts` — add `createExperience()`, `updateExperience()`, `deleteExperience()`, `reorderExperiences()`

### 4C Status: PENDING

---

### 4D: Projects CRUD + File Uploads

**Scope:** Projects editor page, card grid with add/edit/delete dialogs, image/video upload, reusable file upload component, CRUD server actions, cache invalidation via `revalidateTag('projects')`.

**Files to create:**

- `app/admin/(dashboard)/projects/page.tsx` — server component, fetches projects + categories
- `components/admin/projects-editor.tsx` — client component, card grid + dialogs
- `components/admin/file-upload.tsx` — reusable drag-and-drop upload with preview + progress

**Files to modify:**

- `actions/admin.ts` — add project CRUD + file upload/delete actions

### 4D Status: PENDING

---

### 4E: Skills CRUD

**Scope:** Skills editor page, grouped card view, add/remove/reorder groups and skills, CRUD server actions, cache invalidation via `revalidateTag('skills')`.

**Files to create:**

- `app/admin/(dashboard)/skills/page.tsx` — server component, fetches skill groups with skills
- `components/admin/skills-editor.tsx` — client component, grouped view + dialogs

**Files to modify:**

- `actions/admin.ts` — add skill group and skill CRUD actions

### 4E Status: PENDING

---

### 4F: Resume Management

**Scope:** Resume management page, current resume info, upload new resume, download log table, `uploadResume()` + `getResumeDownloads()` server actions, cache invalidation via `revalidateTag('profile')`.

**Files to create:**

- `app/admin/(dashboard)/resume/page.tsx` — server component, fetches profile + downloads
- `components/admin/resume-manager.tsx` — client component, upload + download log table

**Files to modify:**

- `actions/admin.ts` — add `uploadResume()`, `getResumeDownloads()`

### 4F Status: PENDING

---

### 4G: Visitors Page

**Scope:** Visitors page, table with filter/search/sort, CSV export, pagination, `getVisitors()` + `getVisitorsCsvData()` server actions.

**Files to create:**

- `app/admin/(dashboard)/visitors/page.tsx` — server component, fetches visitors
- `components/admin/visitors-table.tsx` — client component, table + filters + export

**Files to modify:**

- `actions/admin.ts` — add `getVisitors()`, `getVisitorsCsvData()`

### 4G Status: PENDING

---

### 4H: Polish & Final Touches

**Scope:** Loading states / skeleton screens, empty states, error boundaries, responsive verification, form validation.

**Files to modify:**

- All admin pages and components as needed

### 4H Status: PENDING

---

## Phase 5: File Uploads & Storage

### 5.1 Resume Upload (Admin)

- Admin uploads PDF via `/admin/resume`
- File stored in `resume` bucket (private)
- Old file is deleted on replacement
- `profile.resume_url` updated with the new storage path

### 5.2 Resume Download (Visitor)

- Authenticated visitor triggers download
- Server action (`actions/resume.ts`) verifies auth, creates a signed URL (300 seconds / 5 minutes, to accommodate slow connections while keeping links short-lived) for the private `resume` bucket, logs the download, and returns the URL
- Client receives the signed URL and triggers browser download
- Download logged in `resume_downloads`

### 5.3 Image Uploads (Admin)

- Project images → `project-images` bucket (public)
- Company logos → `company-logos` bucket (public)
- On upload, store the **storage path** in the respective table; derive public URLs at read time via `getPublicUrl()`
- Support image preview before saving

### 5.4 Demo Video Uploads (Admin)

- Optional short demo videos for projects → `project-videos` bucket (public)
- On upload, store the **storage path** (e.g. `project-videos/demo.mp4`) in `projects.demo_video_url` — the public URL is derived at read time via `supabase.storage.from('project-videos').getPublicUrl(path)`. Storing the path (not the full URL) makes deletion straightforward and is resilient to CDN/URL changes.
- Old video is deleted from storage on replacement (using the stored path)
- Support video preview before saving
- Visitors can view the demo video inline on the project card and download it
- **Future**: YouTube embedding is planned but not in scope for this implementation; the `demo_video_url` field will initially store Supabase Storage paths only

---

## Phase 6: Testing & Deployment

### 6.1 Testing

| Test Type | What to Test                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Unit      | Data fetching functions, auth utilities, admin server actions                                                            |
| Component | LoginModal, OptionalFieldsModal, admin form components                                                                   |
| E2E       | Resume download flow (login → optional fields → download)                                                                |
| E2E       | Admin login → edit content → verify on frontend                                                                          |
| RLS       | Verify admin policies reject non-admin users, visitors can only access own data, public content is readable without auth |

### 6.2 Environment Variables

Add to Vercel and local `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Update `.env.example` and CI pipeline if needed.

### 6.3 CI/CD Updates

- Add Supabase env vars to GitHub Actions secrets (use a test/staging Supabase project)
- CI builds use real Supabase connection — if queries fail, the build fails (fail-fast strategy)
- Add a `validate-supabase` script that tests the connection before build
- For fork contributors without Supabase access: document that `NEXT_PUBLIC_SUPABASE_URL` must be set, and builds will use the static data fallback with a logged warning

---

## Implementation Order

| Step | Phase | Description                                       | Dependencies |
| ---- | ----- | ------------------------------------------------- | ------------ |
| 1    | 1     | Supabase project setup + env vars                 | None         |
| 2    | 1     | Database schema + RLS policies                    | Step 1       |
| 3    | 1     | Storage buckets                                   | Step 1       |
| 4    | 1     | Supabase client utilities + TypeScript types      | Step 2       |
| 5    | 1     | Seed script (migrate data.ts + hardcoded content) | Step 4       |
| 6    | 3     | Data fetching functions + refactor page.tsx       | Step 5       |
| 7    | 3     | Refactor components to receive data as props      | Step 6       |
| 8    | 2     | Auth setup (providers, middleware, auth context)  | Step 4       |
| 9    | 2     | Visitor login modal + resume download flow        | Steps 3, 8   |
| 10   | 2     | Optional fields modal                             | Step 9       |
| 11   | 2     | Contact form pre-fill                             | Step 8       |
| 12   | 4     | Admin layout + login page                         | Step 8       |
| 13   | 4     | Admin dashboard overview                          | Step 12      |
| 14   | 4     | Admin profile editor                              | Step 12      |
| 15   | 4     | Admin experience CRUD                             | Step 12      |
| 16   | 4     | Admin projects CRUD + image upload                | Step 12      |
| 17   | 4     | Admin skills CRUD                                 | Step 12      |
| 18   | 5     | Admin resume upload + download log                | Step 12      |
| 19   | 4     | Admin visitors page                               | Step 12      |
| 20   | 6     | Tests (unit, component, E2E, RLS)                 | Steps 7-19   |
| 21   | 6     | CI/CD updates + deployment                        | Step 20      |

---

## Files Changed / Created

### New Files

```tree
lib/supabase/client.ts           # Browser Supabase client
lib/supabase/server.ts           # Server Supabase client (anon key + user JWT)
lib/supabase/admin.ts            # Admin client (service role key, RLS bypass)
lib/supabase/queries.ts          # Typed data fetching functions
lib/supabase/types.ts            # Generated TypeScript types
lib/supabase/seed.ts             # Seed script for initial data migration
proxy.ts                        # Auth + route protection proxy (Next.js 16)
context/auth-context.tsx         # Supabase auth React context
components/auth/login-modal.tsx  # Visitor social login modal
components/auth/optional-fields-modal.tsx
actions/admin.ts                 # Admin CRUD server actions
actions/resume.ts                # Resume download server action (signed URL generation)
app/admin/layout.tsx
app/admin/page.tsx
app/admin/login/page.tsx
app/admin/profile/page.tsx
app/admin/experience/page.tsx
app/admin/projects/page.tsx
app/admin/skills/page.tsx
app/admin/resume/page.tsx
app/admin/visitors/page.tsx
```

### Modified Files

```tree
package.json                     # Add @supabase/supabase-js, @supabase/ssr
app/layout.tsx                   # Wrap with AuthProvider
app/page.tsx                     # Remove 'use client', convert to server component, fetch data
components/intro.tsx             # Props instead of hardcoded data, auth-gated download
components/about.tsx             # Props instead of hardcoded data
components/contact.tsx           # Props + session pre-fill
components/experience.tsx        # Props instead of imported data, icon string→component mapping
components/project.tsx           # Inline video playback + download button when demo_video_url is present
components/projects.tsx          # Props instead of imported data
components/skills.tsx            # Props instead of imported data
components/header.tsx            # Props instead of imported data
components/companies-slider.tsx  # Props instead of imported data
components/command-palette.tsx   # Props + auth-gated resume download (wraps server action call)
components/footer.tsx            # Props instead of hardcoded data
lib/types.ts                     # Extended with Supabase types
.env.example                     # Add Supabase env vars
.github/workflows/ci.yml         # Add Supabase env vars to CI
```

### Eventually Deprecated

```tree
lib/data.ts                      # Kept as fallback initially, removed once Supabase is stable
```

---

## Resolved Questions

1. **Admin seeding**: Setup/invite flow — build an admin setup flow rather than manual Supabase dashboard creation.
2. **Image optimization**: Uploaded images should be processed (resized/compressed) before storage.
3. **Content versioning**: Yes — track edit history and support rollback in the admin dashboard.
4. **Rate limiting**: Yes — rate-limit both resume downloads and login attempts.
